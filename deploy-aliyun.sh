#!/bin/bash

###############################################################################
# AI News Hub - 阿里云一键部署脚本
# 适用于：Ubuntu 22.04 / CentOS 8 on Aliyun ECS
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
if [[ $EUID -ne 0 ]]; then
   print_error "此脚本必须以root权限运行"
   exit 1
fi

print_info "========================================"
print_info "  AI News Hub - 阿里云一键部署"
print_info "========================================"
echo ""

# 1. 检测操作系统
print_info "检测操作系统..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
    print_info "操作系统: $OS $VER"
else
    print_error "无法检测操作系统"
    exit 1
fi

# 2. 更新系统
print_info "更新系统软件包..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt update && apt upgrade -y
    apt install -y curl wget vim git
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
    yum update -y
    yum install -y curl wget vim git
fi

# 3. 安装Docker
print_info "检查Docker安装状态..."
if ! command -v docker &> /dev/null; then
    print_info "安装Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
    print_info "Docker安装完成"
else
    print_info "Docker已安装"
fi

# 4. 安装Docker Compose
print_info "检查Docker Compose安装状态..."
if ! command -v docker-compose &> /dev/null; then
    print_info "安装Docker Compose..."
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_info "Docker Compose安装完成"
else
    print_info "Docker Compose已安装"
fi

# 5. 创建项目目录
print_info "创建项目目录..."
PROJECT_DIR="/www/apps/ai_news_hub"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 6. 克隆代码（如果还没有）
if [ ! -d ".git" ]; then
    print_info "请输入Git仓库地址（或按Enter跳过，手动上传代码）："
    read GIT_REPO
    
    if [ ! -z "$GIT_REPO" ]; then
        print_info "克隆代码仓库..."
        git clone $GIT_REPO .
    else
        print_warn "跳过代码克隆，请手动上传代码到 $PROJECT_DIR"
        print_warn "可以使用: scp -r ./ai_news_hub root@your-ecs-ip:/www/apps/"
        exit 0
    fi
fi

# 7. 配置环境变量
print_info "配置环境变量..."
if [ ! -f "server/.env" ]; then
    print_info "创建环境变量文件..."
    
    # 生成随机JWT密钥
    JWT_SECRET=$(openssl rand -base64 32)
    
    cat > server/.env << EOF
# MongoDB
MONGODB_URI=mongodb://mongodb:27017/ai_programming_coach

# JWT
JWT_SECRET=${JWT_SECRET}
BCRYPT_ROUNDS=12

# 阿里云百炼AI（必填）
ALIYUN_BAILIAN_API_KEY=
ALIYUN_BAILIAN_MODEL=qwen-max

# Brave搜索（可选）
BRAVE_API_KEY=

# 微信公众号（可选）
WECHAT_APPID=
WECHAT_APPSECRET=

# Node环境
NODE_ENV=production
PORT=5000
EOF
    
    print_warn "⚠️  请编辑 server/.env 文件，填写必要的API密钥"
    print_warn "   vim $PROJECT_DIR/server/.env"
    echo ""
    read -p "按Enter继续..."
fi

# 8. 配置nginx（如果有域名）
print_info "是否配置域名和SSL？(y/n)"
read CONFIGURE_SSL

if [ "$CONFIGURE_SSL" == "y" ]; then
    print_info "请输入域名（如：example.com）："
    read DOMAIN
    
    if [ ! -z "$DOMAIN" ]; then
        print_info "安装Certbot..."
        if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
            apt install -y certbot
        elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
            yum install -y certbot
        fi
        
        print_info "申请SSL证书..."
        print_warn "请确保域名已解析到当前服务器IP"
        certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN
        
        # 创建SSL软链接
        mkdir -p ssl
        ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem
        ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem
        
        # 更新nginx配置中的域名
        sed -i "s/your-domain.com/$DOMAIN/g" nginx.conf
        
        print_info "SSL证书配置完成"
    fi
fi

# 9. 启动服务
print_info "启动服务..."
docker-compose down 2>/dev/null || true
docker-compose up -d

# 等待服务启动
print_info "等待服务启动..."
sleep 15

# 10. 检查服务状态
print_info "检查服务状态..."
docker-compose ps

# 11. 初始化数据
print_info "是否初始化数据（同步新闻、论文、博客）？(y/n)"
read INIT_DATA

if [ "$INIT_DATA" == "y" ]; then
    print_info "初始化数据（这可能需要几分钟）..."
    docker-compose exec -T app node server/scripts/syncData.js
fi

# 12. 配置定时任务
print_info "配置定时任务..."
CRON_FILE="/tmp/ai-news-hub-cron"
cat > $CRON_FILE << EOF
# AI News Hub 定时任务

# 每6小时同步数据
0 */6 * * * cd $PROJECT_DIR && docker-compose exec -T app node server/scripts/syncData.js >> /var/log/sync.log 2>&1

# 每天凌晨2点清理旧数据
0 2 * * * cd $PROJECT_DIR && docker-compose exec -T app node server/scripts/syncData.js --cleanup >> /var/log/cleanup.log 2>&1

# 每周日凌晨3点备份数据库
0 3 * * 0 docker exec ai-coach-mongodb mongodump --out /backup/mongodb/\$(date +\%Y\%m\%d) >> /var/log/backup.log 2>&1

# SSL证书自动续期（如果配置了SSL）
0 3 * * * certbot renew --quiet && cd $PROJECT_DIR && docker-compose restart nginx >> /var/log/certbot.log 2>&1
EOF

crontab -l 2>/dev/null | cat - $CRON_FILE | crontab -
rm $CRON_FILE
print_info "定时任务配置完成"

# 13. 显示部署信息
echo ""
print_info "========================================"
print_info "  🎉 部署完成！"
print_info "========================================"
echo ""

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

print_info "服务访问地址："
if [ ! -z "$DOMAIN" ]; then
    print_info "  https://$DOMAIN"
    print_info "  https://www.$DOMAIN"
else
    print_info "  http://$SERVER_IP"
fi

echo ""
print_info "常用命令："
print_info "  查看服务状态:  cd $PROJECT_DIR && docker-compose ps"
print_info "  查看日志:      cd $PROJECT_DIR && docker-compose logs -f app"
print_info "  重启服务:      cd $PROJECT_DIR && docker-compose restart"
print_info "  停止服务:      cd $PROJECT_DIR && docker-compose down"
print_info "  更新代码:      cd $PROJECT_DIR && git pull && docker-compose up -d --build"
print_info "  同步数据:      cd $PROJECT_DIR && docker-compose exec app node server/scripts/syncData.js"

echo ""
print_warn "⚠️  重要提示："
print_warn "  1. 请确保已在 server/.env 中配置 ALIYUN_BAILIAN_API_KEY"
print_warn "  2. 检查阿里云安全组，开放端口: 22, 80, 443"
print_warn "  3. 建议配置域名和SSL证书以使用HTTPS"
print_warn "  4. 定期备份MongoDB数据库"

echo ""
print_info "日志文件位置："
print_info "  应用日志:      docker-compose logs app"
print_info "  同步日志:      /var/log/sync.log"
print_info "  清理日志:      /var/log/cleanup.log"
print_info "  备份日志:      /var/log/backup.log"

echo ""
print_info "========================================"
print_info "  感谢使用 AI News Hub！"
print_info "========================================"

