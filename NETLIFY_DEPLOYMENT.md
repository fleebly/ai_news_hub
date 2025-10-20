# 🚀 Netlify部署指南

## 📋 架构说明

由于这是一个全栈应用（前端 + 后端 + 数据库），我们采用**分离部署**策略：

- **前端（React）** → Netlify
- **后端（Node.js + MongoDB）** → Railway / Render / 阿里云

---

## 🎯 方案一：Netlify + Railway（推荐）

### 为什么选择这个方案？
- ✅ Netlify：免费额度高，CDN快速，自动HTTPS
- ✅ Railway：支持Node.js和MongoDB，部署简单，免费额度
- ✅ 完全分离，前后端独立扩展

---

## 📦 第一步：部署后端到Railway

### 1. 注册Railway账号

访问 [railway.app](https://railway.app) 并注册

### 2. 创建新项目

```bash
# 安装Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 初始化项目
railway init
```

### 3. 配置MongoDB

在Railway控制台：
1. 点击 "New Service"
2. 选择 "Database" → "MongoDB"
3. 记录连接字符串

### 4. 配置环境变量

在Railway项目设置中添加：
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongo:27017/ai_news_hub  # Railway自动提供

# 阿里云百炼
ALIYUN_BAILIAN_API_KEY=sk-xxxxxxxx
ALIYUN_BAILIAN_APP_ID=xxxxxxxx
ALIYUN_BAILIAN_TEXT_MODEL=qwen3-max
ALIYUN_BAILIAN_VISION_MODEL=qwen-vl-max

# 阿里云OSS
ALIYUN_OSS_ACCESS_KEY_ID=LTAI5xxxxxxxx
ALIYUN_OSS_ACCESS_KEY_SECRET=xxxxxxxxxxxxxxxx
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_BUCKET=your-bucket-name

# JWT
JWT_SECRET=your_super_secret_jwt_key_2024
BCRYPT_ROUNDS=12
```

### 5. 创建railway.json

在项目根目录创建：
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd server && npm install"
  },
  "deploy": {
    "startCommand": "cd server && node index.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 6. 部署后端

```bash
# 提交代码
git add .
git commit -m "准备Railway部署"

# 部署
railway up

# 获取部署URL
railway domain
```

记录你的后端URL，例如：`https://your-app.railway.app`

---

## 🌐 第二步：部署前端到Netlify

### 1. 注册Netlify账号

访问 [netlify.com](https://www.netlify.com) 并注册

### 2. 准备前端配置

#### 更新前端环境变量

编辑 `client/.env.production`:
```bash
VITE_API_URL=https://your-app.railway.app/api
VITE_APP_TITLE=AI资讯中心
```

### 3. 通过Git部署（推荐）

#### 方式A：通过Netlify控制台

1. 登录Netlify
2. 点击 "Add new site" → "Import an existing project"
3. 连接你的Git仓库（GitHub/GitLab/Bitbucket）
4. 配置构建设置：
   ```
   Base directory: (留空)
   Build command: cd client && npm install && npm run build
   Publish directory: client/dist
   ```
5. 添加环境变量：
   - `VITE_API_URL` = `https://your-app.railway.app/api`
6. 点击 "Deploy site"

#### 方式B：使用Netlify CLI

```bash
# 安装CLI
npm install -g netlify-cli

# 登录
netlify login

# 在项目根目录初始化
netlify init

# 手动部署
netlify deploy --prod
```

### 4. 配置自定义域名（可选）

在Netlify控制台：
1. 进入 "Domain management"
2. 添加自定义域名
3. 配置DNS记录

---

## 🎯 方案二：Netlify + Render

### 部署后端到Render

1. 访问 [render.com](https://render.com)
2. 创建新的 "Web Service"
3. 连接Git仓库
4. 配置：
   ```
   Build Command: cd server && npm install
   Start Command: cd server && node index.js
   ```
5. 添加环境变量（同Railway）
6. 创建MongoDB数据库（选择MongoDB Add-on）

### 部署前端到Netlify

步骤同上，只需修改 `VITE_API_URL` 为Render的URL

---

## 🎯 方案三：Netlify + 阿里云

### 后端部署到阿里云

参考 [ALIYUN_DEPLOYMENT_GUIDE.md](./ALIYUN_DEPLOYMENT_GUIDE.md)

### 前端部署到Netlify

配置 `VITE_API_URL` 为阿里云ECS的公网IP或域名：
```bash
VITE_API_URL=https://your-domain.com/api
```

---

## 🔧 配置API代理（重要）

### 问题：跨域请求

前端（Netlify）和后端（Railway/Render）在不同域名，需要配置CORS

### 解决方案1：后端配置CORS（推荐）

在 `server/index.js` 中已配置：
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-netlify-site.netlify.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

### 解决方案2：Netlify代理（备选）

在 `netlify.toml` 中已配置：
```toml
[[redirects]]
  from = "/api/*"
  to = "https://your-backend-api.com/api/:splat"
  status = 200
  force = true
```

---

## 📝 完整部署流程

### 准备工作

1. **准备API密钥**
   - 阿里云百炼API密钥
   - 阿里云OSS配置
   - JWT密钥

2. **选择后端平台**
   - Railway（推荐，简单）
   - Render（稳定）
   - 阿里云（完全控制）

### 部署步骤

#### 1. 部署后端

**Railway示例**：
```bash
# 1. 创建Railway项目
railway init

# 2. 添加MongoDB
railway add mongodb

# 3. 配置环境变量
railway variables set NODE_ENV=production
railway variables set ALIYUN_BAILIAN_API_KEY=sk-xxx
railway variables set ALIYUN_OSS_ACCESS_KEY_ID=LTAI5xxx
# ... 添加所有环境变量

# 4. 部署
git push railway main

# 5. 获取URL
railway domain
```

#### 2. 配置前端环境变量

创建 `client/.env.production`:
```bash
VITE_API_URL=https://your-railway-app.railway.app/api
VITE_APP_TITLE=AI资讯中心
```

#### 3. 部署到Netlify

**通过Git（自动部署）**：
1. 推送代码到GitHub
2. Netlify连接仓库
3. 自动部署

**手动部署**：
```bash
# 构建前端
cd client
npm install
npm run build

# 部署
netlify deploy --prod --dir=dist
```

---

## 🔍 验证部署

### 1. 检查后端

```bash
# 健康检查
curl https://your-backend.railway.app/api/health

# 预期返回
{"status":"ok","timestamp":"..."}
```

### 2. 检查前端

访问 `https://your-site.netlify.app`

测试功能：
- [x] 页面正常加载
- [x] API请求成功
- [x] 登录注册功能
- [x] 论文搜索功能
- [x] AI解读功能

---

## 📊 环境变量总览

### 后端环境变量（Railway/Render）

```bash
# 基础配置
NODE_ENV=production
PORT=5000
MONGODB_URI=<自动提供或配置>

# JWT
JWT_SECRET=<生成强密钥>
BCRYPT_ROUNDS=12

# 阿里云百炼
ALIYUN_BAILIAN_API_KEY=sk-xxx
ALIYUN_BAILIAN_APP_ID=xxx
ALIYUN_BAILIAN_TEXT_MODEL=qwen3-max
ALIYUN_BAILIAN_VISION_MODEL=qwen-vl-max

# 阿里云OSS
ALIYUN_OSS_ACCESS_KEY_ID=LTAI5xxx
ALIYUN_OSS_ACCESS_KEY_SECRET=xxx
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_BUCKET=your-bucket-name
```

### 前端环境变量（Netlify）

```bash
VITE_API_URL=https://your-backend.railway.app/api
VITE_APP_TITLE=AI资讯中心
```

---

## 🚨 常见问题

### 问题1: 跨域错误

**症状**: `Access-Control-Allow-Origin` 错误

**解决**:
1. 确保后端CORS配置包含Netlify域名
2. 或使用Netlify代理（修改netlify.toml）

### 问题2: API请求失败

**症状**: 404或500错误

**解决**:
```bash
# 1. 检查后端URL配置
echo $VITE_API_URL

# 2. 测试后端
curl https://your-backend.railway.app/api/health

# 3. 查看后端日志
railway logs  # 或 render logs
```

### 问题3: 构建失败

**症状**: Netlify构建错误

**解决**:
```bash
# 1. 检查构建命令
cd client && npm install && npm run build

# 2. 本地测试构建
cd client
npm install
npm run build

# 3. 检查环境变量
# 确保 VITE_API_URL 已配置
```

### 问题4: PDF转换失败

**症状**: PDF解读不工作

**原因**: Railway/Render需要额外配置Python环境

**解决**:

**Railway** - 添加 `nixpacks.toml`:
```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "python39", "poppler_utils"]

[phases.install]
cmds = [
  "cd server && npm install",
  "python3 -m pip install --user pdf2image Pillow requests 'urllib3<2'"
]
```

**Render** - 添加 `render.yaml`:
```yaml
services:
  - type: web
    name: ai-news-hub
    env: node
    buildCommand: |
      apt-get update
      apt-get install -y python3 python3-pip poppler-utils
      python3 -m pip install pdf2image Pillow requests 'urllib3<2'
      cd server && npm install
    startCommand: cd server && node index.js
```

### 问题5: MongoDB连接失败

**解决**:
1. 检查 `MONGODB_URI` 环境变量
2. 确保MongoDB服务已启动
3. 检查网络连接

---

## 🎛️ 持续集成/持续部署(CI/CD)

### 自动部署流程

1. **推送代码到Git**
   ```bash
   git add .
   git commit -m "更新功能"
   git push origin main
   ```

2. **自动触发构建**
   - Netlify自动检测推送
   - Railway/Render自动部署后端

3. **验证部署**
   - Netlify：查看部署日志
   - Railway：`railway logs`

### 回滚部署

**Netlify**:
```bash
# 通过控制台回滚到之前的部署
# Deploys → 选择版本 → Publish deploy
```

**Railway**:
```bash
railway rollback
```

---

## 💰 费用估算

### Netlify（前端）
- **免费额度**: 100GB带宽/月，300分钟构建/月
- **适用场景**: 个人项目、小型应用
- **超出费用**: $7-25/月

### Railway（后端）
- **免费额度**: $5/月免费额度（约500小时）
- **付费计划**: 按使用量付费，约$10-20/月
- **适用场景**: 中小型应用

### Render（后端）
- **免费层**: 512MB内存，休眠机制
- **付费计划**: $7/月起
- **适用场景**: 需要24/7运行

### 总成本
- **最低**: $0/月（免费额度）
- **推荐**: $10-30/月（稳定运行）
- **对比阿里云**: ECS约¥100-200/月

---

## 🔐 安全最佳实践

1. **环境变量管理**
   - 不要在代码中硬编码密钥
   - 使用平台的环境变量功能
   - 定期轮换密钥

2. **HTTPS**
   - Netlify自动提供SSL
   - Railway自动提供SSL
   - 强制HTTPS重定向

3. **API安全**
   - 启用CORS限制
   - 使用JWT认证
   - API限流

4. **数据备份**
   - Railway: 定期导出MongoDB
   - Render: 使用备份插件

---

## 📚 相关文档

- [Netlify文档](https://docs.netlify.com/)
- [Railway文档](https://docs.railway.app/)
- [Render文档](https://render.com/docs)
- [项目OSS配置](./OSS_SETUP.md)
- [阿里云部署](./ALIYUN_DEPLOYMENT_GUIDE.md)

---

## 🎓 快速命令参考

### Netlify CLI
```bash
netlify login          # 登录
netlify init          # 初始化
netlify build         # 本地构建
netlify deploy        # 部署预览
netlify deploy --prod # 生产部署
netlify open          # 打开控制台
netlify logs          # 查看日志
```

### Railway CLI
```bash
railway login         # 登录
railway init          # 初始化
railway up            # 部署
railway logs          # 查看日志
railway domain        # 获取域名
railway variables     # 管理环境变量
railway open          # 打开控制台
```

---

## ✅ 部署检查清单

部署完成后确认：

**后端（Railway/Render）**:
- [ ] MongoDB连接成功
- [ ] 环境变量已配置
- [ ] Python依赖已安装
- [ ] API健康检查通过
- [ ] 日志正常输出

**前端（Netlify）**:
- [ ] 网站可以访问
- [ ] API请求成功
- [ ] 路由工作正常
- [ ] 静态资源加载
- [ ] HTTPS已启用

**功能测试**:
- [ ] 用户注册登录
- [ ] 论文搜索
- [ ] AI深度解读
- [ ] PDF转换
- [ ] OSS图片上传

---

**准备部署？** 从Railway + Netlify开始，这是最简单的方案！

**最后更新**: 2025-10-20

