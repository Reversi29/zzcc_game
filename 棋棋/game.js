/**
 * 棋棋 v12 - 模块化版本
 * 五子棋 + 围棋 + 中国象棋 + 跳棋
 *
 * 文件结构:
 *   game.js      - 主入口
 *   js/config.js - 全局状态
 *   js/utils.js  - 工具函数
 *   js/ui.js     - UI绘制
 *   js/menu.js   - 菜单逻辑
 *   js/gomoku.js - 五子棋逻辑
 *   js/go.js     - 围棋逻辑
 *   js/xiangqi.js - 中国象棋逻辑
 *   js/checkers.js - 跳棋逻辑
 *   js/touch.js  - 触摸处理
 */

// 导入模块
var state = require('./js/config.js');
var utils = require('./js/utils.js');
var ui = require('./js/ui.js');
var menu = require('./js/menu.js');
var gomoku = require('./js/gomoku.js');
var go = require('./js/go.js');
var xiangqi = require('./js/xiangqi.js');
var checkers = require('./js/checkers.js');
var junqi = require('./js/junqi.js');
var othello = require('./js/othello.js');
var touch = require('./js/touch.js');

// ===== 初始化 =====
function init() {
  try {
    state.systemInfo = tt.getSystemInfoSync();
    state.W = state.systemInfo.windowWidth;
    state.H = state.systemInfo.windowHeight;
    state.canvas = tt.createCanvas();
    state.canvas.width = state.W;
    state.canvas.height = state.H;
    state.ctx = state.canvas.getContext('2d');

    menu.initBoardLayout();
    menu.initMenu();

    tt.onTouchStart(touch.handleTouch);
    tt.onTouchMove(touch.handleTouchMove);
    tt.onTouchEnd(touch.handleTouchEnd);

    utils.updateTime();
    setInterval(utils.updateTime, 1000);

    gameLoop();
  } catch (e) {
    console.error('Init error:', e);
  }
}

// ===== 游戏循环 =====
function gameLoop() {
  var ctx = state.ctx;
  var W = state.W;
  var H = state.H;

  ctx.clearRect(0, 0, W, H);

  if (state.gameState === 'menu') {
    if (state.currentScreen === 'main_menu') {
      ui.drawMenu();
    } else if (state.currentScreen === 'settings') {
      ui.drawSettings();
    } else if (state.currentScreen === 'create_game') {
      ui.drawCreateGame();
    } else if (state.currentScreen === 'create_go') {
      ui.drawCreateGo();
    } else if (state.currentScreen === 'create_xiangqi') {
      ui.drawCreateXiangqi();
    } else if (state.currentScreen === 'create_checkers') {
      ui.drawCreateCheckers();
    } else if (state.currentScreen === 'create_junqi') {
      ui.drawCreateJunqi();
    } else if (state.currentScreen === 'create_othello') {
      ui.drawCreateOthello();
    }
  } else if (state.gameState === 'game') {
    drawGame();
  }

  requestAnimationFrame(gameLoop);
}

// ===== 绘制游戏画面 =====
function drawGame() {
  var ctx = state.ctx;
  var W = state.W;
  var H = state.H;

  if (state.gameType === 'go') {
    ctx.fillStyle = '#C8A96E';
  } else if (state.gameType === 'xiangqi') {
    ctx.fillStyle = '#D2B48C';
  } else if (state.gameType === 'checkers') {
    ctx.fillStyle = '#E8D4B8';
  } else if (state.gameType === 'junqi') {
    ctx.fillStyle = '#D2B48C';
  } else if (state.gameType === 'othello') {
    ctx.fillStyle = '#1a5c1a';
  } else {
    ctx.fillStyle = '#E5D4B3';
  }
  ctx.fillRect(0, 0, W, H);

  ui.drawTopBar();
  drawPlayerInfo();
  drawBoard();
  drawPieces();
  
  drawActionArea();
  drawChatArea();

  if (state.gameOver) {
    ui.drawGameOver();
  }
}

// ===== 绘制玩家信息 =====
function drawPlayerInfo() {
  var ctx = state.ctx;
  var W = state.W;
  var topH = state.LAYOUT.topH;
  var infoY = topH + 45;

  var leftX = W * 0.15;
  var rightX = W * 0.85;

  if (state.gameType === 'xiangqi') {
    // 象棋：红方 vs 黑方
    var s = state.settings.xiangqiMode;
    var redActive = state.currentPlayer === 1;
    var blackActive = state.currentPlayer === 2;

    // 红方
    if (redActive) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(leftX, infoY, 15, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(leftX, infoY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = redActive ? '#ffd700' : '#888';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('红', leftX, infoY);

    // 黑方
    if (blackActive) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(rightX, infoY, 15, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(rightX, infoY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = blackActive ? '#ffd700' : '#888';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('黑', rightX, infoY);

    // 提示文字
    ctx.fillStyle = '#555';
    ctx.font = (W * 0.032) + 'px Arial';
    ctx.textAlign = 'center';
    var tip = redActive ? '红方落子' : '黑方落子';
    if (s.vsMode === 'ai') {
      tip = state.isMyTurn ? '轮到你落子' : '人机思考中...';
    }
    ctx.fillText(tip, W / 2, infoY);
    return;
  }

  if (state.gameType === 'junqi') {
    // 军棋：红方 vs 蓝方
    var s = state.settings.junqiMode;
    var redActive = state.currentPlayer === 1;
    var blueActive = state.currentPlayer === 2;

    if (redActive) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(leftX, infoY, 15, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(leftX, infoY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = redActive ? '#ffd700' : '#888';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('红', leftX, infoY);

    if (blueActive) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(rightX, infoY, 15, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#4444ff';
    ctx.beginPath();
    ctx.arc(rightX, infoY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = blueActive ? '#ffd700' : '#888';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('蓝', rightX, infoY);

    ctx.fillStyle = '#555';
    ctx.font = (W * 0.032) + 'px Arial';
    ctx.textAlign = 'center';
    var tip = redActive ? '红方行动' : '蓝方行动';
    if (s.vsMode === 'ai') {
      tip = state.isMyTurn ? '轮到你行动' : '人机思考中...';
    }
    ctx.fillText(tip, W / 2, infoY);
    return;
  }

  if (state.gameType === 'othello') {
    // 黑白棋
    var s = state.settings.othelloMode;
    var blackActive = state.currentPlayer === 1;
    var whiteActive = state.currentPlayer === 2;

    if (blackActive) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(leftX, infoY, 15, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(leftX, infoY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('黑' + (state.othelloBlackCount || 2), leftX, infoY);

    if (whiteActive) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(rightX, infoY, 15, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(rightX, infoY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#333';
    ctx.font = 'bold 8px Arial';
    ctx.fillText('白' + (state.othelloWhiteCount || 2), rightX, infoY);

    ctx.fillStyle = '#555';
    ctx.font = (W * 0.032) + 'px Arial';
    ctx.textAlign = 'center';
    var tip = blackActive ? '黑方落子' : '白方落子';
    if (s.vsMode === 'ai') {
      tip = state.isMyTurn ? '轮到你落子' : '人机思考中...';
    }
    ctx.fillText(tip, W / 2, infoY);
    return;
  }

  var s = state.gameType === 'go' ? state.settings.goMode : state.settings.normalMode;
  var blackActive = state.currentPlayer === 1;
  var whiteActive = state.currentPlayer === 2;

  // 黑棋
  if (blackActive) {
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(leftX, infoY, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(leftX, infoY, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = blackActive ? '#ffd700' : '#888';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('黑', leftX, infoY);

  // 白棋
  if (whiteActive) {
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(rightX, infoY, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#f5f5f5';
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(rightX, infoY, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = whiteActive ? '#ffd700' : '#888';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('白', rightX, infoY);

  // 围棋提子数
  if (state.gameType === 'go') {
    ctx.fillStyle = '#555';
    ctx.font = (W * 0.028) + 'px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('提:' + state.goCaptured[0], leftX - 10, infoY + 18);
    ctx.textAlign = 'right';
    ctx.fillText('提:' + state.goCaptured[1], rightX + 10, infoY + 18);
  }

  // 提示文字
  ctx.fillStyle = '#555';
  ctx.font = (W * 0.032) + 'px Arial';
  ctx.textAlign = 'center';

  var tip;
  if (state.gameType === 'go') {
    tip = state.currentPlayer === 1 ? (s.vsMode === 'ai' ? '轮到你落子' : '黑方落子') : '白方落子';
  } else if (s.vsMode === 'human') {
    tip = state.currentPlayer === 1 ? '黑方落子' : '白方落子';
  } else {
    tip = state.isMyTurn ? '轮到你落子' : '人机思考中...';
  }
  ctx.fillText(tip, W / 2, infoY);
}

// ===== 绘制棋盘 =====
function drawBoard() {
  var ctx = state.ctx;
  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var bs = state.CONFIG.BOARD_SIZE;
  var cs = state.CONFIG.CELL_SIZE;

  if (state.gameType === 'xiangqi') {
    // 象棋棋盘：10x9
    drawXiangqiBoard();
    return;
  }

  if (state.gameType === 'checkers') {
    // 跳棋棋盘：六角星
    drawCheckersBoard();
    return;
  }

  if (state.gameType === 'junqi') {
    // 军棋棋盘：5x12
    drawJunqiBoard();
    return;
  }

  if (state.gameType === 'othello') {
    // 黑白棋棋盘：8x8
    drawOthelloBoard();
    return;
  }

  var lineLen = cs * (bs - 1);
  var isGo = state.gameType === 'go';

  var boardColor = isGo ? '#C8A96E' : '#DEB887';
  var lineColor = isGo ? '#4A2C0A' : '#8B4513';

  ctx.fillStyle = boardColor;
  ctx.fillRect(bL - cs * 0.5, bT - cs * 0.5, lineLen + cs, lineLen + cs);

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = isGo ? 1.2 : 1;

  for (var i = 0; i < bs; i++) {
    var p = Math.round(i * cs);
    ctx.beginPath();
    ctx.moveTo(bL, bT + p);
    ctx.lineTo(bL + lineLen, bT + p);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bL + p, bT);
    ctx.lineTo(bL + p, bT + lineLen);
    ctx.stroke();
  }

  ctx.lineWidth = isGo ? 2 : 1.5;
  ctx.strokeRect(bL, bT, lineLen, lineLen);

  // 星位
  var stars;
  if (bs === 19) {
    stars = [[3, 3], [3, 9], [3, 15], [9, 3], [9, 9], [9, 15], [15, 3], [15, 9], [15, 15]];
  } else if (bs === 13) {
    stars = [[3, 3], [3, 9], [9, 3], [9, 9], [6, 6]];
  } else if (bs === 15) {
    // 五子棋 15x15：天元 + 四角星
    stars = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];
  } else if (bs === 9) {
    stars = [[2, 2], [2, 6], [4, 4], [6, 2], [6, 6]];
  } else {
    stars = [];
  }

  ctx.fillStyle = lineColor;
  for (var i = 0; i < stars.length; i++) {
    ctx.beginPath();
    ctx.arc(bL + stars[i][0] * cs, bT + stars[i][1] * cs, cs * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ===== 绘制象棋棋盘 =====
function drawXiangqiBoard() {
  var ctx = state.ctx;
  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var cs = state.CONFIG.CELL_SIZE;

  // 象棋棋盘：10行9列
  var rows = 10, cols = 9;
  var lineLen = cs * (cols - 1);
  var boardH = cs * (rows - 1);

  ctx.fillStyle = '#D2B48C';
  ctx.fillRect(bL, bT, lineLen, boardH);

  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1;

  // 绘制横线（10条）
  for (var i = 0; i < rows; i++) {
    ctx.beginPath();
    ctx.moveTo(bL, bT + i * cs);
    ctx.lineTo(bL + lineLen, bT + i * cs);
    ctx.stroke();
  }
  
  // 绘制竖线（楚河汉界处断开，只画上半部分和下半部分）
  for (var i = 0; i < cols; i++) {
    // 上半部分（行0到行4）
    ctx.beginPath();
    ctx.moveTo(bL + i * cs, bT);
    ctx.lineTo(bL + i * cs, bT + 4 * cs);
    ctx.stroke();
    // 下半部分（行5到行9）
    ctx.beginPath();
    ctx.moveTo(bL + i * cs, bT + 5 * cs);
    ctx.lineTo(bL + i * cs, bT + boardH);
    ctx.stroke();
  }

  // 绘制外框
  ctx.lineWidth = 2;
  ctx.strokeRect(bL, bT, lineLen, boardH);

  // 楚河汉界文字（不绘制实线和虚线）
  var riverY = bT + 4.5 * cs;
  ctx.fillStyle = '#8B4513';
  ctx.font = 'bold ' + (cs * 0.5) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.fillText('楚 河', bL + lineLen * 0.25, riverY);
  ctx.fillText('汉 界', bL + lineLen * 0.75, riverY);

  // 绘制宫（九宫格）
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1;
  // 红方宫（下方）
  ctx.beginPath();
  ctx.moveTo(bL + 3 * cs, bT);
  ctx.lineTo(bL + 5 * cs, bT + 2 * cs);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bL + 5 * cs, bT);
  ctx.lineTo(bL + 3 * cs, bT + 2 * cs);
  ctx.stroke();

  // 黑方宫（上方）
  ctx.beginPath();
  ctx.moveTo(bL + 3 * cs, bT + 9 * cs);
  ctx.lineTo(bL + 5 * cs, bT + 7 * cs);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bL + 5 * cs, bT + 9 * cs);
  ctx.lineTo(bL + 3 * cs, bT + 7 * cs);
  ctx.stroke();
}

// ===== 绘制跳棋棋盘（正六角星形，17行） =====
function drawCheckersBoard() {
  var ctx = state.ctx;
  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var cs = state.CONFIG.CELL_SIZE;

  // 每一行的点位数
  var ROW_COUNTS = [1, 2, 3, 4, 13, 12, 11, 10, 9, 10, 11, 12, 13, 4, 3, 2, 1];

  // 绘制跳棋棋盘
  ctx.fillStyle = '#E8D4B8';
  ctx.strokeStyle = '#8B6F47';
  ctx.lineWidth = 1;

  for (var y = 0; y < 17; y++) {
    var count = ROW_COUNTS[y];
    var startCol = Math.floor((13 - count) / 2);
    for (var i = 0; i < count; i++) {
      var x = startCol + i;
      // 六边形网格坐标转换为屏幕坐标
      var px = bL + x * cs + (y % 2) * cs / 2;
      var py = bT + y * cs * 0.866;

      // 绘制六边形格子
      ctx.beginPath();
      ctx.arc(px, py, cs * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

// ===== 绘制棋子 =====
function drawPieces() {
  var ctx = state.ctx;
  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var cs = state.CONFIG.CELL_SIZE;

  if (state.gameType === 'xiangqi') {
    drawXiangqiPieces();
    return;
  }

  if (state.gameType === 'checkers') {
    drawCheckersPieces();
    return;
  }

  if (state.gameType === 'junqi') {
    drawJunqiPieces();
    return;
  }

  if (state.gameType === 'othello') {
    drawOthelloPieces();
    return;
  }

  var r = state.CONFIG.PIECE_RADIUS;
  var bs = state.CONFIG.BOARD_SIZE;

  for (var py = 0; py < bs; py++) {
    for (var px = 0; px < bs; px++) {
      var px2 = bL + px * cs;
      var py2 = bT + py * cs;

      if (state.board[py][px] !== 0) {
        // 阴影 - 更不透明
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.beginPath();
        ctx.arc(px2 + 2, py2 + 2, r, 0, Math.PI * 2);
        ctx.fill();

        // 棋子 - 更鲜明的颜色
        var grad = ctx.createRadialGradient(px2 - r * 0.3, py2 - r * 0.3, 0, px2, py2, r);
        if (state.board[py][px] === 1) {
          grad.addColorStop(0, '#333');
          grad.addColorStop(1, '#000');
        } else {
          grad.addColorStop(0, '#fff');
          grad.addColorStop(1, '#ccc');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px2, py2, r, 0, Math.PI * 2);
        ctx.fill();

        if (state.board[py][px] === 2) {
          ctx.strokeStyle = '#888';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // 最后一手标记
        if (state.lastMove && state.lastMove.x === px && state.lastMove.y === py) {
          ctx.strokeStyle = '#e94560';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(px2, py2, r * 0.35, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (state.previewX === px && state.previewY === py) {
        // 预览 - 显示当前落子方的颜色
        var g = state.settings.goMode;
        var previewColor;
        if (state.gameType === 'go') {
          previewColor = g.vsMode === 'human' ? state.currentPlayer : g.playerColor;
        } else {
          previewColor = state.settings.normalMode.vsMode === 'human' ? state.currentPlayer : state.settings.normalMode.playerColor;
        }

        // 黑棋预览用深色，白棋预览用浅色
        ctx.strokeStyle = previewColor === 1 ? 'rgba(30,30,30,0.85)' : 'rgba(250,250,250,0.95)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(px2, py2, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  // 围棋势力范围
  if (state.goShowTerritory && state.gameType === 'go') {
    go.drawGoInfluence();
    drawTerritoryScores();
  }
}

// ===== 绘制象棋棋子 =====
function drawXiangqiPieces() {
  var ctx = state.ctx;
  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var cs = state.CONFIG.CELL_SIZE;
  var xiangqi = require('./js/xiangqi.js');

  for (var y = 0; y < 10; y++) {
    for (var x = 0; x < 9; x++) {
      var piece = state.board[y][x];
      if (piece === 0) continue;

      var px = bL + x * cs;
      var py = bT + y * cs;
      var color = Math.floor(piece / 10); // 1=红, 2=黑
      var type = piece % 10;
      var name = xiangqi.xiangqiPieceName(piece);

      // 棋子圆形
      var radius = cs * 0.35;

      // 检查是否被选中
      var isSelected = state.selectedPiece && state.selectedPiece.x === x && state.selectedPiece.y === y;

      // 如果被选中，棋子抬起（向上移动）
      if (isSelected) {
        py -= cs * 0.15;
      }

      // 阴影
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.arc(px + 1, py + 1, radius, 0, Math.PI * 2);
      ctx.fill();

      // 棋子背景
      ctx.fillStyle = color === 1 ? '#cc0000' : '#1a1a1a';
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      // 棋子边框
      ctx.strokeStyle = color === 1 ? '#ff6666' : '#666';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 棋子文字
      ctx.fillStyle = color === 1 ? '#fff' : '#fff';
      ctx.font = 'bold ' + (cs * 0.4) + 'px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, px, py);

      // 选中高亮
      if (isSelected) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, radius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // 绘制有效移动点（虚线圆圈）
  if (state.selectedPiece && state.validMoves.length > 0) {
    for (var i = 0; i < state.validMoves.length; i++) {
      var move = state.validMoves[i];
      var mx = bL + move.x * cs;
      var my = bT + move.y * cs;
      var moveRadius = cs * 0.25;

      // 虚线圆圈
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(mx, my, moveRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 中心点
      ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(mx, my, moveRadius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 绘制最后一步棋的提示
  if (state.lastMove) {
    var fromX = bL + state.lastMove.from.x * cs;
    var fromY = bT + state.lastMove.from.y * cs;
    var toX = bL + state.lastMove.to.x * cs;
    var toY = bT + state.lastMove.to.y * cs;

    // 起点标记（空心圆，表示棋子原来的位置）
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(fromX, fromY, cs * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    // 终点标记（圆框，表示棋子移动到的位置）
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(toX, toY, cs * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    // 连接线（从起点到终点，显示移动方向）
    ctx.strokeStyle = 'rgba(76, 175, 80, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// ===== 绘制跳棋棋子 =====
function drawCheckersPieces() {
  var ctx = state.ctx;
  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var cs = state.CONFIG.CELL_SIZE;
  var checkers = require('./js/checkers.js');

  // 每一行的点位数
  var ROW_COUNTS = [1, 2, 3, 4, 13, 12, 11, 10, 9, 10, 11, 12, 13, 4, 3, 2, 1];

  // 棋子颜色
  var colors = ['#ff0000', '#0000ff', '#ffff00', '#00ff00', '#ff00ff', '#00ffff'];

  for (var row = 0; row < 17; row++) {
    var count = ROW_COUNTS[row];
    var startCol = Math.floor((13 - count) / 2);
    for (var col = startCol; col < startCol + count; col++) {
      var piece = state.board[row][col];
      if (piece === 0) continue;

      // 六边形网格坐标转换为屏幕坐标
      var px = bL + col * cs + (row % 2) * cs / 2;
      var py = bT + row * cs * 0.866;
      var radius = cs * 0.35;

      // 检查是否被选中
      var isSelected = state.selectedPiece && 
                       state.selectedPiece.row === row && 
                       state.selectedPiece.col === col;

      // 如果被选中，棋子抬起
      if (isSelected) {
        py -= cs * 0.15;
      }

      // 阴影
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.arc(px + 1, py + 1, radius, 0, Math.PI * 2);
      ctx.fill();

      // 棋子背景
      ctx.fillStyle = colors[piece - 1];
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      // 棋子边框
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 选中高亮
      if (isSelected) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, radius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // 绘制有效移动点
  if (state.selectedPiece && state.validMoves.length > 0) {
    for (var i = 0; i < state.validMoves.length; i++) {
      var move = state.validMoves[i];
      var mx = bL + move.col * cs + (move.row % 2) * cs / 2;
      var my = bT + move.row * cs * 0.866;
      var moveRadius = cs * 0.2;

      // 虚线圆圈
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(mx, my, moveRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 中心点
      ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(mx, my, moveRadius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ===== 绘制领地分数 =====
function drawTerritoryScores() {
  if (!state.goEvalResult) return;

  var ctx = state.ctx;
  var W = state.W;
  var komi = state.settings.goMode.komi || 6.5;
  var bsc = state.goEvalResult.blackScore;
  var ws = state.goEvalResult.whiteScore + komi;
  var wr = bsc / (bsc + ws) * 100;
  var lead = ws - bsc;
  var leadStr = lead > 0 ? '白领先' + lead.toFixed(1) : lead < 0 ? '黑领先' + (-lead).toFixed(1) : '持平';

  var barW = W * 0.55;
  var barH = 14;
  var barX = W / 2 - barW / 2;
  var barY = state.LAYOUT.topH + 45;

  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ui.roundRect(ctx, barX, barY, barW, barH, barH / 2);
  ctx.fill();

  ctx.fillStyle = '#1a1a1a';
  var fillW = barW * (100 - wr) / 100;
  ui.roundRect(ctx, barX, barY, fillW, barH, barH / 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold ' + (W * 0.024) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('黑', barX + 18, barY + barH / 2);
  ctx.fillText('白', barX + barW - 18, barY + barH / 2);

  ctx.fillStyle = '#fff';
  ctx.font = (W * 0.028) + 'px Arial';
  ctx.fillText(wr.toFixed(1) + '% ' + leadStr, W / 2, barY - barH * 0.9);
}

// ===== 绘制操作区域 =====
function drawActionArea() {
  var ctx = state.ctx;
  var W = state.W;
  var H = state.H;
  var chatY = H - state.LAYOUT.chatH;
  var actionY = chatY - state.LAYOUT.actionH;
  var cx = W / 2;

  ctx.fillStyle = '#eee';
  ctx.fillRect(0, actionY, W, state.LAYOUT.actionH);

  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, actionY);
  ctx.lineTo(W, actionY);
  ctx.stroke();

  // 象棋、跳棋、军棋、黑白棋操作按钮
  if (state.gameType === 'xiangqi' || state.gameType === 'checkers' || state.gameType === 'junqi' || state.gameType === 'othello') {
    var abW = 80, abH = 36, abGap = 12;
    var totalW = abW * 3 + abGap * 2;
    var abStartX = cx - totalW / 2;
    var abY = actionY + 6;
    var labels = ['认输', '悔棋', '求和'];
    var btnIds = ['resign', 'undo', 'draw'];

    for (var i = 0; i < 3; i++) {
      var bx = abStartX + i * (abW + abGap);
      var isH = state.hoveredBtn && state.hoveredBtn.id === btnIds[i];
      ctx.fillStyle = isH ? '#555' : '#777';
      ui.roundRect(ctx, bx, abY, abW, abH, 6);
      ctx.fill();
      ctx.fillStyle = isH ? '#fff' : '#ddd';
      ctx.font = (W * 0.032) + 'px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], bx + abW / 2, abY + abH / 2);
    }
    return;
  }

  // 确认落子按钮
  var btnW = 140;
  var btnH = 38;
  var btnX = cx - btnW / 2;
  var btnY = actionY + 2;
  var isHov = state.hoveredBtn && state.hoveredBtn.id === 'confirm';

  ctx.fillStyle = state.canPlace ? (isHov ? '#d63850' : '#e94560') : '#bbb';
  ui.roundRect(ctx, btnX, btnY, btnW, btnH, 8);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold ' + (W * 0.033) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('确认落子', cx, btnY + btnH / 2);

  if (state.gameType === 'go') {
    // 围棋功能按钮
    var ebW = 58, ebH = 26, ebGap = 4;
    var ebY = btnY + btnH + 3;
    var totalEbW = ebW * 3 + ebGap * 2;
    var ebStartX = cx - totalEbW / 2;
    var elabels = ['申请点目', state.goShowTerritory ? '关闭判断' : '局势判断', '悔棋'];
    var ebtnIds = ['eval', 'predict', 'undo'];
    var epredictActive = state.goShowTerritory;

    for (var i = 0; i < 3; i++) {
      var bx = ebStartX + i * (ebW + ebGap);
      var eisH = state.hoveredBtn && state.hoveredBtn.id === ebtnIds[i];
      var btnBg;

      if (ebtnIds[i] === 'predict' && epredictActive) {
        btnBg = eisH ? '#3a7bc8' : '#4a90d9';
      } else {
        btnBg = eisH ? '#4a90d9' : '#5ba3e0';
      }

      ctx.fillStyle = btnBg;
      ui.roundRect(ctx, bx, ebY, ebW, ebH, 5);
      ctx.fill();

      if (ebtnIds[i] === 'predict' && epredictActive) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ui.roundRect(ctx, bx, ebY, ebW, ebH, 5);
        ctx.stroke();
      }

      ctx.fillStyle = '#fff';
      ctx.font = (W * 0.022) + 'px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(elabels[i], bx + ebW / 2, ebY + ebH / 2);
    }

    // 认输、虚手按钮
    var rbW = 58, rbH = 26, rbGap = 4;
    var rbY = ebY + ebH + 3;
    var rlabels = ['认输', '虚手'];
    var rbtnIds = ['resign', 'pass'];
    var totalRbW = rbW * 2 + rbGap;
    var rbStartX = cx - totalRbW / 2;

    for (var i = 0; i < 2; i++) {
      var bx = rbStartX + i * (rbW + rbGap);
      var risH = state.hoveredBtn && state.hoveredBtn.id === rbtnIds[i];
      ctx.fillStyle = risH ? '#d95555' : '#e06666';
      ui.roundRect(ctx, bx, rbY, rbW, rbH, 5);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = (W * 0.024) + 'px Arial';
      ctx.fillText(rlabels[i], bx + rbW / 2, rbY + rbH / 2);
    }
  } else {
    // 五子棋按钮
    var abW = 80, abH = 36, abGap = 12;
    var totalW = abW * 3 + abGap * 2;
    var abStartX = cx - totalW / 2;
    var abY = btnY + btnH + 6;
    var labels = ['认输', '悔棋', '求和'];
    var btnIds = ['resign', 'undo', 'draw'];

    for (var i = 0; i < 3; i++) {
      var bx = abStartX + i * (abW + abGap);
      var isH = state.hoveredBtn && state.hoveredBtn.id === btnIds[i];
      ctx.fillStyle = isH ? '#555' : '#777';
      ui.roundRect(ctx, bx, abY, abW, abH, 6);
      ctx.fill();
      ctx.fillStyle = isH ? '#fff' : '#ddd';
      ctx.font = (W * 0.032) + 'px Arial';
      ctx.fillText(labels[i], bx + abW / 2, abY + abH / 2);
    }
  }
}

// ===== 绘制聊天区域 =====
function drawChatArea() {
  var ctx = state.ctx;
  var W = state.W;
  var H = state.H;
  var chatY = H - state.LAYOUT.chatH;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, chatY, W, state.LAYOUT.chatH);

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, chatY);
  ctx.lineTo(W, chatY);
  ctx.stroke();

  ctx.fillStyle = '#aaa';
  ctx.font = (W * 0.028) + 'px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('聊天', 12, chatY + 16);

  var msgY = chatY + 32;
  for (var i = Math.max(0, state.chatMessages.length - 2); i < state.chatMessages.length; i++) {
    ctx.fillStyle = '#333';
    ctx.font = (W * 0.028) + 'px Arial';
    ctx.fillText(state.chatMessages[i], 12, msgY);
    msgY += 22;
  }

  ctx.fillStyle = '#f5f5f5';
  ui.roundRect(ctx, 10, chatY + 60, W - 20, 25, 6);
  ctx.fill();
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  ui.roundRect(ctx, 10, chatY + 60, W - 20, 25, 6);
  ctx.stroke();

  ctx.fillStyle = '#bbb';
  ctx.font = (W * 0.03) + 'px Arial';
  ctx.fillText('输入消息...', 18, chatY + 73);
}

// ===== 绘制军棋棋盘 =====
function drawJunqiBoard() {
  var ctx = state.ctx;
  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var cs = state.CONFIG.CELL_SIZE;

  // 绘制5x12棋盘
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2;

  // 横线
  for (var y = 0; y <= 12; y++) {
    ctx.beginPath();
    ctx.moveTo(bL, bT + y * cs);
    ctx.lineTo(bL + 4 * cs, bT + y * cs);
    ctx.stroke();
  }

  // 竖线
  for (var x = 0; x <= 5; x++) {
    ctx.beginPath();
    ctx.moveTo(bL + x * cs, bT);
    ctx.lineTo(bL + x * cs, bT + 12 * cs);
    ctx.stroke();
  }

  // 中间区域（河界）
  ctx.fillStyle = '#E8D4B8';
  ctx.fillRect(bL, bT + 5 * cs, 5 * cs, 2 * cs);
  ctx.fillStyle = '#8B4513';
  ctx.font = (cs * 0.5) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('楚河', bL + cs * 1.5, bT + 6 * cs);
  ctx.fillText('汉界', bL + cs * 3.5, bT + 6 * cs);
}

// ===== 绘制军棋棋子 =====
function drawJunqiPieces() {
  var ctx = state.ctx;
  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var cs = state.CONFIG.CELL_SIZE;

  for (var y = 0; y < 12; y++) {
    for (var x = 0; x < 5; x++) {
      var piece = state.board[y][x];
      if (piece === 0) continue;

      var color = junqi.getPieceColor(piece);
      var type = junqi.getPieceType(piece);
      var px = bL + x * cs;
      var py = bT + y * cs;
      var radius = cs * 0.4;

      // 选中效果
      var isSelected = state.selectedPiece && state.selectedPiece.x === x && state.selectedPiece.y === y;
      if (isSelected) {
        py -= cs * 0.1;
      }

      // 棋子背景
      ctx.fillStyle = color === 1 ? '#ff4444' : '#4444ff';
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      // 棋子边框
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 棋子名称
      var names = ['', '工', '排', '连', '营', '团', '旅', '师', '军', '司', '炸', '雷', '旗'];
      ctx.fillStyle = '#fff';
      ctx.font = 'bold ' + (cs * 0.35) + 'px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(names[type], px, py);

      // 选中高亮
      if (isSelected) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // 有效移动点
  if (state.selectedPiece && state.validMoves.length > 0) {
    for (var i = 0; i < state.validMoves.length; i++) {
      var move = state.validMoves[i];
      var mx = bL + move.x * cs;
      var my = bT + move.y * cs;

      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(mx, my, cs * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

// ===== 绘制黑白棋棋盘 =====
function drawOthelloBoard() {
  var ctx = state.ctx;
  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var cs = state.CONFIG.CELL_SIZE;

  // 绘制8x8棋盘
  ctx.fillStyle = '#228B22';
  ctx.fillRect(bL, bT, 8 * cs, 8 * cs);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;

  for (var i = 0; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(bL + i * cs, bT);
    ctx.lineTo(bL + i * cs, bT + 8 * cs);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bL, bT + i * cs);
    ctx.lineTo(bL + 8 * cs, bT + i * cs);
    ctx.stroke();
  }

  // 有效落子提示
  var moves = othello.getValidMoves(state.currentPlayer);
  for (var j = 0; j < moves.length; j++) {
    var mx = bL + moves[j].x * cs;
    var my = bT + moves[j].y * cs;

    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mx, my, cs * 0.15, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ===== 绘制黑白棋棋子 =====
function drawOthelloPieces() {
  var ctx = state.ctx;
  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var cs = state.CONFIG.CELL_SIZE;

  for (var y = 0; y < 8; y++) {
    for (var x = 0; x < 8; x++) {
      var piece = state.board[y][x];
      if (piece === 0) continue;

      var px = bL + x * cs;
      var py = bT + y * cs;
      var radius = cs * 0.4;

      // 阴影
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(px + 2, py + 2, radius, 0, Math.PI * 2);
      ctx.fill();

      // 棋子
      ctx.fillStyle = piece === 1 ? '#000' : '#fff';
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      // 边框
      ctx.strokeStyle = piece === 1 ? '#333' : '#ccc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 最后落子标记
      if (state.lastMove && state.lastMove.x === x && state.lastMove.y === y) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, radius + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // 显示棋子数
  ctx.fillStyle = '#333';
  ctx.font = 'bold ' + (cs * 0.4) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('黑: ' + state.othelloBlackCount, bL + 2 * cs, bT - 15);
  ctx.fillText('白: ' + state.othelloWhiteCount, bL + 6 * cs, bT - 15);
}

// 启动游戏
init();
