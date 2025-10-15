#!/bin/bash

# AI编程教练启动脚本

echo "🚀 启动AI编程教练系统..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js 16+"
    exit 1
fi

# 检查MongoDB是否运行
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB未运行，正在尝试启动..."
    
    # 尝试使用Docker启动MongoDB
    if command -v docker &> /dev/null; then
        echo "🐳 使用Docker启动MongoDB..."
        docker run -d -p 27017:27017 --name ai-coach-mongodb mongo:latest
        sleep 5
    else
        echo "❌ 请手动启动MongoDB服务"
        echo "   或安装Docker后重新运行此脚本"
        exit 1
    fi
fi

# 安装依赖
echo "📦 安装依赖..."

# 安装根目录依赖
if [ ! -d "node_modules" ]; then
    echo "安装根目录依赖..."
    npm install
fi

# 安装后端依赖
if [ ! -d "server/node_modules" ]; then
    echo "安装后端依赖..."
    cd server
    npm install
    cd ..
fi

# 安装前端依赖
if [ ! -d "client/node_modules" ]; then
    echo "安装前端依赖..."
    cd client
    npm install
    cd ..
fi

# 检查环境变量
if [ ! -f "server/.env" ]; then
    echo "⚠️  环境变量文件不存在，正在创建..."
    cat > server/.env << EOF
# 服务器配置
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/ai_programming_coach

# JWT密钥
JWT_SECRET=ai_programming_coach_super_secret_jwt_key_2024

# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key_here

# 其他配置
BCRYPT_ROUNDS=12
EOF
    echo "✅ 环境变量文件已创建，请编辑 server/.env 文件配置OpenAI API Key"
fi

# 初始化数据库
echo "🌱 初始化数据库..."
cd server
node seed/index.js
cd ..

# 启动应用
echo "🎉 启动应用..."
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:5000"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

npm run dev

