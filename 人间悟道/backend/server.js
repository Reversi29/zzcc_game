const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 连接数据库（可选，暂时用内存模拟）
mongoose.connect('mongodb://mongo:27017/renjian-wudao', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// 路由
app.get('/', (req, res) => {
  res.send('人间悟道后端API');
});

// 题目API
app.get('/api/questions', (req, res) => {
  // 模拟数据
  res.json([
    { id: 1, domain: 'math', content: '1+1=?', options: ['1', '2', '3'], answer: 1 }
  ]);
});

app.post('/api/questions', (req, res) => {
  // 创建题目
  const { domain, content, options, answer } = req.body;
  // 保存到DB
  res.json({ message: '题目创建成功' });
});

// 社交API
app.post('/api/send-item', (req, res) => {
  const { toPlayerId, item } = req.body;
  res.json({ message: '道具赠送成功' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});