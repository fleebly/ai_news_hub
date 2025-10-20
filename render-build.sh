#!/bin/bash

#=============================================================================
# Render 构建脚本
# 用于在 Render 上安装 Python 依赖和 Node.js 依赖
#=============================================================================

set -e

echo "🔧 开始 Render 构建..."
echo ""

# 更新包管理器
echo "📦 更新包管理器..."
apt-get update -qq

# 安装 poppler-utils（pdf2image 依赖）
echo "📄 安装 poppler-utils..."
apt-get install -y poppler-utils python3 python3-pip

# 安装 Python 依赖
echo "🐍 安装 Python 依赖..."
pip3 install --no-cache-dir pdf2image Pillow requests urllib3

# 安装 Node.js 依赖
echo "📦 安装 Node.js 依赖..."
cd server && npm install --production

echo ""
echo "✅ 构建完成！"

