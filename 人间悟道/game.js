// 入口：挂机类休闲游戏框架 - 人间悟道

const { state, STORAGE_KEY } = require("./src/state");
const { render } = require("./src/ui");

// ==================== 存档功能（内联避免模块问题）====================

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
      if (data.bgOffset !== undefined) state.bgOffset = data.bgOffset;
      if (data.chatBoxExpanded !== undefined) state.chatBoxExpanded = data.chatBoxExpanded;
      if (data.inChatMode !== undefined) state.inChatMode = data.inChatMode;
      if (data.playerId !== undefined) state.playerId = data.playerId;
      if (data.uid !== undefined) state.uid = data.uid;
      if (data.nickname !== undefined) state.nickname = data.nickname;
      if (data.avatar !== undefined) state.avatar = data.avatar;
      if (data.avatarFrame !== undefined) state.avatarFrame = data.avatarFrame;
      if (data.level !== undefined) state.level = data.level;
      if (data.cultivation !== undefined) state.cultivation = data.cultivation;
      if (data.bio !== undefined) state.bio = data.bio;
      if (data.birthday !== undefined) state.birthday = data.birthday;
      if (data.selectedRole !== undefined) state.selectedRole = data.selectedRole;
      if (data.friends !== undefined) state.friends = data.friends;
      if (data.messages !== undefined) state.messages = data.messages;
      if (data.apiBase !== undefined) state.apiBase = data.apiBase;
    }
  } catch (err) {
    console.log('读取存档失败:', err);
  }
}

// ==================== 初始化 Canvas ====================

const systemInfo = tt.getSystemInfoSync();
const canvas = tt.createCanvas();
const ctx = canvas.getContext("2d");

const dpr = systemInfo.pixelRatio || 1;
canvas.width = systemInfo.windowWidth * dpr;
canvas.height = systemInfo.windowHeight * dpr;
ctx.scale(dpr, dpr);

const inputState = {
  isPressing: false,
  lastTapX: -1,
  lastTapY: -1,
  lastMoveX: 0,
  isDragging: false,
};

let socket = null;
let lastTime = Date.now();
let uiState = null;
let currentMinOffset = 0, currentMaxOffset = 0;

// ==================== 玩家注册 ====================

function initPlayerId() {
  if (!state.playerId) {
    state.playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    registerToServer();
  }
}

function registerToServer() {
  console.log('正在注册到服务器:', state.apiBase);
  tt.request({
    url: state.apiBase + '/api/users/register',
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    data: { playerId: state.playerId, nickname: state.nickname },
    success: function(res) {
      if (res.data && res.data.uid) {
        state.uid = res.data.uid;
        state.nickname = res.data.nickname || state.nickname;
        state.level = res.data.level || 1;
        state.cultivation = res.data.cultivation || 0;
        state.bio = res.data.bio || '';
        state.birthday = res.data.birthday || '';
        console.log('注册成功, UID:', state.uid);
        saveState();
        loadFriends();
      } else {
        console.log('注册响应无uid，使用本地UID');
        generateLocalUID();
      }
    },
    fail: function(err) {
      console.log('注册失败:', err);
      generateLocalUID();
    }
  });
}

function generateLocalUID() {
  if (!state.uid) {
    state.uid = 100000 + Math.floor(Math.random() * 899999);
    console.log('使用本地临时UID:', state.uid);
    saveState();
  }
}

// ==================== WebSocket ====================

function connectWebSocket() {
  if (socket) return;
  try {
    const wsUrl = state.apiBase.replace('http://', 'ws://').replace('https://', 'wss://');
    console.log('Connecting WebSocket:', wsUrl);
    socket = tt.connectSocket({ url: wsUrl });

    socket.onOpen(function() {
      console.log('WebSocket connected');
      state.connected = true;
      if (state.playerId) {
        socket.send({ data: JSON.stringify({ event: 'login', playerId: state.playerId }) });
      }
    });

    socket.onMessage(function(res) {
      try {
        const data = JSON.parse(res.data);
        if (data.event === 'newMessage') {
          handleNewMessage(data.message || data);
        } else if (data.event === 'userOnline') {
          state.friends = state.friends.map(function(f) {
            return f.playerId === data.playerId ? Object.assign({}, f, { online: true }) : f;
          });
        } else if (data.event === 'userOffline') {
          state.friends = state.friends.map(function(f) {
            return f.playerId === data.playerId ? Object.assign({}, f, { online: false }) : f;
          });
        }
      } catch (e) {
        console.log('WS parse error:', e);
      }
    });

    socket.onClose(function() {
      console.log('WebSocket closed, reconnecting...');
      state.connected = false;
      socket = null;
      setTimeout(connectWebSocket, 5000);
    });

    socket.onError(function(err) {
      console.log('WebSocket error:', err);
      state.connected = false;
      socket = null;
    });
  } catch (err) {
    console.log('无法连接WebSocket:', err);
    socket = null;
  }
}

function handleNewMessage(msg) {
  var from = msg.from;
  if (!state.messages[from]) state.messages[from] = [];
  state.messages[from].push(msg);
}

function sendMessage(content) {
  if (!state.selectedFriend || !content || !content.trim()) return;
  var msg = {
    from: state.playerId,
    to: state.selectedFriend,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };
  if (!state.messages[state.selectedFriend]) state.messages[state.selectedFriend] = [];
  state.messages[state.selectedFriend].push(msg);

  if (socket) {
    try {
      socket.send({ data: JSON.stringify({ event: 'sendMessage', from: msg.from, to: msg.to, content: msg.content }) });
    } catch (err) {
      console.log('发送消息失败:', err);
    }
  }
}

// ==================== 好友 ====================

function loadFriends() {
  if (!state.playerId) return;
  tt.request({
    url: state.apiBase + '/api/friends/' + state.playerId,
    method: 'GET',
    success: function(res) {
      if (res.data && Array.isArray(res.data)) {
        state.friends = res.data;
      }
    },
    fail: function(err) {
      console.log('加载好友失败:', err);
    }
  });
}

function addFriend(query) {
  if (!query || !query.trim()) {
    tt.showToast({ title: '请输入UID或昵称' });
    return;
  }
  var isUID = /^\d+$/.test(query.trim());
  var searchUrl = isUID
    ? state.apiBase + '/api/players?uid=' + encodeURIComponent(query.trim())
    : state.apiBase + '/api/players?nickname=' + encodeURIComponent(query.trim());

  tt.request({
    url: searchUrl,
    method: 'GET',
    success: function(res) {
      if (!res.data || res.data.length === 0) {
        tt.showToast({ title: '未找到玩家' });
        return;
      }
      var target = res.data[0];
      if (target.playerId === state.playerId) {
        tt.showToast({ title: '不能添加自己' });
        return;
      }
      tt.request({
        url: state.apiBase + '/api/friends',
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: { playerId: state.playerId, friendId: target.playerId },
        success: function(addRes) {
          if (addRes.statusCode === 200 || addRes.statusCode === 201) {
            tt.showToast({ title: '添加成功!' });
            loadFriends();
          } else {
            var errMsg = (addRes.data && addRes.data.error) ? addRes.data.error : '添加失败';
            tt.showToast({ title: errMsg });
          }
        },
        fail: function() {
          tt.showToast({ title: '网络错误' });
        }
      });
    },
    fail: function() {
      tt.showToast({ title: '搜索失败' });
    }
  });
}

// ==================== 输入 ====================

function isPointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function showInputDialog(title, placeholder, callback) {
  tt.showModal({
    title: title,
    placeholderText: placeholder,
    confirmText: '确定',
    cancelText: '取消',
    success: function(res) {
      if (res.confirm && res.value) {
        callback(res.value);
      }
    }
  });
}

tt.onTouchStart(function(evt) {
  var touch = evt.touches[0];
  if (!touch) return;
  inputState.lastTapX = touch.clientX;
  inputState.lastTapY = touch.clientY;
  inputState.lastMoveX = touch.clientX;
  inputState.isPressing = true;
  inputState.isDragging = false;
});

tt.onTouchMove(function(evt) {
  var touch = evt.touches[0];
  if (!touch || !inputState.isPressing) return;
  if (state.selectedTabWindow || state.showProfile) return;
  var height = systemInfo.windowHeight;
  if (touch.clientY >= height - 80) return;
  var deltaX = Math.max(-20, Math.min(20, touch.clientX - inputState.lastMoveX));
  state.bgOffset += deltaX;
  if (state.bgOffset < currentMinOffset) state.bgOffset = currentMinOffset;
  if (state.bgOffset > currentMaxOffset) state.bgOffset = currentMaxOffset;
  inputState.lastMoveX = touch.clientX;
  inputState.isDragging = true;
});

tt.onTouchEnd(function() {
  inputState.isPressing = false;
  inputState.isDragging = false;
});

// ==================== 主循环 ====================

function gameLoop() {
  var now = Date.now();
  lastTime = now;

  uiState = render(ctx, systemInfo.windowWidth, systemInfo.windowHeight, inputState);
  currentMinOffset = uiState.minOffset || 0;
  currentMaxOffset = uiState.maxOffset || 0;

  if (!inputState.isPressing && !inputState.isDragging && inputState.lastTapX >= 0) {
    var x = inputState.lastTapX;
    var y = inputState.lastTapY;
    var handled = false;

    // 1. 头像按钮
    if (!handled && uiState.avatarBtn && isPointInRect(x, y, uiState.avatarBtn)) {
      state.showProfile = true;
      state.selectedTabWindow = null;
      handled = true;
    }

    // 2. 个人信息面板
    if (!handled && state.showProfile && uiState.profileButtons) {
      for (var i = 0; i < uiState.profileButtons.length; i++) {
        var btn = uiState.profileButtons[i];
        if (isPointInRect(x, y, btn)) {
          if (btn.action === 'close') {
            state.showProfile = false;
          } else if (btn.action === 'changeAvatar') {
            var idx = state.roleList.indexOf(state.avatar || state.selectedRole);
            state.avatar = state.roleList[(idx + 1) % state.roleList.length];
            saveState();
          } else if (btn.action === 'changeFrame') {
            state.avatarFrame = ((state.avatarFrame || 0) + 1) % 4;
            saveState();
          } else if (btn.action === 'changeNickname') {
            showInputDialog('修改昵称', '请输入新昵称', function(v) { state.nickname = v; saveState(); });
          } else if (btn.action === 'changeBio') {
            showInputDialog('修改简介', '介绍一下自己', function(v) { state.bio = v; saveState(); });
          }
          handled = true;
          break;
        }
      }
    }

    // 3. 聊天输入框
    if (!handled && uiState.inputAreas) {
      for (var i = 0; i < uiState.inputAreas.length; i++) {
        var area = uiState.inputAreas[i];
        if (isPointInRect(x, y, area) && area.type === 'chat') {
          showInputDialog('发送消息', '输入消息', function(v) { sendMessage(v); });
          handled = true;
          break;
        }
      }
    }

    // 4. 弹窗操作按钮
    if (!handled && uiState.actionButtons) {
      for (var i = 0; i < uiState.actionButtons.length; i++) {
        var btn = uiState.actionButtons[i];
        if (isPointInRect(x, y, btn)) {
          if (btn.action === 'close') {
            state.selectedTabWindow = null;
            state.showProfile = false;
          } else if (btn.action === 'back') {
            state.selectedFriend = null;
          } else if (btn.action === 'send') {
            showInputDialog('发送消息', '输入消息', function(v) { sendMessage(v); });
          } else if (btn.action === 'addFriend') {
            showInputDialog('添加好友', '输入玩家UID或昵称', function(v) { addFriend(v); });
          }
          handled = true;
          break;
        }
      }
    }

    // 5. 角色选择
    if (!handled && uiState.roleButtons) {
      for (var i = 0; i < uiState.roleButtons.length; i++) {
        var btn = uiState.roleButtons[i];
        if (isPointInRect(x, y, btn)) {
          state.avatar = btn.roleId;
          state.selectedRole = btn.roleId;
          saveState();
          handled = true;
          break;
        }
      }
    }

    // 6. 好友列表
    if (!handled && uiState.friendButtons) {
      for (var i = 0; i < uiState.friendButtons.length; i++) {
        var btn = uiState.friendButtons[i];
        if (isPointInRect(x, y, btn)) {
          state.selectedFriend = btn.playerId;
          if (!state.messages[btn.playerId]) state.messages[btn.playerId] = [];
          handled = true;
          break;
        }
      }
    }

    // 7. 底部选项卡
    if (!handled && uiState.optionButtons) {
      for (var i = 0; i < uiState.optionButtons.length; i++) {
        var btn = uiState.optionButtons[i];
        if (isPointInRect(x, y, btn)) {
          state.selectedTab = btn.label;
          state.selectedTabWindow = btn.label;
          state.showProfile = false;
          handled = true;
          break;
        }
      }
    }

    // 8. 居中按钮
    if (!handled && uiState.centerButton && isPointInRect(x, y, uiState.centerButton)) {
      state.bgOffset = 0;
      handled = true;
    }

    // 9. 点击弹窗外关闭
    if (!handled && state.selectedTabWindow && uiState.tabWindow && !isPointInRect(x, y, uiState.tabWindow)) {
      state.selectedTabWindow = null;
      handled = true;
    }

    // 10. 点击其他区域关闭个人资料
    if (!handled && state.showProfile) {
      state.showProfile = false;
    }

    inputState.lastTapX = -1;
    inputState.lastTapY = -1;
  }

  requestAnimationFrame(gameLoop);
}

// ==================== 初始化 ====================

function init() {
  loadState();
  state.bgOffset = 0;
  initPlayerId();
  if (!state.uid) registerToServer();
  connectWebSocket();
  loadFriends();
  gameLoop();
}

tt.onShow(function() {
  loadState();
  lastTime = Date.now();
  if (!state.uid && state.playerId) registerToServer();
  loadFriends();
  if (state.playerId && socket) {
    try { socket.send({ data: JSON.stringify({ event: 'login', playerId: state.playerId }) }); } catch(e) {}
  }
});

tt.onHide(function() {
  state.lastExit = Date.now();
  saveState();
});

init();
