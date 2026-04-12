/**
 * test_board.js - 棋盘初始化测试
 * 营地坐标 camp[i] = [col, row]（注意：是 col 在前，row 在后）
 */

var T = require('./util.js');

// placeCamp(board, camp, player) 期望 camp[i] = [col, row]
var CAMPS = {
  camp1: [[6,0],[5,1],[6,1],[5,2],[6,2],[7,2],[4,3],[5,3],[6,3],[7,3]],
  camp2: [[9,4],[10,4],[11,4],[12,4],[9,5],[10,5],[11,5],[10,6],[11,6],[10,7]],
  camp3: [[10,9],[10,10],[11,10],[9,11],[10,11],[11,11],[9,12],[10,12],[11,12],[12,12]],
  camp4: [[4,13],[5,13],[6,13],[7,13],[5,14],[6,14],[7,14],[5,15],[6,15],[6,16]],
  camp5: [[1,9],[1,10],[2,10],[0,11],[1,11],[2,11],[0,12],[1,12],[2,12],[3,12]],
  camp6: [[0,4],[1,4],[2,4],[3,4],[0,5],[1,5],[2,5],[1,6],[2,6],[1,7]]
};

function createBoard() {
  var b = []; for (var r = 0; r < 17; r++) { b[r] = []; for (var c = 0; c < 17; c++) b[r][c] = 0; }
  return b;
}

// placeCamp 期望 camp[i] = [col, row]
function placeCamp(board, camp, player) {
  for (var i = 0; i < camp.length; i++) { board[camp[i][1]][camp[i][0]] = player; }
}

var passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('  ✓ ' + msg); }
  else { failed++; console.log('  ✗ ' + msg); }
}

// ---- 1. 棋盘结构 ----
console.log('\n[1] 棋盘结构');
var total = T.ROW_COUNTS.reduce(function(a,b){return a+b;},0);
assert(total === 121, '总点数=121');
T.ROW_COUNTS.forEach(function(count, row) {
  var sc = T.getRowStartCol(row);
  assert(T.isOnBoard(row, sc), '行'+row+' 首col'+sc+' 在棋盘内');
  assert(T.isOnBoard(row, sc+count-1), '行'+row+' 末col'+(sc+count-1)+' 在棋盘内');
  assert(!T.isOnBoard(row, sc-1), '行'+row+' col'+(sc-1)+' 应在棋盘外');
  assert(!T.isOnBoard(row, sc+count), '行'+row+' col'+(sc+count)+' 应在棋盘外');
});

// ---- 2. 营地坐标合法性 ----
console.log('\n[2] 营地坐标合法性');
Object.keys(CAMPS).forEach(function(name) {
  var invalid = [];
  CAMPS[name].forEach(function(pos) {
    // pos = [col, row]
    if (!T.isOnBoard(pos[1], pos[0])) invalid.push('(col='+pos[0]+',row='+pos[1]+')');
  });
  assert(invalid.length === 0, name+' 位置全部合法'+(invalid.length===0?'':' 无效:'+invalid.join(',')));
});

// ---- 3. 棋子不重叠 ----
console.log('\n[3] 棋子不重叠');
(function() {
  var b = createBoard();
  var overlaps = [];
  Object.keys(CAMPS).forEach(function(name, idx) {
    CAMPS[name].forEach(function(pos) {
      if (b[pos[1]][pos[0]] !== 0) overlaps.push(name+'棋子(col='+pos[0]+',row='+pos[1]+')已有'+b[pos[1]][pos[0]]);
      b[pos[1]][pos[0]] = idx + 1;
    });
  });
  assert(overlaps.length === 0, '无重叠'+(overlaps.length===0?'':' 冲突:'+overlaps.join('; ')));
})();

// ---- 4. 各营地棋子数量 ----
console.log('\n[4] 各营地棋子数量');
Object.keys(CAMPS).forEach(function(name) {
  assert(CAMPS[name].length === 10, name+' 应有10子，实际='+CAMPS[name].length);
});

// ---- 5. 2人模式 ----
console.log('\n[5] 2人模式（南vs北）');
(function() {
  var b = createBoard();
  placeCamp(b, CAMPS.camp4, 1);
  placeCamp(b, CAMPS.camp1, 2);
  var cnt = [0,0,0];
  for (var r = 0; r < 17; r++) {
    for (var c = T.getRowStartCol(r), mx = c+T.ROW_COUNTS[r]; c < mx; c++) {
      var v = b[r][c];
      if (v >= 1 && v <= 6) cnt[v]++;
    }
  }
  assert(cnt[1] === 10, '玩家1=10子，实际='+cnt[1]);
  assert(cnt[2] === 10, '玩家2=10子，实际='+cnt[2]);
  assert(cnt[1]+cnt[2] === 20, '总计20子');
})();

// ---- 6. 6人模式 ----
console.log('\n[6] 6人模式');
(function() {
  var b = createBoard();
  placeCamp(b, CAMPS.camp4, 1);
  placeCamp(b, CAMPS.camp5, 2);
  placeCamp(b, CAMPS.camp6, 3);
  placeCamp(b, CAMPS.camp1, 4);
  placeCamp(b, CAMPS.camp2, 5);
  placeCamp(b, CAMPS.camp3, 6);
  var cnt = [0,0,0,0,0,0,0];
  for (var r = 0; r < 17; r++) {
    for (var c = T.getRowStartCol(r), mx = c+T.ROW_COUNTS[r]; c < mx; c++) {
      var v = b[r][c];
      if (v >= 1 && v <= 6) cnt[v]++;
    }
  }
  var ok = cnt.slice(1).every(function(n){return n===10;});
  assert(ok, '6人各10子: '+cnt.slice(1).join(',')+' (期望全为10)');
})();

// ---- 7. board坐标和user坐标转换对应 ----
console.log('\n[7] 营地棋子board→user映射');
Object.keys(CAMPS).forEach(function(name) {
  var allValid = true;
  CAMPS[name].forEach(function(pos) {
    var u = T.boardToUser(pos[1], pos[0]);
    if (!T.isValidCheckersPos(u.x, u.y)) allValid = false;
  });
  assert(allValid, name+' 所有棋子board→user映射有效');
});

console.log('\n========== 棋盘测试汇总 ==========');
console.log('通过: ' + passed + '  失败: ' + failed);
console.log(failed === 0 ? '✅ 全部通过' : '❌ 有 ' + failed + ' 个失败');
module.exports = { passed: passed, failed: failed };
