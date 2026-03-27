/**
 * 棋棋 - 工具函数
 */

var state = require('./config.js');
var menu = null; // 延迟加载避免循环依赖

// 更新时间显示
function updateTime() {
  var d = new Date();
  state.currentTime = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

// 数字补零
function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

// 圆角矩形
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

// 结束游戏
function endGame(w) {
  state.gameOver = true;
  state.winner = w;
  if (state.timerInterval) clearInterval(state.timerInterval);
}

// 返回菜单
function backToMenu() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.aiMoveToken++;
  state.gameState = 'menu';
  state.currentScreen = '';
  state.previewX = -1;
  state.previewY = -1;
  state.canPlace = false;
  state.hoveredBtn = null;
  // 延迟加载菜单模块
  if (!menu) menu = require('./menu.js');
  menu.initBoardLayout();
  menu.initMenu();
}

// 调度AI落子
function scheduleAiMove() {
  var token = state.aiMoveToken;
  setTimeout(function() {
    if (token === state.aiMoveToken) {
      if (state.gameType === 'go') {
        var go = require('./go.js');
        go.goAiMove();
      } else {
        var gomoku = require('./gomoku.js');
        gomoku.aiMove();
      }
    }
  }, state.CONFIG.AI_DELAY);
}

module.exports = {
  updateTime: updateTime,
  pad2: pad2,
  roundRect: roundRect,
  endGame: endGame,
  backToMenu: backToMenu,
  scheduleAiMove: scheduleAiMove
};
