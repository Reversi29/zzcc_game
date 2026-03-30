/**
 * 棋棋 - 围棋模块
 * 包含围棋游戏逻辑、AI和势力计算
 */

var state = require('./config.js');
var utils = require('./utils.js');
var menu = null; // 延迟加载避免循环依赖

// 初始化围棋游戏
function initGoGame() {
  state.gameType = 'go';

  if (!menu) menu = require('./menu.js');
  menu.initBoardLayout();

  state.board = [];
  for (var y = 0; y < state.CONFIG.BOARD_SIZE; y++) {
    state.board[y] = [];
    for (var x = 0; x < state.CONFIG.BOARD_SIZE; x++) {
      state.board[y][x] = 0;
    }
  }

  var g = state.settings.goMode;
  if (g.playerColor === 0) {
    g.playerColor = Math.random() < 0.5 ? 1 : 2;
  }

  state.currentPlayer = 1;
  state.isMyTurn = g.vsMode === 'human' ? true : g.playerColor === 1;
  state.gameOver = false;
  state.winner = null;
  state.lastMove = null;
  state.moveHistory = [];
  state.aiMoveToken++;
  state.previewX = -1;
  state.previewY = -1;
  state.canPlace = false;
  state.goCaptured = [0, 0];
  state.goPassCount = 0;
  state.goKoPoint = null;
  state.goPrevBoardStr = '';
  state.goShowTerritory = false;
  state.goEvalResult = null;
  state.goScoreRequestActive = false;
  state.goMoveCount = 0;
  state.chatMessages = [];

  if (state.timerInterval) clearInterval(state.timerInterval);

  if (g.vsMode === 'ai' && !state.isMyTurn) {
    utils.scheduleAiMove();
  }
}

// 获取棋组
function goGetGroup(x, y, player) {
  var visited = {};
  var group = [];
  var liberties = [];
  var stack = [{ x: x, y: y }];
  var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (stack.length) {
    var cur = stack.pop();
    var key = cur.x + ',' + cur.y;
    if (visited[key]) continue;
    visited[key] = true;
    group.push({ x: cur.x, y: cur.y });

    for (var d = 0; d < 4; d++) {
      var nx = cur.x + dirs[d][0];
      var ny = cur.y + dirs[d][1];
      if (nx < 0 || nx >= state.CONFIG.BOARD_SIZE ||
          ny < 0 || ny >= state.CONFIG.BOARD_SIZE) continue;
      var nkey = nx + ',' + ny;
      if (state.board[ny][nx] === 0 && !visited[nkey]) {
        liberties.push({ x: nx, y: ny });
        visited[nkey] = true;
      } else if (state.board[ny][nx] === player && !visited[nkey]) {
        stack.push({ x: nx, y: ny });
      }
    }
  }

  return { group: group, liberties: liberties };
}

// 移除棋组
function goRemoveGroup(group) {
  for (var i = 0; i < group.length; i++) {
    state.board[group[i].y][group[i].x] = 0;
  }
}

// 棋盘字符串
function goBoardStr() {
  var s = '';
  for (var y = 0; y < state.CONFIG.BOARD_SIZE; y++) {
    for (var x = 0; x < state.CONFIG.BOARD_SIZE; x++) {
      s += state.board[y][x];
    }
  }
  return s;
}

// 检查合法落子
function goIsValidMove(x, y, player) {
  if (state.board[y][x] !== 0) return false;
  if (state.goKoPoint && state.goKoPoint.x === x && state.goKoPoint.y === y) return false;

  state.board[y][x] = player;
  var opponent = player === 1 ? 2 : 1;
  var captured = [];
  var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  for (var d = 0; d < 4; d++) {
    var nx = x + dirs[d][0];
    var ny = y + dirs[d][1];
    if (nx < 0 || nx >= state.CONFIG.BOARD_SIZE ||
        ny < 0 || ny >= state.CONFIG.BOARD_SIZE) continue;
    if (state.board[ny][nx] === opponent) {
      var res = goGetGroup(nx, ny, opponent);
      if (res.liberties.length === 0) {
        captured = captured.concat(res.group);
      }
    }
  }

  var selfRes = goGetGroup(x, y, player);
  var valid = captured.length > 0 || selfRes.liberties.length > 0;
  state.board[y][x] = 0;

  return valid;
}

// 确认围棋落子
function goConfirmPlace() {
  if (!state.canPlace || state.previewX < 0 || state.previewY < 0) return;

  var x = state.previewX;
  var y = state.previewY;
  state.previewX = -1;
  state.previewY = -1;
  state.canPlace = false;

  if (!goIsValidMove(x, y, state.currentPlayer)) {
    state.chatMessages.push('非法落子');
    return;
  }

  var prevStr = goBoardStr();
  state.board[y][x] = state.currentPlayer;
  var opponent = state.currentPlayer === 1 ? 2 : 1;
  var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var totalCap = 0;
  var lastCapGroup = null;

  for (var d = 0; d < 4; d++) {
    var nx = x + dirs[d][0];
    var ny = y + dirs[d][1];
    if (nx < 0 || nx >= state.CONFIG.BOARD_SIZE ||
        ny < 0 || ny >= state.CONFIG.BOARD_SIZE) continue;
    if (state.board[ny][nx] === opponent) {
      var res = goGetGroup(nx, ny, opponent);
      if (res.liberties.length === 0) {
        totalCap += res.group.length;
        lastCapGroup = res.group;
        goRemoveGroup(res.group);
      }
    }
  }

  state.goCaptured[state.currentPlayer - 1] += totalCap;
  var newStr = goBoardStr();

  // 劫检测：标准打劫规则
  // 1. 如果本步提了一子，设置禁入点为被提子的位置
  // 2. 如果本步落子后会被对方立即提回（虎口），也设置为禁入点
  var newKoPoint = null;
  
  if (totalCap === 1 && lastCapGroup && lastCapGroup.length === 1) {
    // 提了一子，设置禁入点为被提子的位置
    newKoPoint = { x: lastCapGroup[0].x, y: lastCapGroup[0].y };
  } else if (totalCap === 0) {
    // 没有提子，检查本步落子是否形成虎口（会被对方立即提回）
    var selfRes = goGetGroup(x, y, state.currentPlayer);
    if (selfRes.group.length === 1 && selfRes.liberties.length === 1) {
      // 单子且只有一个气，检查这个气是否会被对方提回
      var libertyX = selfRes.liberties[0].x;
      var libertyY = selfRes.liberties[0].y;
      
      // 模拟对方在这个气的位置落子
      state.board[libertyY][libertyX] = opponent;
      var oppRes = goGetGroup(libertyX, libertyY, opponent);
      
      // 如果对方落子后能提回我们的棋子，则这个位置是禁入点
      if (oppRes.liberties.length === 0) {
        newKoPoint = { x: x, y: y };
      }
      
      state.board[libertyY][libertyX] = 0; // 恢复
    }
  }
  
  state.goKoPoint = newKoPoint;

  state.lastMove = { x: x, y: y };
  state.moveHistory.push({
    x: x, y: y, player: state.currentPlayer,
    boardSnap: prevStr, captured: totalCap, koPoint: newKoPoint
  });
  state.goPassCount = 0;
  state.goPrevBoardStr = newStr;
  state.goShowTerritory = false;
  state.goEvalResult = null;
  state.goScoreRequestActive = false;
  state.goMoveCount++;

  state.currentPlayer = opponent;
  state.isMyTurn = true;

  var g = state.settings.goMode;
  if (g.vsMode === 'ai' && state.currentPlayer !== g.playerColor) {
    state.isMyTurn = false;
    utils.scheduleAiMove();
  }
}

// 虚手
function onGoPass() {
  var prevStr = goBoardStr();
  state.moveHistory.push({
    x: -1, y: -1, player: state.currentPlayer,
    boardSnap: prevStr, captured: 0, koPoint: state.goKoPoint, isPass: true
  });
  state.goPassCount++;
  state.goScoreRequestActive = false;
  state.goMoveCount++;

  state.chatMessages.push((state.currentPlayer === 1 ? '黑' : '白') + '方虚手');

  if (state.goPassCount >= 2) {
    goEndCount();
    return;
  }

  state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
  state.isMyTurn = true;

  var g = state.settings.goMode;
  if (g.vsMode === 'ai' && state.currentPlayer !== g.playerColor) {
    state.isMyTurn = false;
    utils.scheduleAiMove();
  }
}

// 悔棋
function goUndo() {
  if (state.moveHistory.length === 0) return;

  var go = state.settings.goMode;
  var stepsToUndo = go.vsMode === 'ai' ? 2 : 1;

  for (var i = 0; i < stepsToUndo && state.moveHistory.length > 0; i++) {
    var step = state.moveHistory.pop();
    if (step.boardSnap !== undefined) {
      var snap = step.boardSnap;
      var idx = 0;
      for (var y = 0; y < state.CONFIG.BOARD_SIZE; y++) {
        for (var x = 0; x < state.CONFIG.BOARD_SIZE; x++) {
          state.board[y][x] = parseInt(snap[idx++]);
        }
      }
      state.goCaptured[step.player - 1] -= step.captured;
      state.goKoPoint = step.koPoint || null;
      state.goPassCount = 0;
    }
  }

  state.lastMove = state.moveHistory.length > 0 && state.moveHistory[state.moveHistory.length - 1].x >= 0
    ? state.moveHistory[state.moveHistory.length - 1]
    : null;
  state.currentPlayer = 1;
  state.isMyTurn = true;
  state.previewX = -1;
  state.previewY = -1;
  state.canPlace = false;
}

// 终局计分
function goEndCount() {
  var bs = state.CONFIG.BOARD_SIZE;
  var territory = [];

  for (var y = 0; y < bs; y++) {
    territory[y] = [];
    for (var x = 0; x < bs; x++) {
      territory[y][x] = 0;
    }
  }

  var visited = {};

  for (var y = 0; y < bs; y++) {
    for (var x = 0; x < bs; x++) {
      if (state.board[y][x] === 0 && !visited[y + ',' + x]) {
        var region = [];
        var borders = { 1: false, 2: false };
        var stack = [{ x: x, y: y }];
        var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

        while (stack.length) {
          var cur = stack.pop();
          var key = cur.x + ',' + cur.y;
          if (visited[key]) continue;
          visited[key] = true;
          region.push({ x: cur.x, y: cur.y });

          for (var d = 0; d < 4; d++) {
            var nx = cur.x + dirs[d][0];
            var ny = cur.y + dirs[d][1];
            if (nx < 0 || nx >= bs || ny < 0 || ny >= bs) continue;
            if (state.board[ny][nx] === 0 && !visited[nx + ',' + ny]) {
              stack.push({ x: nx, y: ny });
            } else if (state.board[ny][nx] === 1) {
              borders[1] = true;
            } else if (state.board[ny][nx] === 2) {
              borders[2] = true;
            }
          }
        }

        var owner = 0;
        if (borders[1] && !borders[2]) owner = 1;
        else if (borders[2] && !borders[1]) owner = 2;

        for (var k = 0; k < region.length; k++) {
          territory[region[k].y][region[k].x] = owner;
        }
      }
    }
  }

  var blackScore = 0;
  var whiteScore = state.settings.goMode.komi;

  for (var y = 0; y < bs; y++) {
    for (var x = 0; x < bs; x++) {
      if (state.board[y][x] === 1 || territory[y][x] === 1) {
        blackScore++;
      } else if (state.board[y][x] === 2 || territory[y][x] === 2) {
        whiteScore++;
      }
    }
  }

  blackScore += state.goCaptured[0];
  whiteScore += state.goCaptured[1];

  state.gameOver = true;
  state.winner = blackScore > whiteScore ? 1 : 2;
  state.chatMessages.push('黑:' + blackScore.toFixed(1) + ' 白:' + whiteScore.toFixed(1));

  if (state.timerInterval) clearInterval(state.timerInterval);
}

// 计算位置价值权重（金角银边草肚皮）
function goPositionWeight(x, y, bs) {
  var cx = (bs - 1) / 2;
  var dx = Math.abs(x - cx);
  var dy = Math.abs(y - cy);
  // 到最近边的距离
  var ex = Math.min(x, bs - 1 - x);
  var ey = Math.min(y, bs - 1 - y);
  var edgeDist = Math.min(ex, ey); // 0=边线, 1=二路, 2=三路...
  var cornerDist = Math.min(ex, ey); // 角落判断

  // 角落（3路以内的角）权重最高
  var isCorner = ex <= 2 && ey <= 2;
  // 边（非角的边线附近）
  var isEdge = (ex <= 2 || ey <= 2) && !isCorner;
  // 中腹
  var isCenter = ex >= 3 && ey >= 3;

  if (isCorner) return 1.8;   // 金角
  if (isEdge)   return 1.3;   // 银边
  if (isCenter) return 0.8;   // 草肚皮（中腹价值低）
  return 1.0;
}

// 计算势力范围（含金角银边草肚皮权重）
function goCalculateInfluence() {
  var bs = state.CONFIG.BOARD_SIZE;
  var influence = [];
  var dirs4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var dirs8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  for (var y = 0; y < bs; y++) {
    influence[y] = [];
    for (var x = 0; x < bs; x++) {
      influence[y][x] = { black: 0, white: 0 };
    }
  }

  // === 1. 基础势力扩散（8方向，随距离衰减）===
  for (var y = 0; y < bs; y++) {
    for (var x = 0; x < bs; x++) {
      if (state.board[y][x] === 0) continue;
      var color = state.board[y][x];

      for (var d = 0; d < 8; d++) {
        for (var dist = 1; dist <= 5; dist++) {
          var nx = x + dirs8[d][0] * dist;
          var ny = y + dirs8[d][1] * dist;
          if (nx < 0 || nx >= bs || ny < 0 || ny >= bs) break;
          if (state.board[ny][nx] !== 0 && state.board[ny][nx] !== color) break;
          if (state.board[ny][nx] !== 0) continue; // 同色棋子不累加

          // 衰减：正交方向衰减慢，斜向衰减快
          var isOrtho = d < 4;
          var decay = isOrtho ? 1.0 / (dist * 0.8 + 0.5) : 0.6 / (dist * 1.0 + 0.5);

          // 金角银边草肚皮位置权重
          var ex = Math.min(nx, bs - 1 - nx);
          var ey = Math.min(ny, bs - 1 - ny);
          var posW = (ex <= 2 && ey <= 2) ? 1.8 : ((ex <= 2 || ey <= 2) ? 1.3 : 0.8);

          var val = decay * posW;
          if (color === 1) influence[ny][nx].black += val;
          else             influence[ny][nx].white += val;
        }
      }
    }
  }

  // === 2. 局部缠斗威胁加成 ===
  for (var y = 0; y < bs; y++) {
    for (var x = 0; x < bs; x++) {
      if (state.board[y][x] === 0) continue;
      var color = state.board[y][x];
      var opp = color === 1 ? 2 : 1;

      for (var d = 0; d < 4; d++) {
        var nx = x + dirs4[d][0];
        var ny = y + dirs4[d][1];
        if (nx < 0 || nx >= bs || ny < 0 || ny >= bs) continue;
        if (state.board[ny][nx] !== opp) continue;

        var res = goGetGroup(nx, ny, opp);
        var libs = res.liberties.length;

        if (libs === 1) {
          // 单气：可净杀，大幅提升己方势力
          var boost = res.group.length * 4.0;
          for (var k = 0; k < res.group.length; k++) {
            var gx = res.group[k].x, gy = res.group[k].y;
            if (color === 1) influence[gy][gx].black += boost;
            else             influence[gy][gx].white += boost;
            // 周边空点也受益
            for (var dd = 0; dd < 4; dd++) {
              var mx = gx + dirs4[dd][0], my = gy + dirs4[dd][1];
              if (mx >= 0 && mx < bs && my >= 0 && my < bs && state.board[my][mx] === 0) {
                if (color === 1) influence[my][mx].black += boost * 0.6;
                else             influence[my][mx].white += boost * 0.6;
              }
            }
          }
        } else if (libs === 2) {
          // 两气：打吃威胁
          var boost2 = res.group.length * 1.5;
          for (var k = 0; k < res.group.length; k++) {
            var gx = res.group[k].x, gy = res.group[k].y;
            if (color === 1) influence[gy][gx].black += boost2;
            else             influence[gy][gx].white += boost2;
          }
        }
      }

      // === 3. 己方棋组气数少时，防守加成 ===
      var selfRes = goGetGroup(x, y, color);
      if (selfRes.liberties.length === 1) {
        // 己方被打吃，周边空点（逃跑/补气点）价值提升
        for (var k = 0; k < selfRes.liberties.length; k++) {
          var lx = selfRes.liberties[k].x, ly = selfRes.liberties[k].y;
          if (color === 1) influence[ly][lx].black += selfRes.group.length * 3.0;
          else             influence[ly][lx].white += selfRes.group.length * 3.0;
        }
      }
    }
  }

  // === 4. 计算分数（含位置权重）===
  var blackScore = 0, whiteScore = 0;

  for (var y = 0; y < bs; y++) {
    for (var x = 0; x < bs; x++) {
      var ex = Math.min(x, bs - 1 - x);
      var ey = Math.min(y, bs - 1 - y);
      var posW = (ex <= 2 && ey <= 2) ? 1.8 : ((ex <= 2 || ey <= 2) ? 1.3 : 0.8);

      if (state.board[y][x] === 1) {
        blackScore += 2 * posW;
      } else if (state.board[y][x] === 2) {
        whiteScore += 2 * posW;
      } else {
        var bi = influence[y][x].black;
        var wi = influence[y][x].white;
        var total = bi + wi;
        if (total > 0.2) {
          var ratio = bi / total;
          if (ratio > 0.65)      blackScore += Math.min(2.0, total * 0.4) * posW;
          else if (ratio < 0.35) whiteScore += Math.min(2.0, total * 0.4) * posW;
          // 争夺区域双方各得一半
          else {
            blackScore += Math.min(1.0, total * 0.2) * posW;
            whiteScore += Math.min(1.0, total * 0.2) * posW;
          }
        }
      }
    }
  }

  blackScore += state.goCaptured[0];
  whiteScore += state.goCaptured[1];

  return { blackScore: blackScore, whiteScore: whiteScore, influence: influence };
}

// 绘制势力范围
function drawGoInfluence() {
  var inf = state.goEvalResult && state.goEvalResult.influence;
  if (!inf) return;

  var ctx = state.ctx;
  var bs = state.CONFIG.BOARD_SIZE;
  var bL = state.LAYOUT.boardLeft;
  var bT = state.LAYOUT.boardTop;
  var cs = state.CONFIG.CELL_SIZE;
  var dotR = cs * 0.22;

  for (var y = 0; y < bs; y++) {
    for (var x = 0; x < bs; x++) {
      if (state.board[y][x] === 0) {
        var bi = inf[y][x].black;
        var wi = inf[y][x].white;
        var total = bi + wi;

        if (total > 0.3) {
          var px = bL + x * cs;
          var py = bT + y * cs;

          if (bi > wi) {
            var alpha = Math.min(0.9, 0.3 + bi * 0.15);
            ctx.fillStyle = 'rgba(0,0,0,' + alpha.toFixed(2) + ')';
            ctx.beginPath();
            ctx.arc(px, py, dotR * Math.min(1, 0.4 + bi * 0.08), 0, Math.PI * 2);
            ctx.fill();
          } else if (wi > bi) {
            var alpha = Math.min(0.9, 0.3 + wi * 0.15);
            ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(2) + ')';
            ctx.beginPath();
            ctx.arc(px, py, dotR * Math.min(1, 0.4 + wi * 0.08), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }
}

// 评估请求
function goEvalRequest(type) {
  if (state.gameType !== 'go') return;

  var bs = state.CONFIG.BOARD_SIZE;
  var minMoves = { 9: 20, 13: 80, 19: 150 };
  var minMove = minMoves[bs] || 150;

  if (type === 1) {
    if (state.moveHistory.length < minMove) {
      state.chatMessages.push('需下满' + minMove + '手才可申请点目');
      return;
    }
    state.goEvalResult = goCountTerritory();
    var komi = state.settings.goMode.komi || 6.5;
    var blackTotal = state.goEvalResult.black;
    var whiteTotal = state.goEvalResult.white + komi;
    var lead = blackTotal - whiteTotal;
    var leadStr = lead > 0 ? '黑领先' + lead.toFixed(1) + '目' :
                  lead < 0 ? '白领先' + (-lead).toFixed(1) + '目' : '双方持平';
    state.chatMessages.push('点目:黑' + blackTotal.toFixed(1) + ' 白' + whiteTotal.toFixed(1) + ' (' + leadStr + ')');
    state.goScoreRequestActive = true;
    state.chatMessages.push('请确认判负 或 取消');
  } else if (type === 2) {
    state.goShowTerritory = !state.goShowTerritory;
    if (state.goShowTerritory) {
      state.goEvalResult = goCalculateInfluence();
      var komi = state.settings.goMode.komi || 6.5;
      var bsc = state.goEvalResult.blackScore;
      var ws = state.goEvalResult.whiteScore + komi;
      var wr = bsc / (bsc + ws) * 100;
      var lead = bsc - ws;
      var leadStr = lead > 0 ? '黑领先' + lead.toFixed(1) + '目' :
                    lead < 0 ? '白领先' + (-lead).toFixed(1) + '目' : '双方持平';
      state.chatMessages.push('胜率:' + wr.toFixed(1) + '% (' + leadStr + ')');
    } else {
      state.goEvalResult = null;
    }
  } else if (type === 3) {
    if (!state.goScoreRequestActive) {
      goUndo();
    } else {
      state.goScoreRequestActive = false;
      state.chatMessages.push('已取消');
    }
  } else if (type === 4) {
    if (!state.goScoreRequestActive) return;
    state.goScoreRequestActive = false;
    var komi = state.settings.goMode.komi || 6.5;
    var blackTotal = state.goEvalResult.black;
    var whiteTotal = state.goEvalResult.white + komi;
    state.gameOver = true;
    state.winner = blackTotal > whiteTotal ? 1 : 2;
    var lead = Math.abs(blackTotal - whiteTotal);
    var winMsg = state.winner === 1 ? '黑方胜!领先' + lead.toFixed(1) + '目' : '白方胜!领先' + lead.toFixed(1) + '目';
    state.chatMessages.push(winMsg);
    if (state.timerInterval) clearInterval(state.timerInterval);
  }
}

// 计算领地
function goCountTerritory() {
  var bs = state.CONFIG.BOARD_SIZE;
  var territory = {};

  for (var y = 0; y < bs; y++) {
    territory[y] = {};
    for (var x = 0; x < bs; x++) {
      territory[y][x] = 0;
    }
  }

  var visited = {};

  for (var y = 0; y < bs; y++) {
    for (var x = 0; x < bs; x++) {
      if (state.board[y][x] === 0 && !visited[y + ',' + x]) {
        var region = [];
        var borders = { 1: 0, 2: 0 };
        var stack = [{ x: x, y: y }];
        var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

        while (stack.length) {
          var cur = stack.pop();
          var key = cur.x + ',' + cur.y;
          if (visited[key]) continue;
          visited[key] = true;
          region.push({ x: cur.x, y: cur.y });

          for (var d = 0; d < 4; d++) {
            var nx = cur.x + dirs[d][0];
            var ny = cur.y + dirs[d][1];
            if (nx < 0 || nx >= bs || ny < 0 || ny >= bs) continue;
            if (state.board[ny][nx] === 0 && !visited[nx + ',' + ny]) {
              stack.push({ x: nx, y: ny });
            } else if (state.board[ny][nx] === 1) {
              borders[1]++;
            } else if (state.board[ny][nx] === 2) {
              borders[2]++;
            }
          }
        }

        var owner = 0;
        if (borders[1] > 0 && borders[2] === 0) owner = 1;
        else if (borders[2] > 0 && borders[1] === 0) owner = 2;

        for (var k = 0; k < region.length; k++) {
          territory[region[k].y][region[k].x] = owner;
        }
      }
    }
  }

  var blackScore = 0;
  var whiteScore = 0;

  for (var y = 0; y < bs; y++) {
    for (var x = 0; x < bs; x++) {
      if (state.board[y][x] === 1 || territory[y][x] === 1) {
        blackScore++;
      } else if (state.board[y][x] === 2 || territory[y][x] === 2) {
        whiteScore++;
      }
    }
  }

  blackScore += state.goCaptured[0];
  whiteScore += state.goCaptured[1];

  return { black: blackScore, white: whiteScore, territory: territory };
}

// AI落子 - 增强版（大局掌控 + 局部缠斗）
// ============================================================
// 大师级围棋AI评估系统
// ============================================================

// 围棋AI
function goAiMove() {
  if (state.gameOver) return;

  var g = state.settings.goMode;
  var myColor = g.playerColor === 1 ? 2 : 1;
  var playerColor = g.playerColor;
  var bs = state.CONFIG.BOARD_SIZE;
  var diff = g.difficulty || 'kyu10';
  var komi = g.komi || 6.5;
  var startTime = Date.now();
  var maxThinkMs = 15000;

  var currentInf = goCalculateInfluence();
  var currentWinRate = currentInf.blackScore / (currentInf.blackScore + currentInf.whiteScore + komi) * 100;
  if (myColor === 2) currentWinRate = 100 - currentWinRate;

  var candidates = [];

  for (var y = 0; y < bs; y++) {
    for (var x = 0; x < bs; x++) {
      if (!goIsValidMove(x, y, myColor)) continue;

      var savedBoard = [];
      for (var r = 0; r < bs; r++) savedBoard[r] = state.board[r].slice();

      state.board[y][x] = myColor;
      var caps = 0;
      var dirs4 = [[-1,0],[1,0],[0,-1],[0,1]];
      for (var d = 0; d < 4; d++) {
        var nx = x + dirs4[d][0];
        var ny = y + dirs4[d][1];
        if (nx >= 0 && nx < bs && ny >= 0 && ny < bs && state.board[ny][nx] === playerColor) {
          var res = goGetGroup(nx, ny, playerColor);
          if (res.liberties.length === 0) {
            caps += res.group.length;
            goRemoveGroup(res.group);
          }
        }
      }

      var afterInf = goCalculateInfluence();
      var blackAfter = afterInf.blackScore;
      var whiteAfter = afterInf.whiteScore + komi;
      var winRateAfter = myColor === 1 ? blackAfter / (blackAfter + whiteAfter) * 100 : 100 - blackAfter / (blackAfter + whiteAfter) * 100;
      var winDelta = winRateAfter - currentWinRate;

      var cx = Math.min(x, bs - 1 - x);
      var cy = Math.min(y, bs - 1 - y);
      var posW = 1.0;
      if (cx <= 2 && cy <= 2) posW = 1.8;
      else if (cx <= 3 || cy <= 3) posW = 1.3;
      else if (cx >= 4 && cy >= 4) posW = 0.8;

      var finalScore = 0;
      if (diff === 'kyu10') {
        finalScore = winDelta * 1.5 + caps * 2 + Math.random() * 15;
      } else if (diff === 'kyu5') {
        finalScore = winDelta * 4 + caps * 4 + posW * 3 + Math.random() * 8;
      } else if (diff === 'dan1') {
        finalScore = winDelta * 8 + caps * 6 + posW * 5 + (winRateAfter > 50 ? 15 : 0);
      } else {
        finalScore = winDelta * 12 + caps * 8 + posW * 8 + (winRateAfter > 55 ? 25 : 0) + (caps > 0 ? 20 : 0);
      }

      candidates.push({ x: x, y: y, score: finalScore, winRate: winRateAfter, caps: caps, posW: posW });

      state.board = savedBoard;

      if (Date.now() - startTime > maxThinkMs * 0.8) break;
    }
    if (Date.now() - startTime > maxThinkMs * 0.8) break;
  }

  candidates.sort(function(a, b) { return b.score - a.score; });

  var move = null;
  if (candidates.length > 0) {
    var topN;
    if (diff === 'kyu10') topN = Math.min(20, candidates.length);
    else if (diff === 'kyu5') topN = Math.min(10, candidates.length);
    else if (diff === 'dan1') topN = Math.min(5, candidates.length);
    else topN = Math.min(3, candidates.length);
    move = candidates[Math.floor(Math.random() * topN)];
  }

  if (!move && candidates.length > 0) move = candidates[0];

  if (move) {
    var prevStr = goBoardStr();
    state.board[move.y][move.x] = myColor;
    var totalCap = 0;
    var dirs4 = [[-1,0],[1,0],[0,-1],[0,1]];
    for (var d = 0; d < 4; d++) {
      var nx = move.x + dirs4[d][0];
      var ny = move.y + dirs4[d][1];
      if (nx >= 0 && nx < bs && ny >= 0 && ny < bs && state.board[ny][nx] === playerColor) {
        var res = goGetGroup(nx, ny, playerColor);
        if (res.liberties.length === 0) {
          totalCap += res.group.length;
          goRemoveGroup(res.group);
        }
      }
    }
    state.goCaptured[myColor - 1] += totalCap;
    state.lastMove = { x: move.x, y: move.y };
    state.moveHistory.push({
      x: move.x, y: move.y, player: myColor,
      boardSnap: prevStr, captured: totalCap, koPoint: state.goKoPoint
    });
    state.goPassCount = 0;
    state.goShowTerritory = false;
    state.goEvalResult = null;
    state.currentPlayer = playerColor;
    state.isMyTurn = true;
  } else {
    onGoPass();
  }
}

module.exports = {
  initGoGame: initGoGame,
  goGetGroup: goGetGroup,
  goRemoveGroup: goRemoveGroup,
  goBoardStr: goBoardStr,
  goIsValidMove: goIsValidMove,
  goConfirmPlace: goConfirmPlace,
  onGoPass: onGoPass,
  goUndo: goUndo,
  goEndCount: goEndCount,
  goCalculateInfluence: goCalculateInfluence,
  drawGoInfluence: drawGoInfluence,
  goEvalRequest: goEvalRequest,
  goCountTerritory: goCountTerritory,
  goAiMove: goAiMove
};
