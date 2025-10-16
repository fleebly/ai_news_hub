#!/bin/bash

echo "🧪 测试混合模型PDF分析功能"
echo "================================"
echo ""

# 1. 测试API状态
echo "1. 测试API状态..."
curl -s http://localhost:5000/api/paper-analysis/status | python3 -m json.tool
echo ""
echo ""

# 2. 测试快速模式
echo "2. 测试快速模式（纯文本）..."
curl -X POST http://localhost:5000/api/paper-analysis/analyze-hybrid \
  -H "Content-Type: application/json" \
  -d '{
    "paper": {
      "title": "Attention Is All You Need",
      "abstract": "The dominant sequence transduction models...",
      "authors": ["Vaswani et al."],
      "pdfUrl": "https://arxiv.org/pdf/1706.03762.pdf"
    },
    "level": "fast"
  }' | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps({'success': data['success'], 'level': data['data'].get('level'), 'cost': data['data'].get('cost'), 'message': data['message']}, indent=2))"
echo ""
echo ""

# 3. 测试标准模式（如果Python环境配置好了）
echo "3. 测试标准模式（PDF+视觉）..."
echo "注意：这需要Python环境配置和API key，可能需要2-4分钟"
echo ""
curl -X POST http://localhost:5000/api/paper-analysis/analyze-hybrid \
  -H "Content-Type: application/json" \
  -d '{
    "paper": {
      "title": "GPT-4 Technical Report",
      "abstract": "We report the development of GPT-4...",
      "authors": ["OpenAI"],
      "pdfUrl": "https://arxiv.org/pdf/2303.08774.pdf"
    },
    "level": "standard"
  }' | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps({'success': data['success'], 'level': data['data'].get('level'), 'fallback': data['data'].get('fallback'), 'message': data['message'], 'metadata': data['data'].get('metadata')}, indent=2))"
echo ""
echo ""

echo "✅ 测试完成！"

