/**
 * test_direction.js - 方向表测试
 */

var T = require('./util.js');

var passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('  ✓ ' + msg); }
  else { failed++; console.log('  ✗ ' + msg); }
}

// ---- 1. 方向对验证（最重要不变量） ----
console.log('\n[1] 方向对验证（726个方向）');
var errPairs = [];
for (var r = 0; r < 17; r++) {
  for (var c = T.getRowStartCol(r), mx = c+T.ROW_COUNTS[r]; c < mx; c++) {
    for (var d = 0; d < 6; d++) {
      var nb = T.getNeighbor(r, c, d);
      if (!nb) continue;
      var back = T.getNeighbor(nb.row, nb.col, T.OPP[d]);
      if (!back || back.row !== r || back.col !== c)
        errPairs.push(T.DIR[d]+'('+r+','+c+')');
    }
  }
}
assert(errPairs.length === 0, '方向对 726/726 全部互逆，错误='+errPairs.length);

// ---- 2. 全棋盘方向几何验证（程序生成预期） ----
console.log('\n[2] 全棋盘方向几何验证');
var geoErr = 0;
for (var r = 0; r < 17; r++) {
  for (var c = T.getRowStartCol(r), mx = c+T.ROW_COUNTS[r]; c < mx; c++) {
    for (var d = 0; d < 6; d++) {
      var nb = T.getNeighbor(r, c, d);
      if (!nb) continue;
      var isOdd = r % 2 === 1;
      var exp = null;
      if (d === 0)      exp = {row: r,     col: c+1};
      else if (d === 1)  exp = {row: r,     col: c-1};
      else if (d === 2) exp = {row: r+1,   col: isOdd ? c+1 : c};
      else if (d === 3) exp = {row: r+1,   col: isOdd ? c   : c-1};
      else if (d === 4) exp = {row: r-1,   col: isOdd ? c   : c-1};
      else if (d === 5) exp = {row: r-1,   col: isOdd ? c+1 : c};
      if (exp && (nb.row !== exp.row || nb.col !== exp.col)) {
        geoErr++;
        if (geoErr <= 3) console.log('    ('+r+','+c+') '+T.DIR[d]+' → ('+nb.row+','+nb.col+') 预期('+exp.row+','+exp.col+')');
      }
    }
  }
}
assert(geoErr === 0, '全棋盘方向几何验证，错误='+geoErr);

// ---- 3. 边界邻居存在性 ----
console.log('\n[3] 边界邻居存在性');
assert(T.getNeighbor(8,2,1) === null, '行8 col2 W=null（左缘）');
assert(T.getNeighbor(9,1,1) === null, '行9 col1 W=null（左缘）');
assert(T.getNeighbor(8,10,0) === null, '行8 col10 E=null（右缘）');
assert(T.getNeighbor(9,10,0) === null, '行9 col10 E=null（右缘）');
assert(T.getNeighbor(0,6,0) === null, '行0 col6 E=null');
assert(T.getNeighbor(0,6,1) === null, '行0 col6 W=null');
assert(T.getNeighbor(0,6,2) !== null, '行0 col6 SE');
assert(T.getNeighbor(0,6,3) !== null, '行0 col6 SW');
assert(T.getNeighbor(16,6,0) === null, '行16 col6 E=null');
assert(T.getNeighbor(16,6,1) === null, '行16 col6 W=null');
assert(T.getNeighbor(16,6,4) !== null, '行16 col6 NW');
assert(T.getNeighbor(16,6,5) !== null, '行16 col6 NE');

// ---- 4. 特殊指向验证 ----
console.log('\n[4] 特殊指向验证');
// even行偶列：SE和SW可能指向不同点（因为跳棋方向vs纯几何）
// odd行奇列：NW和NE可能指向不同点
// 验证：这些邻居都存在
[14,6,12,6,10,6,8,6,6,6,4,6,2,6].forEach(function(c) {
  if (!T.isOnBoard(14,c)) return;
  var se = T.getNeighbor(14,c,2), sw = T.getNeighbor(14,c,3);
  assert(se && sw, 'even行14 col'+c+' SE=('+se.row+','+se.col+') SW=('+sw.row+','+sw.col+')');
});
[13,5,11,5,9,5,7,5,5,5,3,5,1,5].forEach(function(c) {
  if (!T.isOnBoard(13,c)) return;
  var nw = T.getNeighbor(13,c,4), ne = T.getNeighbor(13,c,5);
  assert(nw && ne, 'odd行13 col'+c+' NW=('+nw.row+','+nw.col+') NE=('+ne.row+','+ne.col+')');
});

console.log('\n========== 方向表测试汇总 ==========');
console.log('通过: ' + passed + '  失败: ' + failed);
console.log(failed === 0 ? '✅ 全部通过' : '❌ 有 ' + failed + ' 个失败');
module.exports = { passed: passed, failed: failed };
