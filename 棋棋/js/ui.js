/**
 * 棋棋 - UI绘制模块
 * 包含所有绘制相关函数
 */

var state = require('./config.js');
var utils = require('./utils.js');

var roundRect = utils.roundRect;

// 绘制顶部栏
function drawTopBar() {
  var ctx = state.ctx;
  var W = state.W;
  ctx.fillStyle = 'rgba(26,26,46,0.95)';
  ctx.fillRect(0, 0, W, state.LAYOUT.topH);
  ctx.fillStyle = '#fff';
  ctx.font = (W * 0.035) + 'px Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.currentTime, W - 12, state.LAYOUT.topH / 2);
}

// 绘制主菜单
function drawMenu() {
  var ctx = state.ctx;
  var W = state.W;
  var H = state.H;

  var g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1a1a2e');
  g.addColorStop(1, '#16213e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  drawTopBar();

  ctx.fillStyle = '#e94560';
  ctx.font = 'bold ' + (W * 0.1) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('棋棋', W / 2, H * 0.15);

  ctx.fillStyle = '#9a8c98';
  ctx.font = (W * 0.03) + 'px Arial';
  ctx.fillText('Board Game', W / 2, H * 0.21);

  for (var i = 0; i < state.menuButtons.length; i++) {
    var isHov = state.hoveredBtn && state.hoveredBtn.id === state.menuButtons[i].id;
    drawDarkBtn(state.menuButtons[i], isHov);
  }
}

// 绘制设置页面
function drawSettings() {
  var ctx = state.ctx;
  var W = state.W;
  var H = state.H;

  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, W, H);
  drawTopBar();

  ctx.fillStyle = '#333';
  ctx.font = 'bold ' + (W * 0.06) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('设置', W / 2, state.LAYOUT.topH + 30);

  for (var i = 0; i < state.menuButtons.length; i++) {
    var b = state.menuButtons[i];
    var isHov = state.hoveredBtn && state.hoveredBtn.id === b.id;

    if (b.type === 'label') {
      ctx.fillStyle = '#666';
      ctx.font = (W * 0.04) + 'px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, b.x, b.y);
    } else if (b.type === 'toggle') {
      drawToggleBtn(b, isHov);
    } else if (b.type === 'btn') {
      drawSmallBtn(b, isHov);
    }
  }
}

// 绘制创建对局页面
function drawCreateGame() {
  var ctx = state.ctx;
  var W = state.W;
  var H = state.H;

  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, W, H);
  drawTopBar();

  ctx.fillStyle = '#333';
  ctx.font = 'bold ' + (W * 0.06) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('创建对局', W / 2, state.LAYOUT.topH + 30);

  for (var i = 0; i < state.menuButtons.length; i++) {
    var b = state.menuButtons[i];
    var isHov = state.hoveredBtn && state.hoveredBtn.id === b.id;

    if (b.type === 'label') {
      ctx.fillStyle = b.disabled ? '#bbb' : '#666';
      ctx.font = (W * 0.04) + 'px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, b.x, b.y);
    } else if (b.type === 'vsmode') {
      drawOptionBtn(b, state.settings.normalMode.vsMode === b.vsMode, isHov, false);
    } else if (b.type === 'diff') {
      drawOptionBtn(b, state.settings.normalMode.difficulty === b.diff, isHov, b.disabled);
    } else if (b.type === 'color') {
      drawOptionBtn(b, state.settings.normalMode.playerColor === b.color, isHov, b.disabled);
    } else if (b.type === 'toggle') {
      drawToggleBtn(b, isHov);
    } else if (b.type === 'btn') {
      drawSmallBtn(b, isHov);
    } else if (b.type === 'btn_large') {
      drawLargeBtn(b, isHov);
    }
  }
}

// 绘制创建围棋对局页面
function drawCreateGo() {
  var ctx = state.ctx;
  var W = state.W;
  var H = state.H;
  var go = state.settings.goMode;

  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, W, H);
  drawTopBar();

  ctx.fillStyle = '#333';
  ctx.font = 'bold ' + (W * 0.06) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('围棋对局', W / 2, state.LAYOUT.topH + 30);

  for (var i = 0; i < state.menuButtons.length; i++) {
    var b = state.menuButtons[i];
    var isHov = state.hoveredBtn && state.hoveredBtn.id === b.id;

    if (b.type === 'label') {
      ctx.fillStyle = b.disabled ? '#bbb' : '#666';
      ctx.font = (W * 0.04) + 'px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, b.x, b.y);
    } else if (b.type === 'govsmode') {
      drawOptionBtn(b, go.vsMode === b.vsMode, isHov, false);
    } else if (b.type === 'godiff') {
      drawOptionBtn(b, go.difficulty === b.diff, isHov, b.disabled);
    } else if (b.type === 'gocolor') {
      drawOptionBtn(b, go.playerColor === b.color, isHov, b.disabled);
    } else if (b.type === 'gosize') {
      drawOptionBtn(b, go.boardSize === b.size, isHov, false);
    } else if (b.type === 'komi') {
      drawOptionBtn(b, go.komi === b.komi, isHov, false);
    } else if (b.type === 'btn') {
      drawSmallBtn(b, isHov);
    } else if (b.type === 'btn_large') {
      drawLargeBtn(b, isHov);
    }
  }
}

// 绘制选项按钮
function drawOptionBtn(b, isActive, isHov, disabled) {
  var ctx = state.ctx;
  var W = state.W;

  if (disabled) {
    ctx.fillStyle = '#f0f0f0';
    roundRect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1.5;
    roundRect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 8);
    ctx.stroke();
    ctx.fillStyle = '#ccc';
    ctx.font = (W * 0.035) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.text, b.x, b.y);
    return;
  }

  ctx.fillStyle = isActive ? '#e94560' : isHov ? '#f0f0f0' : '#fff';
  roundRect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 8);
  ctx.fill();
  ctx.strokeStyle = isActive ? '#e94560' : isHov ? '#e94560' : '#ddd';
  ctx.lineWidth = isHov ? 2.5 : 1.5;
  roundRect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 8);
  ctx.stroke();

  ctx.fillStyle = isActive ? '#fff' : isHov ? '#e94560' : '#666';
  ctx.font = (W * 0.035) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.text, b.x, b.y);
}

// 绘制深色按钮
function drawDarkBtn(b, isHov) {
  var ctx = state.ctx;
  var W = state.W;

  var bg = ctx.createLinearGradient(b.x - b.w / 2, 0, b.x + b.w / 2, 0);
  bg.addColorStop(0, isHov ? '#4a4e69' : '#3a3e59');
  bg.addColorStop(1, isHov ? '#2d2d4a' : '#22223b');
  ctx.fillStyle = bg;
  roundRect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 12);
  ctx.fill();

  ctx.strokeStyle = isHov ? '#e94560' : '#4a4e69';
  ctx.lineWidth = isHov ? 3 : 2;
  roundRect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 12);
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold ' + (W * 0.04) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.text, b.x, b.y);
}

// 绘制小按钮
function drawSmallBtn(b, isHov) {
  var ctx = state.ctx;
  var W = state.W;

  ctx.fillStyle = isHov ? '#555' : '#666';
  roundRect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 8);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = (W * 0.04) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.text, b.x, b.y);
}

// 绘制大按钮
function drawLargeBtn(b, isHov) {
  var ctx = state.ctx;
  var W = state.W;

  ctx.fillStyle = isHov ? '#d63850' : '#e94560';
  roundRect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 12);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold ' + (W * 0.045) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.text, b.x, b.y);
}

// 绘制切换按钮
function drawToggleBtn(b, isHov) {
  var ctx = state.ctx;
  var W = state.W;

  ctx.fillStyle = b.isOn ? '#e94560' : isHov ? '#f5f5f5' : '#fff';
  roundRect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 8);
  ctx.fill();

  ctx.strokeStyle = b.isOn ? '#e94560' : isHov ? '#e94560' : '#ddd';
  ctx.lineWidth = isHov ? 2.5 : 1.5;
  roundRect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 8);
  ctx.stroke();

  ctx.fillStyle = b.isOn ? '#fff' : isHov ? '#e94560' : '#666';
  ctx.font = (W * 0.035) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.text, b.x, b.y);
}

// 绘制游戏结束画面
function drawGameOver() {
  var ctx = state.ctx;
  var W = state.W;
  var H = state.H;

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, W, H);

  var msg, color, sub = '';
  if (state.gameType === 'go') {
    msg = state.winner === 1 ? '黑方胜!' : '白方胜!';
    color = '#ffd700';
    if (state.chatMessages.length > 0) {
      sub = state.chatMessages[state.chatMessages.length - 1];
    }
  } else {
    var s = state.settings.normalMode;
    if (s.vsMode === 'human') {
      msg = state.winner === 1 ? '黑方胜!' : '白方胜!';
      color = '#ffd700';
    } else {
      var myColor = s.playerColor;
      msg = state.winner === myColor ? '你赢了!' : '你输了!';
      color = state.winner === myColor ? '#ffd700' : '#e94560';
    }
  }

  ctx.fillStyle = color;
  ctx.font = 'bold ' + (W * 0.13) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(msg, W / 2, H * 0.36);

  if (sub) {
    ctx.fillStyle = '#fff';
    ctx.font = (W * 0.038) + 'px Arial';
    ctx.fillText(sub, W / 2, H * 0.46);
  }

  var btnW = 150, btnH = 48, btnY = H * 0.52;
  ctx.fillStyle = '#e94560';
  roundRect(ctx, W / 2 - btnW / 2, btnY, btnW, btnH, 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold ' + (W * 0.04) + 'px Arial';
  ctx.fillText('再来一局', W / 2, btnY + btnH / 2);

  ctx.fillStyle = '#888';
  roundRect(ctx, W / 2 - 55, btnY + 58, 110, 40, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = (W * 0.035) + 'px Arial';
  ctx.fillText('返回菜单', W / 2, btnY + 78);
}

// 绘制创建象棋对局页面
function drawCreateXiangqi() {
  var ctx = state.ctx;
  var W = state.W;
  var H = state.H;
  var s = state.settings.xiangqiMode;

  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, W, H);
  drawTopBar();

  ctx.fillStyle = '#333';
  ctx.font = 'bold ' + (W * 0.06) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('象棋对局', W / 2, state.LAYOUT.topH + 30);

  for (var i = 0; i < state.menuButtons.length; i++) {
    var b = state.menuButtons[i];
    var isHov = state.hoveredBtn && state.hoveredBtn.id === b.id;

    if (b.type === 'label') {
      ctx.fillStyle = b.disabled ? '#bbb' : '#666';
      ctx.font = (W * 0.04) + 'px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, b.x, b.y);
    } else if (b.type === 'xiangqi_vsmode') {
      drawOptionBtn(b, s.vsMode === b.vsMode, isHov, false);
    } else if (b.type === 'xiangqi_diff') {
      drawOptionBtn(b, s.difficulty === b.diff, isHov, b.disabled);
    } else if (b.type === 'xiangqi_color') {
      drawOptionBtn(b, s.playerColor === b.color, isHov, b.disabled);
    } else if (b.type === 'btn') {
      drawSmallBtn(b, isHov);
    } else if (b.type === 'btn_large') {
      drawLargeBtn(b, isHov);
    }
  }
}

// 绘制创建跳棋对局页面
function drawCreateCheckers() {
  var ctx = state.ctx;
  var W = state.W;
  var H = state.H;
  var s = state.settings.checkersMode;

  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, W, H);
  drawTopBar();

  ctx.fillStyle = '#333';
  ctx.font = 'bold ' + (W * 0.06) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('跳棋对局', W / 2, state.LAYOUT.topH + 30);

  for (var i = 0; i < state.menuButtons.length; i++) {
    var b = state.menuButtons[i];
    var isHov = state.hoveredBtn && state.hoveredBtn.id === b.id;

    if (b.type === 'label') {
      ctx.fillStyle = '#666';
      ctx.font = (W * 0.04) + 'px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, b.x, b.y);
    } else if (b.type === 'checkers_players') {
      drawOptionBtn(b, s.players === b.players, isHov, false);
    } else if (b.type === 'checkers_ai') {
      drawOptionBtn(b, s.aiCount === b.aiCount, isHov, false);
    } else if (b.type === 'checkers_diff') {
      drawOptionBtn(b, s.difficulty === b.diff, isHov, false);
    } else if (b.type === 'btn') {
      drawSmallBtn(b, isHov);
    } else if (b.type === 'btn_large') {
      drawLargeBtn(b, isHov);
    }
  }
}

// 绘制创建军旗对局页面
function drawCreateJunqi() {
  var ctx = state.ctx;
  var W = state.W;
  var H = state.H;
  var s = state.settings.junqiMode;

  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, W, H);
  drawTopBar();

  ctx.fillStyle = '#333';
  ctx.font = 'bold ' + (W * 0.06) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('军旗对局', W / 2, state.LAYOUT.topH + 30);

  for (var i = 0; i < state.menuButtons.length; i++) {
    var b = state.menuButtons[i];
    var isHov = state.hoveredBtn && state.hoveredBtn.id === b.id;

    if (b.type === 'label') {
      ctx.fillStyle = '#666';
      ctx.font = (W * 0.04) + 'px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, b.x, b.y);
    } else if (b.type === 'junqi_vsmode') {
      drawOptionBtn(b, s.vsMode === b.vsMode, isHov, false);
    } else if (b.type === 'junqi_color') {
      var disabled = s.vsMode !== 'ai';
      drawOptionBtn(b, s.playerColor === b.color, isHov, disabled);
    } else if (b.type === 'junqi_diff') {
      var disabled = s.vsMode !== 'ai';
      drawOptionBtn(b, s.difficulty === b.diff, isHov, disabled);
    } else if (b.type === 'btn') {
      drawSmallBtn(b, isHov);
    } else if (b.type === 'btn_large') {
      drawLargeBtn(b, isHov);
    }
  }
}

// 绘制创建黑白棋对局页面
function drawCreateOthello() {
  var ctx = state.ctx;
  var W = state.W;
  var H = state.H;
  var s = state.settings.othelloMode;

  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, W, H);
  drawTopBar();

  ctx.fillStyle = '#333';
  ctx.font = 'bold ' + (W * 0.06) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('黑白棋对局', W / 2, state.LAYOUT.topH + 30);

  for (var i = 0; i < state.menuButtons.length; i++) {
    var b = state.menuButtons[i];
    var isHov = state.hoveredBtn && state.hoveredBtn.id === b.id;

    if (b.type === 'label') {
      ctx.fillStyle = '#666';
      ctx.font = (W * 0.04) + 'px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, b.x, b.y);
    } else if (b.type === 'othello_vsmode') {
      drawOptionBtn(b, s.vsMode === b.vsMode, isHov, false);
    } else if (b.type === 'othello_color') {
      var disabled = s.vsMode !== 'ai';
      drawOptionBtn(b, s.playerColor === b.color, isHov, disabled);
    } else if (b.type === 'othello_diff') {
      var disabled = s.vsMode !== 'ai';
      drawOptionBtn(b, s.difficulty === b.diff, isHov, disabled);
    } else if (b.type === 'btn') {
      drawSmallBtn(b, isHov);
    } else if (b.type === 'btn_large') {
      drawLargeBtn(b, isHov);
    }
  }
}

module.exports = {
  drawTopBar: drawTopBar,
  drawMenu: drawMenu,
  drawSettings: drawSettings,
  drawCreateGame: drawCreateGame,
  drawCreateGo: drawCreateGo,
  drawCreateXiangqi: drawCreateXiangqi,
  drawCreateCheckers: drawCreateCheckers,
  drawCreateJunqi: drawCreateJunqi,
  drawCreateOthello: drawCreateOthello,
  drawOptionBtn: drawOptionBtn,
  drawDarkBtn: drawDarkBtn,
  drawSmallBtn: drawSmallBtn,
  drawLargeBtn: drawLargeBtn,
  drawToggleBtn: drawToggleBtn,
  drawGameOver: drawGameOver,
  roundRect: roundRect
};
