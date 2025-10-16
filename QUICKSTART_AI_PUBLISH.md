# 🚀 AI内容生成与微信发布功能快速上手

## ✨ 功能简介

这是一个完整的**AI辅助内容创作和微信公众号发布系统**，核心功能：

1. 📖 **智能内容生成**：从论文/博客自动生成高质量文章
2. ✍️ **三种创作模式**：摘要、深度解读、观点评论
3. 📱 **一键发布**：自动发布到微信公众号
4. 📊 **内容管理**：草稿管理、发布历史追踪

## 📦 环境配置

### 1. 安装依赖

```bash
# 进入服务器目录
cd server

# 安装新依赖
npm install axios form-data
```

### 2. 配置环境变量

在 `server/.env` 文件中添加配置：

```bash
# ========== AI服务配置 ==========
# 选择AI提供商: openai, tongyi, wenxin
AI_PROVIDER=openai

# OpenAI配置（https://platform.openai.com/api-keys）
OPENAI_API_KEY=sk-your_openai_api_key_here

# 通义千问配置（https://dashscope.aliyuncs.com/）
# TONGYI_API_KEY=your_tongyi_api_key_here

# ========== 阿里云百炼配置（论文解读功能）==========
# 获取地址：https://bailian.console.aliyun.com/
ALIYUN_BAILIAN_API_KEY=your_dashscope_api_key_here
ALIYUN_BAILIAN_MODEL=qwen-plus  # qwen-turbo, qwen-plus, qwen-max

# 文心一言配置（https://cloud.baidu.com/）
# WENXIN_API_KEY=your_wenxin_api_key_here
# WENXIN_SECRET_KEY=your_wenxin_secret_key_here

# ========== 微信公众号配置 ==========
# 登录 https://mp.weixin.qq.com/ 获取
WECHAT_APPID=wx_your_app_id_here
WECHAT_APPSECRET=your_app_secret_here
```

**注意**：
- 如果不配置API Key，系统会自动使用模拟数据（演示模式）
- 演示模式下所有功能都可正常测试，只是不会真实调用AI和微信API

## 🎯 快速测试

### 方法1：使用curl测试API

```bash
# 1. 测试配置状态
curl http://localhost:5000/api/ai-publish/status

# 2. AI生成文章（摘要模式）
curl -X POST http://localhost:5000/api/ai-publish/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sourceContent": {
      "title": "深度学习最新进展",
      "content": "本文介绍了深度学习领域的最新研究成果...",
      "author": "研究团队"
    },
    "mode": "summary"
  }'

# 3. 发布到微信（模拟模式）
curl -X POST http://localhost:5000/api/ai-publish/publish \
  -H "Content-Type: application/json" \
  -d '{
    "article": {
      "title": "测试文章",
      "digest": "这是一篇测试文章",
      "content": "<p>文章内容</p>",
      "author": "作者名"
    }
  }'
```

### 方法2：使用Postman测试

导入以下API集合：

```json
{
  "info": {
    "name": "AI Publish API",
    "_postman_id": "ai-publish-api",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Check Status",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:5000/api/ai-publish/status",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "ai-publish", "status"]
        }
      }
    },
    {
      "name": "Generate Article",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"sourceContent\": {\n    \"title\": \"测试文章\",\n    \"content\": \"内容\"\n  },\n  \"mode\": \"summary\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/ai-publish/generate",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "ai-publish", "generate"]
        }
      }
    }
  ]
}
```

## 📖 API文档

### 1. 检查配置状态

**请求**：
```http
GET /api/ai-publish/status
```

**响应**：
```json
{
  "success": true,
  "status": {
    "aiConfigured": true,
    "aiProvider": "openai",
    "wechatConfigured": true,
    "features": {
      "aiGeneration": "enabled",
      "wechatPublish": "enabled"
    }
  }
}
```

### 2. AI生成文章

**请求**：
```http
POST /api/ai-publish/generate
Content-Type: application/json

{
  "sourceContent": {
    "title": "文章标题",
    "content": "文章内容",
    "summary": "文章摘要（可选）",
    "author": "作者（可选）"
  },
  "mode": "summary"  // summary, deepDive, commentary
}
```

**响应**：
```json
{
  "success": true,
  "article": {
    "title": "生成的标题",
    "digest": "文章摘要",
    "content": "<p>HTML格式的文章内容</p>",
    "author": "AI助手",
    "generatedAt": "2025-10-15T12:00:00.000Z"
  },
  "message": "AI生成完成"
}
```

**生成模式说明**：
- `summary`：摘要模式（400-600字）
- `deepDive`：深度解读（1500-2500字）
- `commentary`：观点评论（800-1500字）

### 3. 发布到微信公众号

**请求**：
```http
POST /api/ai-publish/publish
Content-Type: application/json

{
  "article": {
    "title": "文章标题",
    "digest": "文章摘要",
    "content": "<p>HTML格式内容</p>",
    "author": "作者名",
    "coverImage": "https://example.com/cover.jpg",
    "sourceUrl": "https://example.com/source"
  }
}
```

**响应（成功）**：
```json
{
  "success": true,
  "message": "发布成功！",
  "data": {
    "publishId": "2000000001",
    "msgDataId": 123456,
    "msgId": 123456,
    "publishedAt": "2025-10-15T12:00:00.000Z"
  }
}
```

**响应（演示模式）**：
```json
{
  "success": true,
  "message": "✅ 发布成功（演示模式）",
  "data": {
    "publishId": "mock_1729000000000",
    "publishedAt": "2025-10-15T12:00:00.000Z",
    "mockMode": true,
    "note": "这是演示模式，文章未真实发布..."
  }
}
```

### 4. 获取草稿列表

**请求**：
```http
GET /api/ai-publish/drafts?offset=0&count=20
```

### 5. 获取发布历史

**请求**：
```http
GET /api/ai-publish/publish-history?offset=0&count=20
```

## 🎨 使用场景示例

### 场景1：从论文快速生成摘要

```javascript
// 1. 用户在Papers页面浏览论文
// 2. 点击"生成文章"按钮
// 3. 系统调用AI生成API

const response = await fetch('http://localhost:5000/api/ai-publish/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceContent: {
      title: paper.title,
      content: paper.abstract,
      author: paper.authors
    },
    mode: 'summary'
  })
});

const data = await response.json();
console.log('生成的文章:', data.article);
```

### 场景2：深度解读技术博客

```javascript
// 使用deepDive模式生成长文
const response = await fetch('http://localhost:5000/api/ai-publish/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceContent: {
      title: blog.title,
      content: blog.content,
      summary: blog.summary
    },
    mode: 'deepDive'
  })
});
```

### 场景3：发布到微信

```javascript
// 编辑完成后，一键发布
const response = await fetch('http://localhost:5000/api/ai-publish/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    article: {
      title: editedArticle.title,
      digest: editedArticle.digest,
      content: editedArticle.content,
      author: 'AI技术作者',
      coverImage: 'https://example.com/cover.jpg'
    }
  })
});

if (response.data.success) {
  alert('✅ 发布成功！');
}
```

## 🔧 常见问题

### Q1: 如何获取OpenAI API Key？

1. 访问 https://platform.openai.com/
2. 注册/登录账号
3. 点击右上角头像 → API Keys
4. 点击"Create new secret key"
5. 复制Key并添加到 `.env` 文件

**费用参考**：
- GPT-4：约$0.03/1K tokens（输入），$0.06/1K tokens（输出）
- 生成一篇文章约$0.3-0.5

### Q2: 如何获取微信公众号凭证？

1. 访问 https://mp.weixin.qq.com/
2. 登录微信公众平台
3. 设置与开发 → 基本配置
4. 获取 AppID 和 AppSecret
5. 配置IP白名单（添加服务器IP）

**要求**：
- 必须是已认证的服务号或订阅号
- 需要开通发布接口权限

### Q3: 不配置API可以使用吗？

✅ **可以！** 系统支持完整的演示模式：

- **AI生成**：使用精心设计的模板生成文章
- **微信发布**：模拟发布流程，返回模拟数据
- **所有接口**：都能正常调用和测试

演示模式适合：
- 🎯 功能演示和展示
- 🧪 开发和测试
- 📚 学习系统架构

### Q4: 如何切换AI提供商？

在 `.env` 文件中修改 `AI_PROVIDER`：

```bash
# 使用OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-xxx

# 或使用通义千问
AI_PROVIDER=tongyi
TONGYI_API_KEY=sk-xxx

# 或使用文心一言
AI_PROVIDER=wenxin
WENXIN_API_KEY=xxx
WENXIN_SECRET_KEY=xxx
```

### Q5: 生成的内容质量如何？

AI生成的内容具有以下特点：

✅ **优点**：
- 结构清晰、逻辑连贯
- 专业术语使用准确
- 快速生成，效率高

⚠️ **需要注意**：
- 建议人工审核和润色
- 可能需要补充案例和数据
- 应添加合适的配图

## 📊 系统架构

```
用户操作
   ↓
前端界面
   ↓
API Gateway
   ↓
┌──────────────────────────────┐
│                              │
│  aiContentService            │  ←  OpenAI/通义/文心
│  (AI内容生成)                 │
│                              │
└──────────────────────────────┘
   ↓
┌──────────────────────────────┐
│                              │
│  wechatPublishService        │  ←  微信公众平台API
│  (微信发布)                   │
│                              │
└──────────────────────────────┘
   ↓
发布成功
```

## 📚 相关文档

- [完整功能设计文档](./WECHAT_PUBLISH_FEATURE.md)
- [微信数据接入方案](./WECHAT_INTEGRATION.md)
- [微信公众平台开发文档](https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html)
- [OpenAI API文档](https://platform.openai.com/docs/api-reference)

## ✅ 下一步计划

当前实现了核心后端功能，接下来可以：

1. **前端界面**：
   - [ ] 创建AI生成页面
   - [ ] 集成富文本编辑器
   - [ ] 实现草稿管理界面
   - [ ] 添加发布历史查看

2. **功能增强**：
   - [ ] 多篇素材合并生成
   - [ ] SEO优化建议
   - [ ] 定时发布
   - [ ] 数据统计分析

3. **用户体验**：
   - [ ] 实时生成进度显示
   - [ ] 历史记录和模板
   - [ ] 批量操作
   - [ ] 导出为Markdown

## 💡 使用建议

1. **内容质量**：
   - AI生成后建议人工审核
   - 补充实际案例和数据
   - 添加合适的配图
   - 优化排版和格式

2. **SEO优化**：
   - 使用吸引人的标题
   - 合理使用关键词
   - 添加相关标签
   - 配置原文链接

3. **合规性**：
   - 注明内容来源
   - 尊重原作者版权
   - 遵守微信平台规范
   - 避免敏感内容

## 🤝 贡献指南

欢迎贡献代码和建议！

- 提Issue：报告bug或提出新功能
- 提PR：贡献代码改进
- 完善文档：帮助其他用户

## 📞 获取帮助

- GitHub Issues：https://github.com/your-repo/issues
- 技术文档：查看项目文档目录
- 示例代码：参考测试用例

---

🎉 **开始使用吧！** 体验AI辅助内容创作的强大威力！

