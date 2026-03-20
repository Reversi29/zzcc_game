// 全局状态（可持久化）
const STORAGE_KEY = "idle_game_state_v1";

const state = {
  // 玩家信息
  playerId: null, // 玩家ID（用于后端同步）
  uid: null, // 6位数字UID
  nickname: '无名修士',
  avatar: 1, // 当前角色/头像
  avatarFrame: 0, // 头像框
  level: 1,
  cultivation: 0, // 修为
  bio: '', // 简介
  birthday: '', // 生日 MM-DD
  
  // UI状态
  bgOffset: 0, // 背景偏移（滑动）
  chatBoxExpanded: false, // 聊天框是否展开
  inChatMode: false, // 是否在聊天模式
  selectedTab: '角色', // 当前选中的选项栏标签
  selectedTabWindow: null, // 当前打开的窗口标签
  showProfile: false, // 是否显示用户信息面板
  
  // 角色系统
  selectedRole: 1, // 当前选中的角色 (1, 2, ...)
  roleList: [1, 2], // 可用角色列表
  
  // 好友系统
  friends: [], // 好友列表
  selectedFriend: null, // 当前聊天的好友
  
  // 聊天系统
  messages: {}, // { friendId: [messages] }
  unreadCount: 0, // 未读消息数
  chatInput: '', // 聊天输入内容
  
  // 后端配置
  apiBase: 'http://localhost:3000', // 后端API地址
  connected: false, // 后端连接状态
};

function reset() {
  state.coins = 0;
  state.idleRate = 1;
  state.upgradeLevel = 1;
  state.lastUpdate = Date.now();
  state.lastExit = Date.now();
  state.selectedRole = 1;
}

module.exports = {
  STORAGE_KEY,
  state,
  reset,
};
