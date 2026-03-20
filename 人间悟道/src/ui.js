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

// 头像框配置
const avatarFrames = {
  0: { name: "无", color: "transparent" },
  1: { name: "金框", color: "#FFD700" },
  2: { name: "银框", color: "#C0C0C0" },
  3: { name: "紫框", color: "#9966CC" },
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
  return roleImages[state.avatar || state.selectedRole];
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
}

// 绘制渐变背景（仙侠风格）
function drawGradientBg(ctx, x, y, w, h) {
  const gradient = ctx.createLinearGradient(x, y, x, y + h);
  gradient.addColorStop(0, "#1a1a2e");
  gradient.addColorStop(0.5, "#16213e");
  gradient.addColorStop(1, "#0f3460");
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);
}

// 绘制金色边框（仙侠风格）
function drawGoldBorder(ctx, x, y, w, h, r = 8) {
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.stroke();
  
  // 内发光效果
  ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, x + 2, y + 2, w - 4, h - 4, r);
  ctx.stroke();
}

function render(ctx, width, height, inputState) {
  // 获取时间和电量
  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  let batteryStr = '';
  try {
    const battery = tt.getBatteryInfoSync();
    batteryStr = battery.level + '%';
  } catch (e) {}

  // 绘制背景
  let minOffset = 0, maxOffset = 0;
  if (bgImage && bgImage.complete) {
    const bgWidth = bgImage.width;
    const bgHeight = bgImage.height;
    const scale = height / bgHeight;
    const scaledWidth = bgWidth * scale;
    const centerX = (width - scaledWidth) / 2;
    const x = centerX + state.bgOffset;

    const halfRange = Math.max(0, (scaledWidth - width) / 2);
    minOffset = -halfRange;
    maxOffset = halfRange;

    ctx.drawImage(bgImage, x, 0, scaledWidth, height);

    // 绘制人物
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
    drawGradientBg(ctx, 0, 0, width, height);
  }

  // ========== 左上角头像区域 ==========
  const avatarBtnSize = 50;
  const avatarBtn = { x: 10, y: 10, w: avatarBtnSize, h: avatarBtnSize };
  
  // 头像背景
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  drawRoundedRect(ctx, 5, 5, avatarBtnSize + 4, avatarBtnSize + 4, 8);
  ctx.fill();
  
  // 头像框颜色
  const frameColor = avatarFrames[state.avatarFrame || 0].color;
  if (frameColor !== "transparent") {
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, 5, 5, avatarBtnSize + 4, avatarBtnSize + 4, 8);
    ctx.stroke();
  }
  
  // 头像图片
  const avatarImg = getCurrentRoleImage();
  if (avatarImg && avatarImg.complete) {
    ctx.drawImage(avatarImg, 10, 10, avatarBtnSize, avatarBtnSize);
  } else {
    ctx.fillStyle = "#4A90D9";
    ctx.beginPath();
    ctx.arc(10 + avatarBtnSize/2, 10 + avatarBtnSize/2, avatarBtnSize/2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 玩家信息（头像右边）
  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "left";
  ctx.fillText(state.nickname || '游客', 70, 25);
  ctx.fillStyle = "#FFD700";
  ctx.font = "12px Arial";
  ctx.fillText(`Lv.${state.level}`, 70, 45);
  if (state.uid) {
    ctx.fillStyle = "#aaa";
    ctx.font = "10px Arial";
    ctx.fillText(`UID: ${state.uid}`, 70, 60);
  }

  // ========== 半透明聊天框（恢复显示）==========
  const isChatExpanded = state.chatBoxExpanded || state.selectedFriend;
  const chatBoxHeight = isChatExpanded ? 100 : 50;
  const chatBoxY = height - 80 - chatBoxHeight;
  
  // 聊天框背景（半透明）
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  drawRoundedRect(ctx, 10, chatBoxY + 5, width - 20, chatBoxHeight - 5, 10);
  ctx.fill();
  
  if (state.selectedFriend && state.messages[state.selectedFriend]) {
    const messages = state.messages[state.selectedFriend];
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) {
      ctx.fillStyle = "#fff";
      ctx.font = "14px Arial";
      const msgText = lastMsg.from === state.playerId ? `我: ${lastMsg.content}` : `${lastMsg.from}: ${lastMsg.content}`;
      ctx.fillText(msgText.substring(0, 25), 20, chatBoxY + 30);
    }
  } else if (!isChatExpanded) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "14px Arial";
    ctx.fillText("💬 点击底部「好友」查看消息", 30, chatBoxY + 30);
  }

  // ========== 底部选项栏 ==========
  const optionBarHeight = 80;
  const optionBarY = height - optionBarHeight;
  
  // 选项栏背景（仙侠风格）
  const barGradient = ctx.createLinearGradient(0, optionBarY, 0, optionBarY + optionBarHeight);
  barGradient.addColorStop(0, "#2d2d44");
  barGradient.addColorStop(1, "#1a1a2e");
  ctx.fillStyle = barGradient;
  ctx.fillRect(0, optionBarY, width, optionBarHeight);
  
  // 金色装饰线
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, optionBarY);
  ctx.lineTo(width, optionBarY);
  ctx.stroke();

  // 选项按钮
  const buttonLabels = ['角色', '斩魔', '集市', '宗门', '好友'];
  const buttonWidth = width / buttonLabels.length;
  const buttonHeight = 55;
  const buttonY = optionBarY + 10;
  const optionButtons = [];
  
  for (let i = 0; i < buttonLabels.length; i++) {
    const buttonX = i * buttonWidth;
    const isActive = buttonLabels[i] === state.selectedTabWindow;
    
    // 按钮背景
    ctx.fillStyle = isActive ? "rgba(212, 175, 55, 0.3)" : "rgba(255, 255, 255, 0.1)";
    drawRoundedRect(ctx, buttonX + 5, buttonY, buttonWidth - 10, buttonHeight, 8);
    ctx.fill();
    
    // 按钮文字
    ctx.fillStyle = isActive ? "#FFD700" : "#fff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(buttonLabels[i], buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
    
    optionButtons.push({ 
      x: buttonX + 5, 
      y: buttonY, 
      w: buttonWidth - 10, 
      h: buttonHeight, 
      label: buttonLabels[i] 
    });
  }
  ctx.textAlign = "left";

  // ========== 弹窗窗口 ==========
  let tabWindow = null;
  const roleButtons = [];
  const friendButtons = [];
  const actionButtons = [];
  const inputAreas = [];
  
  if (state.selectedTabWindow) {
    const windowWidth = Math.min(360, width - 30);
    const windowHeight = Math.min(480, height - 80);
    const windowX = (width - windowWidth) / 2;
    const windowY = (height - windowHeight) / 2 - 20;
    
    // 半透明背景
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, width, height);
    
    // 窗口背景（仙侠风格）
    const windowGradient = ctx.createLinearGradient(windowX, windowY, windowX, windowY + windowHeight);
    windowGradient.addColorStop(0, "#2a2a4a");
    windowGradient.addColorStop(1, "#1a1a3a");
    ctx.fillStyle = windowGradient;
    drawRoundedRect(ctx, windowX, windowY, windowWidth, windowHeight, 15);
    ctx.fill();
    
    // 金色边框
    drawGoldBorder(ctx, windowX, windowY, windowWidth, windowHeight, 15);
    
    // 窗口标题栏
    const titleGradient = ctx.createLinearGradient(windowX, windowY, windowX, windowY + 50);
    titleGradient.addColorStop(0, "#D4AF37");
    titleGradient.addColorStop(1, "#B8860B");
    ctx.fillStyle = titleGradient;
    drawRoundedRect(ctx, windowX, windowY, windowWidth, 45, 15);
    ctx.beginPath();
    ctx.moveTo(windowX, windowY + 45);
    ctx.lineTo(windowX + windowWidth, windowY + 45);
    ctx.strokeStyle = "#8B6914";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 标题文字
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(state.selectedTabWindow, windowX + windowWidth / 2, windowY + 32);
    
    // 关闭按钮
    ctx.fillStyle = "#8B0000";
    ctx.font = "bold 16px Arial";
    ctx.fillText("✕", windowX + windowWidth - 25, windowY + 30);
    actionButtons.push({ x: windowX + windowWidth - 40, y: windowY + 10, w: 30, h: 30, action: 'close' });
    ctx.textAlign = "left";

    // ========== 角色窗口 ==========
    if (state.selectedTabWindow === "角色") {
      ctx.fillStyle = "#ccc";
      ctx.font = "14px Arial";
      ctx.fillText("选择角色", windowX + 15, windowY + 65);

      const roleStartY = windowY + 80;
      const roleItemHeight = 70;

      state.roleList.forEach((roleId, index) => {
        const itemY = roleStartY + index * (roleItemHeight + 10);
        const isSelected = roleId === (state.avatar || state.selectedRole);

        // 角色卡片
        ctx.fillStyle = isSelected ? "rgba(212, 175, 55, 0.3)" : "rgba(255, 255, 255, 0.1)";
        drawRoundedRect(ctx, windowX + 15, itemY, windowWidth - 30, roleItemHeight, 10);
        ctx.fill();
        
        if (isSelected) {
          drawGoldBorder(ctx, windowX + 15, itemY, windowWidth - 30, roleItemHeight, 10);
        }

        // 角色头像
        const roleImg = roleImages[roleId];
        if (roleImg && roleImg.complete) {
          ctx.drawImage(roleImg, windowX + 25, itemY + 8, 50, 50);
        } else {
          ctx.fillStyle = "#4A90D9";
          ctx.beginPath();
          ctx.arc(windowX + 50, itemY + 33, 25, 0, Math.PI * 2);
          ctx.fill();
        }

        // 角色信息
        ctx.fillStyle = "#fff";
        ctx.font = "bold 15px Arial";
        ctx.fillText(roleData[roleId].name, windowX + 90, itemY + 25);
        ctx.fillStyle = "#aaa";
        ctx.font = "12px Arial";
        ctx.fillText(roleData[roleId].desc, windowX + 90, itemY + 48);

        roleButtons.push({
          x: windowX + 15,
          y: itemY,
          w: windowWidth - 30,
          h: roleItemHeight,
          roleId: roleId
        });
      });
    }
    
    // ========== 好友窗口 ==========
    else if (state.selectedTabWindow === "好友") {
      if (state.selectedFriend) {
        // ===== 聊天模式 =====
        // 返回按钮
        ctx.fillStyle = "#D4AF37";
        ctx.font = "14px Arial";
        ctx.fillText("◀ 返回", windowX + 15, windowY + 65);
        actionButtons.push({ x: windowX + 10, y: windowY + 50, w: 60, h: 25, action: 'back' });
        
        // 聊天标题
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(state.selectedFriend, windowX + windowWidth / 2, windowY + 65);
        ctx.textAlign = "left";
        
        // 消息区域
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        const chatAreaY = windowY + 85;
        const chatAreaHeight = windowHeight - 160;
        drawRoundedRect(ctx, windowX + 15, chatAreaY, windowWidth - 30, chatAreaHeight, 10);
        ctx.fill();
        
        // 显示消息
        const messages = state.messages[state.selectedFriend] || [];
        ctx.font = "13px Arial";
        
        messages.slice(-10).forEach((msg, idx) => {
          const isMe = msg.from === state.playerId || msg.from === 'me';
          const msgY = chatAreaY + 15 + idx * 32;
          if (msgY > chatAreaY + chatAreaHeight - 20) return;
          
          // 消息气泡
          const bubbleX = isMe ? windowX + windowWidth - 120 : windowX + 25;
          ctx.fillStyle = isMe ? "rgba(212, 175, 55, 0.5)" : "rgba(255, 255, 255, 0.2)";
          drawRoundedRect(ctx, bubbleX, msgY, 100, 26, 13);
          ctx.fill();
          
          ctx.fillStyle = "#fff";
          ctx.textAlign = isMe ? "right" : "left";
          const textX = isMe ? bubbleX + 95 : bubbleX + 10;
          ctx.fillText(msg.content.substring(0, 12), textX, msgY + 18);
        });
        ctx.textAlign = "left";
        
        // 输入框区域
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        drawRoundedRect(ctx, windowX + 15, windowY + windowHeight - 65, windowWidth - 100, 35, 8);
        ctx.fill();
        
        ctx.fillStyle = "#aaa";
        ctx.font = "12px Arial";
        ctx.fillText(state.chatInput || "输入消息...", windowX + 25, windowY + windowHeight - 40);
        
        inputAreas.push({ x: windowX + 15, y: windowY + windowHeight - 65, w: windowWidth - 100, h: 35, type: 'chat' });
        
        // 发送按钮
        ctx.fillStyle = "#D4AF37";
        drawRoundedRect(ctx, windowX + windowWidth - 80, windowY + windowHeight - 65, 65, 35, 8);
        ctx.fill();
        ctx.fillStyle = "#1a1a2e";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("发送", windowX + windowWidth - 47, windowY + windowHeight - 40);
        ctx.textAlign = "left";
        
        actionButtons.push({ x: windowX + windowWidth - 80, y: windowY + windowHeight - 65, w: 65, h: 35, action: 'send' });
        
      } else {
        // ===== 好友列表模式 =====
        // 搜索/添加按钮
        ctx.fillStyle = "#D4AF37";
        const addBtnX = windowX + windowWidth - 90;
        const addBtnY = windowY + 55;
        drawRoundedRect(ctx, addBtnX, addBtnY, 75, 30, 8);
        ctx.fill();
        ctx.fillStyle = "#1a1a2e";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("+ 添加", addBtnX + 37, addBtnY + 20);
        ctx.textAlign = "left";
        actionButtons.push({ x: addBtnX, y: addBtnY, w: 75, h: 30, action: 'addFriend' });
        
        // 好友列表
        ctx.fillStyle = "#ccc";
        ctx.font = "14px Arial";
        ctx.fillText(`好友 (${state.friends.length})`, windowX + 15, windowY + 65);
        
        const friendStartY = windowY + 80;
        const friendItemHeight = 55;
        
        if (state.friends.length === 0) {
          ctx.fillStyle = "#888";
          ctx.font = "14px Arial";
          ctx.textAlign = "center";
          ctx.fillText("暂无好友", windowX + windowWidth / 2, friendStartY + 30);
          ctx.textAlign = "left";
        } else {
          state.friends.forEach((friend, index) => {
            const itemY = friendStartY + index * (friendItemHeight + 5);
            if (itemY > windowY + windowHeight - 70) return;
            
            // 好友卡片
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            drawRoundedRect(ctx, windowX + 15, itemY, windowWidth - 30, friendItemHeight, 8);
            ctx.fill();
            
            // 在线状态
            ctx.fillStyle = friend.online ? "#4CAF50" : "#666";
            ctx.beginPath();
            ctx.arc(windowX + 35, itemY + 28, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // 头像
            const friendAvatar = roleImages[friend.avatar] || roleImages[1];
            if (friendAvatar && friendAvatar.complete) {
              ctx.drawImage(friendAvatar, windowX + 18, itemY + 8, 40, 40);
            }
            
            // 好友信息
            ctx.fillStyle = "#fff";
            ctx.font = "14px Arial";
            ctx.fillText(friend.nickname || friend.playerId, windowX + 68, itemY + 22);
            ctx.fillStyle = friend.online ? "#4CAF50" : "#888";
            ctx.font = "11px Arial";
            ctx.fillText(friend.online ? "在线" : "离线", windowX + 68, itemY + 42);
            
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
    
    // ========== 用户信息面板 ==========
    if (state.showProfile) {
      const windowWidth = Math.min(340, width - 40);
      const windowHeight = Math.min(450, height - 100);
      const windowX = (width - windowWidth) / 2;
      const windowY = (height - windowHeight) / 2 - 20;
      
      // 半透明背景
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, width, height);
      
      // 面板背景
      const profileGradient = ctx.createLinearGradient(windowX, windowY, windowX, windowY + windowHeight);
      profileGradient.addColorStop(0, "#2a2a4a");
      profileGradient.addColorStop(1, "#1a1a3a");
      ctx.fillStyle = profileGradient;
      drawRoundedRect(ctx, windowX, windowY, windowWidth, windowHeight, 15);
      ctx.fill();
      
      // 金色边框
      drawGoldBorder(ctx, windowX, windowY, windowWidth, windowHeight, 15);
      
      // 标题栏
      const titleGradient = ctx.createLinearGradient(windowX, windowY, windowX, windowY + 50);
      titleGradient.addColorStop(0, "#D4AF37");
      titleGradient.addColorStop(1, "#B8860B");
      ctx.fillStyle = titleGradient;
      drawRoundedRect(ctx, windowX, windowY, windowWidth, 45, 15);
      
      ctx.fillStyle = "#1a1a2e";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("个人资料", windowX + windowWidth / 2, windowY + 32);
      
      // 关闭按钮
      ctx.fillStyle = "#8B0000";
      ctx.font = "bold 18px Arial";
      ctx.fillText("✕", windowX + windowWidth - 25, windowY + 30);
      actionButtons.push({ x: windowX + windowWidth - 40, y: windowY + 10, w: 30, h: 30, action: 'close' });
      ctx.textAlign = "left";
      
      // 头像区域
      const avatarCenterX = windowX + windowWidth / 2;
      const avatarY = windowY + 70;
      const avatarSize = 80;
      
      // 头像框
      const frameColor = avatarFrames[state.avatarFrame || 0].color;
      if (frameColor !== "transparent") {
        ctx.strokeStyle = frameColor;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarY + avatarSize/2, avatarSize/2 + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // 头像
      const avatarImg = getCurrentRoleImage();
      if (avatarImg && avatarImg.complete) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImg, avatarCenterX - avatarSize/2, avatarY, avatarSize, avatarSize);
        ctx.restore();
      } else {
        ctx.fillStyle = "#4A90D9";
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 切换头像按钮
      ctx.fillStyle = "#D4AF37";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("[点击切换头像]", avatarCenterX, avatarY + avatarSize + 20);
      actionButtons.push({ x: avatarCenterX - 60, y: avatarY + avatarSize + 5, w: 120, h: 25, action: 'changeAvatar' });
      ctx.textAlign = "left";
      
      // 昵称
      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.fillText(state.nickname || '游客', avatarCenterX, avatarY + avatarSize + 50);
      ctx.font = "12px Arial";
      ctx.fillStyle = "#D4AF37";
      ctx.fillText("Lv." + state.level, avatarCenterX, avatarY + avatarSize + 70);
      ctx.textAlign = "left";
      
      // UID
      if (state.uid) {
        ctx.fillStyle = "#888";
        ctx.font = "12px Arial";
        ctx.fillText("UID: " + state.uid, windowX + 20, windowY + 180);
      }
      
      // 简介
      ctx.fillStyle = "#ccc";
      ctx.font = "14px Arial";
      ctx.fillText("简介: " + (state.bio || '这个人很懒，什么都没写'), windowX + 20, windowY + 210);
      
      // 生日
      ctx.fillText("生日: " + (state.birthday || '未设置'), windowX + 20, windowY + 240);
      
      // 修改按钮
      const editBtnY = windowY + 280;
      
      // 昵称修改
      ctx.fillStyle = "rgba(212, 175, 55, 0.3)";
      drawRoundedRect(ctx, windowX + 20, editBtnY, windowWidth - 40, 35, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("修改昵称", windowX + windowWidth / 2, editBtnY + 23);
      actionButtons.push({ x: windowX + 20, y: editBtnY, w: windowWidth - 40, h: 35, action: 'changeNickname' });
      
      // 简介修改
      ctx.fillStyle = "rgba(212, 175, 55, 0.3)";
      drawRoundedRect(ctx, windowX + 20, editBtnY + 45, windowWidth - 40, 35, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText("修改简介", windowX + windowWidth / 2, editBtnY + 68);
      actionButtons.push({ x: windowX + 20, y: editBtnY + 45, w: windowWidth - 40, h: 35, action: 'changeBio' });
      
      // 头像框切换
      ctx.fillStyle = "rgba(212, 175, 55, 0.3)";
      drawRoundedRect(ctx, windowX + 20, editBtnY + 90, windowWidth - 40, 35, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText("切换头像框: " + avatarFrames[state.avatarFrame || 0].name, windowX + windowWidth / 2, editBtnY + 113);
      actionButtons.push({ x: windowX + 20, y: editBtnY + 90, w: windowWidth - 40, h: 35, action: 'changeFrame' });
      
      ctx.textAlign = "left";
      
      // 保存 profile 状态用于点击检测
      state.showProfile = true;
    }
    
    tabWindow = { 
      x: windowX, 
      y: windowY, 
      w: windowWidth, 
      h: windowHeight, 
      roleButtons,
      friendButtons,
      actionButtons,
      inputAreas
    };
  }

  // 右上角时间
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.font = "14px Arial";
  ctx.textAlign = "right";
  ctx.fillText(timeStr, width - 10, 25);
  ctx.textAlign = "left";

  return { 
    minOffset, 
    maxOffset, 
    centerButton, 
    avatarBtn,
    chatBox: { x: 10, y: chatBoxY, w: width - 20, h: chatBoxHeight }, 
    optionButtons, 
    tabWindow, 
    roleButtons,
    friendButtons,
    actionButtons,
    inputAreas
  };
}

module.exports = { render };
loadBgImage();
