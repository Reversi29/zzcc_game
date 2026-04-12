/**
 * 棋棋 - 五子棋模块
 * 包含五子棋游戏逻辑和AI
 */

var state = require('./config.js');
var utils = require('./utils.js');
var go = null; // 延迟加载避免循环依赖

// 初始化五子棋游戏
function initGame() {
  var menu = require('./menu.js');
  menu.initBoardLayout();

  state.board = [];
  for (var y = 0; y < state.CONFIG.BOARD_SIZE; y++) {
    state.board[y] = [];
    for (var x = 0; x < state.CONFIG.BOARD_SIZE; x++) {
      state.board[y][x] = 0;
    }
  }

  var s = state.settings.normalMode;
  if (s.playerColor === 0) {
    s.playerColor = Math.random() < 0.5 ? 1 : 2;
  }

  state.currentPlayer = 1;
  var myColor = s.playerColor;
  state.isMyTurn = s.vsMode === 'human' ? true : myColor === 1;
  state.gameOver = false;
  state.winner = null;
  state.lastMove = null;
  state.moveHistory = [];
  state.aiMoveToken++;
  state.previewX = -1;
  state.previewY = -1;
  state.canPlace = false;
  state.playerTime = s.countdown ? 15 : 9999;
  state.aiTime = s.countdown ? 15 : 9999;
  state.playerTimeoutCount = 0;
  state.aiTimeoutCount = 0;
  state.chatMessages = [];

  if (state.timerInterval) clearInterval(state.timerInterval);

  if (s.countdown) {
    state.timerInterval = setInterval(function() {
      if (state.gameOver) {
        clearInterval(state.timerInterval);
        return;
      }

      if (s.vsMode === 'human') {
        if (state.currentPlayer === 1) {
          state.playerTime--;
          if (state.playerTime <= 0) {
            state.playerTime = 15;
            state.playerTimeoutCount++;
            if (state.playerTimeoutCount >= 3) {
              utils.endGame(2);
            } else {
              state.chatMessages.push('黑方超时(' + state.playerTimeoutCount + '/3)');
              state.previewX = -1;
              state.previewY = -1;
              state.canPlace = false;
              state.currentPlayer = 2;
              state.aiTime = 15;
            }
          }
        } else {
          state.aiTime--;
          if (state.aiTime <= 0) {
            state.aiTime = 15;
            state.aiTimeoutCount++;
            if (state.aiTimeoutCount >= 3) {
              utils.endGame(1);
            } else {
              state.chatMessages.push('白方超时(' + state.aiTimeoutCount + '/3)');
              state.previewX = -1;
              state.previewY = -1;
              state.canPlace = false;
              state.currentPlayer = 1;
              state.playerTime = 15;
            }
          }
        }
      } else {
        if (state.isMyTurn) {
          state.playerTime--;
          if (state.playerTime <= 0) {
            state.playerTime = 15;
            state.playerTimeoutCount++;
            if (state.playerTimeoutCount >= 3) {
              utils.endGame(myColor === 1 ? 2 : 1);
            } else {
              onTimeoutSkip();
            }
          }
        } else {
          state.aiTime--;
          if (state.aiTime <= 0) {
            state.aiTime = 15;
            state.aiTimeoutCount++;
            if (state.aiTimeoutCount >= 3) {
              utils.endGame(myColor);
            } else {
              aiMove();
            }
          }
        }
      }
    }, 1000);
  }

  if (s.vsMode === 'ai' && !state.isMyTurn) {
    utils.scheduleAiMove();
  }
}

// 超时跳过
function onTimeoutSkip() {
  state.currentPlayer = state.settings.normalMode.playerColor === 1 ? 2 : 1;
  state.isMyTurn = false;
  state.playerTime = state.settings.normalMode.countdown ? 15 : 9999;
  state.aiTime = state.settings.normalMode.countdown ? 15 : 9999;
  state.chatMessages.push('你停了一手(' + state.playerTimeoutCount + '/3)');
  utils.scheduleAiMove();
}

// 落子
function placePiece(x, y, player) {
  state.board[y][x] = player;
  state.lastMove = { x: x, y: y };
  state.moveHistory.push({ x: x, y: y, player: player });
}

// 确认落子
function confirmPlace() {
  if (!state.canPlace || state.previewX < 0 || state.previewY < 0) return;

  if (state.gameType === 'go') {
    if (!go) go = require('./go.js');
    go.goConfirmPlace();
    return;
  }

  var s = state.settings.normalMode;
  var myColor = s.vsMode === 'human' ? state.currentPlayer : s.playerColor;

  placePiece(state.previewX, state.previewY, myColor);
  state.previewX = -1;
  state.previewY = -1;
  state.canPlace = false;

  if (checkWin(state.lastMove.x, state.lastMove.y, myColor)) {
    utils.endGame(myColor);
    return;
  }

  if (s.vsMode === 'human') {
    state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
    state.isMyTurn = true;
    if (s.countdown) {
      if (state.currentPlayer === 1) {
        state.playerTime = 15;
      } else {
        state.aiTime = 15;
      }
    }
  } else {
    state.currentPlayer = s.playerColor === 1 ? 2 : 1;
    state.isMyTurn = false;
    state.playerTime = s.countdown ? 15 : 9999;
    state.aiTime = s.countdown ? 15 : 9999;
    utils.scheduleAiMove();
  }
}

// 检查获胜
function checkWin(x, y, player) {
  var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];

  for (var d = 0; d < dirs.length; d++) {
    var count = 1;

    for (var i = 1; i < 5; i++) {
      var nx = x + dirs[d][0] * i;
      var ny = y + dirs[d][1] * i;
      if (nx < 0 || nx >= state.CONFIG.BOARD_SIZE ||
          ny < 0 || ny >= state.CONFIG.BOARD_SIZE ||
          state.board[ny][nx] !== player) break;
      count++;
    }

    for (var i = 1; i < 5; i++) {
      var nx = x - dirs[d][0] * i;
      var ny = y - dirs[d][1] * i;
      if (nx < 0 || nx >= state.CONFIG.BOARD_SIZE ||
          ny < 0 || ny >= state.CONFIG.BOARD_SIZE ||
          state.board[ny][nx] !== player) break;
      count++;
    }

    if (count >= 5) return true;
  }

  return false;
}

// AI落子
function aiMove() {
  if (state.gameOver) return;

  var myColor = state.settings.normalMode.playerColor;
  var aiColor = myColor === 1 ? 2 : 1;
  var move = findBestMove(aiColor);

  if (move) {
    placePiece(move.x, move.y, aiColor);
    if (checkWin(move.x, move.y, aiColor)) {
      utils.endGame(aiColor);
      return;
    }
    state.currentPlayer = myColor;
    state.isMyTurn = true;
    state.playerTime = state.settings.normalMode.countdown ? 15 : 9999;
    state.aiTime = state.settings.normalMode.countdown ? 15 : 9999;
  }
}

// 寻找最佳落子
function findBestMove(aiColor) {
  var maxScore = -1;
  var candidates = [];

  for (var y = 0; y < state.CONFIG.BOARD_SIZE; y++) {
    for (var x = 0; x < state.CONFIG.BOARD_SIZE; x++) {
      if (state.board[y][x] === 0) {
        var score = evalPoint(x, y, aiColor);
        if (score > maxScore) {
          maxScore = score;
          candidates = [{ x: x, y: y }];
        } else if (score === maxScore) {
          candidates.push({ x: x, y: y });
        }
      }
    }
  }

  if (!candidates.length) {
    var c = Math.floor(state.CONFIG.BOARD_SIZE / 2);
    return { x: c, y: c };
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

// 评估落子分数
function evalPoint(x, y, aiColor) {
  var score = 0;
  var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  var playerColor = state.settings.normalMode.playerColor;

  for (var d = 0; d < dirs.length; d++) {
    score += evalLine(x, y, dirs[d][0], dirs[d][1], aiColor) * 1.2;
    score += evalLine(x, y, dirs[d][0], dirs[d][1], playerColor);
  }

  var c = Math.floor(state.CONFIG.BOARD_SIZE / 2);
  score += (state.CONFIG.BOARD_SIZE * 2 - Math.abs(x - c) - Math.abs(y - c)) * 0.3;

  return score;
}

// 评估线段分数
function evalLine(x, y, dx, dy, player) {
  var count = 0;
  var empty = 0;
  var blocked = 0;

  for (var i = 1; i <= 4; i++) {
    var nx = x + dx * i;
    var ny = y + dy * i;
    if (nx < 0 || nx >= state.CONFIG.BOARD_SIZE ||
        ny < 0 || ny >= state.CONFIG.BOARD_SIZE) {
      blocked++;
      break;
    }
    if (state.board[ny][nx] === player) {
      count++;
    } else if (state.board[ny][nx] === 0) {
      empty++;
      break;
    } else {
      blocked++;
      break;
    }
  }

  for (var i = 1; i <= 4; i++) {
    var nx = x - dx * i;
    var ny = y - dy * i;
    if (nx < 0 || nx >= state.CONFIG.BOARD_SIZE ||
        ny < 0 || ny >= state.CONFIG.BOARD_SIZE) {
      blocked++;
      break;
    }
    if (state.board[ny][nx] === player) {
      count++;
    } else if (state.board[ny][nx] === 0) {
      empty++;
      break;
    } else {
      blocked++;
      break;
    }
  }

  if (blocked === 2) return 0;
  if (count >= 5) return 1000000;
  if (count === 4) return empty === 2 ? 100000 : 10000;
  if (count === 3) return empty === 2 ? 5000 : 500;
  if (count === 2) return empty === 2 ? 200 : 50;
  if (count === 1 && empty === 2) return 10;

  return 0;
}

// 悔棋
function onUndo() {
  if (state.gameType === 'go') {
    if (!go) go = require('./go.js');
    go.goUndo();
    return;
  }

  var s = state.settings.normalMode;

  if (s.vsMode === 'human') {
    if (state.moveHistory.length === 0) return;
    var step = state.moveHistory.pop();
    state.board[step.y][step.x] = 0;
    state.lastMove = state.moveHistory.length > 0 ? state.moveHistory[state.moveHistory.length - 1] : null;
    state.currentPlayer = step.player;
    state.previewX = -1;
    state.previewY = -1;
    state.canPlace = false;
  } else {
    var myColor = s.playerColor;
    if (state.moveHistory.length === 0) return;

    var last = state.moveHistory[state.moveHistory.length - 1];
    if (last.player !== myColor) {
      if (state.moveHistory.length < 2) return;
      var aiStep = state.moveHistory.pop();
      state.board[aiStep.y][aiStep.x] = 0;
      var myStep = state.moveHistory.pop();
      state.board[myStep.y][myStep.x] = 0;
    } else {
      var myStep = state.moveHistory.pop();
      state.board[myStep.y][myStep.x] = 0;
    }

    state.lastMove = state.moveHistory.length > 0 ? state.moveHistory[state.moveHistory.length - 1] : null;
    state.previewX = -1;
    state.previewY = -1;
    state.canPlace = false;
    state.currentPlayer = myColor;
    state.isMyTurn = true;
  }
}

// 认输
function onResign() {
  if (state.gameType === 'go') {
    if (!go) go = require('./go.js');
    var goSettings = state.settings.goMode;
    if (goSettings.vsMode === 'human') {
      // 双人模式：当前落子方认输，对方胜
      utils.endGame(state.currentPlayer === 1 ? 2 : 1);
    } else {
      // 人机模式：玩家认输，AI胜
      utils.endGame(goSettings.playerColor === 1 ? 2 : 1);
    }
    return;
  }

  var s = state.settings.normalMode;
  if (s.vsMode === 'human') {
    utils.endGame(state.currentPlayer === 1 ? 2 : 1);
  } else {
    utils.endGame(s.playerColor === 1 ? 2 : 1);
  }
}

// 求和
function onDraw() {
  // 暂未实现
}

module.exports = {
  initGame: initGame,
  confirmPlace: confirmPlace,
  placePiece: placePiece,
  checkWin: checkWin,
  aiMove: aiMove,
  findBestMove: findBestMove,
  evalPoint: evalPoint,
  evalLine: evalLine,
  onUndo: onUndo,
  onResign: onResign,
  onDraw: onDraw
};
