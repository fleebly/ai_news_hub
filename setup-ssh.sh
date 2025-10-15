#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║     🔐 配置SSH推送（推荐方案）                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 检查是否已有SSH密钥
if [ -f ~/.ssh/id_rsa.pub ]; then
    echo "✅ 已存在SSH密钥"
    echo ""
    echo "📋 你的SSH公钥："
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cat ~/.ssh/id_rsa.pub
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    read -p "是否使用现有密钥？(y/n): " use_existing
    
    if [ "$use_existing" != "y" ] && [ "$use_existing" != "Y" ]; then
        echo ""
        echo "将生成新的SSH密钥..."
        ssh-keygen -t rsa -b 4096 -C "yucheng.yc@alibaba-inc.com"
    fi
else
    echo "🔧 生成新的SSH密钥..."
    echo ""
    echo "提示：一路按回车使用默认设置"
    echo ""
    ssh-keygen -t rsa -b 4096 -C "yucheng.yc@alibaba-inc.com"
    
    if [ $? -ne 0 ]; then
        echo "❌ SSH密钥生成失败"
        exit 1
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋 下一步：添加SSH公钥到code.alibaba-inc.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "步骤："
echo ""
echo "1️⃣  复制你的SSH公钥"
echo "   执行以下命令并复制输出："
echo ""
echo "   cat ~/.ssh/id_rsa.pub | pbcopy"
echo ""
echo "   （公钥已自动复制到剪贴板）"

# 自动复制公钥到剪贴板
cat ~/.ssh/id_rsa.pub | pbcopy 2>/dev/null && echo "   ✅ 公钥已复制！" || echo "   ⚠️  请手动复制公钥"

echo ""
echo "2️⃣  添加到阿里巴巴Git"
echo "   a. 访问：https://code.alibaba-inc.com/-/profile/keys"
echo "   b. 点击 'Add SSH Key' 或 '添加SSH密钥'"
echo "   c. Title：填写 'My Mac' 或任意名称"
echo "   d. Key：粘贴刚才复制的公钥"
echo "   e. 点击 'Add key' 保存"
echo ""
echo "3️⃣  确认仓库已创建"
echo "   访问：https://code.alibaba-inc.com/ai_innovation/ai_news_hub"
echo "   如果显示404，需要先创建仓库"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "SSH密钥已添加到code.alibaba-inc.com？(y/n): " key_added

if [ "$key_added" != "y" ] && [ "$key_added" != "Y" ]; then
    echo ""
    echo "⏸️  请先添加SSH密钥，然后重新运行此脚本"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔧 配置Git使用SSH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd /Users/cheng/Workspace/ai_teacher

# 检查当前远程仓库
echo "当前远程仓库："
git remote -v
echo ""

# 更改为SSH URL
echo "🔄 切换到SSH方式..."
git remote set-url origin git@code.alibaba-inc.com:ai_innovation/ai_news_hub.git

echo "✅ 已切换到SSH"
echo ""
echo "新的远程仓库："
git remote -v
echo ""

# 测试SSH连接
echo "🧪 测试SSH连接..."
echo ""
ssh -T git@code.alibaba-inc.com 2>&1 | head -5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 开始推送"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ✅ 推送成功！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📍 仓库地址："
    echo "   https://code.alibaba-inc.com/ai_innovation/ai_news_hub"
    echo ""
    echo "🎯 推送内容："
    echo "   • 2 commits"
    echo "   • 65 files"
    echo "   • 13,334 lines"
    echo ""
    echo "✨ 后续推送只需："
    echo "   git push"
    echo ""
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ❌ 推送失败"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "可能的原因："
    echo ""
    echo "1. SSH密钥未正确添加"
    echo "   → 重新检查 https://code.alibaba-inc.com/-/profile/keys"
    echo ""
    echo "2. 远程仓库不存在"
    echo "   → 访问 https://code.alibaba-inc.com/ai_innovation"
    echo "   → 创建新项目 'ai_news_hub'"
    echo ""
    echo "3. 没有推送权限"
    echo "   → 联系仓库管理员添加权限"
    echo ""
fi

