const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// MongoDB 连接
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/renjian-wudao';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB 连接成功'))
  .catch(err => console.error('MongoDB 连接失败:', err));

// ==================== 数据模型 ====================

// 用户模型
const UserSchema = new mongoose.Schema({
  playerId: { type: String, required: true, unique: true },
  uid: { type: Number, unique: true },
  nickname: { type: String, default: '无名修士' },
  avatar: { type: Number, default: 1 },
  avatarFrame: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  cultivation: { type: Number, default: 0 },
  bio: { type: String, default: '' },
  birthday: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// UID 生成
let uidCounter = 100000;
async function generateUID() {
  try {
    const lastUser = await User.findOne().sort({ uid: -1 });
    if (lastUser && lastUser.uid) uidCounter = lastUser.uid + 1;
    return uidCounter;
  } catch (err) {
    console.error('UID 生成错误:', err);
    throw err;
  }
}

// 好友模型
const FriendSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  friendId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Friend = mongoose.model('Friend', FriendSchema);

// 消息模型
const MessageSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, default: 'text' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

// 在线用户
const onlineUsers = new Map();

// ==================== Socket.io 实时通信 ====================
io.on('connection', (socket) => {
  console.log('客户端已连接:', socket.id);

  // 登录绑定
  socket.on('login', async (playerId) => {
    try {
      await User.findOneAndUpdate({ playerId }, { lastLogin: Date.now() });
      onlineUsers.set(playerId, { socketId: socket.id, socket });

      const friends = await Friend.find({ playerId });
      friends.forEach(f => {
        const fs = onlineUsers.get(f.friendId);
        if (fs) fs.socket.emit('friend-online', { playerId, online: true });
      });

      socket.emit('login-success', {
        playerId,
        onlineUsers: Array.from(onlineUsers.keys())
      });
      console.log('用户上线:', playerId);
    } catch (err) {
      socket.emit('login-fail', { error: err.message });
    }
  });

  // 发送私聊
  socket.on('send-message', async (data) => {
    try {
      const { from, to, content } = data;
      if (!from || !to || !content) return socket.emit('message-error', { error: '参数缺失' });

      const msg = new Message({ from, to, content });
      await msg.save();

      const target = onlineUsers.get(to);
      if (target) target.socket.emit('receive-message', {
        from, content, createdAt: msg.createdAt, read: false
      });

      socket.emit('message-sent', { messageId: msg._id, createdAt: msg.createdAt });
    } catch (err) {
      socket.emit('message-error', { error: err.message });
    }
  });

  // 标记已读
  socket.on('mark-message-read', async (data) => {
    try {
      const { from, to } = data;
      await Message.updateMany({ from, to, read: false }, { read: true });
      const sender = onlineUsers.get(from);
      if (sender) sender.socket.emit('message-read', { to, read: true });
    } catch (err) {
      socket.emit('message-error', { error: err.message });
    }
  });

  // 断开连接
  socket.on('disconnect', async () => {
    let offlineId = null;
    for (const [pid, info] of onlineUsers.entries()) {
      if (info.socketId === socket.id) {
        offlineId = pid;
        onlineUsers.delete(pid);
        break;
      }
    }

    if (offlineId) {
      const friends = await Friend.find({ playerId: offlineId });
      friends.forEach(f => {
        const fs = onlineUsers.get(f.friendId);
        if (fs) fs.socket.emit('friend-offline', { playerId: offlineId, online: false });
      });
      console.log('用户下线:', offlineId);
    }
  });

  // 心跳
  socket.on('ping', () => socket.emit('pong'));
});

// ==================== REST API 接口 ====================

// 首页
app.get('/', (req, res) => {
  res.json({
    message: '人间悟道 · 游戏服务端 v1.0',
    ws: '已支持 WebSocket 实时通信',
    port: 3000
  });
});

// 用户注册
app.post('/api/users/register', async (req, res) => {
  try {
    const { playerId, nickname } = req.body;
    if (!playerId) return res.status(400).json({ error: 'playerId 不能为空' });

    let user = await User.findOne({ playerId });
    if (user) return res.json(user);

    const uid = await generateUID();
    user = new User({ playerId, nickname, uid });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UID 登录
app.post('/api/users/register-by-uid', async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid 不能为空' });

    const user = await User.findOne({ uid: parseInt(uid) });
    if (!user) return res.status(404).json({ error: '用户不存在' });

    user.lastLogin = Date.now();
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 登录
app.post('/api/users/login', async (req, res) => {
  try {
    const { playerId } = req.body;
    if (!playerId) return res.status(400).json({ error: 'playerId 不能为空' });

    const user = await User.findOneAndUpdate(
      { playerId },
      { lastLogin: Date.now() },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取用户信息
app.get('/api/users/:playerId', async (req, res) => {
  try {
    const user = await User.findOne({ playerId: req.params.playerId });
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新用户信息
app.put('/api/users/:playerId', async (req, res) => {
  try {
    const { nickname, avatar, avatarFrame, level, cultivation, bio, birthday } = req.body;
    const user = await User.findOneAndUpdate(
      { playerId: req.params.playerId },
      { nickname, avatar, avatarFrame, level, cultivation, bio, birthday },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取好友列表
app.get('/api/friends/:playerId', async (req, res) => {
  try {
    const list = await Friend.find({ playerId: req.params.playerId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 添加好友
app.post('/api/friends', async (req, res) => {
  try {
    const { playerId, friendId } = req.body;
    const exists = await Friend.findOne({ playerId, friendId });
    if (exists) return res.json({ message: '已经是好友' });

    const friend = new Friend({ playerId, friendId });
    await friend.save();
    res.status(201).json(friend);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除好友
app.delete('/api/friends/:playerId/:friendId', async (req, res) => {
  try {
    await Friend.deleteOne({
      playerId: req.params.playerId,
      friendId: req.params.friendId
    });
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取聊天记录
app.get('/api/messages/:playerId/:friendId', async (req, res) => {
  try {
    const { playerId, friendId } = req.params;
    const messages = await Message.find({
      $or: [
        { from: playerId, to: friendId },
        { from: friendId, to: playerId }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 搜索玩家
app.get('/api/players', async (req, res) => {
  try {
    const { q } = req.query;
    const users = await User.find({
      $or: [
        { nickname: { $regex: q, $options: 'i' } },
        { uid: isNaN(q) ? -1 : parseInt(q) }
      ]
    }).limit(20);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 启动服务 ====================
server.listen(PORT, () => {
  console.log(`======================================`);
  console.log(`✅ 服务已启动：http://localhost:${PORT}`);
  console.log(`✅ WebSocket 已启用（实时聊天/在线状态）`);
  console.log(`======================================`);
});