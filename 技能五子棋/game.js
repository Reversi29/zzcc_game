/**
 * 技能五子棋 - 抖音小游戏
 */

const CONFIG = {
  BOARD_SIZE: 15,
  CELL_SIZE: 0,
  PIECE_RADIUS: 0,
  THINK_TIME: 15,
  AI_DELAY: 500,
};

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

let aiDifficulty = 'medium'; // easy, medium, hard

let systemInfo = null;
let canvas = null;
let ctx = null;
let canvasWidth = 0;
let canvasHeight = 0;
let menuButtons = [];

function init() {
  try {
    systemInfo = tt.getSystemInfoSync();
    canvasWidth = systemInfo.windowWidth;
    canvasHeight = systemInfo.windowHeight;
    
    canvas = tt.createCanvas();
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx = canvas.getContext('2d');
    
    const minDim = Math.min(canvasWidth, canvasHeight);
    const boardPixelSize = minDim * 0.88;
    CONFIG.CELL_SIZE = boardPixelSize / CONFIG.BOARD_SIZE;
    CONFIG.PIECE_RADIUS = CONFIG.CELL_SIZE * 0.42;
    
    initMenu();
    
    tt.onTouchStart(handleTouch);
    
    gameLoop();
  } catch (e) {
    console.error('Init error:', e);
  }
}

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
  
  const centerX = canvasWidth / 2;
  
  // 难度选项
  const diffY = 180;
  const diffBtnW = 80;
  const diffGap = 15;
  const totalW = diffBtnW * 3 + diffGap * 2;
  const startX = centerX - totalW / 2;
  
  menuButtons = [
    { id: 'diff_easy', text: '简单', x: startX + diffBtnW/2, y: diffY, w: diffBtnW, h: 40, type: 'diff', diff: 'easy' },
    { id: 'diff_medium', text: '中等', x: startX + diffBtnW + diffGap + diffBtnW/2, y: diffY, w: diffBtnW, h: 40, type: 'diff', diff: 'medium' },
    { id: 'diff_hard', text: '困难', x: startX + (diffBtnW + diffGap) * 2 + diffBtnW/2, y: diffY, w: diffBtnW, h: 40, type: 'diff', diff: 'hard' },
    { id: 'back', text: '返回', x: centerX, y: canvasHeight - 100, w: 140, h: 50, type: 'main' },
  ];
}

function drawMenu() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  ctx.fillStyle = '#e94560';
  ctx.font = 'bold ' + (canvasWidth * 0.11) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('技能五子棋', canvasWidth / 2, canvasHeight * 0.12);
  
  ctx.fillStyle = '#9a8c98';
  ctx.font = (canvasWidth * 0.035) + 'px Arial';
  ctx.fillText('Five in a Row', canvasWidth / 2, canvasHeight * 0.18);
  
  if (currentScreen === 'main_menu') {
    drawMainMenu();
  } else if (currentScreen === 'settings') {
    drawSettings();
  }
}

function drawMainMenu() {
  for (let i = 0; i < menuButtons.length; i++) {
    drawButton(menuButtons[i]);
  }
}

function drawSettings() {
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  ctx.fillStyle = '#333';
  ctx.font = 'bold ' + (canvasWidth * 0.08) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('设置', canvasWidth / 2, 60);
  
  // 难度设置
  ctx.font = (canvasWidth * 0.045) + 'px Arial';
  ctx.fillText('人机难度', canvasWidth / 2, 130);
  
  for (let i = 0; i < menuButtons.length; i++) {
    drawButton(menuButtons[i]);
  }
  
  // 版本信息
  ctx.fillStyle = '#999';
  ctx.font = (canvasWidth * 0.03) + 'px Arial';
  ctx.fillText('版本 1.0.0', canvasWidth / 2, canvasHeight - 40);
}

function drawButton(btn) {
  const cx = btn.x;
  const cy = btn.y;
  const w = btn.w;
  const h = btn.h;
  
  if (btn.type === 'diff') {
    // 难度按钮
    const isSelected = aiDifficulty === btn.diff;
    
    ctx.fillStyle = isSelected ? '#e94560' : '#ddd';
    roundRect(ctx, cx - w/2, cy - h/2, w, h, 8);
    ctx.fill();
    
    ctx.fillStyle = isSelected ? '#fff' : '#666';
    ctx.font = 'bold ' + (canvasWidth * 0.038) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, cx, cy);
  } else if (btn.type === 'main') {
    const bg = ctx.createLinearGradient(cx - w/2, 0, cx + w/2, 0);
    bg.addColorStop(0, '#3a3e59');
    bg.addColorStop(1, '#22223b');
    
    ctx.fillStyle = bg;
    roundRect(ctx, cx - w/2, cy - h/2, w, h, 12);
    ctx.fill();
    
    ctx.strokeStyle = '#4a4e69';
    ctx.lineWidth = 2;
    roundRect(ctx, cx - w/2, cy - h/2, w, h, 12);
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + (canvasWidth * 0.045) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (btn.sub) {
      ctx.textAlign = 'left';
      ctx.fillText(btn.text, cx - w/2 + w * 0.25, cy);
      ctx.fillStyle = '#e94560';
      ctx.font = (canvasWidth * 0.035) + 'px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(btn.sub, cx + w/2 - 15, cy);
    } else {
      ctx.fillText(btn.text, cx, cy);
    }
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
  ctx.fillStyle = '#E5D4B3';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  const topH = 70;
  ctx.fillStyle = 'rgba(26, 26, 46, 0.95)';
  ctx.fillRect(0, 0, canvasWidth, topH);
  
  ctx.fillStyle = '#e94560';
  ctx.beginPath();
  ctx.arc(35, 35, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('<', 35, 35);
  
  ctx.fillStyle = '#fff';
  ctx.font = 'bold ' + (canvasWidth * 0.045) + 'px Arial';
  ctx.textAlign = 'center';
  
  // 显示难度
  let diffText = '普通五子棋';
  if (currentPlayer === 1) {
    const diffNames = { easy: '简单', medium: '中等', hard: '困难' };
    diffText = '普通五子棋 - ' + diffNames[aiDifficulty];
  }
  ctx.fillText(diffText, canvasWidth / 2, 35);
  
  const infoY = 55;
  const leftX = canvasWidth * 0.22;
  const rightX = canvasWidth * 0.78;
  
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(leftX, infoY, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = (currentPlayer === 1 && isMyTurn) ? '#e94560' : '#888';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('你', leftX, infoY + 25);
  
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(rightX, infoY, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  const diffNames = { easy: '简单', medium: '中等', hard: '困难' };
  ctx.fillStyle = (currentPlayer === 2 && !isMyTurn) ? '#e94560' : '#888';
  ctx.fillText('人机', rightX, infoY + 25);
  
  ctx.font = 'bold 18px Arial';
  ctx.fillStyle = playerTime <= 5 ? '#e94560' : '#fff';
  ctx.fillText(playerTime + 's', leftX, infoY);
  
  ctx.fillStyle = aiTime <= 5 ? '#e94560' : '#fff';
  ctx.fillText(aiTime + 's', rightX, infoY);
  
  drawBoard();
  drawPieces();
  
  if (!gameOver) {
    const tipY = topH + 25;
    ctx.fillStyle = '#666';
    ctx.font = (canvasWidth * 0.038) + 'px Arial';
    ctx.textAlign = 'center';
    const tip = isMyTurn ? '轮到你落子' : '人机思考中...';
    ctx.fillText(tip, canvasWidth / 2, tipY);
  }
  
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    const msg = winner === 1 ? '你赢了!' : '人机赢了!';
    ctx.fillStyle = winner === 1 ? '#ffd700' : '#e94560';
    ctx.font = 'bold ' + (canvasWidth * 0.15) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(msg, canvasWidth / 2, canvasHeight * 0.45);
    
    const btnW = 140;
    const btnH = 45;
    const btnY = canvasHeight * 0.58;
    
    ctx.fillStyle = '#e94560';
    roundRect(ctx, canvasWidth/2 - btnW/2, btnY, btnW, btnH, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + (canvasWidth * 0.04) + 'px Arial';
    ctx.fillText('再来一局', canvasWidth / 2, btnY + btnH/2);
    
    const btn2Y = btnY + btnH + 20;
    ctx.fillStyle = '#666';
    roundRect(ctx, canvasWidth/2 - 50, btn2Y, 100, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = (canvasWidth * 0.035) + 'px Arial';
    ctx.fillText('返回菜单', canvasWidth / 2, btn2Y + 20);
  }
}

function drawBoard() {
  const topH = 70;
  const padding = CONFIG.CELL_SIZE;
  const boardSize = CONFIG.CELL_SIZE * (CONFIG.BOARD_SIZE - 1);
  
  ctx.fillStyle = '#DEB887';
  ctx.fillRect(padding - 4, topH + padding - 4, boardSize + 8, boardSize + 8);
  
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
  
  const stars = [[3,3], [3,11], [11,3], [11,11], [7,7]];
  ctx.fillStyle = '#8B4513';
  for (let i = 0; i < stars.length; i++) {
    const x = stars[i][0];
    const y = stars[i][1];
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
        
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.arc(px + 2, py + 2, CONFIG.PIECE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
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

function handleTouch(e) {
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
  for (let i = 0; i < menuButtons.length; i++) {
    const btn = menuButtons[i];
    if (x >= btn.x - btn.w/2 && x <= btn.x + btn.w/2 && y >= btn.y - btn.h/2 && y <= btn.y + btn.h/2) {
      handleMenuAction(btn.id, btn.diff);
      break;
    }
  }
}

function handleGameTouch(x, y) {
  if (x < 57 && y < 57) {
    backToMenu();
    return;
  }
  
  if (gameOver) {
    const btnW = 140;
    const btnH = 45;
    const btnY = canvasHeight * 0.58;
    
    if (x >= canvasWidth/2 - btnW/2 && x <= canvasWidth/2 + btnW/2 && y >= btnY && y <= btnY + btnH) {
      initGame();
      return;
    }
    
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
  
  placePiece(gx, gy, 1);
  
  if (checkWin(gx, gy, 1)) {
    endGame(1);
    return;
  }
  
  currentPlayer = 2;
  isMyTurn = false;
  playerTime = CONFIG.THINK_TIME;
  
  setTimeout(aiMove, CONFIG.AI_DELAY);
}

function handleMenuAction(id, diff) {
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
    case 'diff_easy':
      aiDifficulty = 'easy';
      initSettings();
      break;
    case 'diff_medium':
      aiDifficulty = 'medium';
      initSettings();
      break;
    case 'diff_hard':
      aiDifficulty = 'hard';
      initSettings();
      break;
  }
}

function initGame() {
  board = [];
  for (let y = 0; y < CONFIG.BOARD_SIZE; y++) {
    board[y] = [];
    for (let x = 0; x < CONFIG.BOARD_SIZE; x++) {
      board[y][x] = 0;
    }
  }
  currentPlayer = 1;
  isMyTurn = true;
  gameOver = false;
  winner = null;
  lastMove = null;
  playerTime = CONFIG.THINK_TIME;
  aiTime = CONFIG.THINK_TIME;
  
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(function() {
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

function placePiece(x, y, player) {
  board[y][x] = player;
  lastMove = { x: x, y: y };
}

function checkWin(x, y, player) {
  const dirs = [[1,0], [0,1], [1,1], [1,-1]];
  
  for (let d = 0; d < dirs.length; d++) {
    const dx = dirs[d][0];
    const dy = dirs[d][1];
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
  let candidates = [];
  
  if (aiDifficulty === 'easy') {
    // 简单难度：只考虑近邻位置
    candidates = findCandidatesEasy();
  } else if (aiDifficulty === 'medium') {
    // 中等难度：评估所有空位，但有概率犯错
    candidates = findCandidatesMedium();
  } else {
    // 困难难度：最优策略
    candidates = findCandidatesHard();
  }
  
  if (candidates.length === 0) {
    // 找不到合适位置，选中心
    const center = Math.floor(CONFIG.BOARD_SIZE / 2);
    return { x: center, y: center };
  }
  
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// 简单难度：只在已有棋子附近落子
function findCandidatesEasy() {
  const candidates = [];
  const checked = {};
  
  // 找所有已有棋子的位置
  for (let y = 0; y < CONFIG.BOARD_SIZE; y++) {
    for (let x = 0; x < CONFIG.BOARD_SIZE; x++) {
      if (board[y][x] !== 0) {
        // 检查周围2格内的空位
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            const key = nx + ',' + ny;
            
            if (nx >= 0 && nx < CONFIG.BOARD_SIZE && ny >= 0 && ny < CONFIG.BOARD_SIZE &&
                board[ny][nx] === 0 && !checked[key]) {
              checked[key] = true;
              
              // 简单评估
              const score = Math.random() * 50 + evaluatePoint(nx, ny) * 0.3;
              candidates.push({ x: nx, y: ny, score: score });
            }
          }
        }
      }
    }
  }
  
  // 按分数排序，取前几个随机
  candidates.sort(function(a, b) { return b.score - a.score; });
  const top = candidates.slice(0, Math.min(5, candidates.length));
  return top;
}

// 中等难度：完整评估
function findCandidatesMedium() {
  let maxScore = -1;
  let candidates = [];
  
  for (let y = 0; y < CONFIG.BOARD_SIZE; y++) {
    for (let x = 0; x < CONFIG.BOARD_SIZE; x++) {
      if (board[y][x] === 0) {
        const score = evaluatePoint(x, y);
        if (score > maxScore) {
          maxScore = score;
          candidates = [{ x: x, y: y, score: score }];
        } else if (score === maxScore) {
          candidates.push({ x: x, y: y, score: score });
        }
      }
    }
  }
  
  // 30%概率选择次优解
  if (Math.random() < 0.3 && candidates.length > 1) {
    candidates.sort(function(a, b) { return b.score - a.score; });
    const threshold = candidates[0].score * 0.7;
    const suboptimal = candidates.filter(function(c) { return c.score >= threshold; });
    if (suboptimal.length > 1) {
      return [suboptimal[Math.floor(Math.random() * suboptimal.length)]];
    }
  }
  
  candidates.sort(function(a, b) { return b.score - a.score; });
  const top = candidates.slice(0, Math.min(3, candidates.length));
  return top;
}

// 困难难度：最优策略
function findCandidatesHard() {
  let maxScore = -1;
  let candidates = [];
  
  for (let y = 0; y < CONFIG.BOARD_SIZE; y++) {
    for (let x = 0; x < CONFIG.BOARD_SIZE; x++) {
      if (board[y][x] === 0) {
        const score = evaluatePointHard(x, y);
        if (score > maxScore) {
          maxScore = score;
          candidates = [{ x: x, y: y }];
        } else if (score === maxScore) {
          candidates.push({ x: x, y: y });
        }
      }
    }
  }
  
  return candidates;
}

function evaluatePoint(x, y) {
  let score = 0;
  const dirs = [[1,0], [0,1], [1,1], [1,-1]];
  
  for (let d = 0; d < dirs.length; d++) {
    score += evaluateLine(x, y, dirs[d][0], dirs[d][1], 2) * 1.1;
    score += evaluateLine(x, y, dirs[d][0], dirs[d][1], 1);
  }
  
  const center = Math.floor(CONFIG.BOARD_SIZE / 2);
  score += (CONFIG.BOARD_SIZE - Math.abs(x - center) - Math.abs(y - center)) * 0.5;
  
  return score;
}

// 困难难度使用更精细的评估
function evaluatePointHard(x, y) {
  let score = 0;
  const dirs = [[1,0], [0,1], [1,1], [1,-1]];
  
  for (let d = 0; d < dirs.length; d++) {
    const dx = dirs[d][0];
    const dy = dirs[d][1];
    
    // AI进攻评估
    const aiScore = evaluateLineHard(x, y, dx, dy, 2);
    // 防守评估（阻挡玩家）
    const defenseScore = evaluateLineHard(x, y, dx, dy, 1);
    
    // 进攻权重更高
    score += aiScore * 1.2 + defenseScore;
  }
  
  // 位置权重
  const center = Math.floor(CONFIG.BOARD_SIZE / 2);
  const distFromCenter = Math.abs(x - center) + Math.abs(y - center);
  score += (CONFIG.BOARD_SIZE * 2 - distFromCenter) * 0.3;
  
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

function evaluateLineHard(x, y, dx, dy, player) {
  let count = 0;
  let empty = 0;
  let blocked = 0;
  
  // 正方向
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
  
  // 反方向
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
  
  // 更精细的评分
  if (count >= 5) return 1000000;  // 直接获胜
  if (count === 4) {
    if (empty === 2) return 100000;  // 活四
    if (empty === 1) return 10000;   // 冲四
  }
  if (count === 3) {
    if (empty === 2) return 5000;    // 活三
    if (empty === 1) return 500;     // 眠三
  }
  if (count === 2) {
    if (empty === 2) return 200;     // 活二
    if (empty === 1) return 50;      // 眠二
  }
  if (count === 1 && empty === 2) return 10;
  
  return 0;
}

function gameLoop() {
  if (gameState === 'menu') {
    drawMenu();
  } else if (gameState === 'game') {
    drawGame();
  }
  
  requestAnimationFrame(gameLoop);
}

init();
