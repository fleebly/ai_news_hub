#!/bin/bash

#=============================================================================
# AI资讯中心 - 阿里云一键部署脚本
# 用途：快速部署或更新应用到阿里云ECS
# 使用：./aliyun-deploy.sh [docker|pm2]
#=============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：打印彩色消息
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

# 函数：检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 函数：检查环境变量
check_env_file() {
    if [ ! -f "server/.env" ]; then
        print_error "server/.env 文件不存在！"
        print_info "请先创建 server/.env 文件并配置环境变量"
        print_info "参考: ALIYUN_DEPLOYMENT_GUIDE.md"
        exit 1
    fi
}

# 函数：检查Python依赖
check_python_deps() {
    print_info "检查Python依赖..."
    
    if ! command_exists python3; then
        print_error "Python3 未安装"
        print_info "安装命令: sudo apt install -y python3 python3-pip"
        exit 1
    fi
    
    if ! python3 -c "import pdf2image" 2>/dev/null; then
        print_warning "pdf2image 未安装"
        print_info "安装命令: python3 -m pip install --user pdf2image Pillow requests 'urllib3<2'"
    fi
    
    if ! command_exists pdftoppm; then
        print_warning "poppler-utils 未安装"
        print_info "安装命令: sudo apt install -y poppler-utils"
    fi
}

# 函数：Docker部署
deploy_with_docker() {
    print_info "使用Docker部署..."
    
    # 检查Docker
    if ! command_exists docker; then
        print_error "Docker 未安装"
        print_info "安装命令: curl -fsSL https://get.docker.com | bash"
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose 未安装"
        exit 1
    fi
    
    # 停止旧容器
    print_info "停止旧容器..."
    docker-compose down || true
    
    # 构建镜像
    print_info "构建Docker镜像..."
    docker-compose build --no-cache app
    
    # 启动服务
    print_info "启动服务..."
    docker-compose up -d
    
    # 等待服务启动
    sleep 5
    
    # 检查状态
    print_info "检查服务状态..."
    docker-compose ps
    
    # 健康检查
    if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
        print_success "服务启动成功！"
    else
        print_warning "服务可能未完全启动，请检查日志: docker-compose logs -f"
    fi
}

# 函数：PM2部署
deploy_with_pm2() {
    print_info "使用PM2部署..."
    
    # 检查Node.js
    if ! command_exists node; then
        print_error "Node.js 未安装"
        print_info "安装命令: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && nvm install 18"
        exit 1
    fi
    
    # 检查PM2
    if ! command_exists pm2; then
        print_warning "PM2 未安装，正在安装..."
        npm install -g pm2
    fi
    
    # 安装后端依赖
    print_info "安装后端依赖..."
    cd server
    npm install --production
    cd ..
    
    # 构建前端
    print_info "构建前端..."
    cd client
    if [ ! -d "node_modules" ]; then
        print_info "安装前端依赖..."
        npm install
    fi
    npm run build
    cd ..
    
    # 停止旧服务
    print_info "停止旧服务..."
    pm2 stop ai-coach-server 2>/dev/null || true
    pm2 delete ai-coach-server 2>/dev/null || true
    
    # 启动服务
    print_info "启动服务..."
    pm2 start ecosystem.config.js
    
    # 保存PM2配置
    pm2 save
    
    # 检查状态
    print_info "检查服务状态..."
    pm2 status
    
    # 健康检查
    sleep 3
    if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
        print_success "服务启动成功！"
    else
        print_warning "服务可能未完全启动，请检查日志: pm2 logs"
    fi
}

# 函数：配置Nginx
configure_nginx() {
    print_info "配置Nginx..."
    
    if ! command_exists nginx; then
        print_warning "Nginx 未安装"
        print_info "安装命令: sudo apt install -y nginx"
        return
    fi
    
    # 复制Nginx配置
    if [ -f "nginx.conf" ]; then
        sudo cp nginx.conf /etc/nginx/sites-available/ai-news-hub 2>/dev/null || print_warning "需要sudo权限配置Nginx"
        
        # 启用站点
        sudo ln -sf /etc/nginx/sites-available/ai-news-hub /etc/nginx/sites-enabled/ 2>/dev/null || true
        
        # 测试配置
        sudo nginx -t && sudo systemctl reload nginx
        
        print_success "Nginx配置完成"
    fi
}

# 函数：显示访问信息
show_access_info() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_success "部署完成！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📱 访问地址:"
    if [ -n "$SERVER_IP" ]; then
        echo "   http://$SERVER_IP"
    else
        echo "   http://localhost"
    fi
    echo ""
    echo "🔧 管理命令:"
    if [ "$DEPLOY_METHOD" = "docker" ]; then
        echo "   查看状态: docker-compose ps"
        echo "   查看日志: docker-compose logs -f app"
        echo "   重启服务: docker-compose restart app"
        echo "   停止服务: docker-compose down"
    else
        echo "   查看状态: pm2 status"
        echo "   查看日志: pm2 logs ai-coach-server"
        echo "   重启服务: pm2 restart ai-coach-server"
        echo "   停止服务: pm2 stop ai-coach-server"
    fi
    echo ""
    echo "📊 监控命令:"
    if [ "$DEPLOY_METHOD" = "docker" ]; then
        echo "   docker stats"
    else
        echo "   pm2 monit"
    fi
    echo ""
    echo "📚 更多信息: ALIYUN_DEPLOYMENT_GUIDE.md"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

#=============================================================================
# 主程序
#=============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 AI资讯中心 - 阿里云部署脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 获取服务器IP（如果可用）
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "")

# 检查部署方式参数
DEPLOY_METHOD=${1:-"auto"}

if [ "$DEPLOY_METHOD" = "auto" ]; then
    if command_exists docker && command_exists docker-compose; then
        DEPLOY_METHOD="docker"
        print_info "检测到Docker环境，使用Docker部署"
    elif command_exists pm2; then
        DEPLOY_METHOD="pm2"
        print_info "使用PM2部署"
    else
        print_error "未检测到Docker或PM2环境"
        print_info "请先安装Docker或PM2"
        print_info "Docker: curl -fsSL https://get.docker.com | bash"
        print_info "PM2: npm install -g pm2"
        exit 1
    fi
fi

# 检查环境变量文件
check_env_file

# 检查Python依赖
check_python_deps

# 执行部署
case $DEPLOY_METHOD in
    docker)
        deploy_with_docker
        ;;
    pm2)
        deploy_with_pm2
        configure_nginx
        ;;
    *)
        print_error "未知的部署方式: $DEPLOY_METHOD"
        print_info "用法: $0 [docker|pm2]"
        exit 1
        ;;
esac

# 显示访问信息
show_access_info

