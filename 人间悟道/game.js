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
    console.log('正在注册到服务器:', state.apiBase);
    const res = await tt.request({
      url: state.apiBase + '/api/users/register',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        playerId: state.playerId,
        nickname: state.nickname
      }
    });
    console.log('注册响应:', res);
    if (res.data) {
      state.uid = res.data.uid;
      state.nickname = res.data.nickname || state.nickname;
      state.avatar = res.data.avatar || 1;
      state.level = res.data.level || 1;
      state.cultivation = res.data.cultivation || 0;
      state.bio = res.data.bio || '';
      state.birthday = res.data.birthday || '';
      console.log('注册成功, UID:', state.uid);
      saveState();
      loadFriends();
    } else {
      // 后端没有返回数据，使用本地UID
      generateLocalUID();
    }
  } catch (err) {
    console.log('注册失败:', err);
    // 后端不可用，使用本地生成的UID
    generateLocalUID();
  }
}

// 本地生成临时UID（当后端不可用时）
function generateLocalUID() {
  if (!state.uid) {
    // 生成一个基于时间的临时UID（100000-999999范围）
    state.uid = 100000 + Math.floor(Math.random() * 899999);
    console.log('使用本地临时UID:', state.uid);
    saveState();
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
    const wsUrl = state.apiBase.replace('http://', 'ws://').replace('https://', 'wss://');
    console.log('Connecting WebSocket:', wsUrl);
    
    socket = tt.connectSocket({
      url: wsUrl
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
        console.log('WebSocket message:', data);
        
        if (data.event === 'newMessage' || data.type === 'newMessage') {
          const msg = data.message || data;
          handleNewMessage(msg);
        } else if (data.event === 'messageSent') {
          // 消息发送确认
          console.log('Message sent confirmed');
        } else if (data.event === 'userOnline') {
          // 好友上线
          const playerId = data.playerId;
          state.friends = state.friends.map(f => 
            f.playerId === playerId ? { ...f, online: true } : f
          );
        } else if (data.event === 'userOffline') {
          // 好友下线
          const playerId = data.playerId;
          state.friends = state.friends.map(f => 
            f.playerId === playerId ? { ...f, online: false } : f
          );
        }
      } catch (e) {
        console.log('WebSocket message parse error:', e);
      }
    });
    
    socket.onClose(() => {
      console.log('WebSocket closed');
      state.connected = false;
      // 自动重连
      setTimeout(connectWebSocket, 5000);
    });
    
    socket.onError((err) => {
      console.log('WebSocket error:', err);
      state.connected = false;
    });
  } catch (err) {
    console.log('无法连接WebSocket:', err);
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
}

// 发送消息
function sendMessage(content) {
  if (!state.selectedFriend || !content.trim()) return;
  
  const msg = {
    from: state.playerId,
    to: state.selectedFriend,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };
  
  // 先显示到本地
  if (!state.messages[state.selectedFriend]) {
    state.messages[state.selectedFriend] = [];
  }
  state.messages[state.selectedFriend].push(msg);
  
  // 发送到服务器
  if (socket) {
    try {
      socket.send({ 
        data: JSON.stringify({ 
          event: 'sendMessage', 
          from: msg.from,
          to: msg.to,
          content: msg.content
        }) 
      });
      console.log('Message sent via WebSocket');
    } catch (err) {
      console.log('Failed to send message:', err);
    }
  } else {
    console.log('WebSocket not connected');
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
    const x = inputState.lastTapX;
    const y = inputState.lastTapY;
    let handled = false;

    // 1. 头像点击
    if (uiState.avatarBtn && isPointInRect(x, y, uiState.avatarBtn)) {
      state.showProfile = true;
      state.selectedTabWindow = null;
      handled = true;
    }

    // 2. 个人信息面板按钮
    if (!handled && state.showProfile && uiState.profileButtons) {
      for (const btn of uiState.profileButtons) {
        if (isPointInRect(x, y, btn)) {
          if (btn.action === 'close') {
            state.showProfile = false;
          } else if (btn.action === 'changeAvatar') {
            const idx = state.roleList.indexOf(state.avatar || state.selectedRole);
            state.avatar = state.roleList[(idx + 1) % state.roleList.length];
            saveState();
          } else if (btn.action === 'changeFrame') {
            state.avatarFrame = ((state.avatarFrame || 0) + 1) % 4;
            saveState();
          } else if (btn.action === 'changeNickname') {
            showInputDialog('修改昵称', '请输入新昵称', (v) => { state.nickname = v; saveState(); });
          } else if (btn.action === 'changeBio') {
            showInputDialog('修改简介', '介绍一下自己', (v) => { state.bio = v; saveState(); });
          }
          handled = true;
          break;
        }
      }
    }

    // 3. 聊天输入框
    if (!handled && uiState.inputAreas) {
      for (const area of uiState.inputAreas) {
        if (isPointInRect(x, y, area) && area.type === 'chat') {
          showInputDialog('发送消息', '输入消息', (v) => sendMessage(v));
          handled = true;
          break;
        }
      }
    }

    // 4. 弹窗内按钮 (actionButtons)
    if (!handled && uiState.actionButtons) {
      for (const btn of uiState.actionButtons) {
        if (isPointInRect(x, y, btn)) {
          if (btn.action === 'close') {
            state.selectedTabWindow = null;
            state.showProfile = false;
          } else if (btn.action === 'back') {
            state.selectedFriend = null;
          } else if (btn.action === 'send') {
            showInputDialog('发送消息', '输入消息', (v) => sendMessage(v));
          } else if (btn.action === 'addFriend') {
            showInputDialog('添加好友', '输入玩家UID或昵称', async (v) => {
              if (!v || !v.trim()) {
                tt.showToast({ title: '请输入UID或昵称' });
                return;
              }
              try {
                // 判断是纯数字（UID）还是昵称
                const isUID = /^\d+$/.test(v.trim());
                let searchUrl;
                if (isUID) {
                  searchUrl = state.apiBase + '/api/players?uid=' + encodeURIComponent(v.trim());
                } else {
                  searchUrl = state.apiBase + '/api/players?nickname=' + encodeURIComponent(v.trim());
                }
                
                const res = await tt.request({ url: searchUrl, method: 'GET' });
                if (res.data && res.data.length > 0) {
                  // 找到玩家，添加好友
                  const targetPlayer = res.data[0];
                  if (targetPlayer.playerId === state.playerId) {
                    tt.showToast({ title: '不能添加自己为好友' });
                    return;
                  }
                  
                  const addRes = await tt.request({
                    url: state.apiBase + '/api/friends',
                    method: 'POST',
                    header: { 'Content-Type': 'application/json' },
                    data: { playerId: state.playerId, friendId: targetPlayer.playerId }
                  });
                  
                  if (addRes.statusCode === 200 || addRes.statusCode === 201) {
                    tt.showToast({ title: '添加成功!' });
                    loadFriends();
                  } else if (addRes.data && addRes.data.error) {
                    tt.showToast({ title: addRes.data.error });
                  }
                } else {
                  tt.showToast({ title: '未找到玩家' });
                }
              } catch (err) {
                console.log('添加好友错误:', err);
                tt.showToast({ title: '添加失败: ' + (err.message || '网络错误') });
              }
            });
          }
          handled = true;
          break;
        }
      }
    }

    // 5. 角色选择
    if (!handled && uiState.roleButtons) {
      for (const btn of uiState.roleButtons) {
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
      for (const btn of uiState.friendButtons) {
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
      for (const btn of uiState.optionButtons) {
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
    if (!handled && state.selectedTabWindow && uiState.tabWindow) {
      if (!isPointInRect(x, y, uiState.tabWindow)) {
        state.selectedTabWindow = null;
      }
      handled = true;
    }

    if (!handled && state.showProfile) {
      // 点击其他区域关闭个人资料（简化处理）
      state.showProfile = false;
    }

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
  
  // 初始化玩家ID（如果没有则生成并注册）
  initPlayerId();
  
  // 如果没有UID，尝试注册获取
  if (!state.uid) {
    registerToServer();
  }
  
  // 连接WebSocket
  connectWebSocket();
  
  // 加载好友
  loadFriends();
  
  gameLoop();
}

tt.onShow(() => {
  loadState();
  lastTime = Date.now();
  // 每次显示时检查是否需要注册
  if (!state.uid && state.playerId) {
    registerToServer();
  }
  loadFriends();
});

tt.onHide(() => {
  state.lastExit = Date.now();
  saveState();
});

init();
