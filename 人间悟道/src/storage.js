const { state, STORAGE_KEY } = require("./state");

function saveState() {
  if (!state) return;
  try {
    tt.setStorageSync(STORAGE_KEY, {
      bgOffset: state.bgOffset,
      chatBoxExpanded: state.chatBoxExpanded,
      inChatMode: state.inChatMode,
      playerId: state.playerId,
      uid: state.uid,
      nickname: state.nickname,
      avatar: state.avatar,
      avatarFrame: state.avatarFrame,
      level: state.level,
      cultivation: state.cultivation,
      bio: state.bio,
      birthday: state.birthday,
      selectedRole: state.selectedRole,
      friends: state.friends,
      messages: state.messages,
      apiBase: state.apiBase,
    });
  } catch (err) {
    console.log('存档失败:', err);
  }
}

function loadState() {
  try {
    const data = tt.getStorageSync(STORAGE_KEY);
    if (data && typeof data === "object") {
      state.bgOffset = data.bgOffset ?? 0;
      state.chatBoxExpanded = data.chatBoxExpanded ?? false;
      state.inChatMode = data.inChatMode ?? false;
      state.playerId = data.playerId ?? null;
      state.uid = data.uid ?? null;
      state.nickname = data.nickname ?? '无名修士';
      state.avatar = data.avatar ?? 1;
      state.avatarFrame = data.avatarFrame ?? 0;
      state.level = data.level ?? 1;
      state.cultivation = data.cultivation ?? 0;
      state.bio = data.bio ?? '';
      state.birthday = data.birthday ?? '';
      state.selectedRole = data.selectedRole ?? 1;
      state.friends = data.friends ?? [];
      state.messages = data.messages ?? {};
      state.apiBase = data.apiBase ?? 'http://124.223.47.167:3000';
    }
  } catch (err) {
    console.log('读取存档失败:', err);
  }
}

function calcOfflineGain() {
  const now = Date.now();
  const deltaSeconds = Math.floor((now - (state.lastExit || now)) / 1000);
  if (deltaSeconds <= 0) return 0;
  const capped = Math.min(deltaSeconds, 24 * 60 * 60);
  return capped * (state.idleRate || 1);
}

module.exports = { saveState, loadState, calcOfflineGain };
