#!/bin/bash

#=============================================================================
# Netlify快速部署脚本
# 用途：快速部署前端到Netlify，后端到Railway/Render
# 使用：./netlify-deploy.sh [railway|render]
#=============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Netlify + Railway/Render 快速部署"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BACKEND_PLATFORM=${1:-"railway"}

if [ "$BACKEND_PLATFORM" != "railway" ] && [ "$BACKEND_PLATFORM" != "render" ]; then
    print_error "未知的后端平台: $BACKEND_PLATFORM"
    print_info "用法: $0 [railway|render]"
    exit 1
fi

print_info "后端部署平台: $BACKEND_PLATFORM"
echo ""

# 检查必要的CLI工具
print_info "检查必要工具..."

if ! command_exists git; then
    print_error "Git 未安装"
    exit 1
fi

if ! command_exists node; then
    print_error "Node.js 未安装"
    exit 1
fi

if ! command_exists npm; then
    print_error "npm 未安装"
    exit 1
fi

print_success "基础工具检查通过"
echo ""

# 第一步：部署后端
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📦 步骤 1/3: 部署后端到 $BACKEND_PLATFORM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$BACKEND_PLATFORM" = "railway" ]; then
    if ! command_exists railway; then
        print_warning "Railway CLI 未安装"
        print_info "安装命令: npm install -g @railway/cli"
        read -p "是否现在安装? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npm install -g @railway/cli
        else
            print_error "请先安装 Railway CLI"
            exit 1
        fi
    fi
    
    print_info "初始化 Railway 项目..."
    railway login
    
    if [ ! -f ".railway" ]; then
        railway init
    fi
    
    print_info "部署后端到 Railway..."
    git add .
    git commit -m "准备Railway部署" || true
    railway up
    
    print_info "获取后端URL..."
    BACKEND_URL=$(railway domain | grep -o 'https://[^ ]*' | head -1)
    
elif [ "$BACKEND_PLATFORM" = "render" ]; then
    print_info "Render部署需要通过Web控制台或Git自动部署"
    print_info "请访问: https://render.com"
    print_info ""
    print_info "部署步骤:"
    print_info "1. 连接Git仓库"
    print_info "2. 选择 render.yaml 配置"
    print_info "3. 配置环境变量"
    print_info "4. 点击部署"
    echo ""
    read -p "请输入你的Render后端URL (例: https://your-app.onrender.com): " BACKEND_URL
fi

if [ -z "$BACKEND_URL" ]; then
    print_error "未获取到后端URL"
    exit 1
fi

print_success "后端部署完成: $BACKEND_URL"
echo ""

# 第二步：配置前端环境变量
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔧 步骤 2/3: 配置前端环境变量"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_info "创建前端生产环境配置..."
cat > client/.env.production << EOF
VITE_API_URL=${BACKEND_URL}/api
VITE_APP_TITLE=AI资讯中心
EOF

print_success "环境变量配置完成"
cat client/.env.production
echo ""

# 第三步：部署到Netlify
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🌐 步骤 3/3: 部署前端到 Netlify"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ! command_exists netlify; then
    print_warning "Netlify CLI 未安装"
    print_info "安装命令: npm install -g netlify-cli"
    read -p "是否现在安装? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install -g netlify-cli
    else
        print_error "请先安装 Netlify CLI"
        exit 1
    fi
fi

print_info "登录 Netlify..."
netlify login

print_info "构建前端..."
cd client
npm install
npm run build
cd ..

print_info "部署到 Netlify..."
if [ ! -f ".netlify/state.json" ]; then
    netlify init
fi

netlify deploy --prod --dir=client/dist

print_success "前端部署完成！"
echo ""

# 显示部署信息
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ 部署完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "后端URL: $BACKEND_URL"
print_info "前端URL: 请查看上方Netlify输出"
echo ""
print_info "后续步骤:"
echo "  1. 访问前端网站测试功能"
echo "  2. 在后端平台配置环境变量"
echo "  3. 在Netlify配置自定义域名（可选）"
echo ""
print_info "环境变量配置:"
echo "  后端($BACKEND_PLATFORM): 需要配置阿里云API密钥和OSS配置"
echo "  前端(Netlify): 已自动配置 VITE_API_URL"
echo ""
print_info "详细文档: NETLIFY_DEPLOYMENT.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

