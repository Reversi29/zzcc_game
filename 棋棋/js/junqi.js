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

// 军棋初始布局（标准军棋暗棋布局）
function junqiSetupBoard() {
  // 军棋棋子类型：
  // 1=工兵, 2=排长, 3=连长, 4=营长, 5=团长, 6=旅长, 7=师长, 8=军长, 9=司令
  // 10=炸弹, 11=地雷, 12=军棋
  // 棋子编码：color*100 + type（红=1, 蓝=2）
  // 大本营（game.js绘制为虚线框）：红方(0,0)&(4,0)，蓝方(0,11)&(4,11)
  // 大本营内棋子敌方不能进入

  // === 红方（上方 y=0-4）===
  // 第0行（大本营区域，两角是地雷，保护军棋）
  state.board[0][0] = 111; // 地雷（左大本营）
  state.board[0][1] = 0;
  state.board[0][2] = 112; // 军棋（中央大本营）
  state.board[0][3] = 0;
  state.board[0][4] = 111; // 地雷（右大本营）

  // 第1行（旅长、师长、团长防守）
  state.board[1][0] = 0;
  state.board[1][1] = 107; // 师长
  state.board[1][2] = 106; // 旅长
  state.board[1][3] = 107; // 师长
  state.board[1][4] = 0;

  // 第2行（团长主力 + 炸弹）
  state.board[2][0] = 106; // 旅长
  state.board[2][1] = 105; // 团长
  state.board[2][2] = 109; // 炸弹
  state.board[2][3] = 105; // 团长
  state.board[2][4] = 106; // 旅长

  // 第3行（营长、军长、连长）
  state.board[3][0] = 108; // 军长
  state.board[3][1] = 104; // 营长
  state.board[3][2] = 103; // 连长
  state.board[3][3] = 104; // 营长
  state.board[3][4] = 108; // 军长

  // 第4行（行营行：营长、连长、工兵）
  state.board[4][0] = 104; // 营长
  state.board[4][1] = 103; // 连长
  state.board[4][2] = 101; // 工兵
  state.board[4][3] = 103; // 连长
  state.board[4][4] = 104; // 营长

  // 第5行（行营行：排长）
  state.board[5][0] = 0;
  state.board[5][1] = 102; // 排长
  state.board[5][2] = 102; // 排长
  state.board[5][3] = 102; // 排长
  state.board[5][4] = 0;

  // === 蓝方（下方 y=6-11）===
  // 第6行（行营行：排长）
  state.board[6][0] = 0;
  state.board[6][1] = 202; // 排长
  state.board[6][2] = 202; // 排长
  state.board[6][3] = 202; // 排长
  state.board[6][4] = 0;

  // 第7行（行营行：营长、连长、工兵）
  state.board[7][0] = 204; // 营长
  state.board[7][1] = 203; // 连长
  state.board[7][2] = 201; // 工兵
  state.board[7][3] = 203; // 连长
  state.board[7][4] = 204; // 营长

  // 第8行（营长、军长、连长）
  state.board[8][0] = 208; // 军长
  state.board[8][1] = 204; // 营长
  state.board[8][2] = 203; // 连长
  state.board[8][3] = 204; // 营长
  state.board[8][4] = 208; // 军长

  // 第9行（团长主力 + 炸弹）
  state.board[9][0] = 206; // 旅长
  state.board[9][1] = 205; // 团长
  state.board[9][2] = 209; // 炸弹
  state.board[9][3] = 205; // 团长
  state.board[9][4] = 206; // 旅长

  // 第10行（旅长、师长、团长防守）
  state.board[10][0] = 0;
  state.board[10][1] = 207; // 师长
  state.board[10][2] = 206; // 旅长
  state.board[10][3] = 207; // 师长
  state.board[10][4] = 0;

  // 第11行（大本营区域，两角是地雷，保护军棋）
  state.board[11][0] = 211; // 地雷（左大本营）
  state.board[11][1] = 0;
  state.board[11][2] = 212; // 军棋（中央大本营）
  state.board[11][3] = 0;
  state.board[11][4] = 211; // 地雷（右大本营）
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

  // 铁路线定义
  // 两条横铁路: row=4 和 row=7（0-indexed）
  // 四条斜铁路: (0,0)-(2,4), (2,4)-(4,0), (0,11)-(2,7), (2,7)-(4,11)
  // 铁路交叉点: (0,4), (2,4), (4,4), (0,7), (2,7), (4,7)
  var isRailwayY = (y === 4 || y === 7);
  var isRailwayX = false;
  var isOnRailway = false;
  var railwayDirs = []; // 可沿铁路移动的方向

  // 检测是否在铁路交叉点
  var isIntersection = false;
  var interX = -1, interY = -1;
  var intersectionPoints = [[0, 4], [2, 4], [4, 4], [0, 7], [2, 7], [4, 7]];
  for (var ii = 0; ii < intersectionPoints.length; ii++) {
    if (intersectionPoints[ii][0] === x && intersectionPoints[ii][1] === y) {
      isIntersection = true;
      interX = x;
      interY = y;
      break;
    }
  }

  // 检测是否在斜铁路线上
  // 左上斜线: x + y = 4 (但只在row 0-4范围)
  // 右上斜线: x - y = -4 (但只在row 0-4范围)
  // 左下斜线: x - y = -11 (row 7-11)
  // 右下斜线: x + y = 15 (row 7-11)
  var onDiagRail = false;
  if (y >= 0 && y <= 4) {
    if (x + y === 4) onDiagRail = true; // 左上->中
    if (x - y === 4) onDiagRail = true; // 右上->中
  }
  if (y >= 7 && y <= 11) {
    if (x - y === -11) onDiagRail = true; // 左下->中
    if (x + y === 15) onDiagRail = true;  // 右下->中
  }

  isOnRailway = isRailwayY || onDiagRail;

  if (isIntersection) {
    // 交叉点：可以往8个铁路方向走任意步
    railwayDirs = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]];
  } else if (isRailwayY) {
    // 水平铁路：只能左右走
    railwayDirs = [[1, 0], [-1, 0]];
  } else if (onDiagRail) {
    // 斜铁路：只能沿对角线走
    if (y >= 0 && y <= 4) {
      if (x + y === 4) railwayDirs = [[1, -1], [-1, 1]]; // 左上->中
      if (x - y === 4) railwayDirs = [[-1, -1], [1, 1]]; // 右上->中
    }
    if (y >= 7 && y <= 11) {
      if (x - y === -11) railwayDirs = [[-1, 1], [1, -1]]; // 左下->中
      if (x + y === 15) railwayDirs = [[1, 1], [-1, -1]];  // 右下->中
    }
  }

  // 工兵：可以沿铁路走任意步，或走普通一步
  if (type === 1) {
    // 沿铁路走（工兵特色）
    if (railwayDirs.length > 0) {
      for (var d = 0; d < railwayDirs.length; d++) {
        var step = railwayDirs[d];
        var mx = x + step[0];
        var my = y + step[1];
        while (mx >= 0 && mx < 5 && my >= 0 && my < 12) {
          var target = state.board[my][mx];
          if (target === 0) {
            moves.push({ x: mx, y: my });
          } else if (getPieceColor(target) !== color) {
            // 敌方棋子也可以走到（吃子）
            moves.push({ x: mx, y: my });
            break; // 不能越过敌方棋子
          } else {
            break; // 友方棋子，停止
          }
          mx += step[0];
          my += step[1];
        }
      }
    }
    // 工兵也可以走普通一步（非铁路）
    var normalDirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (var n = 0; n < normalDirs.length; n++) {
      var nx2 = x + normalDirs[n][0];
      var ny2 = y + normalDirs[n][1];
      if (nx2 >= 0 && nx2 < 5 && ny2 >= 0 && ny2 < 12) {
        var t2 = state.board[ny2][nx2];
        if (t2 === 0 || getPieceColor(t2) !== color) {
          moves.push({ x: nx2, y: ny2 });
        }
      }
    }
  } else {
    // 非工兵：普通走一步
    var allDirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (var i = 0; i < allDirs.length; i++) {
      var nx3 = x + allDirs[i][0];
      var ny3 = y + allDirs[i][1];
      if (nx3 >= 0 && nx3 < 5 && ny3 >= 0 && ny3 < 12) {
        var t3 = state.board[ny3][nx3];
        if (t3 === 0 || getPieceColor(t3) !== color) {
          moves.push({ x: nx3, y: ny3 });
        }
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
