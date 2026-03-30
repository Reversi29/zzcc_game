/**
 * 棋棋 - 军棋模块
 * 包含军棋游戏逻辑和AI
 * 棋盘：5x12（纵向），双方各25子
 */

var state = require('./config.js');
var utils = require('./utils.js');

// 军棋初始化
function initJunqiGame() {
  state.gameType = 'junqi';

  var menu = require('./menu.js');
  menu.initBoardLayout();

  // 军棋棋盘 5x12（纵向），每方25子
  state.board = [];
  for (var y = 0; y < 12; y++) {
    state.board[y] = [];
    for (var x = 0; x < 5; x++) {
      state.board[y][x] = 0;
    }
  }

  // 初始化棋子
  junqiSetupBoard();

  var s = state.settings.junqiMode;
  state.currentPlayer = 1; // 红先
  state.isMyTurn = s.vsMode === 'human' || s.playerColor === 1;
  state.gameOver = false;
  state.winner = null;
  state.lastMove = null;
  state.moveHistory = [];
  state.aiMoveToken++;
  state.selectedPiece = null;
  state.validMoves = [];
  state.chatMessages = [];
  state.junqiRevealed = []; // 已翻开的棋子

  if (state.timerInterval) clearInterval(state.timerInterval);
}

// 军棋初始布局
function junqiSetupBoard() {
  // 军棋棋子类型（从小到大）
  // 1=工兵, 2=排长, 3=连长, 4=营长, 5=团长, 6=旅长, 7=师长, 8=军长, 9=司令
  // 10=炸弹, 11=地雷, 12=军棋
  // 棋子编码：color*100 + type（红=1, 蓝=2）
  
  // 红方（上方 y=0-4）
  // 第一行（y=0）
  state.board[0][0] = 111; // 地雷
  state.board[0][1] = 111;
  state.board[0][2] = 112; // 军棋
  state.board[0][3] = 111;
  state.board[0][4] = 111;
  
  // 第二行（y=1）
  state.board[1][0] = 109; // 炸弹
  state.board[1][1] = 107; // 师长
  state.board[1][2] = 108; // 军长
  state.board[1][3] = 107;
  state.board[1][4] = 109;
  
  // 第三行（y=2）
  state.board[2][0] = 106; // 旅长
  state.board[2][1] = 105; // 团长
  state.board[2][2] = 105;
  state.board[2][3] = 105;
  state.board[2][4] = 106;
  
  // 第四行（y=3）
  state.board[3][0] = 104; // 营长
  state.board[3][1] = 103; // 连长
  state.board[3][2] = 103;
  state.board[3][3] = 103;
  state.board[3][4] = 104;
  
  // 第五行（y=4）
  state.board[4][0] = 102; // 排长
  state.board[4][1] = 102;
  state.board[4][2] = 101; // 工兵
  state.board[4][3] = 102;
  state.board[4][4] = 102;
  
  // 蓝方（下方 y=7-11）
  // 第六行（y=7）
  state.board[7][0] = 202;
  state.board[7][1] = 202;
  state.board[7][2] = 201;
  state.board[7][3] = 202;
  state.board[7][4] = 202;
  
  // 第七行（y=8）
  state.board[8][0] = 204;
  state.board[8][1] = 203;
  state.board[8][2] = 203;
  state.board[8][3] = 203;
  state.board[8][4] = 204;
  
  // 第八行（y=9）
  state.board[9][0] = 206;
  state.board[9][1] = 205;
  state.board[9][2] = 205;
  state.board[9][3] = 205;
  state.board[9][4] = 206;
  
  // 第九行（y=10）
  state.board[10][0] = 209;
  state.board[10][1] = 207;
  state.board[10][2] = 208;
  state.board[10][3] = 207;
  state.board[10][4] = 209;
  
  // 第十行（y=11）
  state.board[11][0] = 211;
  state.board[11][1] = 211;
  state.board[11][2] = 212;
  state.board[11][3] = 211;
  state.board[11][4] = 211;
}

// 获取棋子类型
function getPieceType(piece) {
  return piece % 100;
}

// 获取棋子颜色
function getPieceColor(piece) {
  return Math.floor(piece / 100);
}

// 获取有效移动
function junqiGetValidMoves(x, y) {
  var moves = [];
  var piece = state.board[y][x];
  if (piece === 0) return moves;

  var type = getPieceType(piece);
  var color = getPieceColor(piece);

  // 地雷和军棋不能移动
  if (type === 11 || type === 12) return moves;

  // 工兵可以沿铁路任意走（简化：所有位置可走）
  // 其他棋子只能走相邻格子
  var dirs = [
    [0, 1], [0, -1], [1, 0], [-1, 0], // 上下左右
    [1, 1], [1, -1], [-1, 1], [-1, -1] // 斜线（铁路）
  ];

  for (var d = 0; d < dirs.length; d++) {
    var nx = x + dirs[d][0];
    var ny = y + dirs[d][1];

    if (nx >= 0 && nx < 5 && ny >= 0 && ny < 12) {
      var target = state.board[ny][nx];
      // 空位或敌方棋子
      if (target === 0 || getPieceColor(target) !== color) {
        // 斜线只能在铁路上（简化：允许所有斜线）
        moves.push({ x: nx, y: ny });
      }
    }
  }

  return moves;
}

// 选中棋子
function junqiSelectPiece(x, y) {
  var piece = state.board[y][x];
  if (piece === 0) return;

  var color = getPieceColor(piece);
  if (color !== state.currentPlayer) return;

  state.selectedPiece = { x: x, y: y };
  state.validMoves = junqiGetValidMoves(x, y);
}

// 移动棋子
function junqiMovePiece(x, y) {
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
  var target = state.board[y][x];

  // 如果目标有敌方棋子，进行战斗
  if (target !== 0) {
    var result = junqiBattle(piece, target);
    if (result === 1) {
      // 攻方胜
      state.board[y][x] = piece;
      state.board[sy][sx] = 0;
    } else if (result === -1) {
      // 防守方胜
      state.board[sy][sx] = 0;
    } else {
      // 同归于尽
      state.board[y][x] = 0;
      state.board[sy][sx] = 0;
    }

    // 检查是否吃掉军棋
    var targetType = getPieceType(target);
    if (targetType === 12) {
      state.gameOver = true;
      state.winner = getPieceColor(piece);
      state.chatMessages.push((state.winner === 1 ? '红' : '蓝') + '方胜利！');
    }
  } else {
    // 移动到空位
    state.board[y][x] = piece;
    state.board[sy][sx] = 0;
  }

  state.lastMove = { from: { x: sx, y: sy }, to: { x: x, y: y } };

  // 切换玩家
  state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
  state.isMyTurn = true;
  state.selectedPiece = null;
  state.validMoves = [];

  // 检查是否是AI回合
  var s = state.settings.junqiMode;
  if (s.vsMode === 'ai' && state.currentPlayer !== s.playerColor && !state.gameOver) {
    state.isMyTurn = false;
    utils.scheduleAiMove();
  }

  return true;
}

// 战斗判定（返回：1=攻方胜, -1=防守方胜, 0=同归于尽）
function junqiBattle(attacker, defender) {
  var atkType = getPieceType(attacker);
  var defType = getPieceType(defender);

  // 炸弹同归于尽
  if (atkType === 10 || defType === 10) return 0;

  // 地雷：只有工兵能挖
  if (defType === 11) {
    return atkType === 1 ? 1 : -1;
  }

  // 军棋：任意棋子可吃
  if (defType === 12) return 1;

  // 工兵对军棋：工兵胜（挖地雷已处理）
  // 司令对炸弹：炸弹同归于尽已处理

  // 大吃小
  if (atkType > defType) return 1;
  if (atkType < defType) return -1;
  return 0; // 同级别同归于尽
}

// AI落子
function junqiAiMove() {
  if (state.gameOver) return;

  var myColor = state.currentPlayer;
  var validPieces = [];

  for (var y = 0; y < 12; y++) {
    for (var x = 0; x < 5; x++) {
      var piece = state.board[y][x];
      if (piece !== 0 && getPieceColor(piece) === myColor) {
        var moves = junqiGetValidMoves(x, y);
        if (moves.length > 0) {
          validPieces.push({ x: x, y: y, moves: moves });
        }
      }
    }
  }

  if (validPieces.length === 0) {
    state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
    state.isMyTurn = true;
    return;
  }

  var piece = validPieces[Math.floor(Math.random() * validPieces.length)];
  var move = piece.moves[Math.floor(Math.random() * piece.moves.length)];

  state.selectedPiece = { x: piece.x, y: piece.y };
  junqiMovePiece(move.x, move.y);
}

module.exports = {
  initJunqiGame: initJunqiGame,
  junqiSelectPiece: junqiSelectPiece,
  junqiMovePiece: junqiMovePiece,
  junqiGetValidMoves: junqiGetValidMoves,
  junqiAiMove: junqiAiMove,
  getPieceType: getPieceType,
  getPieceColor: getPieceColor
};
