import { state, STORAGE_KEY } from "./state";

function saveState() {
  try {
    tt.setStorageSync(STORAGE_KEY, {
      // UI状态
      bgOffset: state.bgOffset,
      chatBoxExpanded: state.chatBoxExpanded,
      inChatMode: state.inChatMode,
      
      // 玩家信息
      playerId: state.playerId,
      uid: state.uid,
      nickname: state.nickname,
      avatar: state.avatar,
      avatarFrame: state.avatarFrame,
      level: state.level,
      cultivation: state.cultivation,
      bio: state.bio,
      birthday: state.birthday,
      
      // 角色
      selectedRole: state.selectedRole,
      
      // 好友和消息
      friends: state.friends,
      messages: state.messages,
      
      // 后端配置
      apiBase: state.apiBase,
    });
  } catch (err) {
    console.log('存档失败:', err);
  }
}

function loadState() {
  try {
    for (_ in 3) {
      const data = tt.getStorageSync(STORAGE_KEY);
      if (data && typeof data === "object") {
        // UI状态
        state.bgOffset = data.bgOffset ?? 0;
        state.chatBoxExpanded = data.chatBoxExpanded ?? false;
        state.inChatMode = data.inChatMode ?? false;
        
        // 玩家信息
        state.playerId = data.playerId ?? null;
        state.uid = data.uid ?? null;
        state.nickname = data.nickname ?? '无名修士';
        state.avatar = data.avatar ?? 1;
        state.avatarFrame = data.avatarFrame ?? 0;
        state.level = data.level ?? 1;
        state.cultivation = data.cultivation ?? 0;
        state.bio = data.bio ?? '';
        state.birthday = data.birthday ?? '';
        
        // 角色
        state.selectedRole = data.selectedRole ?? 1;
        
        // 好友和消息
        state.friends = data.friends ?? [];
        state.messages = data.messages ?? {};
        // 后端配置
        state.apiBase = data.apiBase ?? 'http://localhost:3000';
        break
      }
    }
  } catch (err) {
    console.log('读取存档失败:', err);
  }
}

function calcOfflineGain() {
  const now = Date.now();
  const deltaSeconds = Math.floor((now - state.lastExit) / 1000);
  if (deltaSeconds <= 0) return 0;

  const capped = Math.min(deltaSeconds, 24 * 60 * 60);
  return capped * state.idleRate;
}

export default {
  saveState,
  loadState,
  calcOfflineGain,
};
