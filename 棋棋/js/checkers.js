/**
 * 棋棋 - 跳棋模块
 * 包含跳棋游戏逻辑、标准中国跳棋棋盘和AI
 * 棋盘：17行，ROW_COUNTS布局，中央正六边形 + 六个三角形阵营
 */

var state = require('./config.js');
var utils = require('./utils.js');

// 每一行的点位数（中心对称）
var ROW_COUNTS = [1, 2, 3, 4, 13, 12, 11, 10, 9, 10, 11, 12, 13, 4, 3, 2, 1];

// 计算某行的起始列（0开始）
function getRowStartCol(row) {
  var count = ROW_COUNTS[row];
  var maxCount = 13;
  return Math.floor((maxCount - count) / 2);
}

// 跳棋棋盘初始化
function initCheckersGame() {
  state.gameType = 'checkers';

  var menu = require('./menu.js');
  menu.initBoardLayout();

  // 跳棋棋盘：17行17列
  state.board = [];
  for (var y = 0; y < 17; y++) {
    state.board[y] = [];
    for (var x = 0; x < 17; x++) {
      state.board[y][x] = 0;
    }
  }

  // 初始化棋子
  checkersSetupBoard();

  var s = state.settings.checkersMode;
  state.currentPlayer = 1;
  state.isMyTurn = true;
  state.gameOver = false;
  state.winner = null;
  state.lastMove = null;
  state.moveHistory = [];
  state.aiMoveToken++;
  state.selectedPiece = null;
  state.validMoves = [];
  state.chatMessages = [];
  state.playerColors = [];
  state.playerTypes = [];

  for (var i = 1; i <= s.players; i++) {
    state.playerColors.push(i);
    if (i <= s.aiCount) {
      state.playerTypes.push('ai');
    } else {
      state.playerTypes.push('human');
    }
  }

  if (state.timerInterval) clearInterval(state.timerInterval);
}

// 检查是否是有效的跳棋位置
// 坐标系：x=行（1-17）, y=列（1-13）
function isValidCheckersPos(x, y) {
  // 转换为0开始
  var row = x - 1;
  var col = y - 1;
  
  if (row < 0 || row >= 17 || col < 0 || col >= 17) return false;
  
  var count = ROW_COUNTS[row];
  var startCol = getRowStartCol(row);
  return col >= startCol && col < startCol + count;
}

// 将用户坐标(x,y)转换为内部存储坐标(row,col)
function userToBoard(x, y) {
  var row = x - 1;
  var col = y - 1;
  var startCol = getRowStartCol(row);
  var actualCol = startCol + col;
  return { row: row, col: actualCol };
}

// 跳棋棋盘初始布局
function checkersSetupBoard() {
  var s = state.settings.checkersMode;
  var players = s.players;

  // 第一个阵营（上）：1,1 2,1 2,2 3,1 3,2 3,3 4,1 4,2 4,3 4,4
  // 第二个阵营（左）：7,4 6,4 6,3 5,4 5,3 5,2 4,4 4,3 4,2 4,1
  // 第三个阵营（右下）：7,7 6,7 6,6 5,7 5,6 5,5 4,7 4,6 4,5 4,4
  // 第四个阵营（右下2）：1,7 2,7 2,6 3,7 3,6 3,5 4,7 4,6 4,5 4,4
  // 第五个阵营（下）：1,4 2,4 2,3 3,4 3,3 3,2 4,4 4,3 4,2 4,1
  // 第六个阵营（右）：7,1 6,1 6,2 5,1 5,2 5,3 4,1 4,2 4,3 4,4

  // 阵营1的坐标（10个点）
  var camp1 = [
    [1,1],[2,1],[2,2],[3,1],[3,2],[3,3],[4,1],[4,2],[4,3],[4,4]
  ];
  // 阵营2的坐标
  var camp2 = [
    [7,4],[6,4],[6,3],[5,4],[5,3],[5,2],[4,4],[4,3],[4,2],[4,1]
  ];
  // 阵营3的坐标
  var camp3 = [
    [7,7],[6,7],[6,6],[5,7],[5,6],[5,5],[4,7],[4,6],[4,5],[4,4]
  ];
  // 阵营4的坐标
  var camp4 = [
    [1,7],[2,7],[2,6],[3,7],[3,6],[3,5],[4,7],[4,6],[4,5],[4,4]
  ];
  // 阵营5的坐标
  var camp5 = [
    [1,4],[2,4],[2,3],[3,4],[3,3],[3,2],[4,4],[4,3],[4,2],[4,1]
  ];
  // 阵营6的坐标
  var camp6 = [
    [7,1],[6,1],[6,2],[5,1],[5,2],[5,3],[4,1],[4,2],[4,3],[4,4]
  ];

  function placeCamp(camp, player) {
    for (var i = 0; i < camp.length; i++) {
      var pos = userToBoard(camp[i][0], camp[i][1]);
      state.board[pos.row][pos.col] = player;
    }
  }

  if (players === 2) {
    placeCamp(camp1, 1); // 玩家1：上
    placeCamp(camp5, 2); // 玩家2：下

  } else if (players === 3) {
    placeCamp(camp1, 1); // 玩家1：上
    placeCamp(camp4, 2); // 玩家2：左下
    placeCamp(camp3, 3); // 玩家3：右下

  } else if (players === 4) {
    placeCamp(camp1, 1); // 玩家1：上
    placeCamp(camp3, 2); // 玩家2：右下
    placeCamp(camp5, 3); // 玩家3：下
    placeCamp(camp4, 4); // 玩家4：左下

  } else if (players === 6) {
    placeCamp(camp1, 1); // 玩家1：上
    placeCamp(camp2, 2); // 玩家2：左
    placeCamp(camp3, 3); // 玩家3：右下
    placeCamp(camp5, 4); // 玩家4：下
    placeCamp(camp4, 5); // 玩家5：左下
    placeCamp(camp6, 6); // 玩家6：右
  }
}

// 获取有效移动
function checkersGetValidMoves(x, y) {
  var moves = [];
  var pos = userToBoard(x, y);
  var piece = state.board[pos.row][pos.col];
  if (piece === 0) return moves;

  // 六边形网格的6个方向
  // 根据当前行号的奇偶性，方向有所不同
  var row = pos.row;
  var isOddRow = row % 2 === 1;
  
  // 6个方向（使用内部坐标）
  var dirs;
  if (isOddRow) {
    // 奇数行（1,3,5...）
    dirs = [
      [0, 1],   // 右
      [0, -1],  // 左
      [1, 0],   // 下
      [-1, 0],  // 上
      [-1, 0],  // 左上
      [1, 1]    // 右下
    ];
  } else {
    // 偶数行（0,2,4...）
    dirs = [
      [0, 1],   // 右
      [0, -1],  // 左
      [1, 0],   // 下
      [-1, 0],  // 上
      [-1, -1], // 左上
      [1, 1]    // 右下
    ];
  }

  // 普通移动（相邻空位）
  for (var d = 0; d < 6; d++) {
    var nx = pos.row + dirs[d][0];
    var ny = pos.col + dirs[d][1];
    
    // 检查是否是有效棋盘位置
    if (nx >= 0 && nx < 17 && ny >= 0 && ny < 17) {
      var count = ROW_COUNTS[nx];
      var startCol = getRowStartCol(nx);
      if (ny >= startCol && ny < startCol + count) {
        if (state.board[nx][ny] === 0) {
          // 转换为用户坐标
          var userX = nx + 1;
          var userY = ny - startCol + 1;
          moves.push({ x: userX, y: userY, isJump: false, row: nx, col: ny });
        }
      }
    }
  }

  // 跳跃移动
  checkersGetJumps(pos.row, pos.col, piece, moves, {});

  return moves;
}

// 获取跳跃移动
function checkersGetJumps(row, col, piece, moves, visited) {
  var isOddRow = row % 2 === 1;
  
  var dirs;
  if (isOddRow) {
    dirs = [
      [0, 1], [0, -1], [1, 0], [-1, 0], [-1, 0], [1, 1]
    ];
  } else {
    dirs = [
      [0, 1], [0, -1], [1, 0], [-1, 0], [-1, -1], [1, 1]
    ];
  }

  for (var d = 0; d < 6; d++) {
    var nx = row + dirs[d][0];
    var ny = col + dirs[d][1];
    var jx = row + dirs[d][0] * 2;
    var jy = col + dirs[d][1] * 2;
    
    if (jx >= 0 && jx < 17 && jy >= 0 && jy < 17) {
      var count = ROW_COUNTS[jx];
      var startCol = getRowStartCol(jx);
      if (jy >= startCol && jy < startCol + count) {
        if (state.board[nx][ny] !== 0 && state.board[nx][ny] !== piece && state.board[jx][jy] === 0) {
          var key = jx + ',' + jy;
          if (!visited[key]) {
            visited[key] = true;
            var userX = jx + 1;
            var userY = jy - startCol + 1;
            moves.push({ 
              x: userX, y: userY, 
              isJump: true, 
              jumpX: nx + 1, jumpY: ny - getRowStartCol(nx) + 1,
              row: jx, col: jy 
            });
            checkersGetJumps(jx, jy, piece, moves, visited);
          }
        }
      }
    }
  }
}

// 选中棋子
function checkersSelectPiece(x, y) {
  var pos = userToBoard(x, y);
  var piece = state.board[pos.row][pos.col];
  if (piece === 0) return;

  if (piece !== state.currentPlayer) return;

  state.selectedPiece = { x: x, y: y, row: pos.row, col: pos.col };
  state.validMoves = checkersGetValidMoves(x, y);
}

// 移动棋子
function checkersMovePiece(x, y) {
  if (!state.selectedPiece) return false;

  var isValid = false;
  var moveData = null;
  for (var i = 0; i < state.validMoves.length; i++) {
    if (state.validMoves[i].x === x && state.validMoves[i].y === y) {
      isValid = true;
      moveData = state.validMoves[i];
      break;
    }
  }

  if (!isValid) return false;

  var sx = state.selectedPiece.row;
  var sy = state.selectedPiece.col;
  var piece = state.board[sx][sy];

  // 记录移动
  state.moveHistory.push({
    from: { x: state.selectedPiece.x, y: state.selectedPiece.y, row: sx, col: sy },
    to: { x: x, y: y, row: moveData.row, col: moveData.col },
    piece: piece,
    isJump: moveData.isJump,
    jumpX: moveData.jumpX,
    jumpY: moveData.jumpY,
    player: state.currentPlayer
  });

  // 执行移动
  state.board[moveData.row][moveData.col] = piece;
  state.board[sx][sy] = 0;

  // 如果是跳跃，移除被跳过的棋子
  if (moveData.isJump) {
    var jumpPos = userToBoard(moveData.jumpX, moveData.jumpY);
    state.board[jumpPos.row][jumpPos.col] = 0;
  }

  state.lastMove = { 
    from: { x: state.selectedPiece.x, y: state.selectedPiece.y }, 
    to: { x: x, y: y } 
  };

  // 切换玩家
  state.currentPlayer = state.currentPlayer % state.settings.checkersMode.players + 1;
  state.isMyTurn = true;
  state.selectedPiece = null;
  state.validMoves = [];

  return true;
}

// AI落子
function checkersAiMove() {
  if (state.gameOver) return;

  var s = state.settings.checkersMode;
  var myColor = state.currentPlayer;

  var validPieces = [];
  for (var row = 0; row < 17; row++) {
    var count = ROW_COUNTS[row];
    var startCol = getRowStartCol(row);
    for (var col = startCol; col < startCol + count; col++) {
      var piece = state.board[row][col];
      if (piece === myColor) {
        var userX = row + 1;
        var userY = col - startCol + 1;
        var moves = checkersGetValidMoves(userX, userY);
        if (moves.length > 0) {
          validPieces.push({ x: userX, y: userY, moves: moves });
        }
      }
    }
  }

  if (validPieces.length === 0) {
    state.currentPlayer = state.currentPlayer % s.players + 1;
    return;
  }

  var piece = validPieces[Math.floor(Math.random() * validPieces.length)];
  var move = piece.moves[Math.floor(Math.random() * piece.moves.length)];

  state.selectedPiece = { x: piece.x, y: piece.y };
  checkersMovePiece(move.x, move.y);
}

module.exports = {
  initCheckersGame: initCheckersGame,
  checkersSelectPiece: checkersSelectPiece,
  checkersMovePiece: checkersMovePiece,
  checkersGetValidMoves: checkersGetValidMoves,
  checkersAiMove: checkersAiMove,
  isValidCheckersPos: isValidCheckersPos,
  userToBoard: userToBoard
};
