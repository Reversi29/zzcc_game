/**
 * 棋棋 - 全局状态管理
 * 使用单例模式确保所有模块共享同一状态对象
 */

// 创建全局状态对象（使用对象属性而非变量）
var state = module.exports = {
  // 棋盘配置
  CONFIG: {
    BOARD_SIZE: 19,
    CELL_SIZE: 0,
    PIECE_RADIUS: 0,
    AI_DELAY: 800
  },

  // 布局配置
  LAYOUT: {
    topH: 40,
    chatH: 90,
    actionH: 100,
    boardLeft: 0,
    boardTop: 0,
    boardPx: 0
  },

  // 游戏状态
  gameState: 'menu',
  currentScreen: '',
  gameType: 'gomoku',

  // 棋盘数据
  board: [],
  currentPlayer: 1,
  isMyTurn: true,
  gameOver: false,
  winner: null,
  lastMove: null,
  moveHistory: [],
  aiMoveToken: 0,

  // 落子预览
  previewX: -1,
  previewY: -1,
  canPlace: false,

  // 计时器
  playerTime: 15,
  aiTime: 15,
  timerInterval: null,
  playerTimeoutCount: 0,
  aiTimeoutCount: 0,

  // 消息
  chatMessages: [],
  currentTime: '00:00',

  // 菜单
  menuButtons: [],
  hoveredBtn: null,

  // 设置
  settings: {
    normalMode: {
      difficulty: 'normal',
      countdown: false,
      playerColor: 0,
      vsMode: 'ai'
    },
    goMode: {
      boardSize: 19,
      komi: 6.5,
      vsMode: 'ai',
      difficulty: 'kyu10',
      playerColor: 0
    },
    xiangqiMode: {
      vsMode: 'ai',
      difficulty: 'normal',
      playerColor: 0
    },
    checkersMode: {
      players: 2,
      aiCount: 1,
      difficulty: 'normal'
    },
    junqiMode: {
      vsMode: 'ai',
      difficulty: 'normal',
      playerColor: 0
    },
    othelloMode: {
      vsMode: 'ai',
      difficulty: 'normal',
      playerColor: 1
    },
    general: {
      sound: true,
      music: true,
      vibration: true
    }
  },

  // 系统变量
  systemInfo: null,
  canvas: null,
  ctx: null,
  W: 0,
  H: 0,

  // 围棋专用
  goCaptured: [0, 0],
  goPassCount: 0,
  goKoPoint: null,
  goPrevBoardStr: '',
  goEvalMode: 0,
  goEvalResult: null,
  goShowTerritory: false,
  goScoreRequestActive: false,
  goMoveCount: 0,

  // 军旗专用
  junqiSelectedPiece: null,
  junqiValidMoves: [],
  junqiRevealed: [],

  // 黑白棋专用
  othelloBlackCount: 2,
  othelloWhiteCount: 2
};
