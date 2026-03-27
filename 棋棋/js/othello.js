/**
 * 棋棋 - 黑白棋模块
 * 包含黑白棋游戏逻辑和AI
 * 棋盘：8x8
 */

var state = require('./config.js');

// 延迟加载 utils（避免循环依赖）
function getUtils() {
  return require('./utils.js');
}

// 黑白棋初始化
function initOthelloGame() {
  state.gameType = 'othello';

  var menu = require('./menu.js');
  menu.initBoardLayout();

  // 黑白棋棋盘 8x8
  state.board = [];
  for (var y = 0; y < 8; y++) {
    state.board[y] = [];
    for (var x = 0; x < 8; x++) {
      state.board[y][x] = 0;
    }
  }

  // 初始布局：中央4子
  state.board[3][3] = 2; // 白
  state.board[3][4] = 1; // 黑
  state.board[4][3] = 1; // 黑
  state.board[4][4] = 2; // 白

  var s = state.settings.othelloMode;
  state.currentPlayer = 1; // 黑先
  state.isMyTurn = s.vsMode === 'human' || s.playerColor === 1;
  state.gameOver = false;
  state.winner = null;
  state.lastMove = null;
  state.moveHistory = [];
  state.aiMoveToken++;
  state.selectedPiece = null;
  state.validMoves = [];
  state.chatMessages = [];
  
  // 计算棋子数
  countPieces();

  if (state.timerInterval) clearInterval(state.timerInterval);
}

// 计算棋子数
function countPieces() {
  var black = 0, white = 0;
  for (var y = 0; y < 8; y++) {
    for (var x = 0; x < 8; x++) {
      if (state.board[y][x] === 1) black++;
      else if (state.board[y][x] === 2) white++;
    }
  }
  state.othelloBlackCount = black;
  state.othelloWhiteCount = white;
}

// 8个方向
var DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1], [1, 0], [1, 1]
];

// 检查是否是有效落子
function isValidOthelloMove(x, y, player) {
  if (state.board[y][x] !== 0) return false;

  var opponent = player === 1 ? 2 : 1;
  var flipped = [];

  for (var d = 0; d < 8; d++) {
    var dx = DIRS[d][0];
    var dy = DIRS[d][1];
    var nx = x + dx;
    var ny = y + dy;
    var tempFlipped = [];

    // 沿着方向找对手棋子
    while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8 && state.board[ny][nx] === opponent) {
      tempFlipped.push({ x: nx, y: ny });
      nx += dx;
      ny += dy;
    }

    // 如果找到自己的棋子，则这些对手棋子会被翻转
    if (tempFlipped.length > 0 && nx >= 0 && nx < 8 && ny >= 0 && ny < 8 && state.board[ny][nx] === player) {
      flipped = flipped.concat(tempFlipped);
    }
  }

  return flipped.length > 0 ? flipped : null;
}

// 获取所有有效落子
function getValidMoves(player) {
  var moves = [];
  for (var y = 0; y < 8; y++) {
    for (var x = 0; x < 8; x++) {
      var flipped = isValidOthelloMove(x, y, player);
      if (flipped) {
        moves.push({ x: x, y: y, flipped: flipped });
      }
    }
  }
  return moves;
}

// 落子
function othelloPlace(x, y) {
  var flipped = isValidOthelloMove(x, y, state.currentPlayer);
  if (!flipped) return false;

  // 放置棋子
  state.board[y][x] = state.currentPlayer;

  // 翻转棋子
  for (var i = 0; i < flipped.length; i++) {
    state.board[flipped[i].y][flipped[i].x] = state.currentPlayer;
  }

  // 记录移动
  state.moveHistory.push({
    x: x, y: y,
    player: state.currentPlayer,
    flipped: flipped
  });

  state.lastMove = { x: x, y: y };
  
  // 切换玩家
  var opponent = state.currentPlayer === 1 ? 2 : 1;
  var opponentMoves = getValidMoves(opponent);
  var myMoves = getValidMoves(state.currentPlayer);

  if (opponentMoves.length > 0) {
    // 对手有有效落子，切换
    state.currentPlayer = opponent;
  } else if (myMoves.length > 0) {
    // 对手无有效落子，自己继续
    state.chatMessages.push((opponent === 1 ? '黑' : '白') + '方无有效落子，跳过');
  } else {
    // 双方都无有效落子，游戏结束
    countPieces();
    state.gameOver = true;
    if (state.othelloBlackCount > state.othelloWhiteCount) {
      state.winner = 1;
      state.chatMessages.push('黑方胜！' + state.othelloBlackCount + ' vs ' + state.othelloWhiteCount);
    } else if (state.othelloWhiteCount > state.othelloBlackCount) {
      state.winner = 2;
      state.chatMessages.push('白方胜！' + state.othelloWhiteCount + ' vs ' + state.othelloBlackCount);
    } else {
      state.winner = 0;
      state.chatMessages.push('平局！' + state.othelloBlackCount + ' vs ' + state.othelloWhiteCount);
    }
    return true;
  }

  countPieces();
  state.isMyTurn = true;

  // 检查是否是AI回合
  var s = state.settings.othelloMode;
  if (s.vsMode === 'ai' && state.currentPlayer !== s.playerColor) {
    state.isMyTurn = false;
    getUtils().scheduleAiMove();
  }

  return true;
}

// AI落子
function othelloAiMove() {
  if (state.gameOver) return;

  var moves = getValidMoves(state.currentPlayer);
  if (moves.length === 0) {
    // 跳过
    var opponent = state.currentPlayer === 1 ? 2 : 1;
    state.currentPlayer = opponent;
    state.isMyTurn = true;
    return;
  }

  // 策略：优先角落，其次边，再次翻转最多
  var s = state.settings.othelloMode;
  var move;

  if (s.difficulty === 'easy') {
    // 简单：随机
    move = moves[Math.floor(Math.random() * moves.length)];
  } else {
    // 普通/困难：评估位置
    moves.sort(function(a, b) {
      return getScore(b) - getScore(a);
    });
    move = moves[0];
  }

  othelloPlace(move.x, move.y);
}

// 计算位置分数
function getScore(move) {
  var score = move.flipped.length;

  // 角落最高分
  if ((move.x === 0 || move.x === 7) && (move.y === 0 || move.y === 7)) {
    score += 100;
  }
  // 边次之
  else if (move.x === 0 || move.x === 7 || move.y === 0 || move.y === 7) {
    score += 10;
  }
  // 次角落（角落旁边）扣分
  if ((move.x === 1 || move.x === 6) && (move.y === 1 || move.y === 6)) {
    score -= 50;
  }

  return score;
}

module.exports = {
  initOthelloGame: initOthelloGame,
  othelloPlace: othelloPlace,
  othelloAiMove: othelloAiMove,
  getValidMoves: getValidMoves,
  isValidOthelloMove: isValidOthelloMove,
  countPieces: countPieces
};
