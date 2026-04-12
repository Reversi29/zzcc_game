/**
 * run_tests.js - 测试运行器
 */

var fs = require('fs');
var path = require('path');

var tests = ['test_direction.js', 'test_jump.js', 'test_coordinate.js', 'test_board.js'];

console.log('========================================');
console.log('  棋棋 - 跳棋模块 测试套件');
console.log('========================================\n');

var totalPassed = 0, totalFailed = 0;

tests.forEach(function(name) {
  var filePath = path.join(__dirname, name);
  if (!fs.existsSync(filePath)) {
    console.log('[跳过] ' + name + ' - 文件不存在');
    return;
  }
  console.log('\n' + '~'.repeat(50));
  console.log('运行: ' + name);
  console.log('~'.repeat(50));
  try {
    var result = require(filePath);
    totalPassed += result.passed;
    totalFailed += result.failed;
  } catch (e) {
    console.log('  ✗ 运行错误: ' + e.message);
    totalFailed++;
  }
});

console.log('\n' + '='.repeat(50));
console.log('  测试汇总');
console.log('='.repeat(50));
console.log('  总通过: ' + totalPassed);
console.log('  总失败: ' + totalFailed);
console.log('  总用例: ' + (totalPassed + totalFailed));
var rate = (totalPassed / (totalPassed + totalFailed) * 100).toFixed(1);
console.log('  通过率: ' + rate + '%');
console.log(totalFailed === 0 ? '\n  ✅ 全部测试通过' : '\n  ❌ 有 ' + totalFailed + ' 个测试失败');

process.exit(totalFailed > 0 ? 1 : 0);
