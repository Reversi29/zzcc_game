// 入口：挂机类休闲游戏框架
// 目录结构建议：
//  - src/state.js  状态数据
//  - src/logic.js  挂机/升级逻辑
//  - src/storage.js  存档/离线收益
//  - src/ui.js  界面绘制与输入判定

const { state } = require("./src/state");
const { loadState, saveState } = require("./src/storage");
const { render } = require("./src/ui");

const systemInfo = tt.getSystemInfoSync();
const canvas = tt.createCanvas();
const ctx = canvas.getContext("2d");

// 高DPI支持，避免画面模糊
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
    // 如果有窗口打开，不移动背景
    if (state.selectedTabWindow) return;
    const height = systemInfo.windowHeight;
    // 检查是否在选项栏或聊天框区域
    const optionBarY = height - 80;
    const isChatExpanded = state.chatBoxExpanded || state.inChatMode;
    const chatBoxHeight = isChatExpanded ? 120 : 60;
    const chatBoxY = height - 80 - chatBoxHeight;
    if (y >= optionBarY || (y >= chatBoxY && y <= chatBoxY + chatBoxHeight)) {
      // 在选项栏或聊天框，不移动背景
      return;
    }
    const deltaX = Math.max(-20, Math.min(20, x - inputState.lastMoveX)); // 限制最大移动距离，避免顿挫
    state.bgOffset += deltaX;
    // 限制边界
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

    // 检查窗口点击
    if (uiState.tabWindow && isPointInRect(inputState.lastTapX, inputState.lastTapY, uiState.tabWindow)) {
      clickedOnSomething = true; // 点击在窗口内
    } else if (state.selectedTabWindow) {
      state.selectedTabWindow = null; // 点击窗口外，关闭窗口
    }

    if (uiState.chatBox && isPointInRect(inputState.lastTapX, inputState.lastTapY, uiState.chatBox)) {
      // 点击聊天框，进入聊天模式
      state.inChatMode = true;
      clickedOnSomething = true;
    } else if (state.inChatMode) {
      // 点击其他地方，退出聊天模式
      state.inChatMode = false;
    }

    if (uiState.centerButton && isPointInRect(inputState.lastTapX, inputState.lastTapY, uiState.centerButton)) {
      // 点击居中按钮
      state.bgOffset = 0;
      clickedOnSomething = true;
    }

    if (uiState.optionButtons) {
      for (const button of uiState.optionButtons) {
        if (isPointInRect(inputState.lastTapX, inputState.lastTapY, button)) {
          // 点击选项按钮
          state.selectedTab = button.label;
          state.selectedTabWindow = button.label;
          clickedOnSomething = true;
          break;
        }
      }
    }

    // 重置点击位置，防止重复处理
    inputState.lastTapX = -1;
    inputState.lastTapY = -1;
  }

  requestAnimationFrame(gameLoop);
}

function startQuestion() {
  // 暂时移除问题功能
}

function renderQuestion(ctx, width, height) {
  // 暂时移除问题渲染
}

function handleQuestionTap(x, y) {
  // 暂时移除问题点击处理
}

function init() {
  loadState();
  state.bgOffset = 0; // 刚进入游戏背景居中
  gameLoop();
}

tt.onShow(() => {
  loadState();
  lastTime = Date.now();
});

tt.onHide(() => {
  state.lastExit = Date.now();
  saveState();
});

init();
