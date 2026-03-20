// WebSocket 模块 - 实时通信
const { state } = require("./state");

let socket = null;

const SocketManager = {
  // 初始化连接
  connect() {
    if (socket && socket.open) return;
    
    try {
      socket = tt.connectSocket({
        url: 'ws://' + (state.apiBase.replace('http://', ''))
      });
      
      socket.onOpen(() => {
        console.log('WebSocket connected');
        state.connected = true;
        if (state.playerId) {
          this.login(state.playerId);
        }
      });
      
      socket.onMessage((res) => {
        try {
          const data = JSON.parse(res.data);
          console.log('WebSocket message:', data);
          
          // 处理新消息
          if (data.event === 'newMessage') {
            const msg = data.message;
            if (!state.messages[msg.from]) {
              state.messages[msg.from] = [];
            }
            state.messages[msg.from].push({
              from: msg.from,
              to: msg.to,
              content: msg.content,
              createdAt: msg.createdAt
            });
          }
          
          // 用户上线/下线
          if (data.event === 'userOnline') {
            const playerId = data.playerId;
            state.friends = state.friends.map(f => 
              f.playerId === playerId ? { ...f, online: true } : f
            );
          }
          if (data.event === 'userOffline') {
            const playerId = data.playerId;
            state.friends = state.friends.map(f => 
              f.playerId === playerId ? { ...f, online: false } : f
            );
          }
        } catch (e) {
          console.log('Raw WS message:', res.data);
        }
      });
      
      socket.onClose(() => {
        console.log('WebSocket closed');
        state.connected = false;
        socket = null;
        // 30秒后重连
        setTimeout(() => this.connect(), 30000);
      });
      
      socket.onError((err) => {
        console.error('WebSocket error:', err);
        state.connected = false;
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
          playerId: playerId
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
          from: from,
          to: to,
          content: content
        })
      });
      return true;
    }
    return false;
  },
  
  // 检查连接状态
  isConnected() {
    return socket && socket.open;
  }
};

module.exports = {
  SocketManager
};
