const { state } = require("./state");
const { getCurrentSeason, getSeasonBgPath } = require("./config");

let bgImage = null;
let centerButtonImage = null;
let roleImages = {};
let currentSeason = getCurrentSeason();

const roleData = {
  1: { name: "少年", desc: "初入仙途的少年" },
  2: { name: "少女", desc: "灵秀脱俗的少女" },
};

const avatarFrames = {
  0: { name: "无", color: "transparent" },
  1: { name: "金框", color: "#FFD700" },
  2: { name: "银框", color: "#C0C0C0" },
  3: { name: "紫框", color: "#9966CC" },
};

// 图片加载状态
let imagesInitialized = false;

function initImages() {
  if (imagesInitialized) return;
  imagesInitialized = true;
  
  // 背景图片
  if (!bgImage) {
    try {
      bgImage = tt.createImage();
      bgImage.src = getSeasonBgPath(currentSeason);
    } catch (e) {
      console.log('背景图片加载失败:', e);
    }
  }
  
  // 居中按钮图片
  if (!centerButtonImage) {
    try {
      centerButtonImage = tt.createImage();
      centerButtonImage.src = "assets/images/btn/btn_center.png";
    } catch (e) {
      console.log('按钮图片加载失败:', e);
    }
  }
  
  // 角色图片
  Object.keys(roleData).forEach(roleId => {
    if (!roleImages[roleId]) {
      try {
        const img = tt.createImage();
        img.src = `assets/images/role/role_${roleId}.png`;
        roleImages[roleId] = img;
      } catch (e) {
        console.log('角色图片加载失败:', roleId, e);
      }
    }
  });
}

function getCurrentRoleImage() {
  const roleId = state.avatar || state.selectedRole || 1;
  return roleImages[roleId];
}

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

function render(ctx, width, height, inputState) {
  // 初始化图片
  initImages();
  
  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

  // 初始化返回数据
  let centerButton = null;
  const optionButtons = [];
  const roleButtons = [];
  const friendButtons = [];
  const actionButtons = [];
  const inputAreas = [];
  const profileButtons = [];
  let tabWindow = null;
  let minOffset = 0, maxOffset = 0;

  // 绘制背景
  let bgLoaded = bgImage && bgImage.complete && bgImage.width > 0;
  if (bgLoaded) {
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
    if (currentRoleImage && currentRoleImage.complete && currentRoleImage.width > 0) {
      const roleWidth = 200;
      const roleHeight = 200;
      const x_on_bg = scaledWidth / 2 - roleWidth / 2;
      const y_on_bg = height * 0.525;
      const x_draw = centerX + state.bgOffset + x_on_bg;
      ctx.drawImage(currentRoleImage, x_draw, y_on_bg, roleWidth, roleHeight);
    }
  } else {
    // 备用背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(0.5, "#16213e");
    gradient.addColorStop(1, "#0f3460");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // 左上角头像区域
  const avatarBtn = { x: 10, y: 10, w: 50, h: 50 };
  const avatarSize = 50;
  const avatarCenterX = 10 + avatarSize / 2;
  const avatarCenterY = 10 + avatarSize / 2;
  
  // 头像框（圆形）
  const frameColor = avatarFrames[state.avatarFrame || 0].color;
  if (frameColor !== "transparent") {
    ctx.fillStyle = frameColor;
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarSize / 2 + 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 头像背景（圆形）
  ctx.fillStyle = "#4A90D9";
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarSize / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // 头像文字（首字）
  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const firstChar = (state.nickname || '无').charAt(0);
  ctx.fillText(firstChar, avatarCenterX, avatarCenterY);
  ctx.textBaseline = "alphabetic";
  
  // 玩家信息
  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "left";
  ctx.fillText(state.nickname || '游客', 70, 28);
  ctx.fillStyle = "#FFD700";
  ctx.font = "12px Arial";
  ctx.fillText(`Lv.${state.level}`, 70, 48);
  if (state.uid) {
    ctx.fillStyle = "#aaa";
    ctx.font = "10px Arial";
    ctx.fillText(`UID: ${state.uid}`, 70, 62);
  }

  // 半透明聊天框
  const chatBoxY = height - 130;
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  drawRoundedRect(ctx, 10, chatBoxY, width - 20, 50, 10);
  ctx.fill();
  
  if (state.selectedFriend && state.messages[state.selectedFriend]) {
    const messages = state.messages[state.selectedFriend];
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) {
      ctx.fillStyle = "#fff";
      ctx.font = "13px Arial";
      const msgText = lastMsg.from === state.playerId ? `我: ${lastMsg.content}` : `${lastMsg.from}: ${lastMsg.content}`;
      ctx.fillText(msgText.substring(0, 25), 20, chatBoxY + 30);
    }
  } else {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "13px Arial";
    ctx.fillText("💬 点击底部「好友」查看消息", 20, chatBoxY + 30);
  }

  // 底部选项栏
  const optionBarHeight = 80;
  const optionBarY = height - optionBarHeight;
  ctx.fillStyle = "#2a2a4a";
  ctx.fillRect(0, optionBarY, width, optionBarHeight);
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, optionBarY);
  ctx.lineTo(width, optionBarY);
  ctx.stroke();

  const buttonLabels = ['角色', '斩魔', '集市', '宗门', '好友'];
  const buttonWidth = width / buttonLabels.length;
  const buttonY = optionBarY + 10;
  
  for (let i = 0; i < buttonLabels.length; i++) {
    const buttonX = i * buttonWidth;
    const isActive = buttonLabels[i] === state.selectedTabWindow;
    
    ctx.fillStyle = isActive ? "rgba(212, 175, 55, 0.3)" : "rgba(255, 255, 255, 0.1)";
    drawRoundedRect(ctx, buttonX + 5, buttonY, buttonWidth - 10, 55, 8);
    ctx.fill();
    
    ctx.fillStyle = isActive ? "#FFD700" : "#fff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(buttonLabels[i], buttonX + buttonWidth / 2, buttonY + 32);
    
    optionButtons.push({ x: buttonX + 5, y: buttonY, w: buttonWidth - 10, h: 55, label: buttonLabels[i] });
  }
  ctx.textAlign = "left";

  // 居中按钮
  if (Math.abs(state.bgOffset) > 20) {
    const buttonW = 50;
    const buttonH = 50;
    const btnY = height / 2 - buttonH / 2;
    const buttonX = state.bgOffset < 0 ? 0 : width - buttonW;
    
    if (centerButtonImage && centerButtonImage.complete && centerButtonImage.width > 0) {
      ctx.drawImage(centerButtonImage, buttonX, btnY, buttonW, buttonH);
    } else {
      ctx.fillStyle = "#D4AF37";
      drawRoundedRect(ctx, buttonX, btnY, buttonW, buttonH, 8);
      ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("居中", buttonX + 25, btnY + 28);
      ctx.textAlign = "left";
    }
    centerButton = { x: buttonX, y: btnY, w: buttonW, h: buttonH };
  }

  // 弹窗
  if (state.selectedTabWindow && !state.showProfile) {
    const windowWidth = Math.min(340, width - 30);
    const windowHeight = Math.min(450, height - 100);
    const windowX = (width - windowWidth) / 2;
    const windowY = (height - windowHeight) / 2 - 20;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = "#2a2a4a";
    drawRoundedRect(ctx, windowX, windowY, windowWidth, windowHeight, 12);
    ctx.fill();
    
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, windowX, windowY, windowWidth, windowHeight, 12);
    ctx.stroke();
    
    // 标题栏
    ctx.fillStyle = "#D4AF37";
    drawRoundedRect(ctx, windowX, windowY, windowWidth, 40, 12);
    ctx.fill();
    
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(state.selectedTabWindow, windowX + windowWidth / 2, windowY + 28);
    
    // 关闭按钮
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 16px Arial";
    ctx.fillText("✕", windowX + windowWidth - 25, windowY + 26);
    actionButtons.push({ x: windowX + windowWidth - 40, y: windowY + 5, w: 30, h: 30, action: 'close' });
    ctx.textAlign = "left";

    // 角色窗口
    if (state.selectedTabWindow === "角色") {
      ctx.fillStyle = "#ccc";
      ctx.font = "14px Arial";
      ctx.fillText("选择角色", windowX + 15, windowY + 60);

      const roleStartY = windowY + 75;
      state.roleList.forEach((roleId, index) => {
        const itemY = roleStartY + index * 80;
        const isSelected = roleId === (state.avatar || state.selectedRole);

        ctx.fillStyle = isSelected ? "rgba(212, 175, 55, 0.3)" : "rgba(255, 255, 255, 0.1)";
        drawRoundedRect(ctx, windowX + 15, itemY, windowWidth - 30, 70, 8);
        ctx.fill();
        
        if (isSelected) {
          ctx.strokeStyle = "#D4AF37";
          ctx.lineWidth = 2;
          drawRoundedRect(ctx, windowX + 15, itemY, windowWidth - 30, 70, 8);
          ctx.stroke();
        }

        const roleImg = roleImages[roleId];
        if (roleImg && roleImg.complete && roleImg.width > 0) {
          ctx.drawImage(roleImg, windowX + 25, itemY + 8, 50, 50);
        }

        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Arial";
        ctx.fillText(roleData[roleId].name, windowX + 90, itemY + 28);
        ctx.fillStyle = "#aaa";
        ctx.font = "12px Arial";
        ctx.fillText(roleData[roleId].desc, windowX + 90, itemY + 48);

        roleButtons.push({ x: windowX + 15, y: itemY, w: windowWidth - 30, h: 70, roleId });
      });
    }
    
    // 好友窗口
    if (state.selectedTabWindow === "好友") {
      if (state.selectedFriend) {
        // 聊天模式
        ctx.fillStyle = "#D4AF37";
        ctx.font = "14px Arial";
        ctx.fillText("◀ 返回", windowX + 15, windowY + 60);
        actionButtons.push({ x: windowX + 10, y: windowY + 45, w: 60, h: 25, action: 'back' });
        
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(state.selectedFriend, windowX + windowWidth / 2, windowY + 60);
        ctx.textAlign = "left";
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        drawRoundedRect(ctx, windowX + 15, windowY + 80, windowWidth - 30, windowHeight - 150, 8);
        ctx.fill();
        
        const messages = state.messages[state.selectedFriend] || [];
        ctx.font = "12px Arial";
        messages.slice(-10).forEach((msg, idx) => {
          const isMe = msg.from === state.playerId || msg.from === 'me';
          const msgY = windowY + 100 + idx * 28;
          if (msgY > windowY + windowHeight - 80) return;
          
          const bubbleX = isMe ? windowX + windowWidth - 120 : windowX + 25;
          ctx.fillStyle = isMe ? "rgba(212, 175, 55, 0.4)" : "rgba(255, 255, 255, 0.2)";
          drawRoundedRect(ctx, bubbleX, msgY, 100, 24, 12);
          ctx.fill();
          
          ctx.fillStyle = "#fff";
          ctx.textAlign = isMe ? "right" : "left";
          ctx.fillText(msg.content.substring(0, 12), isMe ? bubbleX + 92 : bubbleX + 8, msgY + 16);
        });
        ctx.textAlign = "left";
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        drawRoundedRect(ctx, windowX + 15, windowY + windowHeight - 60, windowWidth - 90, 35, 8);
        ctx.fill();
        
        ctx.fillStyle = "#aaa";
        ctx.font = "12px Arial";
        ctx.fillText("点击输入消息...", windowX + 25, windowY + windowHeight - 38);
        inputAreas.push({ x: windowX + 15, y: windowY + windowHeight - 60, w: windowWidth - 90, h: 35, type: 'chat' });
        
        ctx.fillStyle = "#D4AF37";
        drawRoundedRect(ctx, windowX + windowWidth - 70, windowY + windowHeight - 60, 55, 35, 8);
        ctx.fill();
        ctx.fillStyle = "#1a1a2e";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("发送", windowX + windowWidth - 42, windowY + windowHeight - 38);
        actionButtons.push({ x: windowX + windowWidth - 70, y: windowY + windowHeight - 60, w: 55, h: 35, action: 'send' });
        ctx.textAlign = "left";
        
      } else {
        // 好友列表
        ctx.fillStyle = "#D4AF37";
        drawRoundedRect(ctx, windowX + windowWidth - 85, windowY + 50, 70, 28, 6);
        ctx.fill();
        ctx.fillStyle = "#1a1a2e";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("+ 添加", windowX + windowWidth - 50, windowY + 68);
        actionButtons.push({ x: windowX + windowWidth - 85, y: windowY + 50, w: 70, h: 28, action: 'addFriend' });
        ctx.textAlign = "left";
        
        ctx.fillStyle = "#ccc";
        ctx.font = "14px Arial";
        ctx.fillText(`好友 (${state.friends.length})`, windowX + 15, windowY + 60);
        
        const friendStartY = windowY + 75;
        if (state.friends.length === 0) {
          ctx.fillStyle = "#888";
          ctx.font = "14px Arial";
          ctx.textAlign = "center";
          ctx.fillText("暂无好友，点击添加", windowX + windowWidth / 2, friendStartY + 30);
          ctx.textAlign = "left";
        } else {
          state.friends.forEach((friend, index) => {
            const itemY = friendStartY + index * 60;
            if (itemY > windowY + windowHeight - 70) return;
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            drawRoundedRect(ctx, windowX + 15, itemY, windowWidth - 30, 55, 8);
            ctx.fill();
            
            ctx.fillStyle = friend.online ? "#4CAF50" : "#666";
            ctx.beginPath();
            ctx.arc(windowX + 35, itemY + 28, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = "#fff";
            ctx.font = "14px Arial";
            ctx.fillText(friend.nickname || friend.playerId, windowX + 50, itemY + 25);
            ctx.fillStyle = friend.online ? "#4CAF50" : "#888";
            ctx.font = "11px Arial";
            ctx.fillText(friend.online ? "在线" : "离线", windowX + 50, itemY + 43);
            
            friendButtons.push({ x: windowX + 15, y: itemY, w: windowWidth - 30, h: 55, playerId: friend.playerId });
          });
        }
      }
    }
    
    tabWindow = { x: windowX, y: windowY, w: windowWidth, h: windowHeight };
  }

  // 个人信息面板
  if (state.showProfile) {
    const windowWidth = Math.min(320, width - 40);
    const windowHeight = Math.min(420, height - 100);
    const windowX = (width - windowWidth) / 2;
    const windowY = (height - windowHeight) / 2;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = "#2a2a4a";
    drawRoundedRect(ctx, windowX, windowY, windowWidth, windowHeight, 12);
    ctx.fill();
    
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, windowX, windowY, windowWidth, windowHeight, 12);
    ctx.stroke();
    
    ctx.fillStyle = "#D4AF37";
    drawRoundedRect(ctx, windowX, windowY, windowWidth, 40, 12);
    ctx.fill();
    
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("个人资料", windowX + windowWidth / 2, windowY + 28);
    
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 16px Arial";
    ctx.fillText("✕", windowX + windowWidth - 25, windowY + 26);
    profileButtons.push({ x: windowX + windowWidth - 40, y: windowY + 5, w: 30, h: 30, action: 'close' });
    ctx.textAlign = "left";
    
    // 头像（圆形）
    const avatarCenterX = windowX + windowWidth / 2;
    const avatarY = windowY + 55;
    const avatarSize = 70;
    
    // 头像框（圆形）
    const frameCol = avatarFrames[state.avatarFrame || 0].color;
    if (frameCol !== "transparent") {
      ctx.fillStyle = frameCol;
      ctx.beginPath();
      ctx.arc(avatarCenterX, avatarY + avatarSize/2, avatarSize/2 + 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 头像背景（圆形）
    ctx.fillStyle = "#4A90D9";
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    // 头像文字
    ctx.fillStyle = "#fff";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const firstChar = (state.nickname || '无').charAt(0);
    ctx.fillText(firstChar, avatarCenterX, avatarY + avatarSize/2);
    ctx.textBaseline = "alphabetic";
    
    ctx.fillStyle = "#D4AF37";
    ctx.font = "11px Arial";
    ctx.fillText("[点击切换头像]", avatarCenterX, avatarY + avatarSize + 18);
    profileButtons.push({ x: avatarCenterX - 50, y: avatarY + avatarSize + 3, w: 100, h: 20, action: 'changeAvatar' });
    
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(state.nickname || '游客', avatarCenterX, avatarY + avatarSize + 42);
    ctx.font = "12px Arial";
    ctx.fillStyle = "#D4AF37";
    ctx.fillText("Lv." + state.level, avatarCenterX, avatarY + avatarSize + 60);
    ctx.textAlign = "left";
    
    ctx.fillStyle = "#888";
    ctx.font = "12px Arial";
    ctx.fillText("UID: " + (state.uid || '申请中...'), windowX + 20, windowY + 175);
    
    ctx.fillStyle = "#ccc";
    ctx.font = "13px Arial";
    ctx.fillText("简介: " + (state.bio || '这个人很懒'), windowX + 20, windowY + 200);
    
    // 修改按钮
    const btnY = windowY + 230;
    
    ctx.fillStyle = "rgba(212, 175, 55, 0.3)";
    drawRoundedRect(ctx, windowX + 20, btnY, windowWidth - 40, 32, 6);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "13px Arial";
    ctx.textAlign = "center";
    ctx.fillText("修改昵称", windowX + windowWidth / 2, btnY + 21);
    profileButtons.push({ x: windowX + 20, y: btnY, w: windowWidth - 40, h: 32, action: 'changeNickname' });
    
    ctx.fillStyle = "rgba(212, 175, 55, 0.3)";
    drawRoundedRect(ctx, windowX + 20, btnY + 40, windowWidth - 40, 32, 6);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText("修改简介", windowX + windowWidth / 2, btnY + 61);
    profileButtons.push({ x: windowX + 20, y: btnY + 40, w: windowWidth - 40, h: 32, action: 'changeBio' });
    
    ctx.fillStyle = "rgba(212, 175, 55, 0.3)";
    drawRoundedRect(ctx, windowX + 20, btnY + 80, windowWidth - 40, 32, 6);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText("头像框: " + avatarFrames[state.avatarFrame || 0].name, windowX + windowWidth / 2, btnY + 101);
    profileButtons.push({ x: windowX + 20, y: btnY + 80, w: windowWidth - 40, h: 32, action: 'changeFrame' });
    
    ctx.textAlign = "left";
  }

  // 右上角时间
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = "14px Arial";
  ctx.textAlign = "right";
  ctx.fillText(timeStr, width - 10, 25);
  ctx.textAlign = "left";

  return { 
    minOffset, 
    maxOffset, 
    centerButton, 
    avatarBtn,
    optionButtons, 
    tabWindow, 
    roleButtons,
    friendButtons,
    actionButtons,
    inputAreas,
    profileButtons
  };
}

module.exports = { render };
