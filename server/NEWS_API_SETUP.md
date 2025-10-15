# 实时新闻API配置指南

本项目现在支持从多个来源获取实时AI和编程相关资讯。

## 功能特性

✅ **RSS订阅源** - 从OpenAI、Google AI、GitHub、Hugging Face等高质量博客获取文章  
✅ **Brave Search** - 使用Brave Search API搜索最新AI资讯（可选）  
✅ **智能缓存** - 10分钟缓存机制，减少API调用  
✅ **自动去重** - 基于标题相似度去除重复新闻  
✅ **多语言支持** - 自动提取标签和分类  

## 快速开始

### 1. 无需配置（使用RSS源）

项目默认使用RSS订阅源，无需任何API密钥即可工作。

启动服务器后，访问：
```
GET http://localhost:5000/api/ai-news
```

### 2. 使用Brave Search API（可选，推荐）

Brave Search提供免费的API额度，可以获取更实时的搜索结果。

#### 获取Brave API Key:
1. 访问 https://brave.com/search/api/
2. 注册账号（免费）
3. 获取API Key
4. 免费额度：每月2000次请求

#### 配置方法:
在 `server` 目录创建 `.env` 文件（如果不存在）：

```env
# 其他配置...
BRAVE_API_KEY=your_brave_api_key_here
```

### 3. 使用Tavily Search API（可选，备选方案）

Tavily是专为AI设计的搜索API。

#### 获取Tavily API Key:
1. 访问 https://tavily.com
2. 注册账号
3. 获取API Key
4. 免费额度：每月1000次请求

#### 配置方法:
```env
TAVILY_API_KEY=your_tavily_api_key_here
```

## API端点

### 获取新闻列表
```bash
GET /api/ai-news
```

响应示例：
```json
{
  "success": true,
  "news": [
    {
      "id": "rss_xxx",
      "title": "OpenAI发布GPT-4 Turbo",
      "summary": "GPT-4 Turbo在推理能力和代码生成方面有了重大突破...",
      "category": "AI技术",
      "source": "OpenAI",
      "publishedAt": "2025-10-15T10:00:00Z",
      "link": "https://...",
      "imageUrl": "https://...",
      "tags": ["GPT-4", "AI"],
      "readTime": "3分钟",
      "trending": true,
      "views": 4892,
      "likes": 321,
      "comments": 99
    }
  ],
  "lastUpdated": "2025-10-15T12:00:00Z",
  "count": 20
}
```

### 获取单条新闻详情
```bash
GET /api/ai-news/:id
```

### 刷新缓存
```bash
POST /api/ai-news/refresh
```

### 调试：查看RSS源数据
```bash
GET /api/news/sources
```

## RSS订阅源列表

当前订阅的高质量RSS源：

1. **OpenAI Blog** - OpenAI官方博客
2. **Google AI Blog** - Google AI技术博客
3. **Meta Engineering** - Meta工程技术博客
4. **GitHub Blog** - GitHub官方博客
5. **TensorFlow Blog** - TensorFlow官方博客
6. **Hugging Face Blog** - Hugging Face社区博客
7. **AWS Machine Learning** - AWS机器学习博客

## 故障排除

### 问题1：没有获取到新闻
**解决方案：**
1. 检查网络连接
2. 查看服务器日志
3. 尝试访问 `/api/news/sources` 查看RSS源状态

### 问题2：新闻更新太慢
**解决方案：**
1. 调用 `/api/ai-news/refresh` 清除缓存
2. 配置Brave Search API获取更实时的搜索结果

### 问题3：Brave Search API不工作
**解决方案：**
1. 确认API Key正确配置在.env文件中
2. 检查API额度是否用完
3. 即使Brave API失败，RSS源仍然可以工作

## 开发调试

### 测试RSS解析
```bash
curl http://localhost:5000/api/news/sources
```

### 测试Brave搜索（需要配置API Key）
在 `server/services/newsService.js` 中可以单独测试。

### 查看缓存状态
缓存时间：10分钟（600秒）  
可以在 `newsService.js` 中修改 `stdTTL` 参数。

## 进阶配置

### 添加自定义RSS源

编辑 `server/services/newsService.js`，添加到 `RSS_FEEDS` 数组：

```javascript
const RSS_FEEDS = [
  // 现有源...
  { 
    url: 'https://your-blog.com/rss.xml', 
    category: 'AI技术', 
    source: '你的博客名称' 
  },
];
```

### 调整缓存时间

```javascript
// 在 newsService.js 中
const cache = new NodeCache({ 
  stdTTL: 600  // 改为你想要的秒数
});
```

### 修改搜索关键词

```javascript
// 在 newsService.js 中
const AI_KEYWORDS = [
  'GPT-4', 'Claude', // ... 添加更多关键词
];
```

## 性能优化

- ✅ 缓存机制减少API调用
- ✅ 并行获取多个RSS源
- ✅ 智能去重避免重复内容
- ✅ 限制返回数量（默认30条）

## 下一步计划

- [ ] 支持更多搜索引擎（SerpAPI、Exa等）
- [ ] 添加新闻分类过滤
- [ ] 实现用户自定义订阅源
- [ ] 添加新闻推荐算法
- [ ] 支持多语言新闻

## 相关资源

- [Brave Search API文档](https://brave.com/search/api/)
- [RSS Parser NPM包](https://www.npmjs.com/package/rss-parser)
- [Node-Cache文档](https://www.npmjs.com/package/node-cache)

## 许可证

与主项目相同

