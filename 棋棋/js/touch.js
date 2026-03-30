/**
 * 棋棋 - 触摸处理模块
 * 处理所有触摸事件
 */

var state = require('./config.js');
var menu = require('./menu.js');
var gomoku = require('./gomoku.js');
var go = require('./go.js');
var ui = require('./ui.js');

// 触摸开始
function handleTouch(e) {
  var touch = e.touches ? e.touches[0] : e;
  var x = touch.clientX;
  var y = touch.clientY;

  if (state.gameState === 'menu') {
    handleMenuTouch(x, y);
  } else if (state.gameState === 'game') {
    handleGameTouch(x, y);
  }
}

// 触摸移动
function handleTouchMove(e) {
  var touch = e.touches ? e.touches[0] : e;
  var x = touch.clientX;
  var y = touch.clientY;

  state.hoveredBtn = getHoveredBtn(x, y);

  if (state.gameState === 'game') {
    handleGameHover(x, y);
  }
}

// 触摸结束
function handleTouchEnd(e) {
  state.hoveredBtn = null;
}

// 获取悬停按钮
function getHoveredBtn(x, y) {
  for (var i = 0; i < state.menuButtons.length; i++) {
    var b = state.menuButtons[i];
    if (!b.w || !b.h) continue;
    if (x >= b.x - b.w / 2 && x <= b.x + b.w / 2 &&
        y >= b.y - b.h / 2 && y <= b.y + b.h / 2) {
      return b;
    }
  }
  return null;
}

// 处理菜单触摸
function handleMenuTouch(x, y) {
  for (var i = 0; i < state.menuButtons.length; i++) {
    var b = state.menuButtons[i];
    if (!b.w) continue;
    if (x >= b.x - b.w / 2 && x <= b.x + b.w / 2 &&
        y >= b.y - b.h / 2 && y <= b.y + b.h / 2) {
      onMenuBtn(b.id, b);
      break;
    }
  }
}

// 菜单按钮处理
function onMenuBtn(id, btn) {
  var s = state.settings.normalMode;
  var g = state.settings.general;
  var goSettings = state.settings.goMode;

  if (id === 'mode_normal') {
    state.gameType = 'gomoku';
    menu.initCreateGame();
  } else if (id === 'mode_go') {
    state.gameType = 'go';
    menu.initCreateGo();
  } else if (id === 'mode_xiangqi') {
    state.gameType = 'xiangqi';
    menu.initCreateXiangqi();
  } else if (id === 'mode_checkers') {
    state.gameType = 'checkers';
    menu.initCreateCheckers();
  } else if (id === 'mode_junqi') {
    state.gameType = 'junqi';
    menu.initCreateJunqi();
  } else if (id === 'mode_othello') {
    state.gameType = 'othello';
    menu.initCreateOthello();
  } else if (id === 'settings') {
    menu.initSettings();
  } else if (id === 'back') {
    menu.initMenu();
  } else if (id === 'start_game') {
    state.gameState = 'game';
    gomoku.initGame();
  } else if (id === 'start_go') {
    state.gameState = 'game';
    go.initGoGame();
  } else if (id === 'start_xiangqi') {
    state.gameState = 'game';
    var xiangqi = require('./xiangqi.js');
    xiangqi.initXiangqiGame();
  } else if (id === 'start_checkers') {
    state.gameState = 'game';
    var checkers = require('./checkers.js');
    checkers.initCheckersGame();
  } else if (id === 'start_junqi') {
    state.gameState = 'game';
    var junqi = require('./junqi.js');
    junqi.initJunqiGame();
  } else if (id === 'start_othello') {
    state.gameState = 'game';
    var othello = require('./othello.js');
    othello.initOthelloGame();
  } else if (btn.type === 'vsmode') {
    s.vsMode = btn.vsMode;
    menu.initCreateGame();
  } else if (btn.type === 'govsmode') {
    goSettings.vsMode = btn.vsMode;
    menu.initCreateGo();
  } else if (btn.type === 'gocolor') {
    if (goSettings.vsMode === 'ai') {
      goSettings.playerColor = btn.color;
      menu.initCreateGo();
    }
  } else if (btn.type === 'godiff') {
    if (goSettings.vsMode === 'ai') {
      goSettings.difficulty = btn.diff;
      menu.initCreateGo();
    }
  } else if (btn.type === 'xiangqi_vsmode') {
    var xiangqiSettings = state.settings.xiangqiMode;
    xiangqiSettings.vsMode = btn.vsMode;
    menu.initCreateXiangqi();
  } else if (btn.type === 'xiangqi_color') {
    var xiangqiSettings = state.settings.xiangqiMode;
    if (xiangqiSettings.vsMode === 'ai') {
      xiangqiSettings.playerColor = btn.color;
      menu.initCreateXiangqi();
    }
  } else if (btn.type === 'xiangqi_diff') {
    var xiangqiSettings = state.settings.xiangqiMode;
    if (xiangqiSettings.vsMode === 'ai') {
      xiangqiSettings.difficulty = btn.diff;
      menu.initCreateXiangqi();
    }
  } else if (btn.type === 'checkers_players') {
    var checkersSettings = state.settings.checkersMode;
    checkersSettings.players = btn.players;
    checkersSettings.aiCount = Math.min(checkersSettings.aiCount, btn.players - 1);
    menu.initCreateCheckers();
  } else if (btn.type === 'checkers_ai') {
    var checkersSettings = state.settings.checkersMode;
    checkersSettings.aiCount = btn.aiCount;
    menu.initCreateCheckers();
  } else if (btn.type === 'checkers_diff') {
    var checkersSettings = state.settings.checkersMode;
    checkersSettings.difficulty = btn.diff;
    menu.initCreateCheckers();
  } else if (btn.type === 'junqi_vsmode') {
    var junqiSettings = state.settings.junqiMode;
    junqiSettings.vsMode = btn.vsMode;
    menu.initCreateJunqi();
  } else if (btn.type === 'junqi_color') {
    var junqiSettings = state.settings.junqiMode;
    if (junqiSettings.vsMode === 'ai') {
      junqiSettings.playerColor = btn.color;
      menu.initCreateJunqi();
    }
  } else if (btn.type === 'junqi_diff') {
    var junqiSettings = state.settings.junqiMode;
    if (junqiSettings.vsMode === 'ai') {
      junqiSettings.difficulty = btn.diff;
      menu.initCreateJunqi();
    }
  } else if (btn.type === 'othello_vsmode') {
    var othelloSettings = state.settings.othelloMode;
    othelloSettings.vsMode = btn.vsMode;
    menu.initCreateOthello();
  } else if (btn.type === 'othello_color') {
    var othelloSettings = state.settings.othelloMode;
    if (othelloSettings.vsMode === 'ai') {
      othelloSettings.playerColor = btn.color;
      menu.initCreateOthello();
    }
  } else if (btn.type === 'othello_diff') {
    var othelloSettings = state.settings.othelloMode;
    if (othelloSettings.vsMode === 'ai') {
      othelloSettings.difficulty = btn.diff;
      menu.initCreateOthello();
    }
  } else if (btn.type === 'gosize') {
    goSettings.boardSize = btn.size;
    menu.initCreateGo();
  } else if (btn.type === 'komi') {
    goSettings.komi = btn.komi;
    menu.initCreateGo();
  } else if (btn.type === 'diff') {
    if (s.vsMode === 'ai') {
      s.difficulty = btn.diff;
      menu.initCreateGame();
    }
  } else if (btn.type === 'color') {
    s.playerColor = btn.color;
    menu.initCreateGame();
  } else if (id === 'timer_on') {
    s.countdown = true;
    menu.initCreateGame();
  } else if (id === 'timer_off') {
    s.countdown = false;
    menu.initCreateGame();
  } else if (id === 'sound_on') {
    g.sound = true;
    menu.initSettings();
  } else if (id === 'sound_off') {
    g.sound = false;
    menu.initSettings();
  } else if (id === 'music_on') {
    g.music = true;
    menu.initSettings();
  } else if (id === 'music_off') {
    g.music = false;
    menu.initSettings();
  } else if (id === 'vibe_on') {
    g.vibration = true;
    menu.initSettings();
  } else if (id === 'vibe_off') {
    g.vibration = false;
    menu.initSettings();
  }
}

// 游戏悬停处理
function handleGameHover(x, y) {
  var chatY = state.H - state.LAYOUT.chatH;
  var actionY = chatY - state.LAYOUT.actionH;

  state.hoveredBtn = null;

  if (y >= actionY && y < chatY) {
    var cx = state.W / 2;
    var confirmX = cx - 80;
    var confirmY = actionY + 5;
    var confirmW = 160;
    var confirmH = 50;

    if (x >= confirmX && x <= confirmX + confirmW &&
        y >= confirmY && y <= confirmY + confirmH) {
      state.hoveredBtn = { id: 'confirm' };
      return;
    }

    var btnW = 80;
    var btnH = 36;
    var btnGap = 12;
    var totalW = btnW * 3 + btnGap * 2;
    var startX = cx - totalW / 2;
    var btnY = actionY + 60;

    for (var i = 0; i < 3; i++) {
      var bx = startX + i * (btnW + btnGap);
      if (x >= bx && x <= bx + btnW && y >= btnY && y <= btnY + btnH) {
        state.hoveredBtn = { id: ['resign', 'pass', 'undo'][i] };
        return;
      }
    }
  }
}

// 游戏触摸处理
function handleGameTouch(x, y) {
  var chatY = state.H - state.LAYOUT.chatH;
  var actionY = chatY - state.LAYOUT.actionH;

  if (y >= chatY) return;

  if (state.gameOver) {
    var btnY = state.H * 0.52;
    if (x >= state.W / 2 - 75 && x <= state.W / 2 + 75 &&
        y >= btnY && y <= btnY + 48) {
      if (state.gameType === 'go') {
        go.initGoGame();
      } else if (state.gameType === 'xiangqi') {
        var xiangqi = require('./xiangqi.js');
        xiangqi.initXiangqiGame();
      } else {
        gomoku.initGame();
      }
      return;
    }
    if (x >= state.W / 2 - 55 && x <= state.W / 2 + 55 &&
        y >= btnY + 58 && y <= btnY + 98) {
      var utils = require('./utils.js');
      utils.backToMenu();
    }
    return;
  }

  if (y >= actionY) {
    handleActionTouch(x, y, actionY);
    return;
  }

  if (state.gameType === 'go') {
    handleGoTouch(x, y);
    return;
  }

  if (state.gameType === 'xiangqi') {
    handleXiangqiTouch(x, y);
    return;
  }

  if (state.gameType === 'checkers') {
    handleCheckersTouch(x, y);
    return;
  }

  if (state.gameType === 'junqi') {
    handleJunqiTouch(x, y);
    return;
  }

  if (state.gameType === 'othello') {
    handleOthelloTouch(x, y);
    return;
  }

  var s = state.settings.normalMode;
  if (s.vsMode === 'ai' && state.currentPlayer !== s.playerColor) return;

  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var bx = x - bL;
  var by = y - bT;
  var bs2 = state.CONFIG.CELL_SIZE * (state.CONFIG.BOARD_SIZE - 1);

  if (bx < -state.CONFIG.PIECE_RADIUS || by < -state.CONFIG.PIECE_RADIUS ||
      bx > bs2 + state.CONFIG.PIECE_RADIUS || by > bs2 + state.CONFIG.PIECE_RADIUS) {
    return;
  }

  var gx = Math.round(bx / state.CONFIG.CELL_SIZE);
  var gy = Math.round(by / state.CONFIG.CELL_SIZE);

  if (gx < 0 || gx >= state.CONFIG.BOARD_SIZE ||
      gy < 0 || gy >= state.CONFIG.BOARD_SIZE) return;

  if (state.board[gy][gx] !== 0) return;

  state.previewX = gx;
  state.previewY = gy;
  state.canPlace = true;
}

// 围棋触摸处理
function handleGoTouch(x, y) {
  var goSettings = state.settings.goMode;
  var myColor = goSettings.playerColor === 1 ? 2 : 1;

  if (goSettings.vsMode === 'ai' && state.currentPlayer === myColor) return;

  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var bx = x - bL;
  var by = y - bT;
  var bs2 = state.CONFIG.CELL_SIZE * (state.CONFIG.BOARD_SIZE - 1);

  if (bx < -state.CONFIG.CELL_SIZE / 2 || by < -state.CONFIG.CELL_SIZE / 2 ||
      bx > bs2 + state.CONFIG.CELL_SIZE / 2 || by > bs2 + state.CONFIG.CELL_SIZE / 2) {
    return;
  }

  var gx = Math.round(bx / state.CONFIG.CELL_SIZE);
  var gy = Math.round(by / state.CONFIG.CELL_SIZE);

  if (gx < 0 || gx >= state.CONFIG.BOARD_SIZE ||
      gy < 0 || gy >= state.CONFIG.BOARD_SIZE) return;

  if (state.board[gy][gx] !== 0) return;

  state.previewX = gx;
  state.previewY = gy;
  state.canPlace = true;
}

// 操作区域触摸处理
function handleActionTouch(x, y, actionY) {
  var cx = state.W / 2;
  var btnW = 140;
  var btnH = 38;
  var btnX = cx - btnW / 2;
  var btnY = actionY + 2;
  var confirmY = btnY;

  // 象棋、跳棋、军棋、黑白棋操作按钮处理
  if (state.gameType === 'xiangqi' || state.gameType === 'checkers' || state.gameType === 'junqi' || state.gameType === 'othello') {
    var abW = 80, abH = 36, abGap = 12;
    var totalW = abW * 3 + abGap * 2;
    var abStartX = cx - totalW / 2;
    var abY = actionY + 6;
    var btnIds = ['resign', 'undo', 'draw'];

    for (var i = 0; i < 3; i++) {
      var bx = abStartX + i * (abW + abGap);
      if (y >= abY && y <= abY + abH && x >= bx && x <= bx + abW) {
        var id = btnIds[i];
        if (id === 'resign') {
          // 认输：当前玩家认输，对手赢
          var utils = require('./utils.js');
          utils.endGame(state.currentPlayer === 1 ? 2 : 1);
        } else if (id === 'undo') {
          // 悔棋：回到上一步
          if (state.moveHistory.length > 0) {
            var lastMove = state.moveHistory.pop();
            state.board[lastMove.from.y][lastMove.from.x] = lastMove.piece;
            state.board[lastMove.to.y][lastMove.to.x] = lastMove.captured;
            state.currentPlayer = lastMove.player;
            state.isMyTurn = true;
            state.selectedPiece = null;
            state.validMoves = [];
          }
        } else if (id === 'draw') {
          // 求和：暂未实现
          state.chatMessages.push('求和功能暂未实现');
        }
        return;
      }
    }
    return;
  }

  if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
    if (state.canPlace) gomoku.confirmPlace();
    return;
  }

  if (state.gameType === 'go') {
    var ebW = 58, ebH = 26, ebGap = 4;
    var ebY = confirmY + btnH + 6;
    var totalEbW = ebW * 3 + ebGap * 2;
    var ebStartX = cx - totalEbW / 2;

    var elabels = ['申请点目', state.goShowTerritory ? '关闭判断' : '局势判断', '悔棋'];
    var ebtnIds = ['eval', 'predict', 'undo'];

    if (state.goScoreRequestActive) {
      elabels = ['确认判负', '取消', ''];
      ebtnIds = ['confirmEval', 'cancelEval', ''];
    }

    for (var i = 0; i < 3; i++) {
      var bx = ebStartX + i * (ebW + ebGap);
      if (y >= ebY && y <= ebY + ebH && x >= bx && x <= bx + ebW && ebtnIds[i]) {
        var id = ebtnIds[i];
        if (id === 'eval') go.goEvalRequest(1);
        else if (id === 'predict') go.goEvalRequest(2);
        else if (id === 'undo') go.goEvalRequest(3);
        else if (id === 'confirmEval') go.goEvalRequest(4);
        else if (id === 'cancelEval') go.goEvalRequest(3);
        return;
      }
    }

    var rbW = 58, rbH = 26, rbGap = 4;
    var rbY = ebY + ebH + 3;
    var rlabels = ['认输', '虚手'];
    var rbtnIds = ['resign', 'pass'];
    var totalRbW = rbW * 2 + rbGap;
    var rbStartX = cx - totalRbW / 2;

    for (var i = 0; i < 2; i++) {
      var bx = rbStartX + i * (rbW + rbGap);
      if (y >= rbY && y <= rbY + rbH && x >= bx && x <= bx + rbW) {
        if (rbtnIds[i] === 'resign') gomoku.onResign();
        else go.onGoPass();
        return;
      }
    }
  } else {
    var abW = 80, abH = 36, abGap = 12;
    var abY = confirmY + btnH + 6;
    var totalW = abW * 3 + abGap * 2;
    var abStartX = cx - totalW / 2;
    var labels = ['认输', '悔棋', '求和'];
    var btnIds = ['resign', 'undo', 'draw'];

    for (var i = 0; i < 3; i++) {
      var bx = abStartX + i * (abW + abGap);
      if (x >= bx && x <= bx + abW && y >= abY && y <= abY + abH) {
        if (i === 0) gomoku.onResign();
        else if (i === 1) gomoku.onUndo();
        else gomoku.onDraw();
        return;
      }
    }
  }
}

// 象棋触摸处理
function handleXiangqiTouch(x, y) {
  var xiangqi = require('./xiangqi.js');
  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var cs = state.CONFIG.CELL_SIZE;

  // 计算点击的棋盘位置
  var bx = x - bL;
  var by = y - bT;

  // 检查是否在棋盘范围内
  if (bx < 0 || bx > cs * 8 || by < 0 || by > cs * 9) return;

  // 找到最近的交叉点
  var gx = Math.round(bx / cs);
  var gy = Math.round(by / cs);

  // 边界检查
  if (gx < 0 || gx >= 9 || gy < 0 || gy >= 10) return;

  // 检查是否点击了已选中棋子的有效移动点
  if (state.selectedPiece && state.validMoves.length > 0) {
    for (var i = 0; i < state.validMoves.length; i++) {
      if (state.validMoves[i].x === gx && state.validMoves[i].y === gy) {
        // 执行移动
        xiangqi.xiangqiMovePiece(gx, gy);
        return;
      }
    }
  }

  // 检查是否点击了棋子
  var piece = state.board[gy][gx];
  if (piece !== 0) {
    var color = Math.floor(piece / 10);
    // 只能选中当前玩家的棋子
    if (color === state.currentPlayer) {
      xiangqi.xiangqiSelectPiece(gx, gy);
    }
  }
}

// 跳棋触摸处理
// 坐标系：x=行(1-17), y=列(1-13)，从1开始
function handleCheckersTouch(x, y) {
  var checkers = require('./checkers.js');
  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var cs = state.CONFIG.CELL_SIZE;

  // 从屏幕坐标反推行号
  var by = y - bT;
  var row = Math.round(by / (cs * 0.866));
  
  if (row < 0 || row >= 17) return;

  // 根据行号计算列的范围
  var ROW_COUNTS = [1, 2, 3, 4, 13, 12, 11, 10, 9, 10, 11, 12, 13, 4, 3, 2, 1];
  var count = ROW_COUNTS[row];
  var startCol = Math.floor((13 - count) / 2);

  // 根据行号奇偶性调整x坐标计算
  var bx = x - bL;
  var offsetX = (row % 2) * cs / 2;
  var col = Math.round((bx - offsetX) / cs);

  // 检查是否在有效范围内
  if (col < startCol || col >= startCol + count) return;

  // 转换为用户坐标（从1开始）
  var userX = row + 1;
  var userY = col - startCol + 1;

  // 检查是否点击了已选中棋子的有效移动点
  if (state.selectedPiece && state.validMoves.length > 0) {
    for (var i = 0; i < state.validMoves.length; i++) {
      if (state.validMoves[i].x === userX && state.validMoves[i].y === userY) {
        checkers.checkersMovePiece(userX, userY);
        return;
      }
    }
  }

  // 检查是否点击了棋子
  var pos = checkers.userToBoard(userX, userY);
  var piece = state.board[pos.row][pos.col];
  if (piece !== 0) {
    if (piece === state.currentPlayer) {
      checkers.checkersSelectPiece(userX, userY);
    }
  }
}

// 军棋触摸处理
function handleJunqiTouch(x, y) {
  var junqi = require('./junqi.js');
  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var cs = state.CONFIG.CELL_SIZE;

  // 计算点击的棋盘位置
  var bx = x - bL;
  var by = y - bT;

  // 找到最近的交叉点
  var gx = Math.round(bx / cs);
  var gy = Math.round(by / cs);

  // 边界检查（5x12棋盘）
  if (gx < 0 || gx >= 5 || gy < 0 || gy >= 12) return;

  // 检查是否点击了已选中棋子的有效移动点
  if (state.selectedPiece && state.validMoves.length > 0) {
    for (var i = 0; i < state.validMoves.length; i++) {
      if (state.validMoves[i].x === gx && state.validMoves[i].y === gy) {
        junqi.junqiMovePiece(gx, gy);
        return;
      }
    }
  }

  // 检查是否点击了棋子
  var piece = state.board[gy][gx];
  if (piece !== 0) {
    var color = junqi.getPieceColor(piece);
    if (color === state.currentPlayer) {
      junqi.junqiSelectPiece(gx, gy);
    }
  }
}

// 黑白棋触摸处理
function handleOthelloTouch(x, y) {
  var othello = require('./othello.js');
  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var cs = state.CONFIG.CELL_SIZE;

  // 计算点击的棋盘位置
  var bx = x - bL;
  var by = y - bT;

  // 找到最近的交叉点
  var gx = Math.round(bx / cs);
  var gy = Math.round(by / cs);

  // 边界检查（8x8棋盘）
  if (gx < 0 || gx >= 8 || gy < 0 || gy >= 8) return;

  // 检查是否是有效落子
  var flipped = othello.isValidOthelloMove(gx, gy, state.currentPlayer);
  if (flipped) {
    othello.othelloPlace(gx, gy);
  }
}

module.exports = {
  handleTouch: handleTouch,
  handleTouchMove: handleTouchMove,
  handleTouchEnd: handleTouchEnd,
  handleMenuTouch: handleMenuTouch,
  handleGameTouch: handleGameTouch,
  handleActionTouch: handleActionTouch,
  handleXiangqiTouch: handleXiangqiTouch,
  handleCheckersTouch: handleCheckersTouch,
  handleJunqiTouch: handleJunqiTouch,
  handleOthelloTouch: handleOthelloTouch
};
