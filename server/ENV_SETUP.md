# 环境变量配置说明

## 创建 .env 文件

在 `server` 目录下创建 `.env` 文件，配置以下环境变量：

```bash
# MongoDB配置
MONGODB_URI=mongodb://localhost:27017/ai_teacher

# 服务器配置
PORT=5000
NODE_ENV=development

# OpenAI API（用于AI功能）
OPENAI_API_KEY=

# 阿里云百炼 API（用于论文解读）
ALIYUN_BAILIAN_API_KEY=sk-f9f45a565287495f9d7bd4321fc735c6
ALIYUN_BAILIAN_MODEL=qwen3-max

# Brave Search API（用于搜索AI新闻，可选）
BRAVE_API_KEY=

# ========== 社交媒体API配置 ==========

# Twitter/X API（可选，需要付费订阅）
# 获取方式：https://developer.twitter.com/
TWITTER_BEARER_TOKEN=
TWITTER_API_KEY=
TWITTER_API_SECRET=

# 微博 API（可选，需要申请开发者账号）
# 获取方式：https://open.weibo.com/
WEIBO_APP_KEY=
WEIBO_APP_SECRET=
WEIBO_ACCESS_TOKEN=

# ========== 其他配置 ==========

# 微信公众号配置（可选）
WECHAT_APP_ID=
WECHAT_APP_SECRET=

# JWT密钥（用于用户认证）
JWT_SECRET=your_jwt_secret_key_here

# CORS配置
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 配置优先级

### 必需配置（服务器正常运行）
- `MONGODB_URI` - MongoDB 数据库连接
- `PORT` - 服务器端口
- `JWT_SECRET` - JWT 加密密钥

### 推荐配置（核心功能）
- `ALIYUN_BAILIAN_API_KEY` - 论文AI解读功能

### 可选配置（增强功能）
- `OPENAI_API_KEY` - OpenAI 相关功能
- `BRAVE_API_KEY` - 增强新闻搜索
- `TWITTER_BEARER_TOKEN` - Twitter 内容集成
- `WEIBO_APP_KEY` + `WEIBO_APP_SECRET` + `WEIBO_ACCESS_TOKEN` - 微博内容集成

## 社交媒体API申请指南

### Reddit（无需配置✅）
Reddit 使用公开API，无需任何配置即可使用。

### Twitter/X（需要付费💰）
1. 访问 [Twitter Developer Portal](https://developer.twitter.com/)
2. 创建应用
3. 订阅 API 计划（Basic 每月 $100）
4. 获取 Bearer Token
5. 配置到 `.env` 文件

### 微博（需要申请📝）
1. 访问 [微博开放平台](https://open.weibo.com/)
2. 注册开发者账号
3. 创建应用
4. 获取 App Key 和 App Secret
5. 通过 OAuth2.0 获取 Access Token
6. 配置到 `.env` 文件

## 快速开始

### 最小配置（仅使用 Reddit）
```bash
# 创建 .env 文件
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/ai_teacher
PORT=5000
NODE_ENV=development
JWT_SECRET=$(openssl rand -base64 32)
EOF
```

### 完整配置
复制上面的完整配置模板，填入你的API密钥。

## 验证配置

启动服务器后，查看控制台输出：
```bash
npm run dev
```

你会看到类似的日志：
```
✅ 阿里云百炼服务已启用，模型: qwen3-max
⚠️  OpenAI API key未配置，AI功能将不可用
⚠️  Brave API key not configured, skipping Brave search
⚠️  Twitter API not configured, skipping...
⚠️  Weibo API not configured, skipping...
✅ Fetched 27 Reddit posts
```

## 常见问题

### Q: 没有配置任何社交媒体API，服务能正常运行吗？
A: 可以！Reddit 不需要配置，会自动工作。Twitter 和微博是可选的增强功能。

### Q: 如何测试 Reddit 是否正常工作？
A: 访问 `http://localhost:5000/api/social-media?platform=reddit` 查看是否返回数据。

### Q: Twitter API 太贵，有替代方案吗？
A: 可以使用 RSS 源或者其他开源的Twitter抓取方案，但要注意遵守服务条款。

### Q: 微博 Access Token 会过期吗？
A: 是的，需要定期刷新。建议实现自动刷新机制或使用长期Token。

## 安全建议

1. **永远不要**将 `.env` 文件提交到 Git
2. 使用强随机字符串作为 `JWT_SECRET`
3. 在生产环境中使用环境变量或密钥管理服务
4. 定期轮换API密钥
5. 限制API密钥的权限范围

## 更多帮助

详细的社交媒体集成文档请参考：`SOCIAL_MEDIA_INTEGRATION.md`

