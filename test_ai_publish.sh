#!/bin/bash

# AI内容生成与微信发布功能测试脚本
# 用法: ./test_ai_publish.sh

echo "🚀 测试AI内容生成与微信发布功能"
echo "======================================"
echo ""

# 服务器地址
API_BASE="http://localhost:5000/api/ai-publish"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 测试1: 检查配置状态
echo -e "${BLUE}测试 1/4: 检查配置状态${NC}"
echo "请求: GET $API_BASE/status"
echo ""

STATUS_RESPONSE=$(curl -s $API_BASE/status)
echo "$STATUS_RESPONSE" | python3 -m json.tool

# 解析状态
AI_CONFIGURED=$(echo "$STATUS_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['status']['aiConfigured'])" 2>/dev/null || echo "false")
WECHAT_CONFIGURED=$(echo "$STATUS_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['status']['wechatConfigured'])" 2>/dev/null || echo "false")

echo ""
if [ "$AI_CONFIGURED" = "True" ]; then
    echo -e "${GREEN}✅ AI服务已配置${NC}"
else
    echo -e "${YELLOW}⚠️  AI服务未配置（使用模拟模式）${NC}"
fi

if [ "$WECHAT_CONFIGURED" = "True" ]; then
    echo -e "${GREEN}✅ 微信API已配置${NC}"
else
    echo -e "${YELLOW}⚠️  微信API未配置（使用模拟模式）${NC}"
fi

echo ""
echo "按回车继续..."
read

# 测试2: AI生成文章（摘要模式）
echo ""
echo -e "${BLUE}测试 2/4: AI生成文章（摘要模式）${NC}"
echo "请求: POST $API_BASE/generate"
echo ""

GENERATE_PAYLOAD='{
  "sourceContent": {
    "title": "深度学习在自然语言处理中的应用",
    "content": "深度学习技术在自然语言处理领域取得了突破性进展。本文介绍了Transformer架构、BERT模型以及GPT系列模型的核心原理和应用场景。这些技术极大地提升了机器翻译、文本生成、情感分析等任务的性能。",
    "author": "AI研究团队"
  },
  "mode": "summary"
}'

echo "发送请求..."
ARTICLE_RESPONSE=$(curl -s -X POST $API_BASE/generate \
  -H "Content-Type: application/json" \
  -d "$GENERATE_PAYLOAD")

echo "$ARTICLE_RESPONSE" | python3 -m json.tool

# 提取生成的文章
GENERATED_TITLE=$(echo "$ARTICLE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['article']['title'])" 2>/dev/null || echo "")
GENERATED_DIGEST=$(echo "$ARTICLE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['article']['digest'])" 2>/dev/null || echo "")

echo ""
if [ -n "$GENERATED_TITLE" ]; then
    echo -e "${GREEN}✅ AI生成成功${NC}"
    echo "标题: $GENERATED_TITLE"
    echo "摘要: ${GENERATED_DIGEST:0:100}..."
else
    echo -e "${RED}❌ AI生成失败${NC}"
fi

echo ""
echo "按回车继续..."
read

# 测试3: AI生成文章（深度解读模式）
echo ""
echo -e "${BLUE}测试 3/4: AI生成文章（深度解读模式）${NC}"
echo "请求: POST $API_BASE/generate (deepDive mode)"
echo ""

DEEPDIVE_PAYLOAD='{
  "sourceContent": {
    "title": "Transformer架构详解",
    "content": "Transformer是一种基于自注意力机制的神经网络架构，由Google在2017年提出。它彻底改变了序列建模的方式，成为当前NLP领域的主流架构。"
  },
  "mode": "deepDive"
}'

echo "发送请求（deepDive模式，生成时间较长）..."
DEEPDIVE_RESPONSE=$(curl -s -X POST $API_BASE/generate \
  -H "Content-Type: application/json" \
  -d "$DEEPDIVE_PAYLOAD")

echo "$DEEPDIVE_RESPONSE" | python3 -m json.tool | head -30
echo "..."

DEEPDIVE_TITLE=$(echo "$DEEPDIVE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['article']['title'])" 2>/dev/null || echo "")

echo ""
if [ -n "$DEEPDIVE_TITLE" ]; then
    echo -e "${GREEN}✅ 深度解读生成成功${NC}"
else
    echo -e "${RED}❌ 深度解读生成失败${NC}"
fi

echo ""
echo "按回车继续..."
read

# 测试4: 发布到微信
echo ""
echo -e "${BLUE}测试 4/4: 发布到微信公众号${NC}"
echo "请求: POST $API_BASE/publish"
echo ""

# 使用之前生成的文章进行发布测试
PUBLISH_PAYLOAD=$(cat <<EOF
{
  "article": {
    "title": "$GENERATED_TITLE",
    "digest": "$GENERATED_DIGEST",
    "content": "<h2>引言</h2><p>这是一篇测试文章。</p><h2>正文</h2><p>内容详情...</p>",
    "author": "AI技术作者"
  }
}
EOF
)

echo "发送发布请求..."
PUBLISH_RESPONSE=$(curl -s -X POST $API_BASE/publish \
  -H "Content-Type: application/json" \
  -d "$PUBLISH_PAYLOAD")

echo "$PUBLISH_RESPONSE" | python3 -m json.tool

PUBLISH_SUCCESS=$(echo "$PUBLISH_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['success'])" 2>/dev/null || echo "false")
PUBLISH_ID=$(echo "$PUBLISH_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('publishId', ''))" 2>/dev/null || echo "")

echo ""
if [ "$PUBLISH_SUCCESS" = "True" ]; then
    echo -e "${GREEN}✅ 发布成功${NC}"
    echo "发布ID: $PUBLISH_ID"
    
    IS_MOCK=$(echo "$PUBLISH_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('mockMode', False))" 2>/dev/null || echo "False")
    if [ "$IS_MOCK" = "True" ]; then
        echo -e "${YELLOW}注意: 这是模拟发布（演示模式）${NC}"
    else
        echo -e "${GREEN}✅ 真实发布成功！${NC}"
    fi
else
    echo -e "${RED}❌ 发布失败${NC}"
fi

# 总结
echo ""
echo "======================================"
echo -e "${BLUE}📊 测试总结${NC}"
echo "======================================"
echo ""

if [ "$AI_CONFIGURED" = "True" ]; then
    echo -e "AI服务:      ${GREEN}✅ 已配置 (真实API)${NC}"
else
    echo -e "AI服务:      ${YELLOW}⚠️  未配置 (模拟模式)${NC}"
fi

if [ "$WECHAT_CONFIGURED" = "True" ]; then
    echo -e "微信API:     ${GREEN}✅ 已配置 (真实API)${NC}"
else
    echo -e "微信API:     ${YELLOW}⚠️  未配置 (模拟模式)${NC}"
fi

echo ""
echo "功能测试:"
echo "  1. 配置检查:    ✅"
echo "  2. AI生成摘要:  $([ -n "$GENERATED_TITLE" ] && echo "✅" || echo "❌")"
echo "  3. AI深度解读:  $([ -n "$DEEPDIVE_TITLE" ] && echo "✅" || echo "❌")"
echo "  4. 微信发布:    $([ "$PUBLISH_SUCCESS" = "True" ] && echo "✅" || echo "❌")"

echo ""
echo "======================================"
echo ""

if [ "$AI_CONFIGURED" != "True" ] || [ "$WECHAT_CONFIGURED" != "True" ]; then
    echo -e "${YELLOW}💡 提示：${NC}"
    echo "当前使用模拟模式，所有功能都能正常测试。"
    echo "如需使用真实AI和微信API，请配置 server/.env 文件："
    echo ""
    echo "  # AI配置"
    echo "  AI_PROVIDER=openai"
    echo "  OPENAI_API_KEY=sk-your_key_here"
    echo ""
    echo "  # 微信配置"
    echo "  WECHAT_APPID=wx_your_app_id"
    echo "  WECHAT_APPSECRET=your_secret_here"
    echo ""
fi

echo -e "${GREEN}✨ 测试完成！${NC}"
echo ""
echo "查看详细文档: cat QUICKSTART_AI_PUBLISH.md"
echo ""

