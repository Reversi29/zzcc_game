// 全局状态（可持久化）
const STORAGE_KEY = "idle_game_state_v1";

const state = {
  bgOffset: 0, // 背景偏移（滑动）
  chatBoxExpanded: false, // 聊天框是否展开
  inChatMode: false, // 是否在聊天模式
  selectedTab: '角色', // 当前选中的选项栏标签
  selectedTabWindow: null, // 当前打开的窗口标签
};

function reset() {
  state.coins = 0;
  state.idleRate = 1;
  state.upgradeLevel = 1;
  state.lastUpdate = Date.now();
  state.lastExit = Date.now();
}

module.exports = {
  STORAGE_KEY,
  state,
  reset,
};
