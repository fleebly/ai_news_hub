# 📡 论文爬虫使用指南

## ✅ 功能概述

综合论文爬虫服务，从多个渠道自动获取最新热门AI论文：

### 支持的数据源

1. **arXiv API** ✅ （稳定，推荐）
   - 直接通过官方API获取
   - 无需认证，无频率限制
   - 实时更新，数据完整

2. **Reddit** ⚠️ （需要配置）
   - r/MachineLearning
   - r/artificial  
   - r/deeplearning
   - **注意**: Reddit有反爬虫机制，建议使用官方API

3. **Papers with Code** ⚠️ （需要配置）
   - 带代码的热门论文
   - **注意**: 可能需要代理或API密钥

4. **Hugging Face Papers** ⚠️ （需要配置）
   - 每日精选论文
   - **注意**: 可能需要稳定的网络连接

5. **Twitter/X** ⚠️ （需要API密钥）
   - AI论文相关推文
   - **需要**: `TWITTER_BEARER_TOKEN`

---

## 🚀 快速开始

### 方法1：使用arXiv API（推荐）

arXiv是最稳定的数据源，无需额外配置：

```bash
# 访问前端
http://localhost:3000/papers

# 点击"刷新"按钮（🔄图标）
# 自动从arXiv获取最新论文
```

### 方法2：综合爬取（需要配置）

如果要使用Reddit、Papers with Code等渠道：

1. **配置Reddit API**（推荐）

```bash
# 1. 访问 https://www.reddit.com/prefs/apps
# 2. 创建应用获取 client_id 和 client_secret
# 3. 在 .env 中添加：
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=your_app_name/1.0
```

2. **配置Twitter API**（可选）

```bash
# 1. 访问 https://developer.twitter.com/
# 2. 创建应用获取 Bearer Token
# 3. 在 .env 中添加：
TWITTER_BEARER_TOKEN=your_bearer_token
```

---

## 🔧 当前问题及解决方案

### 问题1: Reddit返回403 Forbidden

**原因**: Reddit检测到爬虫行为

**解决方案**:

1. **使用Reddit官方API**（推荐）

修改 `paperCrawlerService.js` 中的Reddit爬取部分：

```javascript
// 使用OAuth认证
const response = await axios.get(
  `https://oauth.reddit.com/r/${subreddit}/hot`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': process.env.REDDIT_USER_AGENT
    }
  }
);
```

2. **添加更真实的请求头**

```javascript
headers: {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1'
}
```

3. **使用代理**（如果在国内）

```bash
# 设置HTTP代理
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port
```

### 问题2: Papers with Code / Hugging Face 连接被重置

**原因**: 网络不稳定或被限流

**解决方案**:

1. **添加重试机制**

```javascript
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

2. **增加超时时间**

```javascript
timeout: 30000  // 30秒
```

3. **使用备用源**

如果外部API不稳定，专注使用arXiv：

```javascript
// 获取更多arXiv论文分类
const categories = [
  'cs.AI',   // 人工智能
  'cs.LG',   // 机器学习
  'cs.CV',   // 计算机视觉
  'cs.CL',   // 自然语言处理
  'cs.NE',   // 神经网络
  'cs.RO',   // 机器人
  'stat.ML'  // 统计机器学习
];
```

---

## 📊 推荐配置

### 配置1: 稳定版（只用arXiv）

适合快速部署，无需额外配置：

```javascript
// server/routes/papers.js
router.post('/papers/crawl', async (req, res) => {
  // 从arXiv获取更多分类的论文
  const categories = ['cs.AI', 'cs.LG', 'cs.CV', 'cs.CL', 'cs.NE', 'cs.RO'];
  const result = await arxivService.fetchMultiCategoryPapers(categories, 30, true);
  // ...
});
```

### 配置2: 完整版（包含社交媒体）

需要配置API密钥：

```javascript
// 启用所有渠道
{
  reddit: true,          // 需要Reddit API
  papersWithCode: true,  // 需要稳定网络
  huggingface: true,     // 需要稳定网络
  twitter: true,         // 需要Twitter API
  limit: 20
}
```

---

## 🎯 实用建议

### 1. 从arXiv开始

arXiv是最可靠的论文来源：

```bash
# 点击"刷新"按钮
# 自动获取 cs.AI, cs.LG, cs.CV, cs.CL 四个分类的最新论文
# 每个分类15篇，共60篇
```

### 2. 手动爬取测试

```bash
cd server
node test-crawler.js
```

### 3. 查看爬取状态

```bash
curl http://localhost:5000/api/papers/crawl-status
```

### 4. 定时爬取（可选）

如果需要自动更新，可以使用 `node-cron`：

```javascript
const cron = require('node-cron');

// 每6小时爬取一次
cron.schedule('0 */6 * * *', async () => {
  console.log('🕐 定时爬取论文...');
  await paperCrawlerService.crawlAllSources({
    reddit: false,
    papersWithCode: false,
    huggingface: false,
    twitter: false,
    limit: 20
  });
});
```

---

## 💡 最佳实践

### 1. 优先使用官方API

- ✅ arXiv API
- ✅ Reddit OAuth API
- ✅ Twitter API v2
- ❌ 直接爬取HTML（容易被封）

### 2. 尊重robots.txt

检查网站的爬虫政策：

```bash
curl https://www.reddit.com/robots.txt
curl https://paperswithcode.com/robots.txt
```

### 3. 添加延迟和限流

避免频繁请求：

```javascript
await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒延迟
```

### 4. 缓存结果

减少不必要的请求：

```javascript
const cache = new NodeCache({ stdTTL: 3600 }); // 1小时缓存
```

---

## 🔍 调试技巧

### 1. 查看日志

```bash
tail -f /tmp/server.log
```

### 2. 测试单个渠道

```javascript
// 只测试Reddit
const result = await paperCrawlerService.fetchFromReddit(10);
console.log(result);
```

### 3. 检查网络连接

```bash
curl -I https://www.reddit.com/r/MachineLearning/hot.json
curl -I https://paperswithcode.com/api/v1/papers/
curl -I https://huggingface.co/api/daily_papers
```

---

## 📝 数据库

爬取的论文会自动保存到MongoDB：

```javascript
// 查看数据库中的论文
use ai_teacher_db
db.papers.find().limit(10)

// 统计
db.papers.countDocuments()
db.papers.countDocuments({ trending: true })
```

---

## 🚦 当前状态

- ✅ **后端服务**: 已启动
- ✅ **前端界面**: "爬取热门"按钮已添加
- ✅ **arXiv爬取**: 正常工作
- ⚠️ **Reddit爬取**: 需要配置API
- ⚠️ **Papers with Code**: 需要稳定网络
- ⚠️ **Hugging Face**: 需要稳定网络
- ❌ **Twitter爬取**: 需要API密钥

---

## 🎉 立即体验

### 方法1: 使用现有功能

1. 访问 http://localhost:3000/papers
2. 点击"刷新"按钮（🔄）
3. 自动从arXiv获取最新论文

### 方法2: 配置完整爬虫

1. 按照上述指南配置API密钥
2. 点击"爬取热门"按钮
3. 从多个渠道获取热门论文

---

## 📞 需要帮助？

如果遇到问题：

1. 检查 `/tmp/server.log` 日志
2. 运行 `node test-crawler.js` 测试
3. 查看 API 响应状态码
4. 确认网络连接和代理设置

---

**推荐**: 目前最稳定的方式是使用 arXiv API，无需额外配置，数据质量高且实时更新。

