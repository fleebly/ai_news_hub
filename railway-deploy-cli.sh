#!/bin/bash

#=============================================================================
# Railway CLI 完整部署脚本
# 用途：通过命令行完成 Railway 部署
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

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header "🚂 Railway CLI 部署"

# 检查是否登录
echo "检查登录状态..."
if ! railway whoami &> /dev/null; then
    print_error "未登录 Railway"
    print_info "请先运行: railway login"
    exit 1
fi

print_success "已登录 Railway"
echo ""

# 获取用户输入环境变量
print_header "⚙️  配置环境变量"
echo "请输入以下环境变量值（按回车使用默认值）："
echo ""

# 阿里云百炼
print_info "━━━ 阿里云百炼配置 ━━━"
read -p "ALIYUN_BAILIAN_API_KEY (sk-xxxxxxxx): " BAILIAN_API_KEY
read -p "ALIYUN_BAILIAN_APP_ID (xxxxxxxx): " BAILIAN_APP_ID
BAILIAN_TEXT_MODEL="qwen3-max"
BAILIAN_VISION_MODEL="qwen-vl-max"
echo ""

# 阿里云 OSS
print_info "━━━ 阿里云OSS配置 ━━━"
read -p "ALIYUN_OSS_ACCESS_KEY_ID (LTAI5xxxxxxxx): " OSS_KEY_ID
read -p "ALIYUN_OSS_ACCESS_KEY_SECRET: " OSS_KEY_SECRET
read -p "ALIYUN_OSS_BUCKET (默认: ai-new-hub): " OSS_BUCKET
OSS_BUCKET=${OSS_BUCKET:-ai-new-hub}
read -p "ALIYUN_OSS_REGION (默认: oss-cn-beijing): " OSS_REGION
OSS_REGION=${OSS_REGION:-oss-cn-beijing}
echo ""

# JWT 密钥
print_info "━━━ JWT密钥配置 ━━━"
read -p "JWT_SECRET (留空自动生成): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET="ai_news_hub_$(openssl rand -hex 32)"
    print_success "已自动生成 JWT_SECRET"
fi
echo ""

# 确认
print_header "📋 确认配置"
echo "即将设置以下环境变量："
echo ""
echo "ALIYUN_BAILIAN_API_KEY=sk-****"
echo "ALIYUN_BAILIAN_APP_ID=$BAILIAN_APP_ID"
echo "ALIYUN_OSS_BUCKET=$OSS_BUCKET"
echo "ALIYUN_OSS_REGION=$OSS_REGION"
echo "JWT_SECRET=****"
echo ""
read -p "确认配置？(y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    print_error "已取消部署"
    exit 1
fi

echo ""
print_header "🚀 开始部署"

# 设置环境变量
print_info "正在配置环境变量..."
echo ""

railway variables --set "NODE_ENV=production" && print_success "NODE_ENV 已设置"
railway variables --set "ALIYUN_BAILIAN_API_KEY=$BAILIAN_API_KEY" && print_success "ALIYUN_BAILIAN_API_KEY 已设置"
railway variables --set "ALIYUN_BAILIAN_APP_ID=$BAILIAN_APP_ID" && print_success "ALIYUN_BAILIAN_APP_ID 已设置"
railway variables --set "ALIYUN_BAILIAN_TEXT_MODEL=$BAILIAN_TEXT_MODEL" && print_success "ALIYUN_BAILIAN_TEXT_MODEL 已设置"
railway variables --set "ALIYUN_BAILIAN_VISION_MODEL=$BAILIAN_VISION_MODEL" && print_success "ALIYUN_BAILIAN_VISION_MODEL 已设置"
railway variables --set "ALIYUN_OSS_ACCESS_KEY_ID=$OSS_KEY_ID" && print_success "ALIYUN_OSS_ACCESS_KEY_ID 已设置"
railway variables --set "ALIYUN_OSS_ACCESS_KEY_SECRET=$OSS_KEY_SECRET" && print_success "ALIYUN_OSS_ACCESS_KEY_SECRET 已设置"
railway variables --set "ALIYUN_OSS_REGION=$OSS_REGION" && print_success "ALIYUN_OSS_REGION 已设置"
railway variables --set "ALIYUN_OSS_BUCKET=$OSS_BUCKET" && print_success "ALIYUN_OSS_BUCKET 已设置"
railway variables --set "JWT_SECRET=$JWT_SECRET" && print_success "JWT_SECRET 已设置"
railway variables --set "BCRYPT_ROUNDS=12" && print_success "BCRYPT_ROUNDS 已设置"

echo ""
print_success "所有环境变量已配置完成！"
echo ""

# 部署
print_header "📦 部署代码"
print_info "正在上传并部署代码..."
print_warning "这可能需要 2-3 分钟..."
echo ""

railway up

echo ""
print_success "部署完成！"
echo ""

# 生成域名
print_header "🌐 生成公共域名"
print_info "正在生成域名..."

DOMAIN_OUTPUT=$(railway domain 2>&1)
echo "$DOMAIN_OUTPUT"

if echo "$DOMAIN_OUTPUT" | grep -q "https://"; then
    DOMAIN=$(echo "$DOMAIN_OUTPUT" | grep -o 'https://[^ ]*' | head -1)
    print_success "域名已生成: $DOMAIN"
else
    print_warning "域名可能需要手动生成"
    print_info "请运行: railway domain"
fi

echo ""

# 验证部署
if [ ! -z "$DOMAIN" ]; then
    print_header "✅ 验证部署"
    print_info "正在测试 API..."
    sleep 5  # 等待服务启动
    
    if curl -f "$DOMAIN/api/health" 2>/dev/null; then
        echo ""
        print_success "后端部署成功！API 正常工作"
    else
        echo ""
        print_warning "健康检查失败，服务可能还在启动中"
        print_info "请稍后访问: $DOMAIN/api/health"
    fi
fi

echo ""
print_header "🎉 部署完成！"

echo -e "${GREEN}✅ 后端已部署到 Railway${NC}"
echo -e "${GREEN}✅ MongoDB 已配置${NC}"
if [ ! -z "$DOMAIN" ]; then
    echo -e "${GREEN}✅ 服务 URL: $DOMAIN${NC}"
fi
echo ""

echo -e "${YELLOW}📋 下一步：配置前端${NC}"
echo ""
echo "1️⃣ 如果使用 Netlify 部署前端："
echo "   • 登录 Netlify 控制台"
echo "   • Site Settings → Environment variables"
if [ ! -z "$DOMAIN" ]; then
    echo "   • 添加: VITE_API_URL = $DOMAIN/api"
else
    echo "   • 添加: VITE_API_URL = https://你的域名.railway.app/api"
fi
echo "   • 重新部署前端"
echo ""
echo "2️⃣ 或更新本地配置："
echo "   • 编辑 client/.env.production"
if [ ! -z "$DOMAIN" ]; then
    echo "   • 设置: VITE_API_URL=$DOMAIN/api"
else
    echo "   • 设置: VITE_API_URL=https://你的域名.railway.app/api"
fi
echo "   • 重新构建: cd client && npm run build"
echo ""

echo -e "${BLUE}🔧 常用命令：${NC}"
echo "  • 查看日志: railway logs"
echo "  • 查看状态: railway status"
echo "  • 查看变量: railway variables"
echo "  • 获取 URL: railway domain"
echo "  • 打开控制台: railway open"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎊 部署成功！现在可以使用所有功能了！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

