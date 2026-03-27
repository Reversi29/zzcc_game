/**
 * 棋棋 - 中国象棋模块
 * 包含象棋游戏逻辑、AI和棋盘管理
 */

var state = require('./config.js');
var utils = require('./utils.js');

// 象棋棋盘初始化
function initXiangqiGame() {
  state.gameType = 'xiangqi';

  var menu = require('./menu.js');
  menu.initBoardLayout();

  // 象棋棋盘 10x9（纵x横）
  state.board = [];
  for (var y = 0; y < 10; y++) {
    state.board[y] = [];
    for (var x = 0; x < 9; x++) {
      state.board[y][x] = 0;
    }
  }

  // 初始布局
  xiangqiSetupBoard();

  var s = state.settings.xiangqiMode;
  if (s.playerColor === 0) {
    s.playerColor = Math.random() < 0.5 ? 1 : 2;
  }

  state.currentPlayer = 1; // 红方先手
  state.isMyTurn = s.vsMode === 'human' ? true : s.playerColor === 1;
  state.gameOver = false;
  state.winner = null;
  state.lastMove = null;
  state.moveHistory = [];
  state.aiMoveToken++;
  state.previewX = -1;
  state.previewY = -1;
  state.canPlace = false;
  state.selectedPiece = null; // 选中的棋子
  state.validMoves = []; // 有效移动列表
  state.chatMessages = [];

  if (state.timerInterval) clearInterval(state.timerInterval);

  if (s.vsMode === 'ai' && !state.isMyTurn) {
    utils.scheduleAiMove();
  }
}

// 象棋初始布局
function xiangqiSetupBoard() {
  // 红方（下方，y=0-4）
  // 兵：y=3, x=0,2,4,6,8
  // 马：y=0, x=1,7
  // 象：y=0, x=2,6
  // 车：y=0, x=0,8
  // 炮：y=2, x=1,7
  // 士：y=0, x=3,5
  // 帅：y=0, x=4

  // 黑方（上方，y=9-5）
  // 兵：y=6, x=0,2,4,6,8
  // 马：y=9, x=1,7
  // 象：y=9, x=2,6
  // 车：y=9, x=0,8
  // 炮：y=7, x=1,7
  // 士：y=9, x=3,5
  // 将：y=9, x=4

  // 红方棋子（1开头）
  state.board[0][0] = 11; // 红车
  state.board[0][1] = 12; // 红马
  state.board[0][2] = 13; // 红象
  state.board[0][3] = 14; // 红士
  state.board[0][4] = 15; // 红帅
  state.board[0][5] = 14; // 红士
  state.board[0][6] = 13; // 红象
  state.board[0][7] = 12; // 红马
  state.board[0][8] = 11; // 红车

  state.board[2][1] = 16; // 红炮
  state.board[2][7] = 16; // 红炮

  state.board[3][0] = 17; // 红兵
  state.board[3][2] = 17; // 红兵
  state.board[3][4] = 17; // 红兵
  state.board[3][6] = 17; // 红兵
  state.board[3][8] = 17; // 红兵

  // 黑方棋子（2开头）
  state.board[9][0] = 21; // 黑车
  state.board[9][1] = 22; // 黑马
  state.board[9][2] = 23; // 黑象
  state.board[9][3] = 24; // 黑士
  state.board[9][4] = 25; // 黑将
  state.board[9][5] = 24; // 黑士
  state.board[9][6] = 23; // 黑象
  state.board[9][7] = 22; // 黑马
  state.board[9][8] = 21; // 黑车

  state.board[7][1] = 26; // 黑炮
  state.board[7][7] = 26; // 黑炮

  state.board[6][0] = 27; // 黑兵
  state.board[6][2] = 27; // 黑兵
  state.board[6][4] = 27; // 黑兵
  state.board[6][6] = 27; // 黑兵
  state.board[6][8] = 27; // 黑兵
}

// 获取棋子类型名称
function xiangqiPieceName(piece) {
  var names = {
    11: '车', 12: '马', 13: '象', 14: '士', 15: '帅', 16: '炮', 17: '兵',
    21: '车', 22: '马', 23: '象', 24: '士', 25: '将', 26: '炮', 27: '兵'
  };
  return names[piece] || '';
}

// 获取棋子颜色（1=红，2=黑）
function xiangqiPieceColor(piece) {
  return piece === 0 ? 0 : Math.floor(piece / 10);
}

// 检查位置是否在宫内（帅/将和士的活动范围）
function xiangqiInPalace(x, y, color) {
  if (color === 1) {
    // 红方宫：x=3-5, y=0-2
    return x >= 3 && x <= 5 && y >= 0 && y <= 2;
  } else {
    // 黑方宫：x=3-5, y=7-9
    return x >= 3 && x <= 5 && y >= 7 && y <= 9;
  }
}

// 获取有效移动列表
function xiangqiGetValidMoves(x, y) {
  var piece = state.board[y][x];
  if (piece === 0) return [];

  var color = xiangqiPieceColor(piece);
  var type = piece % 10;
  var moves = [];

  if (type === 1) {
    // 车：直线移动
    xiangqiAddLineMoves(x, y, color, moves);
  } else if (type === 2) {
    // 马：日字移动（需要检查蹩马）
    xiangqiAddHorseMoves(x, y, color, moves);
  } else if (type === 3) {
    // 象：斜线移动（不过河）
    xiangqiAddElephantMoves(x, y, color, moves);
  } else if (type === 4) {
    // 士：宫内斜线移动
    xiangqiAddAdvisorMoves(x, y, color, moves);
  } else if (type === 5) {
    // 帅/将：宫内移动
    xiangqiAddGeneralMoves(x, y, color, moves);
  } else if (type === 6) {
    // 炮：直线移动，吃子需要跳过一个棋子
    xiangqiAddCannonMoves(x, y, color, moves);
  } else if (type === 7) {
    // 兵：过河前后移动不同
    xiangqiAddSoldierMoves(x, y, color, moves);
  }

  return moves;
}

// 车的移动
function xiangqiAddLineMoves(x, y, color, moves) {
  var dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  for (var d = 0; d < 4; d++) {
    for (var step = 1; step < 10; step++) {
      var nx = x + dirs[d][0] * step;
      var ny = y + dirs[d][1] * step;
      if (nx < 0 || nx >= 9 || ny < 0 || ny >= 10) break;
      var target = state.board[ny][nx];
      if (target === 0) {
        moves.push({ x: nx, y: ny });
      } else if (xiangqiPieceColor(target) !== color) {
        moves.push({ x: nx, y: ny });
        break;
      } else {
        break;
      }
    }
  }
}

// 马的移动（日字，需检查蹩马）
function xiangqiAddHorseMoves(x, y, color, moves) {
  var steps = [
    { dx: 1, dy: 2, block: { dx: 1, dy: 1 } },
    { dx: 1, dy: -2, block: { dx: 1, dy: -1 } },
    { dx: -1, dy: 2, block: { dx: -1, dy: 1 } },
    { dx: -1, dy: -2, block: { dx: -1, dy: -1 } },
    { dx: 2, dy: 1, block: { dx: 1, dy: 0 } },
    { dx: 2, dy: -1, block: { dx: 1, dy: 0 } },
    { dx: -2, dy: 1, block: { dx: -1, dy: 0 } },
    { dx: -2, dy: -1, block: { dx: -1, dy: 0 } }
  ];

  for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    var nx = x + step.dx;
    var ny = y + step.dy;
    var bx = x + step.block.dx;
    var by = y + step.block.dy;

    if (nx >= 0 && nx < 9 && ny >= 0 && ny < 10 && state.board[by][bx] === 0) {
      var target = state.board[ny][nx];
      if (target === 0 || xiangqiPieceColor(target) !== color) {
        moves.push({ x: nx, y: ny });
      }
    }
  }
}

// 象的移动（斜线，不过河）
function xiangqiAddElephantMoves(x, y, color, moves) {
  var riverY = color === 1 ? 4 : 5; // 红方不过y=5，黑方不过y=4
  var steps = [
    { dx: 2, dy: 2, block: { dx: 1, dy: 1 } },
    { dx: 2, dy: -2, block: { dx: 1, dy: -1 } },
    { dx: -2, dy: 2, block: { dx: -1, dy: 1 } },
    { dx: -2, dy: -2, block: { dx: -1, dy: -1 } }
  ];

  for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    var nx = x + step.dx;
    var ny = y + step.dy;
    var bx = x + step.block.dx;
    var by = y + step.block.dy;

    if (nx >= 0 && nx < 9 && ny >= 0 && ny < 10) {
      if (color === 1 && ny <= 4 || color === 2 && ny >= 5) {
        if (state.board[by][bx] === 0) {
          var target = state.board[ny][nx];
          if (target === 0 || xiangqiPieceColor(target) !== color) {
            moves.push({ x: nx, y: ny });
          }
        }
      }
    }
  }
}

// 士的移动（宫内斜线）
function xiangqiAddAdvisorMoves(x, y, color, moves) {
  var steps = [
    { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
    { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
  ];

  for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    var nx = x + step.dx;
    var ny = y + step.dy;

    if (xiangqiInPalace(nx, ny, color)) {
      var target = state.board[ny][nx];
      if (target === 0 || xiangqiPieceColor(target) !== color) {
        moves.push({ x: nx, y: ny });
      }
    }
  }
}

// 帅/将的移动（宫内）
function xiangqiAddGeneralMoves(x, y, color, moves) {
  var steps = [
    { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
    { dx: 1, dy: 0 }, { dx: -1, dy: 0 }
  ];

  for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    var nx = x + step.dx;
    var ny = y + step.dy;

    if (xiangqiInPalace(nx, ny, color)) {
      var target = state.board[ny][nx];
      if (target === 0 || xiangqiPieceColor(target) !== color) {
        moves.push({ x: nx, y: ny });
      }
    }
  }
}

// 炮的移动（直线，吃子需跳过一个棋子）
function xiangqiAddCannonMoves(x, y, color, moves) {
  var dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  for (var d = 0; d < 4; d++) {
    var jumped = false;
    for (var step = 1; step < 10; step++) {
      var nx = x + dirs[d][0] * step;
      var ny = y + dirs[d][1] * step;
      if (nx < 0 || nx >= 9 || ny < 0 || ny >= 10) break;

      var target = state.board[ny][nx];
      if (target === 0) {
        if (!jumped) moves.push({ x: nx, y: ny });
      } else {
        if (!jumped) {
          jumped = true;
        } else {
          if (xiangqiPieceColor(target) !== color) {
            moves.push({ x: nx, y: ny });
          }
          break;
        }
      }
    }
  }
}

// 兵的移动（过河前后不同）
function xiangqiAddSoldierMoves(x, y, color, moves) {
  var riverY = color === 1 ? 5 : 4;
  var hasCrossed = color === 1 ? y >= riverY : y <= riverY;

  if (!hasCrossed) {
    // 未过河：只能向前
    var ny = color === 1 ? y + 1 : y - 1;
    if (ny >= 0 && ny < 10) {
      var target = state.board[ny][x];
      if (target === 0 || xiangqiPieceColor(target) !== color) {
        moves.push({ x: x, y: ny });
      }
    }
  } else {
    // 已过河：可前进、左右移动
    var dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    if (color === 2) dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // 黑方向下

    for (var d = 0; d < 4; d++) {
      var nx = x + dirs[d][0];
      var ny = y + dirs[d][1];
      if (ny >= 0 && ny < 10 && nx >= 0 && nx < 9) {
        var target = state.board[ny][nx];
        if (target === 0 || xiangqiPieceColor(target) !== color) {
          moves.push({ x: nx, y: ny });
        }
      }
    }
  }
}

// 选中棋子
function xiangqiSelectPiece(x, y) {
  var piece = state.board[y][x];
  if (piece === 0) return;

  var color = xiangqiPieceColor(piece);
  if (color !== state.currentPlayer) return;

  state.selectedPiece = { x: x, y: y };
  state.validMoves = xiangqiGetValidMoves(x, y);
}

// 移动棋子
function xiangqiMovePiece(x, y) {
  if (!state.selectedPiece) return false;

  var isValid = false;
  for (var i = 0; i < state.validMoves.length; i++) {
    if (state.validMoves[i].x === x && state.validMoves[i].y === y) {
      isValid = true;
      break;
    }
  }

  if (!isValid) return false;

  var sx = state.selectedPiece.x;
  var sy = state.selectedPiece.y;
  var piece = state.board[sy][sx];

  // 记录移动
  state.moveHistory.push({
    from: { x: sx, y: sy },
    to: { x: x, y: y },
    piece: piece,
    captured: state.board[y][x],
    player: state.currentPlayer
  });

  // 执行移动
  state.board[y][x] = piece;
  state.board[sy][sx] = 0;
  state.lastMove = { from: { x: sx, y: sy }, to: { x: x, y: y } };

  // 检查游戏结束（将/帅被吃）
  if (xiangqiIsGameOver()) {
    // 当前玩家的对手被吃了，当前玩家赢
    utils.endGame(state.currentPlayer);
    return true;
  }

  // 切换玩家
  state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
  state.isMyTurn = true;
  state.selectedPiece = null;
  state.validMoves = [];

  var s = state.settings.xiangqiMode;
  if (s.vsMode === 'ai' && state.currentPlayer !== s.playerColor) {
    state.isMyTurn = false;
    utils.scheduleAiMove();
  }

  return true;
}

// 检查游戏是否结束
function xiangqiIsGameOver() {
  // 检查对方的将/帅是否还在
  for (var y = 0; y < 10; y++) {
    for (var x = 0; x < 9; x++) {
      var piece = state.board[y][x];
      if (piece === 25 || piece === 15) { // 将或帅
        if (xiangqiPieceColor(piece) === state.currentPlayer) {
          return false; // 对方的将/帅还在
        }
      }
    }
  }
  return true;
}

// AI落子
function xiangqiAiMove() {
  if (state.gameOver) return;

  var s = state.settings.xiangqiMode;
  var myColor = s.playerColor === 1 ? 2 : 1;

  // 简单AI：随机选择一个有效移动
  var validPieces = [];
  for (var y = 0; y < 10; y++) {
    for (var x = 0; x < 9; x++) {
      var piece = state.board[y][x];
      if (piece !== 0 && xiangqiPieceColor(piece) === myColor) {
        var moves = xiangqiGetValidMoves(x, y);
        if (moves.length > 0) {
          validPieces.push({ x: x, y: y, moves: moves });
        }
      }
    }
  }

  if (validPieces.length === 0) {
    // AI无法移动，玩家赢
    utils.endGame(s.playerColor);
    return;
  }

  var piece = validPieces[Math.floor(Math.random() * validPieces.length)];
  var move = piece.moves[Math.floor(Math.random() * piece.moves.length)];

  state.selectedPiece = { x: piece.x, y: piece.y };
  xiangqiMovePiece(move.x, move.y);
}

module.exports = {
  initXiangqiGame: initXiangqiGame,
  xiangqiSelectPiece: xiangqiSelectPiece,
  xiangqiMovePiece: xiangqiMovePiece,
  xiangqiGetValidMoves: xiangqiGetValidMoves,
  xiangqiPieceName: xiangqiPieceName,
  xiangqiAiMove: xiangqiAiMove
};
