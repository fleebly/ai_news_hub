#!/bin/bash

#=============================================================================
# Railway环境变量配置脚本
# 用途：通过命令行快速配置所有环境变量
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

print_header "⚙️ Railway环境变量配置"

echo -e "${YELLOW}请输入以下环境变量值（直接粘贴即可）：${NC}"
echo ""

# 阿里云百炼配置
echo -e "${BLUE}━━━ 阿里云百炼配置 ━━━${NC}"
read -p "ALIYUN_BAILIAN_API_KEY (sk-xxxxxxxx): " BAILIAN_API_KEY
read -p "ALIYUN_BAILIAN_APP_ID (xxxxxxxx): " BAILIAN_APP_ID
echo ""

# 阿里云OSS配置
echo -e "${BLUE}━━━ 阿里云OSS配置 ━━━${NC}"
read -p "ALIYUN_OSS_ACCESS_KEY_ID (LTAI5xxxxxxxx): " OSS_KEY_ID
read -p "ALIYUN_OSS_ACCESS_KEY_SECRET: " OSS_KEY_SECRET
read -p "ALIYUN_OSS_BUCKET (ai-new-hub): " OSS_BUCKET
OSS_BUCKET=${OSS_BUCKET:-ai-new-hub}
read -p "ALIYUN_OSS_REGION (oss-cn-beijing): " OSS_REGION
OSS_REGION=${OSS_REGION:-oss-cn-beijing}
echo ""

# JWT密钥
echo -e "${BLUE}━━━ JWT密钥配置 ━━━${NC}"
read -p "JWT_SECRET (留空自动生成): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET="ai_news_hub_$(openssl rand -hex 32)"
    echo -e "${GREEN}已自动生成JWT密钥${NC}"
fi
echo ""

# 确认
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}即将设置以下环境变量：${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "ALIYUN_BAILIAN_API_KEY=sk-****"
echo "ALIYUN_BAILIAN_APP_ID=$BAILIAN_APP_ID"
echo "ALIYUN_OSS_BUCKET=$OSS_BUCKET"
echo "ALIYUN_OSS_REGION=$OSS_REGION"
echo "JWT_SECRET=****"
echo ""
read -p "确认配置？(y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    print_error "已取消配置"
    exit 1
fi

echo ""
print_header "🚀 开始配置环境变量"

# 配置环境变量
echo "正在配置阿里云百炼..."
railway variables --set "ALIYUN_BAILIAN_API_KEY=$BAILIAN_API_KEY"
railway variables --set "ALIYUN_BAILIAN_APP_ID=$BAILIAN_APP_ID"
railway variables --set "ALIYUN_BAILIAN_TEXT_MODEL=qwen3-max"
railway variables --set "ALIYUN_BAILIAN_VISION_MODEL=qwen-vl-max"
print_success "阿里云百炼配置完成"
echo ""

echo "正在配置阿里云OSS..."
railway variables --set "ALIYUN_OSS_ACCESS_KEY_ID=$OSS_KEY_ID"
railway variables --set "ALIYUN_OSS_ACCESS_KEY_SECRET=$OSS_KEY_SECRET"
railway variables --set "ALIYUN_OSS_REGION=$OSS_REGION"
railway variables --set "ALIYUN_OSS_BUCKET=$OSS_BUCKET"
print_success "阿里云OSS配置完成"
echo ""

echo "正在配置其他环境变量..."
railway variables --set "NODE_ENV=production"
railway variables --set "JWT_SECRET=$JWT_SECRET"
railway variables --set "BCRYPT_ROUNDS=12"
print_success "其他配置完成"
echo ""

# 显示所有变量
print_header "📋 当前环境变量"
railway variables
echo ""

print_header "✅ 配置完成！"
echo -e "${GREEN}所有环境变量已成功设置到Railway${NC}"
echo ""
echo -e "${YELLOW}下一步：部署后端${NC}"
echo "运行命令: railway up"
echo ""

