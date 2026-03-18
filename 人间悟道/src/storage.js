const { state, STORAGE_KEY } = require("./state");

function saveState() {
  try {
    tt.setStorageSync(STORAGE_KEY, {
      bgOffset: state.bgOffset,
      chatBoxExpanded: state.chatBoxExpanded,
      inChatMode: state.inChatMode,
    });
  } catch (err) {
    // 存档失败
  }
}

function loadState() {
  try {
    const data = tt.getStorageSync(STORAGE_KEY);
    if (data && typeof data === "object") {
      state.bgOffset = data.bgOffset ?? state.bgOffset;
      state.chatBoxExpanded = data.chatBoxExpanded ?? state.chatBoxExpanded;
      state.inChatMode = data.inChatMode ?? state.inChatMode;
    }
  } catch (err) {
    // 读取存档失败
  }
}

function calcOfflineGain() {
  const now = Date.now();
  const deltaSeconds = Math.floor((now - state.lastExit) / 1000);
  if (deltaSeconds <= 0) return 0;

  // 离线收益根据离线时长计算一次性奖励（最多 24 小时）
  const capped = Math.min(deltaSeconds, 24 * 60 * 60);
  return capped * state.idleRate;
}

module.exports = {
  saveState,
  loadState,
  calcOfflineGain,
};
