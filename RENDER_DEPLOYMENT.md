# 🚀 Render 部署完整指南

## 📋 目录

1. [准备工作](#准备工作)
2. [MongoDB Atlas 配置](#mongodb-atlas-配置)
3. [Render 部署步骤](#render-部署步骤)
4. [环境变量配置](#环境变量配置)
5. [验证部署](#验证部署)
6. [前端配置](#前端配置)
7. [常见问题](#常见问题)

---

## 🎯 准备工作

### 需要的账号：
- ✅ GitHub 账号（连接仓库）
- ✅ Render 账号（https://render.com - 用 GitHub 登录）
- ✅ MongoDB Atlas 账号（https://www.mongodb.com/cloud/atlas - 免费数据库）

### 需要的信息：
- ✅ 阿里云百炼 API_KEY 和 APP_ID
- ✅ 阿里云 OSS 访问密钥和 Bucket 信息

---

## 💾 MongoDB Atlas 配置

Render 免费版不包含数据库，我们使用 MongoDB Atlas 的免费版（512MB存储，完全够用）。

### 步骤 1: 创建 MongoDB Atlas 账号

1. 访问：https://www.mongodb.com/cloud/atlas/register
2. 用 Google/GitHub 账号注册
3. 选择免费的 **M0 Sandbox** 计划

### 步骤 2: 创建集群

1. 登录后点击 "Build a Database"
2. 选择 **FREE** (M0 Sandbox)
3. 选择云服务商：
   - **AWS** 推荐
   - 区域：选择 **Singapore (ap-southeast-1)** 或 **Tokyo (ap-northeast-1)**（离中国最近）
4. 集群名称：`ai-news-hub`（或默认）
5. 点击 "Create"

### 步骤 3: 配置数据库访问

1. 创建数据库用户：
   - 点击左侧 "Database Access"
   - 点击 "Add New Database User"
   - **Authentication Method**: Password
   - **Username**: `aiuser`（或任意）
   - **Password**: 点击 "Autogenerate Secure Password" 并**保存密码**
   - **Database User Privileges**: Atlas admin
   - 点击 "Add User"

2. 配置网络访问：
   - 点击左侧 "Network Access"
   - 点击 "Add IP Address"
   - 选择 "Allow Access from Anywhere" (0.0.0.0/0)
   - 点击 "Confirm"

### 步骤 4: 获取连接字符串

1. 点击左侧 "Database"
2. 点击你的集群的 "Connect" 按钮
3. 选择 "Connect your application"
4. Driver: **Node.js**, Version: **5.5 or later**
5. 复制连接字符串，格式如下：
   ```
   mongodb+srv://aiuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. 将 `<password>` 替换为你的实际密码
7. **保存这个连接字符串**，稍后配置 Render 时需要

---

## 🚀 Render 部署步骤

### 步骤 1: 推送代码到 GitHub

确保你的代码已经推送到 GitHub：

```bash
cd /Users/cheng/Workspace/ai_news_hub
git add .
git commit -m "feat: 添加 Render 部署配置"
git push origin main
```

### 步骤 2: 登录 Render

1. 访问：https://dashboard.render.com/
2. 用 **GitHub 账号**登录
3. 授权 Render 访问你的仓库

### 步骤 3: 创建 Web Service

1. 点击右上角 "New +" 按钮
2. 选择 "Web Service"
3. 连接你的 GitHub 仓库：
   - 如果看不到仓库，点击 "Configure account" 授权更多仓库
   - 找到并点击 `ai_news_hub` 仓库的 "Connect"

### 步骤 4: 配置服务

在配置页面填写：

#### 基本信息
- **Name**: `ai-news-hub-backend`（或任意名称）
- **Region**: `Oregon (US West)` 或 `Singapore`（推荐）
- **Branch**: `main`
- **Root Directory**: `server`（重要！）
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node index.js`

#### 计划
- **Instance Type**: 选择 **Free**

#### 高级设置（展开 "Advanced"）
- **Health Check Path**: `/api/health`
- **Auto-Deploy**: 保持启用（代码更新时自动重新部署）

### 步骤 5: 暂不点击创建

先不要点击 "Create Web Service"，我们需要先配置环境变量。

---

## ⚙️ 环境变量配置

在创建服务页面，向下滚动到 "Environment Variables" 部分，添加以下变量：

### 必需变量（需要你填写）

点击 "Add Environment Variable"，逐个添加：

| Key | Value | 说明 |
|-----|-------|------|
| `NODE_ENV` | `production` | Node 环境 |
| `MONGODB_URI` | `mongodb+srv://aiuser:密码@cluster0...` | 从 MongoDB Atlas 获取 |
| `ALIYUN_BAILIAN_API_KEY` | `sk-xxxxxxxx` | 阿里云百炼 API 密钥 |
| `ALIYUN_BAILIAN_APP_ID` | `xxxxxxxx` | 阿里云百炼应用 ID |
| `ALIYUN_BAILIAN_TEXT_MODEL` | `qwen3-max` | 文本模型 |
| `ALIYUN_BAILIAN_VISION_MODEL` | `qwen-vl-max` | 视觉模型 |
| `ALIYUN_OSS_ACCESS_KEY_ID` | `LTAI5xxxxxxxx` | OSS 访问密钥 ID |
| `ALIYUN_OSS_ACCESS_KEY_SECRET` | `xxxxxxxx` | OSS 访问密钥 Secret |
| `ALIYUN_OSS_REGION` | `oss-cn-beijing` | OSS 区域 |
| `ALIYUN_OSS_BUCKET` | `ai-new-hub` | OSS Bucket 名称 |
| `JWT_SECRET` | `your_secret_key_2024` | JWT 密钥（任意强密码）|
| `BCRYPT_ROUNDS` | `12` | 密码加密轮次 |

### 环境变量配置清单

复制这个清单，逐个填写：

```bash
# 1. Node 环境
NODE_ENV=production

# 2. 数据库（从 MongoDB Atlas 获取）
MONGODB_URI=mongodb+srv://aiuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

# 3. 阿里云百炼
ALIYUN_BAILIAN_API_KEY=sk-xxxxxxxx
ALIYUN_BAILIAN_APP_ID=xxxxxxxx
ALIYUN_BAILIAN_TEXT_MODEL=qwen3-max
ALIYUN_BAILIAN_VISION_MODEL=qwen-vl-max

# 4. 阿里云 OSS
ALIYUN_OSS_ACCESS_KEY_ID=LTAI5xxxxxxxx
ALIYUN_OSS_ACCESS_KEY_SECRET=xxxxxxxx
ALIYUN_OSS_REGION=oss-cn-beijing
ALIYUN_OSS_BUCKET=ai-new-hub

# 5. JWT
JWT_SECRET=your_super_secret_jwt_key_2024
BCRYPT_ROUNDS=12
```

### 步骤 6: 创建并部署

1. 确认所有环境变量都已添加
2. 点击页面底部的 "Create Web Service"
3. Render 开始构建和部署（约 3-5 分钟）
4. 等待部署完成，状态变为 "Live"

---

## ✅ 验证部署

### 步骤 1: 获取后端 URL

部署成功后，你会看到服务的 URL，格式如：
```
https://ai-news-hub-backend.onrender.com
```

### 步骤 2: 测试 API

在浏览器或终端测试：

```bash
# 测试健康检查
curl https://ai-news-hub-backend.onrender.com/api/health

# 应该返回
{"status":"ok","timestamp":"..."}
```

### 步骤 3: 查看日志

如果有问题，点击服务页面的 "Logs" 标签查看日志。

---

## 🌐 前端配置

### 如果前端在 Netlify：

1. 登录 Netlify 控制台
2. 进入你的站点
3. **Site settings** → **Environment variables**
4. 添加新变量：
   - **Key**: `VITE_API_URL`
   - **Value**: `https://ai-news-hub-backend.onrender.com/api`
5. 点击 "Save"
6. **Deploys** → **Trigger deploy** → 重新部署

### 如果前端在本地：

编辑 `client/.env.production`:
```env
VITE_API_URL=https://ai-news-hub-backend.onrender.com/api
```

重新构建：
```bash
cd client
npm run build
```

---

## 🐛 常见问题

### Q1: 服务休眠问题

**问题**：免费版闲置 15 分钟后会休眠，首次访问需要 30-60 秒启动。

**解决方案**：
- 接受这个限制（对个人项目影响不大）
- 或使用 Render 的 Cron Job 功能定期唤醒（每 14 分钟访问一次）
- 或升级到付费版（$7/月）

### Q2: 部署失败

**检查清单**：
1. Root Directory 是否设置为 `server`
2. Build Command 是否为 `npm install`
3. Start Command 是否为 `node index.js`
4. 所有环境变量是否正确配置
5. 查看 Logs 中的错误信息

### Q3: 数据库连接失败

**检查清单**：
1. MongoDB Atlas 的 Network Access 是否允许 0.0.0.0/0
2. MONGODB_URI 中的密码是否正确（特殊字符需要 URL 编码）
3. 数据库用户权限是否正确（至少 readWrite）

### Q4: Python 脚本无法运行

**问题**：PDF 转换需要 Python 和 poppler。

**解决方案**：

在 Render 服务的 "Environment" 标签添加：

1. 添加 Build Command（替换原来的）:
```bash
apt-get update && apt-get install -y poppler-utils python3 python3-pip && pip3 install pdf2image Pillow requests && npm install
```

2. 或创建 `render-build.sh` 文件（在项目根目录）:
```bash
#!/bin/bash
apt-get update
apt-get install -y poppler-utils python3 python3-pip
pip3 install pdf2image Pillow requests
cd server && npm install
```

然后将 Build Command 改为：
```bash
./render-build.sh
```

### Q5: CORS 错误

确保 `server/index.js` 中的 CORS 配置包含你的前端域名：

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-netlify-site.netlify.app',
  'https://ai-news-hub-backend.onrender.com'
];
```

---

## 📊 性能优化建议

### 1. 使用自定义域名（可选）

Render 免费版支持自定义域名，可以提高访问速度。

### 2. 启用持久化磁盘（付费功能）

如果需要存储文件，可以考虑升级到 $7/月 的计划。

### 3. 定时唤醒（防止休眠）

创建一个简单的 Cron Job：
1. 在 Render 控制台点击 "New +" → "Cron Job"
2. 设置每 14 分钟运行一次：
   ```
   */14 * * * * curl https://ai-news-hub-backend.onrender.com/api/health
   ```

---

## 🎉 部署成功检查清单

- [ ] MongoDB Atlas 集群已创建并获取连接字符串
- [ ] Render Web Service 已创建并部署成功
- [ ] 所有环境变量已正确配置
- [ ] `/api/health` 接口返回正常
- [ ] 前端已配置后端 URL
- [ ] 前端重新部署完成
- [ ] AI 深度解读功能测试通过
- [ ] 爬取热门论文功能测试通过

---

## 🆘 需要帮助？

如果遇到任何问题：
1. 查看 Render 服务的 Logs 标签
2. 查看 MongoDB Atlas 的 Metrics 和 Logs
3. 测试各个 API 端点
4. 检查环境变量是否正确

---

## 📚 相关资源

- [Render 文档](https://render.com/docs)
- [MongoDB Atlas 文档](https://www.mongodb.com/docs/atlas/)
- [Render 免费版限制](https://render.com/docs/free)

---

**祝部署顺利！** 🚀

