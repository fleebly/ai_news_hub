#!/bin/bash

echo "╔════════════════════════════════════════════════════╗"
echo "║     🚀 AI头条 - 快速推送（带凭证配置）           ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# 检查是否在Git仓库中
if [ ! -d ".git" ]; then
    echo "❌ 错误：不在Git仓库目录中"
    exit 1
fi

# 配置Git凭证存储
echo "🔧 配置Git凭证存储..."
git config --global credential.helper store
git config user.name "芃麦"
git config user.email "yucheng.yc@alibaba-inc.com"
echo "✅ Git配置完成"
echo ""

# 显示远程仓库信息
echo "📍 远程仓库："
git remote -v
echo ""

# 显示当前分支
echo "🌿 当前分支："
git branch
echo ""

# 提示检查仓库
echo "⚠️  重要提示："
echo "   确保远程仓库已创建："
echo "   https://code.alibaba-inc.com/ai_innovation/ai_news_hub"
echo ""
read -p "远程仓库已创建？(y/n): " repo_exists

if [ "$repo_exists" != "y" ] && [ "$repo_exists" != "Y" ]; then
    echo ""
    echo "📖 创建仓库步骤："
    echo "   1. 访问 https://code.alibaba-inc.com"
    echo "   2. 点击 'New Project'"
    echo "   3. 项目名：ai_news_hub"
    echo "   4. 路径：ai_innovation/ai_news_hub"
    echo "   5. ⚠️  不要初始化README"
    echo "   6. 创建后再运行此脚本"
    echo ""
    exit 0
fi

echo ""
echo "🚀 开始推送..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "提示：系统会要求输入用户名和密码"
echo "  Username: yucheng.yc@alibaba-inc.com (或工号)"
echo "  Password: Git密码或Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 推送到远程
GIT_TERMINAL_PROMPT=1 git push -u origin main

# 检查结果
if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ✅ 推送成功！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📍 仓库地址："
    echo "   https://code.alibaba-inc.com/ai_innovation/ai_news_hub"
    echo ""
    echo "📊 推送内容："
    echo "   • 2 commits"
    echo "   • 65 files"
    echo "   • 13,334 lines"
    echo ""
    echo "🎯 下一步："
    echo "   1. 访问仓库验证文件"
    echo "   2. 配置CI/CD（可选）"
    echo "   3. 邀请团队成员"
    echo ""
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ❌ 推送失败"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📖 常见问题："
    echo ""
    echo "1. 认证失败"
    echo "   → 检查用户名和密码是否正确"
    echo "   → 尝试使用Personal Access Token"
    echo ""
    echo "2. 仓库不存在"
    echo "   → 访问 code.alibaba-inc.com 创建仓库"
    echo "   → 确保路径为 ai_innovation/ai_news_hub"
    echo ""
    echo "3. 网络问题"
    echo "   → 检查VPN连接"
    echo "   → 配置Git代理（如需要）"
    echo ""
    echo "4. 权限问题"
    echo "   → 确认有推送权限"
    echo "   → 联系仓库管理员"
    echo ""
    echo "📚 详细帮助："
    echo "   查看 GIT_PUSH_GUIDE.md"
    echo ""
fi

