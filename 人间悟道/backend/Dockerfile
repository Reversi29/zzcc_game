# 后端服务：人间悟道
# 使用Node.js + Express，提供API支持社交、题目管理等

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]