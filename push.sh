#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 AI头条 - Git 推送脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查是否在正确的目录
if [ ! -d ".git" ]; then
    echo "❌ 错误：不在Git仓库目录中"
    exit 1
fi

# 显示当前状态
echo "📊 当前状态："
git log --oneline -2
echo ""

# 询问是否使用Git凭证存储
echo "💡 提示：配置Git凭证存储可以避免每次都输入密码"
echo ""
read -p "是否配置Git凭证存储？(y/n): " answer

if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
    echo ""
    echo "🔧 配置Git凭证存储..."
    git config --global credential.helper store
    git config user.name "Cheng Yu"
    git config user.email "yucheng.yc@alibaba-inc.com"
    echo "✅ 凭证存储已启用"
    echo "✅ Git用户信息已配置"
    echo "   下次输入密码后会自动保存"
    echo ""
fi

# 推送
echo "🚀 开始推送到远程仓库..."
echo ""
git push -u origin main

# 检查推送结果
if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ✅ 推送成功！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📍 仓库地址："
    echo "   https://code.alibaba-inc.com/ai_innovation/ai_news_hub"
    echo ""
    echo "🎯 下一步："
    echo "   1. 访问仓库验证所有文件已上传"
    echo "   2. 分享给团队成员"
    echo "   3. 配置CI/CD（如需要）"
    echo ""
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ❌ 推送失败"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📖 请查看 GIT_PUSH_GUIDE.md 了解详细解决方案"
    echo ""
    echo "常见问题："
    echo "  1. 身份验证失败 → 检查用户名密码"
    echo "  2. 权限被拒绝 → 确认仓库访问权限"
    echo "  3. 仓库不存在 → 先在网页上创建仓库"
    echo ""
fi

