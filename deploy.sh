#!/bin/bash

# AI编程教练部署脚本

echo "🚀 部署AI编程教练系统..."

# 检查环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装"
    exit 1
fi

# 构建前端
echo "📦 构建前端..."
cd client
npm run build
cd ..

# 安装生产依赖
echo "📦 安装生产依赖..."
cd server
npm install --production
cd ..

# 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ai-coach-server',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
EOF

echo "✅ 部署配置完成"
echo ""
echo "启动命令:"
echo "  pm2 start ecosystem.config.js"
echo ""
echo "查看状态:"
echo "  pm2 status"
echo ""
echo "查看日志:"
echo "  pm2 logs ai-coach-server"
echo ""
echo "停止服务:"
echo "  pm2 stop ai-coach-server"

