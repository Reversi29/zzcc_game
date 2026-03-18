const { state } = require("./state");
const { getCurrentSeason, getSeasonBgPath } = require("./config");

let bgImage = null;
let centerButtonImage = null;
let roleImage = null;
let currentSeason = getCurrentSeason();

function loadBgImage() {
  if (!bgImage) {
    bgImage = tt.createImage();
    bgImage.src = getSeasonBgPath(currentSeason);
  }
  if (!centerButtonImage) {
    centerButtonImage = tt.createImage();
    centerButtonImage.src = "assets/images/btn/btn_center.png";
  }
  if (!roleImage) {
    roleImage = tt.createImage();
    roleImage.src = "assets/images/role/role_1.png";
  }
}

function render(ctx, width, height, inputState) {
  // 获取时间和电量
  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  let batteryStr = '';
  try {
    const battery = tt.getBatteryInfoSync();
    batteryStr = battery.level + '%';
  } catch (e) {
    // 电量API不可用
  }

  // 绘制背景
  let minOffset = 0, maxOffset = 0;
  if (bgImage && bgImage.complete) {
    const bgWidth = bgImage.width;
    const bgHeight = bgImage.height;
    const scale = height / bgHeight;
    const scaledWidth = bgWidth * scale;
    const centerX = (width - scaledWidth) / 2;
    const x = centerX + state.bgOffset;

    // 计算边界
    const halfRange = Math.max(0, (scaledWidth - width) / 2);
    minOffset = -halfRange;
    maxOffset = halfRange;

    ctx.drawImage(bgImage, x, 0, scaledWidth, height);

    // 绘制人物（在背景图中间偏下位置）
    if (roleImage && roleImage.complete) {
      const roleWidth = 200;
      const roleHeight = 200;
      const x_on_bg = scaledWidth / 2 - roleWidth / 2;
      const y_on_bg = height * 0.525;
      const x_draw = centerX + state.bgOffset + x_on_bg;
      const y_draw = y_on_bg;
      ctx.drawImage(roleImage, x_draw, y_draw, roleWidth, roleHeight);
    }
  } else {
    // 备用背景
    ctx.fillStyle = "#E5EBF6";
    ctx.fillRect(0, 0, width, height);
  }

  // 绘制返回中间按钮（如果不在中间）
  let centerButton = null;
  if (Math.abs(state.bgOffset) > 20) { // 允许小误差，多给几个像素
    const buttonW = 60;
    const buttonH = 60; // 改为正方形
    const buttonY = height / 2 - buttonH / 2;
    let buttonX;
    if (state.bgOffset < 0) {
      // 偏左，按钮在右边
      buttonX = 0;
    } else {
      // 偏右，按钮在左边
      buttonX = width - buttonW;
    }
    // 绘制按钮
    if (centerButtonImage && centerButtonImage.complete) {
      ctx.drawImage(centerButtonImage, buttonX, buttonY, buttonW, buttonH);
    } else {
      // 备用：绘制矩形
      ctx.fillStyle = "#FF5722";
      ctx.fillRect(buttonX, buttonY, buttonW, buttonH);
      ctx.strokeStyle = "#D84315";
      ctx.lineWidth = 2;
      ctx.strokeRect(buttonX, buttonY, buttonW, buttonH);
      ctx.fillStyle = "#fff";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("居中", buttonX + buttonW / 2, buttonY + buttonH / 2);
      ctx.textAlign = "left";
    }

    centerButton = { x: buttonX, y: buttonY, w: buttonW, h: buttonH };
  }

  // 绘制聊天框（半透明黑色）
  const isChatExpanded = state.chatBoxExpanded || state.inChatMode; // 在聊天模式下强制展开
  const chatBoxHeight = isChatExpanded ? 120 : 60; // 展开120，折叠60
  const chatBoxY = height - 80 - chatBoxHeight; // 在选项栏上方
  const chatBoxOpacity = isChatExpanded ? 0.7 : 0.3; // 展开0.7，折叠0.3
  ctx.fillStyle = `rgba(0, 0, 0, ${chatBoxOpacity})`; // 半透明黑色
  // 绘制圆角矩形
  const radius = 10; // 圆角半径
  ctx.beginPath();
  ctx.moveTo(0 + radius, chatBoxY);
  ctx.lineTo(width - radius, chatBoxY);
  ctx.arcTo(width, chatBoxY, width, chatBoxY + radius, radius);
  ctx.lineTo(width, chatBoxY + chatBoxHeight - radius);
  ctx.arcTo(width, chatBoxY + chatBoxHeight, width - radius, chatBoxY + chatBoxHeight, radius);
  ctx.lineTo(0 + radius, chatBoxY + chatBoxHeight);
  ctx.arcTo(0, chatBoxY + chatBoxHeight, 0, chatBoxY + chatBoxHeight - radius, radius);
  ctx.lineTo(0, chatBoxY + radius);
  ctx.arcTo(0, chatBoxY, 0 + radius, chatBoxY, radius);
  ctx.closePath();
  ctx.fill();

  // 绘制选项栏
  const optionBarHeight = 80; // 调小
  const optionBarY = height - optionBarHeight;
  ctx.fillStyle = "#333"; // 深灰色选项栏
  ctx.fillRect(0, optionBarY, width, optionBarHeight);
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, optionBarY, width, optionBarHeight);

  // 绘制选项按钮
  const buttonLabels = ['角色', '斩魔', '集市', '宗门', '好友'];
  const buttonWidth = width / buttonLabels.length;
  const buttonHeight = 60;
  const buttonY = optionBarY + 10;
  const optionButtons = [];
  for (let i = 0; i < buttonLabels.length; i++) {
    const buttonX = i * buttonWidth;
    // 绘制按钮背景
    ctx.fillStyle = buttonLabels[i] === state.selectedTabWindow ? "#777" : "#555"; // 高亮当前打开窗口的按钮
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1;
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    // 绘制文本
    ctx.fillStyle = "#fff";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(buttonLabels[i], buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);
    // 保存按钮位置
    optionButtons.push({ x: buttonX, y: buttonY, w: buttonWidth, h: buttonHeight, label: buttonLabels[i] });
  }
  ctx.textAlign = "left"; // 重置

  // 绘制弹出窗口
  let tabWindow = null;
  if (state.selectedTabWindow) {
    const windowWidth = 300;
    const windowHeight = 400;
    const windowX = (width - windowWidth) / 2;
    const windowY = (height - windowHeight) / 2;
    // 半透明背景
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, width, height);
    // 窗口背景
    ctx.fillStyle = "#fff";
    ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(windowX, windowY, windowWidth, windowHeight);
    // 窗口标题
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(state.selectedTabWindow, windowX + windowWidth / 2, windowY + 30);
    ctx.textAlign = "left";
    // 保存窗口位置
    tabWindow = { x: windowX, y: windowY, w: windowWidth, h: windowHeight };
  }

  // 绘制右上角时间和电量
  ctx.fillStyle = "#000000ff";
  ctx.font = "16px Arial";
  ctx.textAlign = "right";
  ctx.fillText(timeStr + ' ' + batteryStr, width - 10, 30);
  ctx.textAlign = "left";

  return { minOffset, maxOffset, centerButton, chatBox: { x: 0, y: chatBoxY, w: width, h: chatBoxHeight }, optionButtons, tabWindow }; // 返回边界和按钮
}

module.exports = {
  render,
};

// 初始化背景
loadBgImage();
