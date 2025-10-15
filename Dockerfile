# 多阶段构建Dockerfile

# 阶段1: 构建前端
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production

COPY client/ ./
RUN npm run build

# 阶段2: 构建后端
FROM node:18-alpine AS backend-builder

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ ./

# 阶段3: 生产镜像
FROM node:18-alpine

# 安装PM2
RUN npm install -g pm2

# 设置工作目录
WORKDIR /app

# 复制后端文件
COPY --from=backend-builder /app/server ./server

# 复制前端构建文件
COPY --from=frontend-builder /app/client/dist ./client/dist

# 复制根目录文件
COPY package*.json ./
COPY ecosystem.config.js ./

# 安装根目录依赖
RUN npm ci --only=production

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# 启动命令
CMD ["pm2-runtime", "start", "ecosystem.config.js"]

