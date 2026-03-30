/**
 * 棋棋 - 菜单模块
 * 处理菜单初始化和按钮点击
 */

var state = require('./config.js');

// 初始化主菜单
function initMenu() {
  state.currentScreen = 'main_menu';
  state.menuButtons = [];

  var btnW = Math.min(state.W * 0.7, 280);
  var btnH = 50;
  var cx = state.W / 2;
  var startY = state.H * 0.22;
  var gap = 55;

  state.menuButtons.push({ id: 'mode_normal', text: '五子棋', x: cx, y: startY, w: btnW, h: btnH });
  state.menuButtons.push({ id: 'mode_go', text: '围棋', x: cx, y: startY + gap, w: btnW, h: btnH });
  state.menuButtons.push({ id: 'mode_xiangqi', text: '中国象棋', x: cx, y: startY + gap * 2, w: btnW, h: btnH });
  state.menuButtons.push({ id: 'mode_checkers', text: '跳棋', x: cx, y: startY + gap * 3, w: btnW, h: btnH });
  state.menuButtons.push({ id: 'mode_junqi', text: '军棋', x: cx, y: startY + gap * 4, w: btnW, h: btnH });
  state.menuButtons.push({ id: 'mode_othello', text: '黑白棋', x: cx, y: startY + gap * 5, w: btnW, h: btnH });
  state.menuButtons.push({ id: 'settings', text: '设置', x: cx, y: startY + gap * 6, w: btnW, h: btnH });
}

// 初始化设置页面
function initSettings() {
  state.currentScreen = 'settings';
  state.menuButtons = [];

  var cx = state.W / 2;
  var startY = state.H * 0.28;
  var set = state.settings.general;

  state.menuButtons.push({ id: 'lbl_sound', text: '音效', x: 30, y: startY, type: 'label' });
  state.menuButtons.push({ id: 'sound_on', text: '开启', x: cx - 65, y: startY + 35, w: 120, h: 36, type: 'toggle', isOn: set.sound });
  state.menuButtons.push({ id: 'sound_off', text: '关闭', x: cx + 65, y: startY + 35, w: 120, h: 36, type: 'toggle', isOn: !set.sound });

  state.menuButtons.push({ id: 'lbl_music', text: '音乐', x: 30, y: startY + 100, type: 'label' });
  state.menuButtons.push({ id: 'music_on', text: '开启', x: cx - 65, y: startY + 135, w: 120, h: 36, type: 'toggle', isOn: set.music });
  state.menuButtons.push({ id: 'music_off', text: '关闭', x: cx + 65, y: startY + 135, w: 120, h: 36, type: 'toggle', isOn: !set.music });

  state.menuButtons.push({ id: 'lbl_vibe', text: '震动反馈', x: 30, y: startY + 200, type: 'label' });
  state.menuButtons.push({ id: 'vibe_on', text: '开启', x: cx - 65, y: startY + 235, w: 120, h: 36, type: 'toggle', isOn: set.vibration });
  state.menuButtons.push({ id: 'vibe_off', text: '关闭', x: cx + 65, y: startY + 235, w: 120, h: 36, type: 'toggle', isOn: !set.vibration });

  state.menuButtons.push({ id: 'back', text: '返回', x: cx, y: state.H - 60, w: 120, h: 40, type: 'btn' });
}

// 初始化创建对局页面
function initCreateGame() {
  state.currentScreen = 'create_game';
  state.menuButtons = [];

  var cx = state.W / 2;
  var startY = state.H * 0.18;
  var s = state.settings.normalMode;

  // 对战模式
  var mw = 130, mh = 40, mg = 16;
  state.menuButtons.push({ id: 'lbl_vsmode', text: '对战模式', x: 30, y: startY, type: 'label' });
  state.menuButtons.push({ id: 'vsmode_ai', text: '人机对战', x: cx - mw / 2 - mg / 2, y: startY + 30, w: mw, h: mh, type: 'vsmode', vsMode: 'ai' });
  state.menuButtons.push({ id: 'vsmode_human', text: '双人对战', x: cx + mw / 2 + mg / 2, y: startY + 30, w: mw, h: mh, type: 'vsmode', vsMode: 'human' });

  // 人机难度
  var isAi = s.vsMode === 'ai';
  state.menuButtons.push({ id: 'lbl_diff', text: '人机难度', x: 30, y: startY + 90, type: 'label', disabled: !isAi });
  var dw = 65, dg = 8, dy = startY + 125;
  var ds = ['easy', 'normal', 'hard', 'extreme'];
  var dl = ['简单', '普通', '困难', '极限'];
  var dx = cx - (dw * 4 + dg * 3) / 2;
  for (var i = 0; i < 4; i++) {
    state.menuButtons.push({ id: 'diff_' + ds[i], text: dl[i], x: dx + dw / 2 + i * (dw + dg), y: dy, w: dw, h: 34, type: 'diff', diff: ds[i], disabled: !isAi });
  }

  // 执子
  state.menuButtons.push({ id: 'lbl_color', text: '执子', x: 30, y: startY + 180, type: 'label', disabled: !isAi });
  var cw = 95, cg = state.W * 0.05;
  state.menuButtons.push({ id: 'color_guess', text: '猜先', x: cx - cw - cg, y: startY + 215, w: cw, h: 36, type: 'color', color: 0, disabled: !isAi });
  state.menuButtons.push({ id: 'color_black', text: '执黑', x: cx, y: startY + 215, w: cw, h: 36, type: 'color', color: 1, disabled: !isAi });
  state.menuButtons.push({ id: 'color_white', text: '执白', x: cx + cw + cg, y: startY + 215, w: cw, h: 36, type: 'color', color: 2, disabled: !isAi });

  // 读秒
  state.menuButtons.push({ id: 'lbl_timer', text: '是否读秒', x: 30, y: startY + 275, type: 'label' });
  state.menuButtons.push({ id: 'timer_on', text: '开启', x: cx - 65, y: startY + 310, w: 120, h: 36, type: 'toggle', isOn: s.countdown });
  state.menuButtons.push({ id: 'timer_off', text: '关闭', x: cx + 65, y: startY + 310, w: 120, h: 36, type: 'toggle', isOn: !s.countdown });

  // 按钮
  state.menuButtons.push({ id: 'start_game', text: '进入游戏', x: cx, y: state.H - 100, w: 160, h: 50, type: 'btn_large' });
  state.menuButtons.push({ id: 'back', text: '返回', x: cx, y: state.H - 40, w: 120, h: 35, type: 'btn' });
}

// 初始化创建围棋对局页面
function initCreateGo() {
  state.currentScreen = 'create_go';
  state.menuButtons = [];

  var cx = state.W / 2;
  var startY = state.H * 0.10;
  var g = state.settings.goMode;
  var isAi = g.vsMode === 'ai';

  // 对战模式
  var mw = 130, mh = 40, mg = 16;
  state.menuButtons.push({ id: 'lbl_vsmode', text: '对战模式', x: 30, y: startY, type: 'label' });
  state.menuButtons.push({ id: 'govsmode_ai', text: '人机对战', x: cx - mw / 2 - mg / 2, y: startY + 28, w: mw, h: mh, type: 'govsmode', vsMode: 'ai' });
  state.menuButtons.push({ id: 'govsmode_human', text: '双人对战', x: cx + mw / 2 + mg / 2, y: startY + 28, w: mw, h: mh, type: 'govsmode', vsMode: 'human' });

  // 人机段位
  state.menuButtons.push({ id: 'lbl_godiff', text: '人机段位', x: 30, y: startY + 82, type: 'label', disabled: !isAi });
  var gdiffs = ['kyu10', 'kyu5', 'dan1', 'dan3'];
  var gdlabels = ['10级', '5级', '1段', '3段'];
  var gdw = 62, gdg = 7, gdy = startY + 112;
  var gdx = cx - (gdw * 4 + gdg * 3) / 2;
  for (var i = 0; i < 4; i++) {
    state.menuButtons.push({ id: 'godiff_' + gdiffs[i], text: gdlabels[i], x: gdx + gdw / 2 + i * (gdw + gdg), y: gdy, w: gdw, h: 34, type: 'godiff', diff: gdiffs[i], disabled: !isAi });
  }

  // 执子
  state.menuButtons.push({ id: 'lbl_gocolor', text: '执子', x: 30, y: startY + 158, type: 'label', disabled: !isAi });
  var cw = 85, cg = state.W * 0.04, cy = startY + 188;
  state.menuButtons.push({ id: 'gocolor_guess', text: '猜先', x: cx - cw - cg, y: cy, w: cw, h: 36, type: 'gocolor', color: 0, disabled: !isAi });
  state.menuButtons.push({ id: 'gocolor_black', text: '执黑', x: cx, y: cy, w: cw, h: 36, type: 'gocolor', color: 1, disabled: !isAi });
  state.menuButtons.push({ id: 'gocolor_white', text: '执白', x: cx + cw + cg, y: cy, w: cw, h: 36, type: 'gocolor', color: 2, disabled: !isAi });

  // 棋盘路数
  state.menuButtons.push({ id: 'lbl_boardsize', text: '棋盘路数', x: 30, y: startY + 236, type: 'label' });
  var bw = 80, bg2 = 10, bsizes = [9, 13, 19], bsy = startY + 266;
  var bsx = cx - (bw * 3 + bg2 * 2) / 2;
  for (var i = 0; i < 3; i++) {
    state.menuButtons.push({ id: 'gosize_' + bsizes[i], text: bsizes[i] + '路', x: bsx + bw / 2 + i * (bw + bg2), y: bsy, w: bw, h: 36, type: 'gosize', size: bsizes[i] });
  }

  // 贴目
  state.menuButtons.push({ id: 'lbl_komi', text: '贴目 (' + g.komi + '目)', x: 30, y: startY + 314, type: 'label' });
  state.menuButtons.push({ id: 'komi_55', text: '5.5', x: cx - 90, y: startY + 342, w: 80, h: 36, type: 'komi', komi: 5.5 });
  state.menuButtons.push({ id: 'komi_65', text: '6.5', x: cx, y: startY + 342, w: 80, h: 36, type: 'komi', komi: 6.5 });
  state.menuButtons.push({ id: 'komi_75', text: '7.5', x: cx + 90, y: startY + 342, w: 80, h: 36, type: 'komi', komi: 7.5 });

  // 按钮
  state.menuButtons.push({ id: 'start_go', text: '进入游戏', x: cx, y: state.H - 70, w: 160, h: 50, type: 'btn_large' });
  state.menuButtons.push({ id: 'back', text: '返回', x: cx, y: state.H - 30, w: 120, h: 35, type: 'btn' });
}

// 初始化棋盘布局
function initBoardLayout() {
  var W = state.W;
  var H = state.H;
  var topH = state.LAYOUT.topH;
  var chatH = state.LAYOUT.chatH;
  var actionH = state.LAYOUT.actionH;

  // 可用高度
  var availH = H - topH - chatH - actionH;

  // 根据游戏类型调整棋盘大小
  if (state.gameType === 'xiangqi') {
    // 象棋：10行9列
    var maxCellH = availH / 9;
    var maxCellW = (W - 40) / 8;
    var cs = Math.min(maxCellH, maxCellW);
    
    state.CONFIG.BOARD_SIZE = 9;
    state.CONFIG.CELL_SIZE = cs;
    state.CONFIG.PIECE_RADIUS = cs * 0.35;

    var boardW = cs * 8;
    var boardH = cs * 9;
    
    state.LAYOUT.boardLeft = (W - boardW) / 2;
    state.LAYOUT.boardTop = topH + (availH - boardH) / 2;
    state.LAYOUT.boardPx = boardW;
  } else if (state.gameType === 'junqi') {
    // 军棋：12行5列
    var maxCellH = availH / 12;
    var maxCellW = (W - 40) / 4;
    var cs = Math.min(maxCellH, maxCellW);
    
    state.CONFIG.BOARD_SIZE = 5;
    state.CONFIG.CELL_SIZE = cs;
    state.CONFIG.PIECE_RADIUS = cs * 0.4;

    var boardW = cs * 4;
    var boardH = cs * 12;
    
    state.LAYOUT.boardLeft = (W - boardW) / 2;
    state.LAYOUT.boardTop = topH + (availH - boardH) / 2;
    state.LAYOUT.boardPx = boardW;
  } else if (state.gameType === 'othello') {
    // 黑白棋：8x8
    var maxCellH = availH / 8;
    var maxCellW = (W - 40) / 8;
    var cs = Math.min(maxCellH, maxCellW);
    
    state.CONFIG.BOARD_SIZE = 8;
    state.CONFIG.CELL_SIZE = cs;
    state.CONFIG.PIECE_RADIUS = cs * 0.4;

    var boardW = cs * 8;
    var boardH = cs * 8;
    
    state.LAYOUT.boardLeft = (W - boardW) / 2;
    state.LAYOUT.boardTop = topH + (availH - boardH) / 2;
    state.LAYOUT.boardPx = boardW;
  } else if (state.gameType === 'checkers') {
    // 跳棋：17行六角星
    var ROW_COUNTS = [1, 2, 3, 4, 13, 12, 11, 10, 9, 10, 11, 12, 13, 4, 3, 2, 1];
    var maxCount = 13;
    
    var maxCellH = availH / 17;
    var maxCellW = (W - 40) / maxCount;
    var cs = Math.min(maxCellH, maxCellW);
    
    state.CONFIG.BOARD_SIZE = maxCount;
    state.CONFIG.CELL_SIZE = cs;
    state.CONFIG.PIECE_RADIUS = cs * 0.35;

    var boardW = cs * (maxCount - 1);
    var boardH = cs * 16 * 0.866;
    
    state.LAYOUT.boardLeft = (W - boardW) / 2;
    state.LAYOUT.boardTop = topH + (availH - boardH) / 2;
    state.LAYOUT.boardPx = boardW;
  } else {
    // 五子棋和围棋
    var bs = state.gameType === 'go' ? state.settings.goMode.boardSize : 15;
    state.CONFIG.BOARD_SIZE = bs;

    var maxCellH = availH / (bs + 0.5);
    var maxCellW = (W - 40) / (bs + 0.5);
    var cs = Math.min(maxCellH, maxCellW);

    state.CONFIG.CELL_SIZE = cs;
    state.CONFIG.PIECE_RADIUS = cs * 0.44;

    var boardPx = cs * (bs - 1);
    state.LAYOUT.boardLeft = (W - boardPx) / 2;
    state.LAYOUT.boardTop = topH + (availH - boardPx) / 2;
    state.LAYOUT.boardPx = boardPx;
  }
}

// 初始化创建象棋对局页面
function initCreateXiangqi() {
  state.currentScreen = 'create_xiangqi';
  state.menuButtons = [];

  var cx = state.W / 2;
  var startY = state.H * 0.18;
  var s = state.settings.xiangqiMode;

  // 对战模式
  var mw = 130, mh = 40, mg = 16;
  state.menuButtons.push({ id: 'lbl_vsmode', text: '对战模式', x: 30, y: startY, type: 'label' });
  state.menuButtons.push({ id: 'xiangqi_vsmode_ai', text: '人机对战', x: cx - mw / 2 - mg / 2, y: startY + 30, w: mw, h: mh, type: 'xiangqi_vsmode', vsMode: 'ai' });
  state.menuButtons.push({ id: 'xiangqi_vsmode_human', text: '双人对战', x: cx + mw / 2 + mg / 2, y: startY + 30, w: mw, h: mh, type: 'xiangqi_vsmode', vsMode: 'human' });

  // 人机难度
  var isAi = s.vsMode === 'ai';
  state.menuButtons.push({ id: 'lbl_diff', text: '人机难度', x: 30, y: startY + 90, type: 'label', disabled: !isAi });
  var dw = 65, dg = 8, dy = startY + 125;
  var ds = ['easy', 'normal', 'hard'];
  var dl = ['简单', '普通', '困难'];
  var dx = cx - (dw * 3 + dg * 2) / 2;
  for (var i = 0; i < 3; i++) {
    state.menuButtons.push({ id: 'xiangqi_diff_' + ds[i], text: dl[i], x: dx + dw / 2 + i * (dw + dg), y: dy, w: dw, h: 34, type: 'xiangqi_diff', diff: ds[i], disabled: !isAi });
  }

  // 执子
  state.menuButtons.push({ id: 'lbl_color', text: '执子', x: 30, y: startY + 180, type: 'label', disabled: !isAi });
  var cw = 95, cg = state.W * 0.05;
  state.menuButtons.push({ id: 'xiangqi_color_guess', text: '猜先', x: cx - cw - cg, y: startY + 215, w: cw, h: 36, type: 'xiangqi_color', color: 0, disabled: !isAi });
  state.menuButtons.push({ id: 'xiangqi_color_red', text: '执红', x: cx, y: startY + 215, w: cw, h: 36, type: 'xiangqi_color', color: 1, disabled: !isAi });
  state.menuButtons.push({ id: 'xiangqi_color_black', text: '执黑', x: cx + cw + cg, y: startY + 215, w: cw, h: 36, type: 'xiangqi_color', color: 2, disabled: !isAi });

  // 按钮
  state.menuButtons.push({ id: 'start_xiangqi', text: '进入游戏', x: cx, y: state.H - 100, w: 160, h: 50, type: 'btn_large' });
  state.menuButtons.push({ id: 'back', text: '返回', x: cx, y: state.H - 40, w: 120, h: 35, type: 'btn' });
}

// 初始化创建跳棋对局页面
function initCreateCheckers() {
  state.currentScreen = 'create_checkers';
  state.menuButtons = [];

  var cx = state.W / 2;
  var startY = state.H * 0.18;
  var s = state.settings.checkersMode;

  // 玩家数量
  state.menuButtons.push({ id: 'lbl_players', text: '玩家数量', x: 30, y: startY, type: 'label' });
  var pw = 70, pg = 8, py = startY + 30;
  var pnums = [2, 3, 4, 6];
  var px = cx - (pw * 4 + pg * 3) / 2;
  for (var i = 0; i < 4; i++) {
    state.menuButtons.push({ id: 'checkers_players_' + pnums[i], text: pnums[i] + '人', x: px + pw / 2 + i * (pw + pg), y: py, w: pw, h: 34, type: 'checkers_players', players: pnums[i] });
  }

  // 人机数量
  state.menuButtons.push({ id: 'lbl_ai', text: '人机数量', x: 30, y: startY + 90, type: 'label' });
  var aw = 70, ag = 8, ay = startY + 125;
  var maxAi = Math.min(s.players - 1, 3);
  var ax = cx - (aw * (maxAi + 1) + ag * maxAi) / 2;
  for (var i = 0; i <= maxAi; i++) {
    state.menuButtons.push({ id: 'checkers_ai_' + i, text: i + '个', x: ax + aw / 2 + i * (aw + ag), y: ay, w: aw, h: 34, type: 'checkers_ai', aiCount: i });
  }

  // 难度
  state.menuButtons.push({ id: 'lbl_diff', text: '人机难度', x: 30, y: startY + 180, type: 'label' });
  var dw = 70, dg = 8, dy = startY + 215;
  var ds = ['easy', 'normal', 'hard'];
  var dl = ['简单', '普通', '困难'];
  var dx = cx - (dw * 3 + dg * 2) / 2;
  for (var i = 0; i < 3; i++) {
    state.menuButtons.push({ id: 'checkers_diff_' + ds[i], text: dl[i], x: dx + dw / 2 + i * (dw + dg), y: dy, w: dw, h: 34, type: 'checkers_diff', diff: ds[i] });
  }

  // 按钮
  state.menuButtons.push({ id: 'start_checkers', text: '进入游戏', x: cx, y: state.H - 100, w: 160, h: 50, type: 'btn_large' });
  state.menuButtons.push({ id: 'back', text: '返回', x: cx, y: state.H - 40, w: 120, h: 35, type: 'btn' });
}

// 初始化军棋创建对局
function initCreateJunqi() {
  state.currentScreen = 'create_junqi';
  state.menuButtons = [];
  var cx = state.W / 2;
  var startY = 100;

  // 对战模式
  state.menuButtons.push({ id: 'lbl_mode', text: '对战模式', x: 30, y: startY, type: 'label' });
  var mw = 90, mg = 12, my = startY + 35;
  state.menuButtons.push({ id: 'junqi_vsmode_human', text: '双人对战', x: cx - mw - mg / 2, y: my, w: mw, h: 34, type: 'junqi_vsmode', vsMode: 'human' });
  state.menuButtons.push({ id: 'junqi_vsmode_ai', text: '人机对战', x: cx + mg / 2, y: my, w: mw, h: 34, type: 'junqi_vsmode', vsMode: 'ai' });

  // 执子（仅人机模式）
  var s = state.settings.junqiMode;
  if (s.vsMode === 'ai') {
    state.menuButtons.push({ id: 'lbl_color', text: '执子选择', x: 30, y: startY + 90, type: 'label' });
    var cw = 70, cg = 10, cy = startY + 125;
    state.menuButtons.push({ id: 'junqi_color_1', text: '执红', x: cx - cw - cg / 2, y: cy, w: cw, h: 34, type: 'junqi_color', color: 1 });
    state.menuButtons.push({ id: 'junqi_color_2', text: '执蓝', x: cx + cg / 2, y: cy, w: cw, h: 34, type: 'junqi_color', color: 2 });
  }

  // 难度
  if (s.vsMode === 'ai') {
    state.menuButtons.push({ id: 'lbl_diff', text: '人机难度', x: 30, y: startY + 180, type: 'label' });
    var dw = 70, dg = 8, dy = startY + 215;
    var ds = ['easy', 'normal', 'hard'];
    var dl = ['简单', '普通', '困难'];
    var dx = cx - (dw * 3 + dg * 2) / 2;
    for (var i = 0; i < 3; i++) {
      state.menuButtons.push({ id: 'junqi_diff_' + ds[i], text: dl[i], x: dx + dw / 2 + i * (dw + dg), y: dy, w: dw, h: 34, type: 'junqi_diff', diff: ds[i] });
    }
  }

  state.menuButtons.push({ id: 'start_junqi', text: '进入游戏', x: cx, y: state.H - 100, w: 160, h: 50, type: 'btn_large' });
  state.menuButtons.push({ id: 'back', text: '返回', x: cx, y: state.H - 40, w: 120, h: 35, type: 'btn' });
}

// 初始化黑白棋创建对局
function initCreateOthello() {
  state.currentScreen = 'create_othello';
  state.menuButtons = [];
  var cx = state.W / 2;
  var startY = 100;

  // 对战模式
  state.menuButtons.push({ id: 'lbl_mode', text: '对战模式', x: 30, y: startY, type: 'label' });
  var mw = 90, mg = 12, my = startY + 35;
  state.menuButtons.push({ id: 'othello_vsmode_human', text: '双人对战', x: cx - mw - mg / 2, y: my, w: mw, h: 34, type: 'othello_vsmode', vsMode: 'human' });
  state.menuButtons.push({ id: 'othello_vsmode_ai', text: '人机对战', x: cx + mg / 2, y: my, w: mw, h: 34, type: 'othello_vsmode', vsMode: 'ai' });

  // 执子（仅人机模式）
  var s = state.settings.othelloMode;
  if (s.vsMode === 'ai') {
    state.menuButtons.push({ id: 'lbl_color', text: '执子选择', x: 30, y: startY + 90, type: 'label' });
    var cw = 70, cg = 10, cy = startY + 125;
    state.menuButtons.push({ id: 'othello_color_1', text: '执黑', x: cx - cw - cg / 2, y: cy, w: cw, h: 34, type: 'othello_color', color: 1 });
    state.menuButtons.push({ id: 'othello_color_2', text: '执白', x: cx + cg / 2, y: cy, w: cw, h: 34, type: 'othello_color', color: 2 });
  }

  // 难度
  if (s.vsMode === 'ai') {
    state.menuButtons.push({ id: 'lbl_diff', text: '人机难度', x: 30, y: startY + 180, type: 'label' });
    var dw = 70, dg = 8, dy = startY + 215;
    var ds = ['easy', 'normal', 'hard'];
    var dl = ['简单', '普通', '困难'];
    var dx = cx - (dw * 3 + dg * 2) / 2;
    for (var i = 0; i < 3; i++) {
      state.menuButtons.push({ id: 'othello_diff_' + ds[i], text: dl[i], x: dx + dw / 2 + i * (dw + dg), y: dy, w: dw, h: 34, type: 'othello_diff', diff: ds[i] });
    }
  }

  state.menuButtons.push({ id: 'start_othello', text: '进入游戏', x: cx, y: state.H - 100, w: 160, h: 50, type: 'btn_large' });
  state.menuButtons.push({ id: 'back', text: '返回', x: cx, y: state.H - 40, w: 120, h: 35, type: 'btn' });
}

module.exports = {
  initMenu: initMenu,
  initSettings: initSettings,
  initCreateGame: initCreateGame,
  initCreateGo: initCreateGo,
  initCreateXiangqi: initCreateXiangqi,
  initCreateCheckers: initCreateCheckers,
  initCreateJunqi: initCreateJunqi,
  initCreateOthello: initCreateOthello,
  initBoardLayout: initBoardLayout
};
