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

  state.board = [];
  for (var y = 0; y < 10; y++) {
    state.board[y] = [];
    for (var x = 0; x < 9; x++) {
      state.board[y][x] = 0;
    }
  }

  var s = state.settings.xiangqiMode;
  if (s.playerColor === 0) {
    s.playerColor = Math.random() < 0.5 ? 1 : 2;
  }

  xiangqiSetupBoard();

  state.currentPlayer = 1;
  state.isMyTurn = s.vsMode === 'human' ? true : s.playerColor === 1;
  state.gameOver = false;
  state.winner = null;
  state.lastMove = null;
  state.moveHistory = [];
  state.aiMoveToken++;
  state.previewX = -1;
  state.previewY = -1;
  state.canPlace = false;
  state.selectedPiece = null;
  state.validMoves = [];
  state.chatMessages = [];

  if (state.timerInterval) clearInterval(state.timerInterval);

  if (s.vsMode === 'ai' && !state.isMyTurn) {
    utils.scheduleAiMove();
  }
}

function xiangqiSetupBoard() {
  var s = state.settings.xiangqiMode;
  var playerColor = s.playerColor || 1;
  var bottomColor = playerColor;
  var topColor = playerColor === 1 ? 2 : 1;

  // 下方（玩家方）
  state.board[9][0] = bottomColor * 10 + 1;
  state.board[9][1] = bottomColor * 10 + 2;
  state.board[9][2] = bottomColor * 10 + 3;
  state.board[9][3] = bottomColor * 10 + 4;
  state.board[9][4] = bottomColor * 10 + 5;
  state.board[9][5] = bottomColor * 10 + 4;
  state.board[9][6] = bottomColor * 10 + 3;
  state.board[9][7] = bottomColor * 10 + 2;
  state.board[9][8] = bottomColor * 10 + 1;
  state.board[7][1] = bottomColor * 10 + 6;
  state.board[7][7] = bottomColor * 10 + 6;
  state.board[6][0] = bottomColor * 10 + 7;
  state.board[6][2] = bottomColor * 10 + 7;
  state.board[6][4] = bottomColor * 10 + 7;
  state.board[6][6] = bottomColor * 10 + 7;
  state.board[6][8] = bottomColor * 10 + 7;

  // 上方（对方）
  state.board[0][0] = topColor * 10 + 1;
  state.board[0][1] = topColor * 10 + 2;
  state.board[0][2] = topColor * 10 + 3;
  state.board[0][3] = topColor * 10 + 4;
  state.board[0][4] = topColor * 10 + 5;
  state.board[0][5] = topColor * 10 + 4;
  state.board[0][6] = topColor * 10 + 3;
  state.board[0][7] = topColor * 10 + 2;
  state.board[0][8] = topColor * 10 + 1;
  state.board[2][1] = topColor * 10 + 6;
  state.board[2][7] = topColor * 10 + 6;
  state.board[3][0] = topColor * 10 + 7;
  state.board[3][2] = topColor * 10 + 7;
  state.board[3][4] = topColor * 10 + 7;
  state.board[3][6] = topColor * 10 + 7;
  state.board[3][8] = topColor * 10 + 7;
}

function xiangqiPieceName(piece) {
  var names = {
    11: '车', 12: '马', 13: '象', 14: '士', 15: '帅', 16: '炮', 17: '兵',
    21: '车', 22: '马', 23: '象', 24: '士', 25: '将', 26: '炮', 27: '卒'
  };
  return names[piece] || '';
}

function xiangqiPieceColor(piece) {
  return piece === 0 ? 0 : Math.floor(piece / 10);
}

function xiangqiInPalace(x, y, color) {
  var s = state.settings.xiangqiMode;
  var playerColor = s.playerColor || 1;
  if (color === playerColor) {
    return x >= 3 && x <= 5 && y >= 7 && y <= 9;
  } else {
    return x >= 3 && x <= 5 && y >= 0 && y <= 2;
  }
}

// 移动生成函数
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

function xiangqiAddHorseMoves(x, y, color, moves) {
  var steps = [
    { dx: 1, dy: 2, blockX: 0, blockY: 1 },
    { dx: 1, dy: -2, blockX: 0, blockY: -1 },
    { dx: -1, dy: 2, blockX: 0, blockY: 1 },
    { dx: -1, dy: -2, blockX: 0, blockY: -1 },
    { dx: 2, dy: 1, blockX: 1, blockY: 0 },
    { dx: 2, dy: -1, blockX: 1, blockY: 0 },
    { dx: -2, dy: 1, blockX: -1, blockY: 0 },
    { dx: -2, dy: -1, blockX: -1, blockY: 0 }
  ];
  for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    var nx = x + step.dx;
    var ny = y + step.dy;
    var bx = x + step.blockX;
    var by = y + step.blockY;
    if (nx >= 0 && nx < 9 && ny >= 0 && ny < 10) {
      if (state.board[by][bx] === 0) {
        var target = state.board[ny][nx];
        if (target === 0 || xiangqiPieceColor(target) !== color) {
          moves.push({ x: nx, y: ny });
        }
      }
    }
  }
}

function xiangqiAddElephantMoves(x, y, color, moves) {
  var s = state.settings.xiangqiMode;
  var playerColor = s.playerColor || 1;
  var min_y = color === playerColor ? 5 : 0;
  var max_y = color === playerColor ? 9 : 4;
  var steps = [
    { dx: 2, dy: 2, bx: 1, by: 1 },
    { dx: 2, dy: -2, bx: 1, by: -1 },
    { dx: -2, dy: 2, bx: -1, by: 1 },
    { dx: -2, dy: -2, bx: -1, by: -1 }
  ];
  for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    var nx = x + step.dx;
    var ny = y + step.dy;
    if (nx >= 0 && nx < 9 && ny >= min_y && ny <= max_y) {
      if (state.board[y + step.by][x + step.bx] === 0) {
        var target = state.board[ny][nx];
        if (target === 0 || xiangqiPieceColor(target) !== color) {
          moves.push({ x: nx, y: ny });
        }
      }
    }
  }
}

function xiangqiAddAdvisorMoves(x, y, color, moves) {
  var steps = [{ dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }];
  for (var i = 0; i < steps.length; i++) {
    var nx = x + steps[i].dx;
    var ny = y + steps[i].dy;
    if (xiangqiInPalace(nx, ny, color)) {
      var target = state.board[ny][nx];
      if (target === 0 || xiangqiPieceColor(target) !== color) {
        moves.push({ x: nx, y: ny });
      }
    }
  }
}

function xiangqiAddGeneralMoves(x, y, color, moves) {
  var steps = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
  for (var i = 0; i < steps.length; i++) {
    var nx = x + steps[i].dx;
    var ny = y + steps[i].dy;
    if (xiangqiInPalace(nx, ny, color)) {
      var target = state.board[ny][nx];
      if (target === 0 || xiangqiPieceColor(target) !== color) {
        moves.push({ x: nx, y: ny });
      }
    }
  }
}

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

function xiangqiAddSoldierMoves(x, y, color, moves) {
  var s = state.settings.xiangqiMode;
  var playerColor = s.playerColor || 1;
  var forward = color === playerColor ? -1 : 1;
  var riverY = color === playerColor ? 4 : 5;
  var hasCrossed = color === playerColor ? y <= riverY : y >= riverY;

  var ny = y + forward;
  if (ny >= 0 && ny < 10) {
    var target = state.board[ny][x];
    if (target === 0 || xiangqiPieceColor(target) !== color) {
      moves.push({ x: x, y: ny });
    }
  }
  if (hasCrossed) {
    for (var dx = -1; dx <= 1; dx += 2) {
      var nx = x + dx;
      if (nx >= 0 && nx < 9) {
        target = state.board[y][nx];
        if (target === 0 || xiangqiPieceColor(target) !== color) {
          moves.push({ x: nx, y: y });
        }
      }
    }
  }
}

function xiangqiIsKingsFacing() {
  var redKing = null, blackKing = null;
  for (var y = 0; y < 10; y++) {
    for (var x = 0; x < 9; x++) {
      if (state.board[y][x] === 15) redKing = { x: x, y: y };
      if (state.board[y][x] === 25) blackKing = { x: x, y: y };
    }
  }
  if (!redKing || !blackKing || redKing.x !== blackKing.x) return false;
  for (var y = Math.min(redKing.y, blackKing.y) + 1; y < Math.max(redKing.y, blackKing.y); y++) {
    if (state.board[y][redKing.x] !== 0) return false;
  }
  return true;
}

function xiangqiIsUnderAttack(x, y, byColor) {
  for (var cy = 0; cy < 10; cy++) {
    for (var cx = 0; cx < 9; cx++) {
      var piece = state.board[cy][cx];
      if (piece !== 0 && xiangqiPieceColor(piece) === byColor) {
        var moves = [], type = piece % 10, color = xiangqiPieceColor(piece);
        if (type === 1) xiangqiAddLineMoves(cx, cy, color, moves);
        else if (type === 2) xiangqiAddHorseMoves(cx, cy, color, moves);
        else if (type === 3) xiangqiAddElephantMoves(cx, cy, color, moves);
        else if (type === 4) xiangqiAddAdvisorMoves(cx, cy, color, moves);
        else if (type === 5) xiangqiAddGeneralMoves(cx, cy, color, moves);
        else if (type === 6) xiangqiAddCannonMoves(cx, cy, color, moves);
        else if (type === 7) xiangqiAddSoldierMoves(cx, cy, color, moves);
        for (var i = 0; i < moves.length; i++) {
          if (moves[i].x === x && moves[i].y === y) return true;
        }
      }
    }
  }
  return false;
}

function xiangqiIsInCheck(color) {
  var kingPiece = color === 1 ? 15 : 25;
  for (var y = 0; y < 10; y++) {
    for (var x = 0; x < 9; x++) {
      if (state.board[y][x] === kingPiece) {
        return xiangqiIsUnderAttack(x, y, color === 1 ? 2 : 1);
      }
    }
  }
  return false;
}

function xiangqiWouldCauseSelfCheck(fromX, fromY, toX, toY, color) {
  var piece = state.board[fromY][fromX];
  var captured = state.board[toY][toX];
  state.board[toY][toX] = piece;
  state.board[fromY][fromX] = 0;
  var inCheck = xiangqiIsInCheck(color) || xiangqiIsKingsFacing();
  state.board[fromY][fromX] = piece;
  state.board[toY][toX] = captured;
  return inCheck;
}

function xiangqiGetValidMoves(x, y) {
  var piece = state.board[y][x];
  if (piece === 0) return [];
  var color = xiangqiPieceColor(piece);
  var type = piece % 10;
  var moves = [];
  if (type === 1) xiangqiAddLineMoves(x, y, color, moves);
  else if (type === 2) xiangqiAddHorseMoves(x, y, color, moves);
  else if (type === 3) xiangqiAddElephantMoves(x, y, color, moves);
  else if (type === 4) xiangqiAddAdvisorMoves(x, y, color, moves);
  else if (type === 5) xiangqiAddGeneralMoves(x, y, color, moves);
  else if (type === 6) xiangqiAddCannonMoves(x, y, color, moves);
  else if (type === 7) xiangqiAddSoldierMoves(x, y, color, moves);

  var validMoves = [];
  for (var i = 0; i < moves.length; i++) {
    if (!xiangqiWouldCauseSelfCheck(x, y, moves[i].x, moves[i].y, color)) {
      validMoves.push(moves[i]);
    }
  }
  return validMoves;
}

function xiangqiSelectPiece(x, y) {
  var piece = state.board[y][x];
  if (piece === 0) return;
  var color = xiangqiPieceColor(piece);
  if (color !== state.currentPlayer) return;
  state.selectedPiece = { x: x, y: y };
  state.validMoves = xiangqiGetValidMoves(x, y);
}

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

  state.moveHistory.push({
    from: { x: sx, y: sy },
    to: { x: x, y: y },
    piece: piece,
    captured: state.board[y][x],
    player: state.currentPlayer
  });

  state.board[y][x] = piece;
  state.board[sy][sx] = 0;
  state.lastMove = { from: { x: sx, y: sy }, to: { x: x, y: y } };

  if (xiangqiIsGameOver()) {
    utils.endGame(state.currentPlayer);
    return true;
  }

  var prevPlayer = state.currentPlayer;
  state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;

  if (xiangqiIsStalemate(state.currentPlayer)) {
    utils.endGame(prevPlayer);
    return true;
  }

  if (xiangqiNoAttackPieces()) {
    state.gameOver = true;
    state.winner = 0;
    state.chatMessages.push('双方均无进攻子力，判和！');
    return true;
  }

  if (xiangqiIsInCheck(state.currentPlayer)) {
    state.chatMessages.push((state.currentPlayer === 1 ? '红' : '黑') + '方被将军！');
  }

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

function xiangqiIsGameOver() {
  var opponentColor = state.currentPlayer === 1 ? 2 : 1;
  for (var y = 0; y < 10; y++) {
    for (var x = 0; x < 9; x++) {
      var piece = state.board[y][x];
      if (piece === 25 || piece === 15) {
        if (xiangqiPieceColor(piece) === opponentColor) return false;
      }
    }
  }
  return true;
}

function xiangqiIsStalemate(color) {
  for (var y = 0; y < 10; y++) {
    for (var x = 0; x < 9; x++) {
      var piece = state.board[y][x];
      if (piece !== 0 && xiangqiPieceColor(piece) === color) {
        if (xiangqiGetValidMoves(x, y).length > 0) return false;
      }
    }
  }
  return true;
}

function xiangqiNoAttackPieces() {
  var redHas = false, blackHas = false;
  for (var y = 0; y < 10; y++) {
    for (var x = 0; x < 9; x++) {
      var piece = state.board[y][x];
      if (piece !== 0) {
        var type = piece % 10;
        if (type === 1 || type === 2 || type === 6) {
          if (xiangqiPieceColor(piece) === 1) redHas = true;
          else blackHas = true;
        }
      }
    }
  }
  return !redHas && !blackHas;
}

// ============================================================
// 大师级象棋AI评估系统
// ============================================================

var XIANGQI_VALUES = {
  PIECE_BASE: { 1: 1000, 2: 400, 3: 200, 4: 180, 5: 50000, 6: 450, 7: 30 },
  CROSSED_PAWN: 80,
  FIRST_MOVER_BONUS: 0.03,
  KILL_BONUS: 300
};

function xiangqiGetGamePhase() {
  var moveCount = state.moveHistory ? state.moveHistory.length : 0;
  if (moveCount < 30) return 'opening';
  if (moveCount < 90) return 'middlegame';
  return 'endgame';
}

function xiangqiFindKing(color) {
  var kingPiece = color === 1 ? 15 : 25;
  for (var y = 0; y < 10; y++) {
    for (var x = 0; x < 9; x++) {
      if (state.board[y][x] === kingPiece) return { x: x, y: y };
    }
  }
  return null;
}

function xiangqiEvalChariot(x, y, color) {
  var score = XIANGQI_VALUES.PIECE_BASE[1];
  var opponentColor = color === 1 ? 2 : 1;
  if (x >= 3 && x <= 5) score += 150;
  var oppKing = xiangqiFindKing(opponentColor);
  if (oppKing && Math.abs(x - oppKing.x) <= 2) score += 180;
  // 双车联攻
  for (var cy = 0; cy < 10; cy++) {
    for (var cx = 0; cx < 9; cx++) {
      if (state.board[cy][cx] === (color * 10 + 1) && (cx !== x || cy !== y)) {
        score += 220;
      }
    }
  }
  // 车低头
  if ((color === 1 && y <= 2) || (color === 2 && y >= 7)) score -= 130;
  return score;
}

function xiangqiEvalHorse(x, y, color) {
  var score = XIANGQI_VALUES.PIECE_BASE[2];
  var goodPos = [[2,2],[6,2],[2,7],[6,7],[3,3],[5,3],[3,6],[5,6],[4,4],[4,5]];
  for (var i = 0; i < goodPos.length; i++) {
    if (x === goodPos[i][0] && y === goodPos[i][1]) { score += 125; break; }
  }
  // 双马连环
  for (var cy = 0; cy < 10; cy++) {
    for (var cx = 0; cx < 9; cx++) {
      if (state.board[cy][cx] === (color * 10 + 2) && (cx !== x || cy !== y)) {
        if (Math.abs(cx - x) <= 2 && Math.abs(cy - y) <= 2) score += 100;
      }
    }
  }
  return score;
}

function xiangqiEvalCannon(x, y, color) {
  var score = XIANGQI_VALUES.PIECE_BASE[6];
  var phase = xiangqiGetGamePhase();
  if (phase === 'endgame') score = Math.floor(score * 0.7);
  if (x === 4) score += 135;
  // 双炮联攻
  var cannonCount = 0;
  for (var cy = 0; cy < 10; cy++) {
    for (var cx = 0; cx < 9; cx++) {
      if (state.board[cy][cx] === (color * 10 + 6)) cannonCount++;
    }
  }
  if (cannonCount >= 2) score += 165;
  return score;
}

function xiangqiEvalGuardElephant(type, color) {
  var score = XIANGQI_VALUES.PIECE_BASE[type];
  var count = 0;
  for (var cy = 0; cy < 10; cy++) {
    for (var cx = 0; cx < 9; cx++) {
      var p = state.board[cy][cx];
      if (p !== 0 && xiangqiPieceColor(p) === color && p % 10 === type) count++;
    }
  }
  if (count >= 2) score += 90;
  else score -= 120;
  return score;
}

function xiangqiEvalPawn(x, y, color) {
  var score = XIANGQI_VALUES.PIECE_BASE[7];
  var phase = xiangqiGetGamePhase();
  var crossed = (color === 1 && y <= 4) || (color === 2 && y >= 5);
  if (crossed) {
    score = XIANGQI_VALUES.CROSSED_PAWN;
    if (x === 3 || x === 5) score += 75;
  }
  if (phase === 'endgame') score = Math.floor(score * 1.4);
  return score;
}

function xiangqiEvaluateBoard(myColor) {
  var opponentColor = myColor === 1 ? 2 : 1;
  var phase = xiangqiGetGamePhase();
  var score = 0;

  for (var y = 0; y < 10; y++) {
    for (var x = 0; x < 9; x++) {
      var piece = state.board[y][x];
      if (piece === 0) continue;
      var type = piece % 10;
      var color = xiangqiPieceColor(piece);
      var value = 0;

      if (type === 1) value = xiangqiEvalChariot(x, y, color);
      else if (type === 2) value = xiangqiEvalHorse(x, y, color);
      else if (type === 6) value = xiangqiEvalCannon(x, y, color);
      else if (type === 3) value = xiangqiEvalGuardElephant(3, color);
      else if (type === 4) value = xiangqiEvalGuardElephant(4, color);
      else if (type === 7) value = xiangqiEvalPawn(x, y, color);
      else if (type === 5) value = XIANGQI_VALUES.PIECE_BASE[5];

      if (color === myColor) score += value;
      else score -= value;
    }
  }

  if (myColor === 1) score = Math.floor(score * 1.03);
  if (xiangqiIsInCheck(opponentColor)) score += XIANGQI_VALUES.KILL_BONUS;
  if (xiangqiIsInCheck(myColor)) score -= XIANGQI_VALUES.KILL_BONUS;
  if (phase === 'opening') score = Math.floor(score * 1.1);
  else if (phase === 'endgame') score = Math.floor(score * 1.14);

  return score;
}

function xiangqiGetAllMoves(color) {
  var allMoves = [];
  for (var y = 0; y < 10; y++) {
    for (var x = 0; x < 9; x++) {
      var piece = state.board[y][x];
      if (piece !== 0 && xiangqiPieceColor(piece) === color) {
        var moves = xiangqiGetValidMoves(x, y);
        for (var i = 0; i < moves.length; i++) {
          allMoves.push({ fromX: x, fromY: y, toX: moves[i].x, toY: moves[i].y, piece: piece });
        }
      }
    }
  }
  return allMoves;
}

function xiangqiCheckForcedKill(myColor) {
  var opponentColor = myColor === 1 ? 2 : 1;
  var allMoves = xiangqiGetAllMoves(myColor);

  for (var i = 0; i < allMoves.length; i++) {
    var m = allMoves[i];
    var piece = state.board[m.fromY][m.fromX];
    var captured = state.board[m.toY][m.toX];

    state.board[m.toY][m.toX] = piece;
    state.board[m.fromY][m.fromX] = 0;

    var isCheckmate = xiangqiIsInCheck(opponentColor) && xiangqiGetAllMoves(opponentColor).length === 0;

    state.board[m.fromY][m.fromX] = piece;
    state.board[m.toY][m.toX] = captured;

    if (isCheckmate) return { hasKill: true, move: m };
  }
  return { hasKill: false, move: null };
}

function xiangqiAiMove() {
  if (state.gameOver) return;

  var s = state.settings.xiangqiMode;
  var myColor = s.playerColor === 1 ? 2 : 1;

  var killResult = xiangqiCheckForcedKill(myColor);
  if (killResult.hasKill && killResult.move) {
    state.selectedPiece = { x: killResult.move.fromX, y: killResult.move.fromY };
    state.validMoves = xiangqiGetValidMoves(killResult.move.fromX, killResult.move.fromY);
    xiangqiMovePiece(killResult.move.toX, killResult.move.toY);
    return;
  }

  var allMoves = xiangqiGetAllMoves(myColor);
  if (allMoves.length === 0) {
    utils.endGame(s.playerColor);
    return;
  }

  var bestMove = xiangqiSelectBestMove(allMoves, myColor, s.difficulty);
  state.selectedPiece = { x: bestMove.fromX, y: bestMove.fromY };
  state.validMoves = xiangqiGetValidMoves(bestMove.fromX, bestMove.fromY);
  xiangqiMovePiece(bestMove.toX, bestMove.toY);
}

function xiangqiSelectBestMove(moves, myColor, difficulty) {
  var depth = difficulty === 'easy' ? 2 : 3;
  var randomFactor = difficulty === 'easy' ? 0.4 : difficulty === 'normal' ? 0.15 : 0;

  for (var i = 0; i < moves.length; i++) {
    moves[i].score = xiangqiEvaluateMoveDeep(moves[i], myColor, depth);
  }

  moves.sort(function(a, b) { return b.score - a.score; });

  if (randomFactor > 0) {
    var topCount = Math.max(1, Math.floor(moves.length * randomFactor));
    return moves[Math.floor(Math.random() * topCount)];
  }
  return moves[0];
}

function xiangqiEvaluateMoveDeep(move, myColor, depth) {
  var piece = state.board[move.fromY][move.fromX];
  var captured = state.board[move.toY][move.toX];

  state.board[move.toY][move.toX] = piece;
  state.board[move.fromY][move.fromX] = 0;

  var score = depth <= 1 ? xiangqiEvaluateBoard(myColor) : -xiangqiMinimax(depth - 1, myColor === 1 ? 2 : 1, -1000000, 1000000);

  state.board[move.fromY][move.fromX] = piece;
  state.board[move.toY][move.toX] = captured;

  return score;
}

function xiangqiMinimax(depth, color, alpha, beta) {
  if (depth === 0) return xiangqiEvaluateBoard(color);

  var allMoves = xiangqiGetAllMoves(color);
  if (allMoves.length === 0) return -50000 + depth * 1000;

  var maxScore = -1000000;
  for (var i = 0; i < allMoves.length; i++) {
    var m = allMoves[i];
    var piece = state.board[m.fromY][m.fromX];
    var captured = state.board[m.toY][m.toX];

    state.board[m.toY][m.toX] = piece;
    state.board[m.fromY][m.fromX] = 0;

    var score = -xiangqiMinimax(depth - 1, color === 1 ? 2 : 1, -beta, -alpha);

    state.board[m.fromY][m.fromX] = piece;
    state.board[m.toY][m.toX] = captured;

    if (score > maxScore) maxScore = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return maxScore;
}

module.exports = {
  initXiangqiGame: initXiangqiGame,
  xiangqiSelectPiece: xiangqiSelectPiece,
  xiangqiMovePiece: xiangqiMovePiece,
  xiangqiGetValidMoves: xiangqiGetValidMoves,
  xiangqiPieceName: xiangqiPieceName,
  xiangqiAiMove: xiangqiAiMove,
  xiangqiIsInCheck: xiangqiIsInCheck,
  xiangqiIsStalemate: xiangqiIsStalemate
};
