/**
 * test_coordinate.js - 坐标转换测试
 * 验证坐标转换的双向互逆
 */

var T = require('./util.js');
var passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('  ✓ ' + msg); }
  else { failed++; console.log('  ✗ ' + msg); }
}

console.log('\n[1] userToBoard ↔ boardToUser 双向互逆');
var errs = 0;
for (var x = 1; x <= 17; x++) {
  for (var y = 1; y <= 17; y++) {
    if (!T.isValidCheckersPos(x, y)) continue;
    var b = T.userToBoard(x, y);
    var u = T.boardToUser(b.row, b.col);
    if (u.x !== x || u.y !== y) {
      errs++;
      if (errs <= 3) console.log('    ERR: user('+x+','+y+')→board('+b.row+','+b.col+')→user('+u.x+','+u.y+')');
    }
  }
}
assert(errs === 0, '双向转换互逆，错误=' + errs);

console.log('\n[2] isValidCheckersPos 和 board内检查一致性');
var mism = 0;
for (var x = 1; x <= 17; x++) {
  for (var y = 1; y <= 17; y++) {
    var board = T.userToBoard(x, y);
    var isV = T.isValidCheckersPos(x, y);
    var boardV = T.isOnBoard(board.row, board.col);
    if (isV !== boardV) { mism++; if (mism <= 3) console.log('    MISMATCH: user('+x+','+y+') isValid='+isV+' boardValid='+boardV); }
  }
}
assert(mism === 0, 'isValid和board检查一致，错误=' + mism);

console.log('\n[3] 棋盘完整性');
var total = T.ROW_COUNTS.reduce(function(a,b){return a+b;},0);
assert(total === 121, '总点数=121，实际='+total);
var cnt = 0;
for (var r = 0; r < 17; r++) for (var c = T.getRowStartCol(r), mx = c+T.ROW_COUNTS[r]; c < mx; c++) if (T.isOnBoard(r,c)) cnt++;
assert(cnt === 121, 'board总点数=121，实际='+cnt);

console.log('\n[4] user坐标范围验证');
var rangeErr = 0;
for (var x = 1; x <= 17; x++) {
  for (var y = 1; y <= 17; y++) {
    if (!T.isValidCheckersPos(x, y)) continue;
    var u = T.boardToUser(T.userToBoard(x, y).row, T.userToBoard(x, y).col);
    if (u.x < 1 || u.x > 17 || u.y < 1 || u.y > 17) { rangeErr++; if (rangeErr <= 3) console.log('    ERR: user('+x+','+y+')→'+u.x+','+u.y); }
  }
}
assert(rangeErr === 0, 'user坐标范围1-17，错误=' + rangeErr);

console.log('\n[5] 关键点验证');
// boardToUser: 直接用几何算
var keyBoard = [[8,7],[8,2],[8,10],[9,1],[9,6],[9,10],[13,5],[14,5],[0,6],[16,6]];
keyBoard.forEach(function(p) {
  if (!T.isOnBoard(p[0],p[1])) return;
  var u = T.boardToUser(p[0],p[1]);
  assert(T.isValidCheckersPos(u.x,u.y), 'board('+p[0]+','+p[1]+')→user('+u.x+','+u.y+')有效');
  // 反查
  var b2 = T.userToBoard(u.x,u.y);
  assert(b2.row===p[0]&&b2.col===p[1], 'user('+u.x+','+u.y+')→board('+b2.row+','+b2.col+')回溯正确');
});

console.log('\n========== 坐标转换测试汇总 ==========');
console.log('通过: ' + passed + '  失败: ' + failed);
console.log(failed === 0 ? '✅ 全部通过' : '❌ 有 ' + failed + ' 个失败');
module.exports = { passed: passed, failed: failed };
