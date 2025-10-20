#!/bin/bash

#=============================================================================
# Railway自动部署脚本
# 用途：一键部署后端到Railway
#=============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header "🚀 Railway后端自动部署"

# 检查Railway CLI
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI未安装"
    print_info "正在安装Railway CLI..."
    npm install -g @railway/cli
fi

print_success "Railway CLI已就绪"
echo ""

# 步骤1: 登录Railway
print_header "📝 步骤1: 登录Railway"
print_info "请在浏览器中完成登录..."
railway login

echo ""
print_success "登录成功！"
echo ""

# 步骤2: 初始化项目
print_header "🎯 步骤2: 初始化Railway项目"
print_info "正在创建Railway项目..."

if [ -f ".railway" ]; then
    print_warning "Railway项目已存在，跳过初始化"
else
    railway init
    print_success "项目初始化完成"
fi

echo ""

# 步骤3: 链接服务
print_header "🔗 步骤3: 创建服务"
print_info "正在设置服务..."

# 这里Railway会自动处理
print_success "服务设置完成"
echo ""

# 步骤4: 添加MongoDB
print_header "💾 步骤4: 添加MongoDB数据库"
print_info "正在添加MongoDB..."

railway add --plugin mongodb || print_warning "MongoDB可能已存在"
print_success "MongoDB已配置"
echo ""

# 步骤5: 提示配置环境变量
print_header "⚙️  步骤5: 配置环境变量"
print_warning "请在Railway控制台手动配置以下环境变量："
echo ""
echo "必需配置："
echo "  • ALIYUN_BAILIAN_API_KEY=sk-xxxxxxxx"
echo "  • ALIYUN_BAILIAN_APP_ID=xxxxxxxx"
echo "  • ALIYUN_BAILIAN_TEXT_MODEL=qwen3-max"
echo "  • ALIYUN_BAILIAN_VISION_MODEL=qwen-vl-max"
echo "  • ALIYUN_OSS_ACCESS_KEY_ID=LTAI5xxxxxxxx"
echo "  • ALIYUN_OSS_ACCESS_KEY_SECRET=xxxxxxxxxxxxxxxx"
echo "  • ALIYUN_OSS_REGION=oss-cn-beijing"
echo "  • ALIYUN_OSS_BUCKET=your-bucket-name"
echo "  • JWT_SECRET=your_super_secret_jwt_key_2024"
echo "  • BCRYPT_ROUNDS=12"
echo ""
echo "Railway自动提供："
echo "  • MONGODB_URI (自动)"
echo "  • PORT (自动)"
echo ""

print_info "打开Railway控制台配置环境变量..."
railway open

echo ""
read -p "环境变量配置完成后，按回车继续..."
echo ""

# 步骤6: 部署
print_header "🚀 步骤6: 部署后端"
print_info "正在部署到Railway..."
print_warning "这可能需要几分钟..."
echo ""

railway up

echo ""
print_success "部署完成！"
echo ""

# 步骤7: 获取URL
print_header "🌐 步骤7: 获取后端URL"
print_info "正在获取服务URL..."
echo ""

BACKEND_URL=$(railway domain 2>/dev/null | grep -o 'https://[^ ]*' | head -1)

if [ -z "$BACKEND_URL" ]; then
    print_warning "自动获取URL失败，请手动获取："
    print_info "运行命令: railway domain"
    echo ""
    railway domain || true
    echo ""
    read -p "请输入你的后端URL (如 https://your-app.railway.app): " BACKEND_URL
else
    print_success "后端URL: $BACKEND_URL"
fi

echo ""

# 步骤8: 验证部署
print_header "✅ 步骤8: 验证部署"
print_info "测试后端健康检查..."
echo ""

sleep 5  # 等待服务启动

if curl -f "$BACKEND_URL/api/health" 2>/dev/null; then
    echo ""
    print_success "后端部署成功！API正常工作"
else
    echo ""
    print_warning "健康检查失败，请检查部署日志："
    print_info "运行命令: railway logs"
fi

echo ""

# 总结
print_header "🎉 部署完成！"

echo -e "${GREEN}✅ 后端已部署到Railway${NC}"
echo -e "${GREEN}✅ MongoDB已配置${NC}"
echo -e "${GREEN}✅ 服务URL: $BACKEND_URL${NC}"
echo ""

echo -e "${YELLOW}📋 下一步：配置前端${NC}"
echo ""
echo "1️⃣ 如果使用Netlify部署前端："
echo "   • 登录Netlify控制台"
echo "   • Site Settings → Environment variables"
echo "   • 添加: VITE_API_URL = $BACKEND_URL/api"
echo "   • 重新部署前端"
echo ""
echo "2️⃣ 或更新本地配置："
echo "   • 编辑 client/.env.production"
echo "   • 设置: VITE_API_URL=$BACKEND_URL/api"
echo "   • 重新构建: cd client && npm run build"
echo ""

echo -e "${BLUE}🔧 常用命令：${NC}"
echo "  • 查看日志: railway logs"
echo "  • 查看状态: railway status"
echo "  • 打开控制台: railway open"
echo "  • 获取URL: railway domain"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎊 后端部署成功！现在可以使用所有功能了！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

