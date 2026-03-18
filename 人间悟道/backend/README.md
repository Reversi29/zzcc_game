# 后端部署说明

## 运行方式
1. 安装Docker和Docker Compose。
2. 在backend/目录下运行：
   ```
   docker-compose up --build
   ```
3. API将在 http://localhost:3000 运行。

## API端点
- GET /api/questions: 获取题目
- POST /api/questions: 创建题目
- POST /api/send-item: 赠送道具

## 数据库
使用MongoDB，存储题目、玩家数据等。