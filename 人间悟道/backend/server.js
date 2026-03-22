const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/renjian-wudao';

app.use(cors());
app.use(express.json());

// ==================== 数据库连接 ====================

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// ==================== 数据模型 ====================

const UserSchema = new mongoose.Schema({
  playerId:    { type: String, required: true, unique: true },
  uid:         { type: Number, unique: true, sparse: true },
  nickname:    { type: String, default: '无名修士' },
  avatar:      { type: Number, default: 1 },
  avatarFrame: { type: Number, default: 0 },
  level:       { type: Number, default: 1 },
  cultivation: { type: Number, default: 0 },
  bio:         { type: String, default: '' },
  birthday:    { type: String, default: '' },
  createdAt:   { type: Date, default: Date.now },
  lastLogin:   { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const FriendSchema = new mongoose.Schema({
  playerId:  { type: String, required: true },
  friendId:  { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
FriendSchema.index({ playerId: 1, friendId: 1 }, { unique: true });
const Friend = mongoose.model('Friend', FriendSchema);

const MessageSchema = new mongoose.Schema({
  from:      { type: String, required: true },
  to:        { type: String, required: true },
  content:   { type: String, required: true },
  type:      { type: String, default: 'text' },
  read:      { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

// ==================== UID 分配 ====================

async function generateUID() {
  const last = await User.findOne({ uid: { $exists: true } }).sort({ uid: -1 });
  return last && last.uid ? last.uid + 1 : 100000;
}

// ==================== 在线用户 ====================

const onlineUsers = new Map(); // playerId -> socket

// ==================== REST API ====================

app.get('/', (req, res) => {
  res.json({ message: '人间悟道 API v1.0', status: 'ok' });
});

// 注册（自动分配UID）
app.post('/api/users/register', async (req, res) => {
  try {
    const { playerId, nickname } = req.body;
    if (!playerId) return res.status(400).json({ error: 'playerId required' });

    let user = await User.findOne({ playerId });
    if (user) {
      // 已存在，更新登录时间并返回
      user.lastLogin = Date.now();
      await user.save();
      return res.json(user);
    }

    // 新用户，分配UID
    const uid = await generateUID();
    user = await User.create({
      playerId,
      uid,
      nickname: nickname || '无名修士'
    });
    console.log(`新用户注册: playerId=${playerId}, uid=${uid}`);
    res.json(user);
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ error: err.message });
  }
});

// 获取用户信息
app.get('/api/users/:playerId', async (req, res) => {
  try {
    const user = await User.findOne({ playerId: req.params.playerId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新用户信息
app.put('/api/users/:playerId', async (req, res) => {
  try {
    const { nickname, avatar, avatarFrame, level, cultivation, bio, birthday } = req.body;
    const update = {};
    if (nickname !== undefined) update.nickname = nickname;
    if (avatar !== undefined) update.avatar = avatar;
    if (avatarFrame !== undefined) update.avatarFrame = avatarFrame;
    if (level !== undefined) update.level = level;
    if (cultivation !== undefined) update.cultivation = cultivation;
    if (bio !== undefined) update.bio = bio;
    if (birthday !== undefined) update.birthday = birthday;

    const user = await User.findOneAndUpdate(
      { playerId: req.params.playerId },
      update,
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 搜索玩家（支持 uid 精确 / nickname 模糊）
app.get('/api/players', async (req, res) => {
  try {
    const { uid, nickname, q, limit = 10 } = req.query;
    let users = [];

    if (uid) {
      // 精确UID搜索
      const u = await User.findOne({ uid: parseInt(uid) });
      users = u ? [u] : [];
    } else if (nickname) {
      // 昵称模糊搜索
      users = await User.find({ nickname: { $regex: nickname, $options: 'i' } }).limit(parseInt(limit));
    } else if (q) {
      // 通用搜索：纯数字当UID，否则昵称
      if (/^\d+$/.test(q.trim())) {
        const u = await User.findOne({ uid: parseInt(q.trim()) });
        users = u ? [u] : [];
      } else {
        users = await User.find({ nickname: { $regex: q.trim(), $options: 'i' } }).limit(parseInt(limit));
      }
    }

    res.json(users.map(u => ({
      playerId: u.playerId,
      uid: u.uid,
      nickname: u.nickname,
      avatar: u.avatar,
      level: u.level,
      bio: u.bio
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取好友列表（含在线状态）
app.get('/api/friends/:playerId', async (req, res) => {
  try {
    const records = await Friend.find({ playerId: req.params.playerId });
    const ids = records.map(r => r.friendId);
    const users = await User.find({ playerId: { $in: ids } });
    const result = users.map(u => ({
      playerId: u.playerId,
      uid: u.uid,
      nickname: u.nickname,
      avatar: u.avatar,
      level: u.level,
      online: onlineUsers.has(u.playerId)
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 添加好友（双向）
app.post('/api/friends', async (req, res) => {
  try {
    const { playerId, friendId } = req.body;
    if (!playerId || !friendId) return res.status(400).json({ error: '参数缺失' });
    if (playerId === friendId) return res.status(400).json({ error: '不能添加自己' });

    const friendUser = await User.findOne({ playerId: friendId });
    if (!friendUser) return res.status(404).json({ error: '玩家不存在' });

    const existing = await Friend.findOne({ playerId, friendId });
    if (existing) return res.status(400).json({ error: '已经是好友' });

    // 双向添加
    await Friend.create({ playerId, friendId });
    await Friend.create({ playerId: friendId, friendId: playerId });

    // 通知对方（如果在线）
    const targetSocket = onlineUsers.get(friendId);
    if (targetSocket) {
      targetSocket.emit('newFriend', { playerId });
    }

    res.json({ message: '添加成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除好友
app.delete('/api/friends/:playerId/:friendId', async (req, res) => {
  try {
    const { playerId, friendId } = req.params;
    await Friend.deleteMany({
      $or: [
        { playerId, friendId },
        { playerId: friendId, friendId: playerId }
      ]
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
    const { limit = 50 } = req.query;
    const messages = await Message.find({
      $or: [
        { from: playerId, to: friendId },
        { from: friendId, to: playerId }
      ]
    }).sort({ createdAt: 1 }).limit(parseInt(limit));

    // 标记已读
    await Message.updateMany({ from: friendId, to: playerId, read: false }, { read: true });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 未读消息数
app.get('/api/messages/unread/:playerId', async (req, res) => {
  try {
    const count = await Message.countDocuments({ to: req.params.playerId, read: false });
    res.json({ unread: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== WebSocket 实时聊天 ====================

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // 用户登录
  socket.on('login', (playerId) => {
    if (!playerId) return;
    onlineUsers.set(playerId, socket);
    socket.playerId = playerId;
    console.log(`User online: ${playerId}`);
    // 通知好友上线
    socket.broadcast.emit('userOnline', { playerId });
  });

  // 发送消息
  socket.on('sendMessage', async (data) => {
    const { from, to, content } = data;
    if (!from || !to || !content) return;

    try {
      const message = await Message.create({ from, to, content });
      // 推送给接收方
      const targetSocket = onlineUsers.get(to);
      if (targetSocket) {
        targetSocket.emit('newMessage', message);
      }
      // 确认给发送方
      socket.emit('messageSent', message);
    } catch (err) {
      console.error('保存消息失败:', err);
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    if (socket.playerId) {
      onlineUsers.delete(socket.playerId);
      console.log(`User offline: ${socket.playerId}`);
      socket.broadcast.emit('userOffline', { playerId: socket.playerId });
    }
  });
});

// ==================== 启动 ====================

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
