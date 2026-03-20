const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // 生产环境应该限制具体域名
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// MongoDB 连接
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/renjian-wudao';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// ==================== 数据模型 ====================

// 用户模型
const UserSchema = new mongoose.Schema({
  playerId: { type: String, required: true, unique: true },
  uid: { type: Number, unique: true }, // 自定义UID（6位数字）
  nickname: { type: String, default: '无名修士' },
  avatar: { type: Number, default: 1 }, // 角色ID
  avatarFrame: { type: Number, default: 0 }, // 头像框
  level: { type: Number, default: 1 },
  cultivation: { type: Number, default: 0 }, // 修为
  bio: { type: String, default: '' }, // 简介
  birthday: { type: String, default: '' }, // 生日 MM-DD
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// UID计数器
let uidCounter = 100000; // 起始UID

async function generateUID() {
  const lastUser = await User.findOne().sort({ uid: -1 });
  if (lastUser && lastUser.uid) {
    uidCounter = lastUser.uid + 1;
  }
  return uidCounter;
}

// 好友模型
const FriendSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  friendId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Friend = mongoose.model('Friend', FriendSchema);

// 聊天消息模型
const MessageSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, default: 'text' }, // text, system
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

// 在线用户映射
const onlineUsers = new Map(); // playerId -> socket

// ==================== REST API ====================

// 根路由
app.get('/', (req, res) => {
  res.json({ 
    message: '人间悟道 API v1.0',
    endpoints: [
      'POST /api/users/register - 注册',
      'POST /api/users/login - 登录',
      'GET /api/users/:playerId - 获取用户信息',
      'PUT /api/users/:playerId - 更新用户信息',
      'GET /api/friends/:playerId - 获取好友列表',
      'POST /api/friends - 添加好友',
      'DELETE /api/friends/:playerId/:friendId - 删除好友',
      'GET /api/messages/:playerId/:friendId - 获取聊天记录',
      'GET /api/players - 搜索玩家'
    ]
  });
});

// 用户注册
app.post('/api/users/register', async (req, res) => {
  try {
    const { playerId, nickname } = req.body;
    if (!playerId) {
      return res.status(400).json({ error: 'playerId is required' });
    }
    
    let user = await User.findOne({ playerId });
    if (user) {
      return res.json(user); // 已存在则返回
    }
    
    // 生成UID
    const uid = await generateUID();
    user = new User({ 
      playerId, 
      nickname: nickname || '无名修士',
      uid: uid
    });
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 根据UID注册/登录
app.post('/api/users/register-by-uid', async (req, res) => {
  try {
    const { uid, nickname } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'uid is required' });
    }
    
    let user = await User.findOne({ uid: parseInt(uid) });
    if (!user) {
      return res.status(404).json({ error: 'User not found with this UID' });
    }
    
    // 更新最后登录时间
    user.lastLogin = Date.now();
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 用户登录
app.post('/api/users/login', async (req, res) => {
  try {
    const { playerId } = req.body;
    const user = await User.findOneAndUpdate(
      { playerId },
      { lastLogin: Date.now() },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取用户信息
app.get('/api/users/:playerId', async (req, res) => {
  try {
    const user = await User.findOne({ playerId: req.params.playerId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
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
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 根据UID获取用户信息
app.get('/api/users-uid/:uid', async (req, res) => {
  try {
    const user = await User.findOne({ uid: parseInt(req.params.uid) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      playerId: user.playerId,
      uid: user.uid,
      nickname: user.nickname,
      avatar: user.avatar,
      level: user.level,
      bio: user.bio
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 搜索玩家（支持UID或昵称）
app.get('/api/players', async (req, res) => {
  try {
    const { q, uid, nickname, limit = 10 } = req.query;
    let query = {};
    
    // 如果提供了UID参数，精确匹配
    if (uid) {
      const user = await User.findOne({ uid: parseInt(uid) });
      if (user) {
        return res.json([{
          playerId: user.playerId,
          uid: user.uid,
          nickname: user.nickname,
          avatar: user.avatar,
          level: user.level,
          bio: user.bio
        }]);
      }
      return res.json([]);
    }
    
    // 如果提供了昵称参数，模糊匹配
    if (nickname) {
      const users = await User.find({ 
        nickname: new RegExp(nickname, 'i') 
      }).limit(parseInt(limit));
      return res.json(users.map(u => ({
        playerId: u.playerId,
        uid: u.uid,
        nickname: u.nickname,
        avatar: u.avatar,
        level: u.level,
        bio: u.bio
      })));
    }
    
    // 通用搜索（支持playerId或nickname）
    if (q) {
      // 检查是否是纯数字（可能是UID）
      if (/^\d+$/.test(q)) {
        const user = await User.findOne({ uid: parseInt(q) });
        if (user) {
          return res.json([{
            playerId: user.playerId,
            uid: user.uid,
            nickname: user.nickname,
            avatar: user.avatar,
            level: user.level,
            bio: user.bio
          }]);
        }
      }
      
      // 模糊搜索昵称
      query = { 
        $or: [
          { playerId: new RegExp(q, 'i') },
          { nickname: new RegExp(q, 'i') }
        ]
      };
    }
    
    const players = await User.find(query).limit(parseInt(limit));
    res.json(players.map(u => ({
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

// 获取好友列表
app.get('/api/friends/:playerId', async (req, res) => {
  try {
    const friends = await Friend.find({ playerId: req.params.playerId });
    const friendIds = friends.map(f => f.friendId);
    
    // 获取好友详细信息和在线状态
    const friendUsers = await User.find({ playerId: { $in: friendIds } });
    const friendsWithStatus = friendUsers.map(user => ({
      ...user.toObject(),
      online: onlineUsers.has(user.playerId)
    }));
    
    res.json(friendsWithStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 添加好友
app.post('/api/friends', async (req, res) => {
  try {
    const { playerId, friendId } = req.body;
    
    if (playerId === friendId) {
      return res.status(400).json({ error: 'Cannot add yourself as friend' });
    }
    
    // 检查好友是否存在
    const friendUser = await User.findOne({ playerId: friendId });
    if (!friendUser) {
      return res.status(404).json({ error: 'Friend user not found' });
    }
    
    // 检查是否已是好友
    const existing = await Friend.findOne({ playerId, friendId });
    if (existing) {
      return res.status(400).json({ error: 'Already friends' });
    }
    
    // 双向添加
    await Friend.create([
      { playerId, friendId },
      { playerId: friendId, friendId: playerId }
    ]);
    
    // 发送系统消息
    await Message.create({
      from: 'system',
      to: friendId,
      content: `${playerId} 将你添加为好友`,
      type: 'system'
    });
    
    res.json({ message: 'Friend added successfully' });
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
    
    res.json({ message: 'Friend removed successfully' });
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
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));
    
    // 标记已读
    await Message.updateMany(
      { from: friendId, to: playerId, read: false },
      { read: true }
    );
    
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取未读消息数
app.get('/api/messages/unread/:playerId', async (req, res) => {
  try {
    const count = await Message.countDocuments({
      to: req.params.playerId,
      read: false
    });
    res.json({ unread: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== WebSocket 实时聊天 ====================

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // 用户登录
  socket.on('login', (playerId) => {
    onlineUsers.set(playerId, socket);
    socket.playerId = playerId;
    console.log(`User ${playerId} is online`);
    
    // 通知好友上线
    // 这里简化处理，实际可以查询数据库获取好友列表
    socket.broadcast.emit('userOnline', { playerId });
  });
  
  // 发送私聊消息
  socket.on('sendMessage', async (data) => {
    const { from, to, content } = data;
    
    // 保存消息到数据库
    const message = await Message.create({ from, to, content });
    
    // 发送给接收者
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      targetSocket.emit('newMessage', message);
    }
    
    // 发送确认给发送者
    socket.emit('messageSent', message);
  });
  
  // 加入好友房间
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });
  
  // 离开房间
  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    if (socket.playerId) {
      onlineUsers.delete(socket.playerId);
      console.log(`User ${socket.playerId} is offline`);
      socket.broadcast.emit('userOffline', { playerId: socket.playerId });
    }
  });
});

// 启动服务器
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket enabled`);
});
