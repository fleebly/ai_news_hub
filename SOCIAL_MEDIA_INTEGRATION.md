# 社交媒体集成指南

## 概述

AI 新闻中心现已集成了多个社交媒体平台的热门内容，包括：
- **Reddit** - 热门 AI 和编程讨论
- **Twitter/X** - 热门AI推文
- **微博** - 热门AI相关微博

## 功能特性

### 🎯 已实现功能
1. **Reddit 集成** ✅
   - 自动获取多个 subreddit 的热门帖子
   - 支持 AI、机器学习、编程等主题
   - 无需 API key，开箱即用

2. **平台过滤** ✅
   - 按平台筛选内容（全部、Reddit、Twitter、微博）
   - 平台徽章显示
   - 实时切换

3. **统一展示** ✅
   - 社交媒体内容与新闻资讯混合展示
   - 支持点赞数、评论数、互动度展示
   - 自动去重和排序

### 🔧 配置说明

#### Reddit（默认启用）
Reddit 使用公开 API，无需配置即可使用。默认监控的 subreddit 包括：
- r/artificial
- r/MachineLearning
- r/ChatGPT
- r/OpenAI
- r/programming
- r/coding
- r/javascript
- r/python
- r/webdev

如需自定义监控的 subreddit，请编辑：
```javascript
// server/services/socialMediaService.js
this.subreddits = [
  'artificial',
  'MachineLearning',
  // 添加你想监控的 subreddit
];
```

#### Twitter/X（可选）
Twitter API v2 现在需要付费订阅。如果你有 API 访问权限，请配置：

1. 在 Twitter Developer Portal 申请 API 访问
2. 获取 Bearer Token
3. 在 `.env` 文件中配置：

```bash
# Twitter API 配置
TWITTER_BEARER_TOKEN=your_bearer_token_here
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
```

#### 微博（可选）
微博 API 需要申请开发者账号。配置步骤：

1. 访问 [微博开放平台](https://open.weibo.com/)
2. 创建应用并获取 App Key 和 App Secret
3. 获取 Access Token
4. 在 `.env` 文件中配置：

```bash
# 微博 API 配置
WEIBO_APP_KEY=your_app_key_here
WEIBO_APP_SECRET=your_app_secret_here
WEIBO_ACCESS_TOKEN=your_access_token_here
```

## API 端点

### 获取所有资讯（包含社交媒体）
```bash
GET /api/ai-news
# 默认包含社交媒体内容

GET /api/ai-news?includeSocial=false
# 不包含社交媒体内容
```

### 按平台筛选
```bash
GET /api/ai-news?platform=reddit
GET /api/ai-news?platform=twitter
GET /api/ai-news?platform=weibo
```

### 仅获取社交媒体内容
```bash
GET /api/social-media
# 获取所有平台

GET /api/social-media?platform=reddit
# 获取特定平台
```

## 数据格式

社交媒体内容统一格式：
```javascript
{
  id: "platform_postid",
  platform: "Reddit" | "Twitter" | "微博",
  type: "discussion" | "tweet" | "post",
  title: "内容标题",
  summary: "内容摘要",
  content: "完整内容",
  category: "分类",
  source: "来源（如 r/artificial）",
  author: "作者",
  publishedAt: "发布时间",
  link: "原始链接",
  imageUrl: "图片URL",
  tags: ["标签1", "标签2"],
  trending: true/false,
  likes: 点赞数,
  comments: 评论数,
  views: 浏览数,
  engagement: 互动度,
  metadata: {
    // 平台特定元数据
  }
}
```

## 性能优化

1. **缓存机制**
   - 社交媒体内容缓存 15 分钟
   - Reddit 内容自动刷新
   - 减少 API 调用次数

2. **并发获取**
   - 多个平台并行请求
   - Promise.allSettled 确保部分失败不影响整体

3. **限流保护**
   - 自动处理 API 限流
   - 优雅降级到已缓存内容

## 使用示例

### 前端组件使用
```javascript
import AINewsFeed from './components/AINewsFeed'

// 组件会自动显示所有来源的内容
<AINewsFeed />

// 用户可以通过 UI 过滤平台
// 点击"过滤"按钮，选择平台（全部、Reddit、Twitter、微博）
```

### 直接 API 调用
```javascript
// 获取所有内容
const response = await fetch('/api/ai-news')
const data = await response.json()

// 只获取 Reddit 内容
const reddit = await fetch('/api/ai-news?platform=reddit')
const redditData = await reddit.json()
```

## 故障排除

### Reddit 内容未显示
1. 检查网络连接
2. 确认没有被防火墙拦截 reddit.com
3. 查看服务器日志：`Error fetching Reddit posts`

### Twitter 内容未显示
1. 确认已配置 `TWITTER_BEARER_TOKEN`
2. 检查 API 配额是否用完
3. 验证 Token 是否有效

### 微博内容未显示
1. 确认已配置所有必需的环境变量
2. 检查 Access Token 是否过期
3. 验证应用权限设置

## 未来计划

- [ ] 添加 Hacker News 集成
- [ ] 支持更多 subreddit 自定义
- [ ] 添加内容质量评分
- [ ] 支持用户自定义关键词追踪
- [ ] 添加趋势分析和可视化

## 贡献

欢迎提交 PR 来支持更多社交媒体平台！

## 许可证

MIT

