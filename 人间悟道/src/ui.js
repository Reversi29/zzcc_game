const { state } = require("./state");
const { getCurrentSeason, getSeasonBgPath } = require("./config");

let bgImage = null;
let centerButtonImage = null;
let roleImages = {}; // 存储所有角色图片
let currentSeason = getCurrentSeason();

// 角色数据配置
const roleData = {
  1: { name: "少年", desc: "初入仙途的少年" },
  2: { name: "少女", desc: "灵秀脱俗的少女" },
};

function loadBgImage() {
  if (!bgImage) {
    bgImage = tt.createImage();
    bgImage.src = getSeasonBgPath(currentSeason);
  }
  if (!centerButtonImage) {
    centerButtonImage = tt.createImage();
    centerButtonImage.src = "assets/images/btn/btn_center.png";
  }
  // 预加载所有角色图片
  Object.keys(roleData).forEach(roleId => {
    if (!roleImages[roleId]) {
      roleImages[roleId] = tt.createImage();
      roleImages[roleId].src = `assets/images/role/role_${roleId}.png`;
    }
  });
}

function getCurrentRoleImage() {
  return roleImages[state.selectedRole];
}

// 绘制圆角矩形
function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
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
    const currentRoleImage = getCurrentRoleImage();
    if (currentRoleImage && currentRoleImage.complete) {
      const roleWidth = 200;
      const roleHeight = 200;
      const x_on_bg = scaledWidth / 2 - roleWidth / 2;
      const y_on_bg = height * 0.525;
      const x_draw = centerX + state.bgOffset + x_on_bg;
      const y_draw = y_on_bg;
      ctx.drawImage(currentRoleImage, x_draw, y_draw, roleWidth, roleHeight);
    }
  } else {
    // 备用背景
    ctx.fillStyle = "#E5EBF6";
    ctx.fillRect(0, 0, width, height);
  }

  // 绘制返回中间按钮（如果不在中间）
  let centerButton = null;
  if (Math.abs(state.bgOffset) > 20) {
    const buttonW = 60;
    const buttonH = 60;
    const buttonY = height / 2 - buttonH / 2;
    let buttonX;
    if (state.bgOffset < 0) {
      buttonX = 0;
    } else {
      buttonX = width - buttonW;
    }
    if (centerButtonImage && centerButtonImage.complete) {
      ctx.drawImage(centerButtonImage, buttonX, buttonY, buttonW, buttonH);
    } else {
      ctx.fillStyle = "#FF5722";
      ctx.fillRect(buttonX, buttonY, buttonW, buttonH);
      ctx.fillStyle = "#fff";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("居中", buttonX + buttonW / 2, buttonY + buttonH / 2);
      ctx.textAlign = "left";
    }
    centerButton = { x: buttonX, y: buttonY, w: buttonW, h: buttonH };
  }

  // 绘制聊天框（半透明黑色）- 改为好友消息展示区域
  const isChatExpanded = state.chatBoxExpanded || state.selectedFriend;
  const chatBoxHeight = isChatExpanded ? 100 : 50;
  const chatBoxY = height - 80 - chatBoxHeight;
  
  // 如果有选中的好友，显示简短消息
  if (state.selectedFriend && state.messages[state.selectedFriend]) {
    const messages = state.messages[state.selectedFriend];
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) {
      // 消息背景
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      drawRoundedRect(ctx, 10, chatBoxY + 10, width - 20, 35, 8);
      ctx.fillStyle = "#fff";
      ctx.font = "14px Arial";
      ctx.textAlign = "left";
      const msgText = lastMsg.from === state.playerId ? `你: ${lastMsg.content}` : `${state.selectedFriend}: ${lastMsg.content}`;
      ctx.fillText(msgText.substring(0, 30), 20, chatBoxY + 32);
      ctx.textAlign = "left";
    }
  }
  
  // 选项栏背景（始终显示）
  const optionBarHeight = 80;
  const optionBarY = height - optionBarHeight;
  ctx.fillStyle = "#333";
  ctx.fillRect(0, optionBarY, width, optionBarHeight);

  // 绘制选项按钮
  const buttonLabels = ['角色', '斩魔', '集市', '宗门', '好友'];
  const buttonWidth = width / buttonLabels.length;
  const buttonHeight = 60;
  const buttonY = optionBarY + 10;
  const optionButtons = [];
  
  for (let i = 0; i < buttonLabels.length; i++) {
    const buttonX = i * buttonWidth;
    ctx.fillStyle = buttonLabels[i] === state.selectedTabWindow ? "#777" : "#555";
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1;
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.fillStyle = "#fff";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(buttonLabels[i], buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);
    optionButtons.push({ x: buttonX, y: buttonY, w: buttonWidth, h: buttonHeight, label: buttonLabels[i] });
  }
  ctx.textAlign = "left";

  // 绘制弹出窗口
  let tabWindow = null;
  const roleButtons = [];
  const friendButtons = [];
  const actionButtons = [];
  
  if (state.selectedTabWindow) {
    const windowWidth = Math.min(340, width - 40);
    const windowHeight = Math.min(450, height - 100);
    const windowX = (width - windowWidth) / 2;
    const windowY = (height - windowHeight) / 2 - 20;
    
    // 半透明背景
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, width, height);
    
    // 窗口背景
    ctx.fillStyle = "#fff";
    drawRoundedRect(ctx, windowX, windowY, windowWidth, windowHeight, 12);
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, windowX, windowY, windowWidth, windowHeight, 12);
    ctx.stroke();
    
    // 窗口标题栏
    ctx.fillStyle = "#4A90D9";
    drawRoundedRect(ctx, windowX, windowY, windowWidth, 45, 12);
    ctx.beginPath();
    ctx.moveTo(windowX, windowY + 45);
    ctx.lineTo(windowX + windowWidth, windowY + 45);
    ctx.stroke();
    
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(state.selectedTabWindow, windowX + windowWidth / 2, windowY + 30);
    ctx.textAlign = "left";

    // ========== 角色窗口 ==========
    if (state.selectedTabWindow === "角色") {
      ctx.fillStyle = "#333";
      ctx.font = "14px Arial";
      ctx.fillText("选择角色", windowX + 15, windowY + 60);

      const roleStartY = windowY + 75;
      const roleItemHeight = 70;
      const roleItemWidth = windowWidth - 30;

      state.roleList.forEach((roleId, index) => {
        const itemY = roleStartY + index * (roleItemHeight + 8);
        const isSelected = roleId === state.selectedRole;

        ctx.fillStyle = isSelected ? "#E3F2FD" : "#F5F5F5";
        drawRoundedRect(ctx, windowX + 15, itemY, roleItemWidth, roleItemHeight, 8);
        ctx.strokeStyle = isSelected ? "#2196F3" : "#CCC";
        ctx.lineWidth = isSelected ? 2 : 1;
        drawRoundedRect(ctx, windowX + 15, itemY, roleItemWidth, roleItemHeight, 8);
        ctx.stroke();

        // 角色头像
        const roleImg = roleImages[roleId];
        if (roleImg && roleImg.complete) {
          ctx.drawImage(roleImg, windowX + 25, itemY + 8, 50, 50);
        } else {
          ctx.fillStyle = "#BBDEFB";
          ctx.fillRect(windowX + 25, itemY + 8, 50, 50);
        }

        // 角色信息
        ctx.fillStyle = "#333";
        ctx.font = "bold 14px Arial";
        ctx.fillText(roleData[roleId].name, windowX + 85, itemY + 25);
        ctx.fillStyle = "#666";
        ctx.font = "12px Arial";
        ctx.fillText(roleData[roleId].desc, windowX + 85, itemY + 45);

        roleButtons.push({
          x: windowX + 15,
          y: itemY,
          w: roleItemWidth,
          h: roleItemHeight,
          roleId: roleId
        });
      });
    }
    
    // ========== 好友窗口 ==========
    else if (state.selectedTabWindow === "好友") {
      // 好友列表或聊天界面
      if (state.selectedFriend) {
        // ===== 聊天模式 =====
        // 返回按钮
        ctx.fillStyle = "#4A90D9";
        ctx.font = "14px Arial";
        ctx.fillText("◀ 返回", windowX + 15, windowY + 60);
        actionButtons.push({ x: windowX + 10, y: windowY + 45, w: 60, h: 25, action: 'back' });
        
        // 聊天标题
        ctx.fillStyle = "#333";
        ctx.font = "bold 14px Arial";
        ctx.fillText(state.selectedFriend, windowX + windowWidth / 2, windowY + 60);
        
        // 消息区域背景
        ctx.fillStyle = "#F8F8F8";
        const chatAreaY = windowY + 75;
        const chatAreaHeight = windowHeight - 130;
        drawRoundedRect(ctx, windowX + 10, chatAreaY, windowWidth - 20, chatAreaHeight, 8);
        
        // 显示消息
        const messages = state.messages[state.selectedFriend] || [];
        const msgStartY = chatAreaY + 10;
        ctx.font = "12px Arial";
        
        messages.slice(-8).forEach((msg, idx) => {
          const isMe = msg.from === state.playerId || msg.from === 'me';
          const msgY = msgStartY + idx * 30;
          
          if (isMe) {
            ctx.fillStyle = "#4A90D9";
            ctx.textAlign = "right";
            ctx.fillText("我: " + msg.content.substring(0, 20), windowX + windowWidth - 20, msgY);
          } else {
            ctx.fillStyle = "#666";
            ctx.textAlign = "left";
            ctx.fillText(msg.from + ": " + msg.content.substring(0, 20), windowX + 20, msgY);
          }
        });
        ctx.textAlign = "left";
        
        // 输入提示
        ctx.fillStyle = "#999";
        ctx.font = "12px Arial";
        ctx.fillText("点击发送消息...", windowX + 20, windowY + windowHeight - 45);
        
        // 发送按钮
        ctx.fillStyle = "#4CAF50";
        const sendBtnX = windowX + windowWidth - 70;
        const sendBtnY = windowY + windowHeight - 60;
        drawRoundedRect(ctx, sendBtnX, sendBtnY, 60, 30, 5);
        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("发送", sendBtnX + 30, sendBtnY + 18);
        ctx.textAlign = "left";
        
        actionButtons.push({ x: sendBtnX, y: sendBtnY, w: 60, h: 30, action: 'send' });
        
      } else {
        // ===== 好友列表模式 =====
        // 添加好友按钮
        ctx.fillStyle = "#4CAF50";
        const addBtnX = windowX + windowWidth - 90;
        const addBtnY = windowY + 10;
        drawRoundedRect(ctx, addBtnX, addBtnY, 75, 28, 5);
        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("+ 添加", addBtnX + 37, addBtnY + 18);
        ctx.textAlign = "left";
        actionButtons.push({ x: addBtnX, y: addBtnY, w: 75, h: 28, action: 'addFriend' });
        
        // 好友列表标题
        ctx.fillStyle = "#333";
        ctx.font = "14px Arial";
        ctx.fillText("好友列表 (" + state.friends.length + ")", windowX + 15, windowY + 60);
        
        // 好友列表
        const friendStartY = windowY + 75;
        const friendItemHeight = 55;
        
        if (state.friends.length === 0) {
          ctx.fillStyle = "#999";
          ctx.font = "14px Arial";
          ctx.textAlign = "center";
          ctx.fillText("暂无好友", windowX + windowWidth / 2, friendStartY + 30);
          ctx.textAlign = "left";
        } else {
          state.friends.forEach((friend, index) => {
            const itemY = friendStartY + index * (friendItemHeight + 5);
            if (itemY > windowY + windowHeight - 60) return;
            
            // 好友卡片
            ctx.fillStyle = "#F5F5F5";
            drawRoundedRect(ctx, windowX + 15, itemY, windowWidth - 30, friendItemHeight, 8);
            
            // 在线状态指示
            ctx.fillStyle = friend.online ? "#4CAF50" : "#ccc";
            ctx.beginPath();
            ctx.arc(windowX + 30, itemY + 28, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // 好友信息
            ctx.fillStyle = "#333";
            ctx.font = "14px Arial";
            ctx.fillText(friend.nickname || friend.playerId, windowX + 45, itemY + 22);
            ctx.fillStyle = "#666";
            ctx.font = "11px Arial";
            ctx.fillText(friend.online ? "在线" + (friend.level ? ` · Lv${friend.level}` : '') : "离线", windowX + 45, itemY + 40);
            
            friendButtons.push({
              x: windowX + 15,
              y: itemY,
              w: windowWidth - 30,
              h: friendItemHeight,
              playerId: friend.playerId
            });
          });
        }
      }
    }
    
    // 保存窗口位置
    tabWindow = { 
      x: windowX, 
      y: windowY, 
      w: windowWidth, 
      h: windowHeight, 
      roleButtons,
      friendButtons,
      actionButtons
    };
  }

  // 绘制右上角时间和电量
  ctx.fillStyle = "#000";
  ctx.font = "14px Arial";
  ctx.textAlign = "right";
  ctx.fillText(timeStr + ' ' + batteryStr, width - 10, 25);
  ctx.textAlign = "left";

  return { 
    minOffset, 
    maxOffset, 
    centerButton, 
    chatBox: { x: 0, y: chatBoxY, w: width, h: chatBoxHeight }, 
    optionButtons, 
    tabWindow, 
    roleButtons,
    friendButtons,
    actionButtons
  };
}

module.exports = {
  render,
};

// 初始化背景
loadBgImage();
