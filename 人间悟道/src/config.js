// 配置模块
// 领域映射、平衡数值

const balance = {
  baseIdleRate: 1,
  upgradeMultiplier: 1.25,
  maxOfflineHours: 24,
  questionReward: 10,
};

function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function getSeasonBgPath(season) {
  return `assets/images/bg/bg_${season}.jpg`;
}

module.exports = {
  balance,
  getCurrentSeason,
  getSeasonBgPath,
};
