/**
 * test_jump.js - 跳跃逻辑测试
 */

var T = require('./util.js');

function createBoard() {
  var b = []; for (var r = 0; r < 17; r++) { b[r] = []; for (var c = 0; c < 17; c++) b[r][c] = 0; }
  return b;
}
function place(b, r, c, v) { b[r][c] = v; }

function checkersGetJumps(row, col, piece, board, moves, visited) {
  for (var d = 0; d < 6; d++) {
    var mid = T.getNeighbor(row, col, d);
    if (!mid || !T.isOnBoard(mid.row, mid.col)) continue;
    if (board[mid.row][mid.col] === 0) continue;
    var land = T.getNeighbor(mid.row, mid.col, d);
    if (!land || !T.isOnBoard(land.row, land.col)) continue;
    if (board[land.row][land.col] !== 0) continue;
    var key = land.row + ',' + land.col;
    if (visited[key]) continue;
    visited[key] = true;
    moves.push({
      x: land.row + 1, y: land.col - T.getRowStartCol(land.row) + 1,
      isJump: true, jumpRow: mid.row, jumpCol: mid.col, row: land.row, col: land.col
    });
    checkersGetJumps(land.row, land.col, piece, board, moves, visited);
  }
}

function findMove(moves, row, col) {
  for (var i = 0; i < moves.length; i++) if (moves[i].row === row && moves[i].col === col) return moves[i];
  return null;
}

function calcJump(sx, sy, d) {
  var mid = T.getNeighbor(sx, sy, d);
  if (!mid) return null;
  var land = T.getNeighbor(mid.row, mid.col, d);
  if (!land) return null;
  return { row: land.row, col: land.col, midRow: mid.row, midCol: mid.col };
}

var passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('  ✓ ' + msg); }
  else { failed++; console.log('  ✗ ' + msg); }
}

// ---- 1. 6方向全覆盖 ----
console.log('\n[1] 6方向全覆盖');
[[13,5],[13,6],[14,5],[14,6],[8,6],[9,6],[11,5],[11,6],[12,5],[12,6]].forEach(function(start) {
  var sx = start[0], sy = start[1];
  if (!T.isOnBoard(sx, sy)) return;
  for (var d = 0; d < 6; d++) {
    var exp = calcJump(sx, sy, d);
    if (!exp) continue;
    var b = createBoard();
    place(b, sx, sy, 1);
    place(b, exp.midRow, exp.midCol, 2);
    var moves = [];
    checkersGetJumps(sx, sy, 1, b, moves, {});
    var m = findMove(moves, exp.row, exp.col);
    assert(m !== null && m.jumpRow === exp.midRow && m.jumpCol === exp.midCol,
      '起点('+sx+','+sy+') '+T.DIR[d]+' → 落点('+exp.row+','+exp.col+') 中间('+exp.midRow+','+exp.midCol+')');
  }
});

// ---- 2. 跳跃规则边界 ----
console.log('\n[2] 跳跃规则边界');
(function() {
  var b = createBoard(); place(b,14,5,1); place(b,14,6,2); place(b,14,7,1);
  var m = []; checkersGetJumps(14,5,1,b,m,{});
  assert(m.length === 0, '落点有己方 → 不能跳');
})();
(function() {
  var b = createBoard(); place(b,14,5,1); place(b,14,6,2); place(b,14,7,3);
  var m = []; checkersGetJumps(14,5,1,b,m,{});
  assert(m.length === 0, '落点有敌方 → 不能跳');
})();
(function() {
  var b = createBoard(); place(b,14,5,1); place(b,14,6,0);
  var m = []; checkersGetJumps(14,5,1,b,m,{});
  assert(m.length === 0, '中间点为空 → 不能跳');
})();
(function() {
  var b = createBoard(); place(b,14,5,1); place(b,14,6,2);
  var m = []; checkersGetJumps(14,5,1,b,m,{});
  assert(m.length > 0, '中间敌子+落点空 → 能跳，'+m.length+'个');
})();

// ---- 3. 连跳 ----
console.log('\n[3] 连跳');
(function() {
  // (11,5) → 中间(11,6)=p2 → 落点(11,7)（必须为空！）
  // 然后从(11,7)继续：中间(12,8)=p2 → 落点(13,9)
  var b = createBoard();
  place(b,11,5,1); place(b,11,6,2); place(b,11,7,0); // 落点空
  var moves = []; checkersGetJumps(11,5,1,b,moves,{});
  assert(moves.length >= 1, '第一跳找到 '+moves.length+'个');
  if (moves.length > 0) {
    var j = findMove(moves, 11, 7);
    assert(!!j, '落点(11,7)存在');
  }
  // 连跳：从(11,7)继续
  if (moves.length > 0) {
    var b2 = createBoard();
    place(b2,11,7,1); place(b2,10,8,2);
    var chain = []; checkersGetJumps(11,7,1,b2,chain,{'11,7':true});
    assert(chain.length >= 1, '连跳：从(11,7)找到后续 '+chain.length+'个');
    if (chain.length > 0) {
      console.log('    后续跳落点: ' + chain.map(function(m){return '('+m.row+','+m.col+')';}).join(','));
    }
  }
})();

// ---- 4. 三角区跳跃 ----
console.log('\n[4] 三角区跳跃');
(function() {
  if (!T.isOnBoard(4,5)) return;
  var mid = T.getNeighbor(4,5,2);
  if (mid) {
    var b = createBoard(); place(b,4,5,1); place(b,mid.row,mid.col,2);
    var m = []; checkersGetJumps(4,5,1,b,m,{});
    assert(m.length > 0, '三角区(4,5)能跳');
    if (m.length > 0) console.log('    三角区跳落点: '+m.map(function(x){return '('+x.row+','+x.col+')';}).join(','));
  }
})();

// ---- 5. 执行跳跃后棋盘状态 ----
console.log('\n[5] 执行跳跃后棋盘状态');
(function() {
  var b = createBoard(); place(b,11,5,1); place(b,11,6,2);
  var moves = []; checkersGetJumps(11,5,1,b,moves,{});
  var j = findMove(moves, 11, 7);
  assert(j !== null, '找到跳跃到(11,7)');
  if (!j) return;
  b[11][5] = 0; b[j.jumpRow][j.jumpCol] = 0; b[j.row][j.col] = 1;
  assert(b[11][5] === 0, '起点(11,5)已清空');
  assert(b[11][6] === 0, '中间子(11,6)已移除');
  assert(b[11][7] === 1, '落点(11,7)已放棋子');
})();

console.log('\n========== 跳跃测试汇总 ==========');
console.log('通过: ' + passed + '  失败: ' + failed);
console.log(failed === 0 ? '✅ 全部通过' : '❌ 有 ' + failed + ' 个失败');
module.exports = { passed: passed, failed: failed };
