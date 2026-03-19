// API 模块 - 与后端通信
const { state } = require("./state");

const API = {
  // 基础请求
  async request(url, options = {}) {
    try {
      const response = await tt.request({
        url: state.apiBase + url,
        header: {
          'Content-Type': 'application/json',
          ...options.header
        },
        ...options
      });
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.data;
      }
      console.error('API Error:', response.data);
      return null;
    } catch (err) {
      console.error('Network Error:', err);
      return null;
    }
  },
  
  // 用户相关
  async register(playerId, nickname) {
    return await this.request('/api/users/register', {
      method: 'POST',
      data: { playerId, nickname }
    });
  },
  
  async login(playerId) {
    return await this.request('/api/users/login', {
      method: 'POST',
      data: { playerId }
    });
  },
  
  async getUser(playerId) {
    return await this.request(`/api/users/${playerId}`);
  },
  
  async updateUser(playerId, data) {
    return await this.request(`/api/users/${playerId}`, {
      method: 'PUT',
      data
    });
  },
  
  async searchPlayers(query, limit = 10) {
    return await this.request(`/api/players?q=${encodeURIComponent(query)}&limit=${limit}`);
  },
  
  // 好友相关
  async getFriends(playerId) {
    return await this.request(`/api/friends/${playerId}`);
  },
  
  async addFriend(playerId, friendId) {
    return await this.request('/api/friends', {
      method: 'POST',
      data: { playerId, friendId }
    });
  },
  
  async removeFriend(playerId, friendId) {
    return await this.request(`/api/friends/${playerId}/${friendId}`, {
      method: 'DELETE'
    });
  },
  
  // 消息相关
  async getMessages(playerId, friendId, limit = 50) {
    return await this.request(`/api/messages/${playerId}/${friendId}?limit=${limit}`);
  },
  
  async getUnreadCount(playerId) {
    return await this.request(`/api/messages/unread/${playerId}`);
  }
};

module.exports = {
  API
};
