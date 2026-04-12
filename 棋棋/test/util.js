/**
 * util.js - 测试共享工具（和 checkers.js 完全一致）
 */

var ROW_COUNTS = [1, 2, 3, 4, 13, 12, 11, 10, 9, 10, 11, 12, 13, 4, 3, 2, 1];

function getRowStartCol(row) {
  var count = ROW_COUNTS[row];
  var maxCount = 13;
  return Math.floor((maxCount - count) / 2);
}

function isOnBoard(row, col) {
  if (row < 0 || row >= 17) return false;
  var sc = getRowStartCol(row);
  return col >= sc && col < sc + ROW_COUNTS[row];
}

// 修正：和 userToBoard 完全一致的列计算
function isValidCheckersPos(x, y) {
  var row = x - 1;
  if (row < 0 || row >= 17) return false;
  var startCol = getRowStartCol(row);
  var col = startCol + (y - 1);  // ← 这里必须加 startCol
  return isOnBoard(row, col);
}

function userToBoard(x, y) {
  var row = x - 1;
  var startCol = getRowStartCol(row);
  var actualCol = startCol + (y - 1);
  return { row: row, col: actualCol };
}

function boardToUser(row, col) {
  var sc = getRowStartCol(row);
  return { x: row + 1, y: col - sc + 1 };
}

var DIR = ['E', 'W', 'SE', 'SW', 'NW', 'NE'];
var OPP = [1, 0, 4, 5, 2, 3];

function getNeighborRaw(r, c, d) {
  if (d === 0) return isOnBoard(r, c + 1) ? { row: r, col: c + 1 } : null;
  if (d === 1) return isOnBoard(r, c - 1) ? { row: r, col: c - 1 } : null;
  if (d === 2) { var nr = r + 1, nc = c + (r % 2 === 1 ? 1 : 0);  return isOnBoard(nr, nc) ? { row: nr, col: nc } : null; }
  if (d === 3) { var nr = r + 1, nc = c + (r % 2 === 1 ? 0 : -1); return isOnBoard(nr, nc) ? { row: nr, col: nc } : null; }
  if (d === 4) { var nr = r - 1, nc = c + (r % 2 === 1 ? 0 : -1); return isOnBoard(nr, nc) ? { row: nr, col: nc } : null; }
  if (d === 5) { var nr = r - 1, nc = c + (r % 2 === 1 ? 1 : 0);  return isOnBoard(nr, nc) ? { row: nr, col: nc } : null; }
  return null;
}

var _DIR_TABLE = null;
function buildDirTable() {
  var table = {};
  for (var r = 0; r < 17; r++) {
    for (var c = getRowStartCol(r), mx = c + ROW_COUNTS[r]; c < mx; c++) {
      table[r + ',' + c] = {};
      for (var d = 0; d < 6; d++) {
        table[r + ',' + c][DIR[d]] = getNeighborRaw(r, c, d);
      }
    }
  }
  return table;
}

function getNeighbor(row, col, d) {
  if (!_DIR_TABLE) _DIR_TABLE = buildDirTable();
  var t = _DIR_TABLE[row + ',' + col];
  if (!t) return null;
  return t[DIR[d]] || null;
}

module.exports = {
  ROW_COUNTS: ROW_COUNTS,
  getRowStartCol: getRowStartCol,
  isOnBoard: isOnBoard,
  userToBoard: userToBoard,
  boardToUser: boardToUser,
  isValidCheckersPos: isValidCheckersPos,
  getNeighbor: getNeighbor,
  DIR: DIR,
  OPP: OPP
};
