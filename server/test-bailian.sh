#!/bin/bash

# 阿里云百炼论文解读功能测试脚本

echo "========================================="
echo "阿里云百炼论文解读功能测试"
echo "========================================="
echo ""

# 服务器地址
SERVER="http://localhost:5000"

# 1. 检查服务状态
echo "📊 1. 检查服务状态..."
curl -s "$SERVER/api/paper-analysis/status" | jq '.'
echo ""

# 2. 测试从arXiv ID解读论文（快速摘要模式）
echo "📝 2. 测试arXiv论文解读 - 快速摘要..."
curl -s -X POST "$SERVER/api/paper-analysis/from-arxiv" \
  -H "Content-Type: application/json" \
  -d '{
    "arxivId": "2301.00234",
    "mode": "summary"
  }' | jq '.'
echo ""

# 3. 测试深度解读模式
echo "🔍 3. 测试arXiv论文解读 - 深度解读..."
curl -s -X POST "$SERVER/api/paper-analysis/from-arxiv" \
  -H "Content-Type: application/json" \
  -d '{
    "arxivId": "2301.00234",
    "mode": "deep"
  }' | jq '.data.title, .data.mode'
echo ""

# 4. 测试直接解读论文对象
echo "📖 4. 测试直接解读论文..."
curl -s -X POST "$SERVER/api/paper-analysis/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "paper": {
      "title": "Attention Is All You Need",
      "abstract": "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...",
      "authors": ["Ashish Vaswani", "Noam Shazeer"],
      "publishedAt": "2017-06-12"
    },
    "mode": "commentary"
  }' | jq '.success, .data.title'
echo ""

# 5. 测试博客解读
echo "📰 5. 测试博客解读..."
curl -s -X POST "$SERVER/api/paper-analysis/blog" \
  -H "Content-Type: application/json" \
  -d '{
    "blog": {
      "title": "GPT-4 Technical Report",
      "author": "OpenAI",
      "summary": "We report the development of GPT-4, a large-scale, multimodal model..."
    },
    "mode": "summary"
  }' | jq '.success, .message'
echo ""

echo "========================================="
echo "测试完成！"
echo "========================================="
echo ""
echo "💡 使用提示:"
echo "1. 确保已配置 ALIYUN_BAILIAN_API_KEY"
echo "2. 如未配置，系统会自动使用模拟数据"
echo "3. 真实API调用可能需要1-2分钟"
echo "4. 建议先测试简单的摘要模式"
echo ""

