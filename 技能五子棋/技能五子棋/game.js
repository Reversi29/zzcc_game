/**
 * 技能五子棋 - 抖音小游戏
 */

// ==================== 游戏配置 ====================
const CONFIG = {
  BOARD_SIZE: 15,
  CELL_SIZE: 0,
  PIECE_RADIUS: 0,
  THINK_TIME: 15,
  AI_DELAY: 500,
};

// ==================== 游戏状态 ====================
let gameState = 'menu';
let gameMode = '';
let currentScreen = '';

let board = [];
let currentPlayer = 1;
let isMyTurn = true;
let gameOver = false;
let winner = null;
let lastMove = null;

let playerTime = CONFIG.THINK_TIME;
let aiTime = CONFIG.THINK_TIME;
let timerInterval = null;

let systemInfo = null;
let canvas = null;
let ctx = null;
let canvasWidth = 0;
let canvasHeight = 0;
let menuButtons = [];

// ==================== 初始化 ====================
function init() {
  try {
    systemInfo = tt.getSystemInfoSync();
    canvasWidth = systemInfo.windowWidth;
    canvasHeight = systemInfo.windowHeight;
    
    // 创建 Canvas
    canvas = tt.createCanvas();
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx = canvas.getContext('2d');
    
    // 计算棋盘尺寸
    const minDim = Math.min(canvasWidth, canvasHeight);
    const boardPixelSize = minDim * 0.88;
    CONFIG.CELL_SIZE = boardPixelSize / CONFIG.BOARD_SIZE;
    CONFIG.PIECE_RADIUS = CONFIG.CELL_SIZE * 0.42;
    
    initMenu();
    
    // 触摸事件
    tt.onTouchStart(handleTouch);
    
    // 启动游戏循环
    gameLoop();
  } catch (e) {
    console.error('Init error:', e);
  }
}

// ==================== 菜单系统 ====================
function initMenu() {
  currentScreen = 'main_menu';
  menuButtons = [];
  
  const btnW = Math.min(canvasWidth * 0.75, 300);
  const btnH = 56;
  const startY = canvasHeight * 0.28;
  const gap = 72;
  const centerX = canvasWidth / 2;
  
  menuButtons = [
    { id: 'normal_single', text: '普通五子棋', sub: '单机', x: centerX, y: startY, w: btnW, h: btnH, type: 'main' },
    { id: 'skill_single', text: '技能五子棋', sub: '单机', x: centerX, y: startY + gap, w: btnW, h: btnH, type: 'main' },
    { id: 'multi_single', text: '多人五子棋', sub: '单机', x: centerX, y: startY + gap * 2, w: btnW, h: btnH, type: 'main' },
    { id: 'settings', text: '设置', x: centerX, y: startY + gap * 3, w: btnW, h: btnH, type: 'main' },
  ];
}

function initSettings() {
  currentScreen = 'settings';
  menuButtons = [];
  
  const btnW = Math.min(canvasWidth * 0.5, 200);
  const btnH = 45;
  const centerX = canvasWidth / 2;
  
  menuButtons = [
    { id: 'back', text: '返回', x: centerX, y: canvasHeight - 100, w: btnW, h: btnH, type: 'main' },
  ];
}

// ==================== 游戏初始化 ====================
function initGame() {
  board = Array(CONFIG.BOARD_SIZE).fill(0).map(() => Array(CONFIG.BOARD_SIZE).fill(0));
  currentPlayer = 1;
  isMyTurn = true;
  gameOver = false;
  winner = null;
  lastMove = null;
  playerTime = CONFIG.THINK_TIME;
  aiTime = CONFIG.THINK_TIME;
  
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    if (gameOver) {
      clearInterval(timerInterval);
      return;
    }
    if (isMyTurn) {
      playerTime--;
      if (playerTime <= 0) endGame(2);
    } else {
      aiTime--;
      if (aiTime <= 0) endGame(1);
    }
  }, 1000);
}

// ==================== 渲染函数 ====================
function drawMenu() {
  // 背景渐变
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // 标题
  ctx.fillStyle = '#e94560';
  ctx.font = `bold ${canvasWidth * 0.11}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('技能五子棋', canvasWidth / 2, canvasHeight * 0.12);
  
  // 副标题
  ctx.fillStyle = '#9a8c98';
  ctx.font = `${canvasWidth * 0.035}px Arial`;
  ctx.fillText('Five in a Row', canvasWidth / 2, canvasHeight * 0.18);
  
  if (currentScreen === 'main_menu') {
    drawMainMenu();
  } else if (currentScreen === 'settings') {
    drawSettings();
  }
}

function drawMainMenu() {
  for (const btn of menuButtons) {
    drawButton(btn);
  }
}

function drawSettings() {
  ctx.fillStyle = '#eee';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  ctx.fillStyle = '#333';
  ctx.font = `bold ${canvasWidth * 0.08}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('设置', canvasWidth / 2, 80);
  
  ctx.font = `${canvasWidth * 0.04}px Arial`;
  ctx.fillText('版本 1.0.0', canvasWidth / 2, 160);
  ctx.fillText('音效: 开启', canvasWidth / 2, 220);
  ctx.fillText('音乐: 开启', canvasWidth / 2, 280);
  
  for (const btn of menuButtons) {
    drawButton(btn);
  }
}

function drawButton(btn) {
  const cx = btn.x;
  const cy = btn.y;
  const w = btn.w;
  const h = btn.h;
  
  // 按钮背景
  const bg = ctx.createLinearGradient(cx - w/2, 0, cx + w/2, 0);
  bg.addColorStop(0, '#3a3e59');
  bg.addColorStop(1, '#22223b');
  
  ctx.fillStyle = bg;
  roundRect(ctx, cx - w/2, cy - h/2, w, h, 12);
  ctx.fill();
  
  // 边框
  ctx.strokeStyle = '#4a4e69';
  ctx.lineWidth = 2;
  roundRect(ctx, cx - w/2, cy - h/2, w, h, 12);
  ctx.stroke();
  
  // 主文字
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${canvasWidth * 0.045}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (btn.type === 'main') {
    // 主文字在左边
    ctx.textAlign = 'left';
    ctx.fillText(btn.text, cx - w/2 + w * 0.25, cy);
    
    // 副文字在右边
    ctx.fillStyle = '#e94560';
    ctx.font = `${canvasWidth * 0.035}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillText(btn.sub, cx + w/2 - 15, cy);
  } else {
    ctx.fillText(btn.text, cx, cy);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawGame() {
  // 背景
  ctx.fillStyle = '#E5D4B3';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // 顶部信息栏
  const topH = 70;
  ctx.fillStyle = 'rgba(26, 26, 46, 0.95)';
  ctx.fillRect(0, 0, canvasWidth, topH);
  
  // 返回按钮
  ctx.fillStyle = '#e94560';
  ctx.beginPath();
  ctx.arc(35, 35, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('<', 35, 35);
  
  // 游戏标题
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${canvasWidth * 0.045}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('普通五子棋', canvasWidth / 2, 35);
  
  // 玩家信息
  const infoY = 55;
  const leftX = canvasWidth * 0.22;
  const rightX = canvasWidth * 0.78;
  
  // 黑方
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(leftX, infoY, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = currentPlayer === 1 && isMyTurn ? '#e94560' : '#888';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('你', leftX, infoY + 25);
  
  // 白方
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(rightX, infoY, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = currentPlayer === 2 && !isMyTurn ? '#e94560' : '#888';
  ctx.fillText('人机', rightX, infoY + 25);
  
  // 计时器
  ctx.font = 'bold 18px Arial';
  ctx.fillStyle = playerTime <= 5 ? '#e94560' : '#fff';
  ctx.fillText(playerTime + 's', leftX, infoY);
  
  ctx.fillStyle = aiTime <= 5 ? '#e94560' : '#fff';
  ctx.fillText(aiTime + 's', rightX, infoY);
  
  // 绘制棋盘
  drawBoard();
  
  // 绘制棋子
  drawPieces();
  
  // 回合提示
  if (!gameOver) {
    const tipY = topH + 25;
    ctx.fillStyle = '#666';
    ctx.font = `${canvasWidth * 0.038}px Arial`;
    ctx.textAlign = 'center';
    const tip = isMyTurn ? '轮到你落子' : '人机思考中...';
    ctx.fillText(tip, canvasWidth / 2, tipY);
  }
  
  // 胜负提示
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    const msg = winner === 1 ? '你赢了！' : '人机赢了！';
    ctx.fillStyle = winner === 1 ? '#ffd700' : '#e94560';
    ctx.font = `bold ${canvasWidth * 0.15}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(msg, canvasWidth / 2, canvasHeight * 0.45);
    
    // 按钮
    const btnW = 140;
    const btnH = 45;
    const btnY = canvasHeight * 0.58;
    
    // 重新开始按钮
    ctx.fillStyle = '#e94560';
    roundRect(ctx, canvasWidth/2 - btnW/2, btnY, btnW, btnH, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${canvasWidth * 0.04}px Arial`;
    ctx.fillText('再来一局', canvasWidth / 2, btnY + btnH/2);
    
    // 返回按钮
    const btn2Y = btnY + btnH + 20;
    ctx.fillStyle = '#666';
    roundRect(ctx, canvasWidth/2 - 100/2, btn2Y, 100, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `${canvasWidth * 0.035}px Arial`;
    ctx.fillText('返回菜单', canvasWidth / 2, btn2Y + 20);
  }
}

function drawBoard() {
  const topH = 70;
  const padding = CONFIG.CELL_SIZE;
  const boardSize = CONFIG.CELL_SIZE * (CONFIG.BOARD_SIZE - 1);
  
  // 棋盘背景
  ctx.fillStyle = '#DEB887';
  ctx.fillRect(padding - 4, topH + padding - 4, boardSize + 8, boardSize + 8);
  
  // 网格线
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1;
  
  for (let i = 0; i < CONFIG.BOARD_SIZE; i++) {
    const pos = padding + i * CONFIG.CELL_SIZE;
    
    ctx.beginPath();
    ctx.moveTo(padding, pos);
    ctx.lineTo(padding + boardSize, pos);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(pos, topH + padding);
    ctx.lineTo(pos, topH + padding + boardSize);
    ctx.stroke();
  }
  
  // 星位
  const stars = [[3,3], [3,11], [11,3], [11,11], [7,7]];
  ctx.fillStyle = '#8B4513';
  for (const [x, y] of stars) {
    ctx.beginPath();
    ctx.arc(padding + x * CONFIG.CELL_SIZE, topH + padding + y * CONFIG.CELL_SIZE, CONFIG.CELL_SIZE * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPieces() {
  const topH = 70;
  const padding = CONFIG.CELL_SIZE;
  
  for (let y = 0; y < CONFIG.BOARD_SIZE; y++) {
    for (let x = 0; x < CONFIG.BOARD_SIZE; x++) {
      if (board[y][x] !== 0) {
        const px = padding + x * CONFIG.CELL_SIZE;
        const py = topH + padding + y * CONFIG.CELL_SIZE;
        
        // 阴影
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.arc(px + 2, py + 2, CONFIG.PIECE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
        // 棋子渐变
        const grad = ctx.createRadialGradient(px - 3, py - 3, 0, px, py, CONFIG.PIECE_RADIUS);
        
        if (board[y][x] === 1) {
          grad.addColorStop(0, '#555');
          grad.addColorStop(1, '#111');
        } else {
          grad.addColorStop(0, '#fff');
          grad.addColorStop(1, '#aaa');
        }
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, CONFIG.PIECE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
        if (board[y][x] === 2) {
          ctx.strokeStyle = '#999';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        
        // 最后一手标记
        if (lastMove && lastMove.x === x && lastMove.y === y) {
          ctx.strokeStyle = '#e94560';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, CONFIG.PIECE_RADIUS * 0.4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }
}

// ==================== 触摸处理 ====================
function handleTouch(e) {
  e.preventDefault();
  
  const touch = e.touches ? e.touches[0] : e;
  const x = touch.clientX;
  const y = touch.clientY;
  
  if (gameState === 'menu') {
    handleMenuTouch(x, y);
  } else if (gameState === 'game') {
    handleGameTouch(x, y);
  }
}

function handleMenuTouch(x, y) {
  for (const btn of menuButtons) {
    const cx = btn.x;
    const cy = btn.y;
    const w = btn.w;
    const h = btn.h;
    
    if (x >= cx - w/2 && x <= cx + w/2 && y >= cy - h/2 && y <= cy + h/2) {
      handleMenuAction(btn.id);
      break;
    }
  }
}

function handleGameTouch(x, y) {
  // 返回按钮
  if (x < 57 && y < 57) {
    backToMenu();
    return;
  }
  
  if (gameOver) {
    const btnW = 140;
    const btnH = 45;
    const btnY = canvasHeight * 0.58;
    
    // 重新开始
    if (x >= canvasWidth/2 - btnW/2 && x <= canvasWidth/2 + btnW/2 && y >= btnY && y <= btnY + btnH) {
      initGame();
      return;
    }
    
    // 返回菜单
    const btn2Y = btnY + btnH + 20;
    if (x >= canvasWidth/2 - 50 && x <= canvasWidth/2 + 50 && y >= btn2Y && y <= btn2Y + 40) {
      backToMenu();
      return;
    }
    return;
  }
  
  if (!isMyTurn) return;
  
  const topH = 70;
  const padding = CONFIG.CELL_SIZE;
  const boardSize = CONFIG.CELL_SIZE * (CONFIG.BOARD_SIZE - 1);
  
  // 计算落子位置
  const bx = x - padding;
  const by = y - topH - padding;
  
  if (bx < -CONFIG.PIECE_RADIUS || by < -CONFIG.PIECE_RADIUS ||
      bx > boardSize + CONFIG.PIECE_RADIUS || by > boardSize + CONFIG.PIECE_RADIUS) {
    return;
  }
  
  const gx = Math.round(bx / CONFIG.CELL_SIZE);
  const gy = Math.round(by / CONFIG.CELL_SIZE);
  
  if (gx < 0 || gx >= CONFIG.BOARD_SIZE || gy < 0 || gy >= CONFIG.BOARD_SIZE) return;
  if (board[gy][gx] !== 0) return;
  
  // 玩家落子
  placePiece(gx, gy, 1);
  
  if (checkWin(gx, gy, 1)) {
    endGame(1);
    return;
  }
  
  currentPlayer = 2;
  isMyTurn = false;
  playerTime = CONFIG.THINK_TIME;
  
  // AI 落子
  setTimeout(aiMove, CONFIG.AI_DELAY);
}

function handleMenuAction(id) {
  switch (id) {
    case 'normal_single':
    case 'skill_single':
    case 'multi_single':
      gameState = 'game';
      initGame();
      break;
    case 'settings':
      initSettings();
      break;
    case 'back':
      initMenu();
      break;
  }
}

// ==================== 游戏逻辑 ====================
function placePiece(x, y, player) {
  board[y][x] = player;
  lastMove = { x, y };
}

function checkWin(x, y, player) {
  const dirs = [[1,0], [0,1], [1,1], [1,-1]];
  
  for (const [dx, dy] of dirs) {
    let count = 1;
    
    for (let i = 1; i < 5; i++) {
      const nx = x + dx * i;
      const ny = y + dy * i;
      if (nx < 0 || nx >= CONFIG.BOARD_SIZE || ny < 0 || ny >= CONFIG.BOARD_SIZE) break;
      if (board[ny][nx] !== player) break;
      count++;
    }
    
    for (let i = 1; i < 5; i++) {
      const nx = x - dx * i;
      const ny = y - dy * i;
      if (nx < 0 || nx >= CONFIG.BOARD_SIZE || ny < 0 || ny >= CONFIG.BOARD_SIZE) break;
      if (board[ny][nx] !== player) break;
      count++;
    }
    
    if (count >= 5) return true;
  }
  return false;
}

function endGame(w) {
  gameOver = true;
  winner = w;
  if (timerInterval) clearInterval(timerInterval);
}

function backToMenu() {
  if (timerInterval) clearInterval(timerInterval);
  gameState = 'menu';
  initMenu();
}

// ==================== AI ====================
function aiMove() {
  if (gameOver) return;
  
  const move = findBestMove();
  if (move) {
    placePiece(move.x, move.y, 2);
    
    if (checkWin(move.x, move.y, 2)) {
      endGame(2);
      return;
    }
    
    currentPlayer = 1;
    isMyTurn = true;
    aiTime = CONFIG.THINK_TIME;
  }
}

function findBestMove() {
  let maxScore = -1;
  let candidates = [];
  
  for (let y = 0; y < CONFIG.BOARD_SIZE; y++) {
    for (let x = 0; x < CONFIG.BOARD_SIZE; x++) {
      if (board[y][x] === 0) {
        const score = evaluatePoint(x, y);
        if (score > maxScore) {
          maxScore = score;
          candidates = [{x, y}];
        } else if (score === maxScore) {
          candidates.push({x, y});
        }
      }
    }
  }
  
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function evaluatePoint(x, y) {
  let score = 0;
  const dirs = [[1,0], [0,1], [1,1], [1,-1]];
  
  for (const [dx, dy] of dirs) {
    score += evaluateLine(x, y, dx, dy, 2) * 1.1; // AI
    score += evaluateLine(x, y, dx, dy, 1);       // 阻挡玩家
  }
  
  const center = Math.floor(CONFIG.BOARD_SIZE / 2);
  score += (CONFIG.BOARD_SIZE - Math.abs(x - center) - Math.abs(y - center)) * 0.5;
  
  return score;
}

function evaluateLine(x, y, dx, dy, player) {
  let count = 0;
  let empty = 0;
  let blocked = 0;
  
  for (let i = 1; i <= 4; i++) {
    const nx = x + dx * i;
    const ny = y + dy * i;
    if (nx < 0 || nx >= CONFIG.BOARD_SIZE || ny < 0 || ny >= CONFIG.BOARD_SIZE) {
      blocked++;
      break;
    }
    if (board[ny][nx] === player) count++;
    else if (board[ny][nx] === 0) { empty++; break; }
    else { blocked++; break; }
  }
  
  for (let i = 1; i <= 4; i++) {
    const nx = x - dx * i;
    const ny = y - dy * i;
    if (nx < 0 || nx >= CONFIG.BOARD_SIZE || ny < 0 || ny >= CONFIG.BOARD_SIZE) {
      blocked++;
      break;
    }
    if (board[ny][nx] === player) count++;
    else if (board[ny][nx] === 0) { empty++; break; }
    else { blocked++; break; }
  }
  
  if (blocked === 2) return 0;
  
  const patterns = {
    5: 100000, 4.1: 10000, 4.2: 1000, 3.1: 500,
    3.2: 100, 2.1: 50, 2.2: 10
  };
  
  if (count >= 5) return patterns[5];
  let key = count + (empty === 0 ? 2 : empty === 1 ? 1 : 0);
  return patterns[key] || 0;
}

// ==================== 游戏循环 ====================
function gameLoop() {
  if (gameState === 'menu') {
    drawMenu();
  } else if (gameState === 'game') {
    drawGame();
  }
  
  requestAnimationFrame(gameLoop);
}

// 启动
init();
