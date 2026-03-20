// 入口：挂机类休闲游戏框架 - 人间悟道
// 目录结构：
//  - src/state.js  状态数据
//  - src/ui.js     界面绘制与输入判定
//  - src/storage.js  存档/离线收益
//  - src/api.js     API通信

const { state } = require("./src/state");
const { loadState, saveState } = require("./src/storage");
const { render } = require("./src/ui");

const systemInfo = tt.getSystemInfoSync();
const canvas = tt.createCanvas();
const ctx = canvas.getContext("2d");

// 高DPI支持
const dpr = systemInfo.pixelRatio || 1;
canvas.width = systemInfo.windowWidth * dpr;
canvas.height = systemInfo.windowHeight * dpr;
ctx.scale(dpr, dpr);

// 输入状态
const inputState = {
  isPressing: false,
  lastTapX: 0,
  lastTapY: 0,
  lastMoveX: 0,
  isDragging: false,
};

// 初始化玩家ID（如果没有的话生成一个）
function initPlayerId() {
  if (!state.playerId) {
    // 生成一个唯一的playerId
    state.playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    // 注册到后端
    registerToServer();
  }
}

// 注册到后端服务器
async function registerToServer() {
  try {
    const res = await tt.request({
      url: state.apiBase + '/api/users/register',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        playerId: state.playerId,
        nickname: state.nickname
      }
    });
    if (res.data) {
      state.uid = res.data.uid;
      state.nickname = res.data.nickname || state.nickname;
      state.avatar = res.data.avatar || 1;
      state.level = res.data.level || 1;
      state.cultivation = res.data.cultivation || 0;
      state.bio = res.data.bio || '';
      state.birthday = res.data.birthday || '';
      console.log('注册成功:', res.data);
      saveState();
      // 注册成功后加载好友
      loadFriends();
    }
  } catch (err) {
    console.log('注册失败，使用本地模式');
  }
}

// WebSocket 连接
let socket = null;

// 加载好友列表
async function loadFriends() {
  if (!state.playerId) return;
  
  try {
    const res = await tt.request({
      url: state.apiBase + '/api/friends/' + state.playerId,
      method: 'GET'
    });
    if (res.data) {
      state.friends = res.data;
      saveState();
    }
  } catch (err) {
    console.log('加载好友列表失败:', err);
  }
}

function connectWebSocket() {
  try {
    socket = tt.connectSocket({
      url: 'ws://' + (state.apiBase.replace('http://', ''))
    });
    
    socket.onOpen(() => {
      console.log('WebSocket connected');
      state.connected = true;
      // 登录
      if (state.playerId) {
        socket.send({ data: JSON.stringify({ event: 'login', playerId: state.playerId }) });
      }
    });
    
    socket.onMessage((res) => {
      try {
        const data = JSON.parse(res.data);
        if (data.event === 'newMessage' || data.type === 'newMessage') {
          const msg = data.message || data;
          handleNewMessage(msg);
        }
      } catch (e) {}
    });
    
    socket.onClose(() => {
      console.log('WebSocket closed');
      state.connected = false;
      // 自动重连
      setTimeout(connectWebSocket, 3000);
    });
    
    socket.onError((err) => {
      console.log('WebSocket error');
    });
  } catch (err) {
    console.log('无法连接WebSocket');
  }
}

// 处理新消息
function handleNewMessage(msg) {
  const from = msg.from;
  if (!state.messages[from]) {
    state.messages[from] = [];
  }
  state.messages[from].push(msg);
  
  // 如果当前正在和这个好友聊天，更新UI
  if (state.selectedFriend === from) {
    // 消息已经在列表中
  }
}

// 发送消息
function sendMessage(content) {
  if (!state.selectedFriend || !content.trim()) return;
  
  const msg = {
    from: state.playerId,
    to: state.selectedFriend,
    content: content,
    createdAt: new Date().toISOString()
  };
  
  // 先显示到本地
  if (!state.messages[state.selectedFriend]) {
    state.messages[state.selectedFriend] = [];
  }
  state.messages[state.selectedFriend].push(msg);
  
  // 发送到服务器
  if (socket && socket.open) {
    socket.send({ data: JSON.stringify({ event: 'sendMessage', ...msg }) });
  }
}

function isPointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function handleTap(x, y) {
  inputState.lastTapX = x;
  inputState.lastTapY = y;
  inputState.lastMoveX = x;
  inputState.isPressing = true;
  inputState.isDragging = false;
}

function handleMove(x, y) {
  if (inputState.isPressing) {
    // 有弹窗时不移动背景
    if (state.selectedTabWindow || state.showProfile) return;
    
    const height = systemInfo.windowHeight;
    const optionBarY = height - 80;
    
    if (y >= optionBarY) return; // 在选项栏不移动
    
    const deltaX = Math.max(-20, Math.min(20, x - inputState.lastMoveX));
    state.bgOffset += deltaX;
    if (state.bgOffset < currentMinOffset) state.bgOffset = currentMinOffset;
    if (state.bgOffset > currentMaxOffset) state.bgOffset = currentMaxOffset;
    inputState.lastMoveX = x;
    inputState.isDragging = true;
  }
}

function handleRelease() {
  inputState.isPressing = false;
  inputState.isDragging = false;
}

// 显示输入框（通用）
function showInputDialog(title, placeholder, callback) {
  const input = tt.createCanvas();
  const inputCtx = input.getContext('2d');
  
  tt.showModal({
    title: title,
    placeholderText: placeholder,
    confirmText: '确定',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm && res.value) {
        callback(res.value);
      }
    }
  });
}

tt.onTouchStart((evt) => {
  const touch = evt.touches[0];
  if (!touch) return;
  handleTap(touch.clientX, touch.clientY);
});

tt.onTouchMove((evt) => {
  const touch = evt.touches[0];
  if (!touch) return;
  handleMove(touch.clientX, touch.clientY);
});

tt.onTouchEnd(() => {
  handleRelease();
});

// 主循环
let lastTime = Date.now();
let uiState = null;
let currentMinOffset = 0, currentMaxOffset = 0;

function gameLoop() {
  const now = Date.now();
  const deltaSeconds = (now - lastTime) / 1000;
  lastTime = now;

  // 渲染
  uiState = render(ctx, systemInfo.windowWidth, systemInfo.windowHeight, inputState);
  currentMinOffset = uiState.minOffset || 0;
  currentMaxOffset = uiState.maxOffset || 0;

  // 点击交互
  if (!inputState.isPressing && !inputState.isDragging && uiState && inputState.lastTapX >= 0) {
    let clickedOnSomething = false;

    // ====== 头像点击（打开用户信息面板）======
    if (uiState.avatarBtn && isPointInRect(inputState.lastTapX, inputState.lastTapY, uiState.avatarBtn)) {
      state.showProfile = true;
      state.selectedTabWindow = null;
      clickedOnSomething = true;
    }
    
    // ====== 个人信息面板按钮 ======
    else if (state.showProfile && uiState.profileButtons && uiState.profileButtons.length > 0) {
      for (const btn of uiState.profileButtons) {
        if (isPointInRect(inputState.lastTapX, inputState.lastTapY, btn)) {
          if (btn.action === 'close') {
            state.showProfile = false;
          } else if (btn.action === 'edit') {
            showInputDialog('修改昵称', '请输入昵称', (value) => {
              state.nickname = value;
              saveState();
            });
          } else if (btn.action === 'changeAvatar') {
            const currentIdx = state.roleList.indexOf(state.avatar || state.selectedRole);
            const nextIdx = (currentIdx + 1) % state.roleList.length;
            state.avatar = state.roleList[nextIdx];
            saveState();
          } else if (btn.action === 'changeFrame') {
            state.avatarFrame = (state.avatarFrame + 1) % 4;
            saveState();
          } else if (btn.action === 'changeNickname') {
            showInputDialog('修改昵称', '请输入新昵称', (value) => {
              state.nickname = value;
              saveState();
            });
          } else if (btn.action === 'changeBio') {
            showInputDialog('修改简介', '介绍一下自己', (value) => {
              state.bio = value;
              saveState();
            });
          }
          clickedOnSomething = true;
          break;
        }
      }
    }
    
    // ====== 聊天输入框 ======
    else if (uiState.inputAreas && uiState.inputAreas.length > 0) {
      for (const inputArea of uiState.inputAreas) {
        if (isPointInRect(inputState.lastTapX, inputState.lastTapY, inputArea)) {
          if (inputArea.type === 'chat') {
            showInputDialog('发送消息', '输入消息内容', (value) => {
              sendMessage(value);
            });
          }
          clickedOnSomething = true;
          break;
        }
      }
    }

    // ====== 窗口内点击 ======
    else if (uiState.tabWindow && isPointInRect(inputState.lastTapX, inputState.lastTapY, uiState.tabWindow)) {
      clickedOnSomething = true;
    } else if (state.selectedTabWindow) {
      state.selectedTabWindow = null;
    }

    // ====== 居中按钮 ======
    else if (uiState.centerButton && isPointInRect(inputState.lastTapX, inputState.lastTapY, uiState.centerButton)) {
      state.bgOffset = 0;
      clickedOnSomething = true;
    }

    // ====== 角色选择 ======
    else if (uiState.roleButtons && uiState.roleButtons.length > 0) {
      for (const roleBtn of uiState.roleButtons) {
        if (isPointInRect(inputState.lastTapX, inputState.lastTapY, roleBtn)) {
          state.avatar = roleBtn.roleId;
          state.selectedRole = roleBtn.roleId;
          clickedOnSomething = true;
          break;
        }
      }
    }

    // ====== 好友列表 ======
    else if (uiState.friendButtons && uiState.friendButtons.length > 0) {
      for (const friendBtn of uiState.friendButtons) {
        if (isPointInRect(inputState.lastTapX, inputState.lastTapY, friendBtn)) {
          state.selectedFriend = friendBtn.playerId;
          if (!state.messages[friendBtn.playerId]) {
            state.messages[friendBtn.playerId] = [];
          }
          clickedOnSomething = true;
          break;
        }
      }
    }

    // ====== 操作按钮 ======
    else if (uiState.actionButtons && uiState.actionButtons.length > 0) {
      for (const actionBtn of uiState.actionButtons) {
        if (isPointInRect(inputState.lastTapX, inputState.lastTapY, actionBtn)) {
          if (actionBtn.action === 'close') {
            state.selectedTabWindow = null;
            state.showProfile = false;
          } else if (actionBtn.action === 'back') {
            state.selectedFriend = null;
          } else if (actionBtn.action === 'send') {
            showInputDialog('发送消息', '输入消息', (value) => {
              sendMessage(value);
            });
          } else if (actionBtn.action === 'addFriend') {
            showInputDialog('添加好友', '输入玩家UID或昵称', async (value) => {
              try {
                const res = await tt.request({
                  url: state.apiBase + '/api/players?q=' + encodeURIComponent(value),
                  method: 'GET'
                });
                if (res.data && res.data.length > 0) {
                  const player = res.data[0];
                  await tt.request({
                    url: state.apiBase + '/api/friends',
                    method: 'POST',
                    header: { 'Content-Type': 'application/json' },
                    data: { playerId: state.playerId, friendId: player.playerId }
                  });
                  tt.showToast({ title: '添加成功!' });
                  loadFriends();
                } else {
                  tt.showToast({ title: '未找到玩家' });
                }
              } catch (err) {
                tt.showToast({ title: '添加失败: ' + err.message });
              }
            });
          }
          clickedOnSomething = true;
          break;
        }
      }
    }

    // ====== 底部选项卡 ======
    else if (uiState.optionButtons) {
      for (const button of uiState.optionButtons) {
        if (isPointInRect(inputState.lastTapX, inputState.lastTapY, button)) {
          state.selectedTab = button.label;
          state.selectedTabWindow = button.label;
          state.showProfile = false;
          clickedOnSomething = true;
          break;
        }
      }
    }

    // 重置点击位置
    inputState.lastTapX = -1;
    inputState.lastTapY = -1;
  }

  requestAnimationFrame(gameLoop);
}

// 加载好友列表
async function loadFriends() {
  try {
    const res = await tt.request({
      url: state.apiBase + '/api/friends/' + state.playerId,
      method: 'GET'
    });
    if (res.data) {
      state.friends = res.data;
    }
  } catch (err) {
    console.log('加载好友失败');
  }
}

function init() {
  loadState();
  state.bgOffset = 0;
  
  // 初始化
  initPlayerId();
  
  // 连接WebSocket
  connectWebSocket();
  
  // 加载好友
  loadFriends();
  
  gameLoop();
}

tt.onShow(() => {
  loadState();
  lastTime = Date.now();
  loadFriends();
});

tt.onHide(() => {
  state.lastExit = Date.now();
  saveState();
});

init();
