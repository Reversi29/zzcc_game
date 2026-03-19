// WebSocket 模块 - 实时通信
const { state } = require("./state");

let socket = null;
let messageCallback = null;
let statusCallback = null;

const SocketIO = {
  // 初始化连接
  connect() {
    if (socket) return;
    
    try {
      socket = tt.connectSocket({
        url: 'ws://' + (state.apiBase.replace('http://', ''))
      });
      
      socket.onOpen(() => {
        console.log('WebSocket connected');
        if (state.playerId) {
          this.login(state.playerId);
        }
        if (statusCallback) statusCallback(true);
      });
      
      socket.onMessage((res) => {
        try {
          const data = JSON.parse(res.data);
          console.log('WebSocket message:', data);
          
          // 处理新消息
          if (data.type === 'newMessage' || data.event === 'newMessage') {
            const msg = data.message || data;
            if (messageCallback) {
              messageCallback(msg);
            }
          }
          
          // 用户上线/下线通知
          if (data.event === 'userOnline' || data.event === 'userOffline') {
            // 更新好友在线状态
            state.friends = state.friends.map(f => ({
              ...f,
              online: data.event === 'userOnline' ? true : false
            }));
          }
        } catch (e) {
          console.log('Raw message:', res.data);
        }
      });
      
      socket.onClose(() => {
        console.log('WebSocket closed');
        socket = null;
        if (statusCallback) statusCallback(false);
        // 自动重连
        setTimeout(() => this.connect(), 3000);
      });
      
      socket.onError((err) => {
        console.error('WebSocket error:', err);
      });
      
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
    }
  },
  
  // 登录
  login(playerId) {
    if (socket && socket.open) {
      socket.send({
        data: JSON.stringify({
          event: 'login',
          playerId
        })
      });
    }
  },
  
  // 发送消息
  sendMessage(from, to, content) {
    if (socket && socket.open) {
      socket.send({
        data: JSON.stringify({
          event: 'sendMessage',
          from,
          to,
          content
        })
      });
      return true;
    }
    return false;
  },
  
  // 设置消息回调
  onMessage(callback) {
    messageCallback = callback;
  },
  
  // 设置连接状态回调
  onStatusChange(callback) {
    statusCallback = callback;
  },
  
  // 断开连接
  disconnect() {
    if (socket) {
      socket.close();
      socket = null;
    }
  },
  
  // 检查是否连接
  isConnected() {
    return socket && socket.open;
  }
};

// 模拟 Socket.IO 的 JSON 消息格式
// 抖音小游戏的 WebSocket API 比较基础，这里用模拟方式
const MockSocketIO = {
  connect() {
    console.log('MockSocketIO: Using HTTP polling instead of WebSocket');
  },
  
  login(playerId) {
    console.log('MockSocketIO: login', playerId);
  },
  
  sendMessage(from, to, content) {
    // 通过 HTTP API 发送消息
    return false;
  },
  
  onMessage(callback) {},
  onStatusChange(callback) {},
  disconnect() {},
  isConnected() { return false; }
};

module.exports = {
  // 使用 MockSocketIO 作为后备
  socketIO: MockSocketIO
};
