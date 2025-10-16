# 微信公众号AI创作与发布功能设计文档

## 📋 功能概述

**目标**：从论文和博客中自动生成优质文章，一键发布到个人微信公众号

**核心价值**：
- 🤖 AI辅助内容创作，提升效率10倍
- ✍️ 智能改写和总结，保持专业性
- 📱 一键发布到微信公众号
- 📊 内容管理和发布记录

## 🏗️ 系统架构

```
论文/博客列表
    ↓
选择素材
    ↓
AI内容生成
    ↓
内容编辑器
    ↓
预览审核
    ↓
微信公众号发布
    ↓
发布记录管理
```

## 🎨 功能模块设计

### 模块1：素材选择器

**位置**：Papers页面、Blogs页面

**功能**：
- 浏览论文/博客列表
- 选择感兴趣的内容
- 点击"生成文章"按钮
- 支持多篇素材合并创作

**界面元素**：
```jsx
<button className="ai-create-btn">
  🤖 AI生成文章
</button>
```

---

### 模块2：AI内容生成器

**技术栈**：
- OpenAI GPT-4 / Claude
- 或国内大模型：通义千问、文心一言、讯飞星火

**生成模式**：

1. **摘要模式**（300-500字）
   - 提取核心观点
   - 适合快讯类文章

2. **深度解读模式**（1000-2000字）
   - 详细解释技术原理
   - 添加案例和应用场景
   - 适合教程类文章

3. **观点评论模式**（800-1500字）
   - 专业分析
   - 行业影响
   - 适合评论类文章

**Prompt模板**：

```javascript
// 摘要模式
const summaryPrompt = `
你是一位专业的AI技术作者。请基于以下论文/博客内容，创作一篇微信公众号文章。

要求：
1. 标题：吸引人、准确反映主题（15-30字）
2. 摘要：100字内概括核心内容
3. 正文：300-500字，条理清晰
4. 语言：专业但易懂，适合技术爱好者阅读
5. 结构：引言-要点-总结

原始内容：
标题：${originalTitle}
摘要：${originalSummary}
内容：${originalContent}

请开始创作：
`;

// 深度解读模式
const deepDivePrompt = `
你是一位资深的AI研究员和技术博主。请基于以下论文内容，创作一篇深度解读文章。

要求：
1. 标题：专业且吸引眼球（15-30字）
2. 引言：100字内引出话题
3. 正文：1000-2000字，包含：
   - 背景介绍
   - 技术原理详解
   - 创新点分析
   - 实际应用场景
   - 代码示例（如适用）
4. 总结：展望未来发展
5. 语言：专业准确，深入浅出

原始内容：
${originalContent}

请创作：
`;
```

---

### 模块3：富文本编辑器

**推荐方案**：Quill.js 或 TinyMCE

**功能需求**：
- ✅ 文字格式（粗体、斜体、下划线）
- ✅ 标题层级（H1-H6）
- ✅ 列表（有序/无序）
- ✅ 代码块（支持语法高亮）
- ✅ 图片上传和插入
- ✅ 链接插入
- ✅ 字数统计
- ✅ 实时保存草稿

**实现示例**：

```javascript
// 安装依赖
npm install quill react-quill

// 组件实现
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const ArticleEditor = () => {
  const [content, setContent] = useState('');
  
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  return (
    <ReactQuill 
      theme="snow"
      value={content}
      onChange={setContent}
      modules={modules}
    />
  );
};
```

---

### 模块4：微信公众号API集成

**官方文档**：https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html

#### 4.1 准备工作

1. **注册微信公众平台账号**
   - 访问：https://mp.weixin.qq.com/
   - 完成实名认证

2. **获取开发者权限**
   - 开发 → 基本配置
   - 获取 AppID 和 AppSecret

3. **配置IP白名单**
   - 将服务器IP添加到白名单

#### 4.2 接口实现

```javascript
// server/services/wechatPublishService.js
const axios = require('axios');

class WechatPublishService {
  constructor() {
    this.appId = process.env.WECHAT_APPID;
    this.appSecret = process.env.WECHAT_APPSECRET;
    this.accessToken = null;
    this.tokenExpireTime = null;
  }

  // 获取access_token
  async getAccessToken() {
    if (this.accessToken && this.tokenExpireTime > Date.now()) {
      return this.accessToken;
    }

    try {
      const response = await axios.get(
        `https://api.weixin.qq.com/cgi-bin/token`,
        {
          params: {
            grant_type: 'client_credential',
            appid: this.appId,
            secret: this.appSecret
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000;
      
      return this.accessToken;
    } catch (error) {
      console.error('获取access_token失败:', error);
      throw new Error('微信API认证失败');
    }
  }

  // 新增永久素材（图片）
  async uploadImage(imageBuffer, filename) {
    const token = await this.getAccessToken();
    const FormData = require('form-data');
    
    const form = new FormData();
    form.append('media', imageBuffer, {
      filename: filename,
      contentType: 'image/jpeg'
    });

    try {
      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`,
        form,
        {
          headers: form.getHeaders()
        }
      );

      return response.data.media_id;
    } catch (error) {
      console.error('上传图片失败:', error);
      throw error;
    }
  }

  // 新增草稿
  async addDraft(article) {
    const token = await this.getAccessToken();

    const draftData = {
      articles: [
        {
          title: article.title,
          author: article.author || '技术作者',
          digest: article.digest,
          content: article.content,
          content_source_url: article.sourceUrl || '',
          thumb_media_id: article.thumbMediaId,
          need_open_comment: 0,
          only_fans_can_comment: 0
        }
      ]
    };

    try {
      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`,
        draftData
      );

      return response.data.media_id;
    } catch (error) {
      console.error('添加草稿失败:', error);
      throw error;
    }
  }

  // 发布草稿
  async publishDraft(mediaId) {
    const token = await this.getAccessToken();

    try {
      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${token}`,
        {
          media_id: mediaId
        }
      );

      return {
        publishId: response.data.publish_id,
        msgDataId: response.data.msg_data_id
      };
    } catch (error) {
      console.error('发布失败:', error);
      throw error;
    }
  }

  // 完整发布流程
  async publishArticle(article) {
    try {
      // 1. 上传封面图
      let thumbMediaId;
      if (article.coverImage) {
        const imageBuffer = await this.downloadImage(article.coverImage);
        thumbMediaId = await this.uploadImage(imageBuffer, 'cover.jpg');
      }

      // 2. 创建草稿
      const draftMediaId = await this.addDraft({
        ...article,
        thumbMediaId
      });

      // 3. 发布文章
      const publishResult = await this.publishDraft(draftMediaId);

      return {
        success: true,
        ...publishResult
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 下载图片
  async downloadImage(url) {
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
  }
}

module.exports = new WechatPublishService();
```

---

### 模块5：AI内容生成服务

```javascript
// server/services/aiContentService.js
const OpenAI = require('openai');

class AIContentService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // 生成文章
  async generateArticle(sourceContent, mode = 'summary') {
    const prompts = {
      summary: this.getSummaryPrompt(sourceContent),
      deepDive: this.getDeepDivePrompt(sourceContent),
      commentary: this.getCommentaryPrompt(sourceContent)
    };

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的AI技术作者和内容创作者。'
          },
          {
            role: 'user',
            content: prompts[mode]
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      });

      const generatedContent = response.choices[0].message.content;
      
      // 解析生成的内容
      return this.parseGeneratedContent(generatedContent);
    } catch (error) {
      console.error('AI生成失败:', error);
      throw error;
    }
  }

  // 摘要模式Prompt
  getSummaryPrompt(source) {
    return `
请基于以下内容创作一篇微信公众号文章（摘要模式）：

原始标题：${source.title}
原始内容：${source.content}

要求：
1. 创作一个吸引人的标题（15-30字）
2. 写一个简短的摘要（100字内）
3. 正文400-600字，结构清晰
4. 语言专业但易懂
5. 适合技术爱好者阅读

请按照以下JSON格式输出：
{
  "title": "文章标题",
  "digest": "文章摘要",
  "content": "文章正文（HTML格式）"
}
`;
  }

  // 深度解读模式Prompt
  getDeepDivePrompt(source) {
    return `
请基于以下内容创作一篇深度技术文章：

原始内容：${source.content}

要求：
1. 吸引人的标题
2. 完整的引言
3. 详细的技术解析（1500-2500字）
4. 实际应用案例
5. 代码示例（如适用）
6. 总结和展望

请按照JSON格式输出。
`;
  }

  // 解析生成的内容
  parseGeneratedContent(content) {
    try {
      // 尝试解析JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // 如果不是JSON，手动解析
      return {
        title: this.extractTitle(content),
        digest: this.extractDigest(content),
        content: this.formatAsHTML(content)
      };
    } catch (error) {
      console.error('解析内容失败:', error);
      return {
        title: '未命名文章',
        digest: content.substring(0, 100),
        content: content
      };
    }
  }

  // 辅助方法
  extractTitle(content) {
    const lines = content.split('\n');
    return lines[0].replace(/^#+\s*/, '').trim();
  }

  extractDigest(content) {
    const lines = content.split('\n').filter(l => l.trim());
    return lines[1] ? lines[1].substring(0, 100) : '';
  }

  formatAsHTML(content) {
    // 将Markdown转换为HTML
    const marked = require('marked');
    return marked.parse(content);
  }
}

module.exports = new AIContentService();
```

---

### 模块6：路由和API端点

```javascript
// server/routes/aiPublishRoutes.js
const express = require('express');
const router = express.Router();
const aiContentService = require('../services/aiContentService');
const wechatPublishService = require('../services/wechatPublishService');

// 生成文章
router.post('/generate', async (req, res) => {
  try {
    const { sourceId, sourceType, mode } = req.body;
    
    // 获取原始内容
    let sourceContent;
    if (sourceType === 'paper') {
      sourceContent = await getPaperById(sourceId);
    } else if (sourceType === 'blog') {
      sourceContent = await getBlogById(sourceId);
    }

    // AI生成文章
    const article = await aiContentService.generateArticle(sourceContent, mode);

    res.json({
      success: true,
      article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 保存草稿
router.post('/draft/save', async (req, res) => {
  try {
    const { article } = req.body;
    
    // 保存到数据库
    const draft = await saveDraft(article);

    res.json({
      success: true,
      draftId: draft._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 发布到微信
router.post('/publish', async (req, res) => {
  try {
    const { article } = req.body;

    // 发布到微信公众号
    const result = await wechatPublishService.publishArticle(article);

    if (result.success) {
      // 记录发布历史
      await savePublishRecord({
        articleId: article.id,
        publishId: result.publishId,
        publishTime: new Date()
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取草稿列表
router.get('/drafts', async (req, res) => {
  try {
    const drafts = await getDrafts();
    res.json({
      success: true,
      drafts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取发布记录
router.get('/publish-history', async (req, res) => {
  try {
    const history = await getPublishHistory();
    res.json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

---

### 模块7：前端页面实现

```jsx
// client/src/pages/AIPublish.jsx
import { useState } from 'react';
import { Wand2, FileText, Send, Save } from 'lucide-react';
import ReactQuill from 'react-quill';

const AIPublish = () => {
  const [step, setStep] = useState(1); // 1: 选择素材, 2: 生成内容, 3: 编辑, 4: 发布
  const [selectedSource, setSelectedSource] = useState(null);
  const [generatedArticle, setGeneratedArticle] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // AI生成文章
  const handleGenerate = async (mode) => {
    setGenerating(true);
    try {
      const response = await fetch('http://localhost:5000/api/ai-publish/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: selectedSource.id,
          sourceType: selectedSource.type,
          mode: mode
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedArticle(data.article);
        setEditedContent(data.article.content);
        setStep(3);
      }
    } catch (error) {
      alert('生成失败: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  // 发布到微信
  const handlePublish = async () => {
    setPublishing(true);
    try {
      const response = await fetch('http://localhost:5000/api/ai-publish/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: {
            ...generatedArticle,
            content: editedContent
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ 发布成功！');
        setStep(4);
      } else {
        alert('❌ 发布失败: ' + data.error);
      }
    } catch (error) {
      alert('发布失败: ' + error.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['选择素材', 'AI生成', '编辑润色', '发布'].map((label, index) => (
              <div key={index} className={`flex-1 ${index < 3 ? 'flex items-center' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step > index + 1 ? 'bg-green-500 text-white' :
                  step === index + 1 ? 'bg-indigo-600 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <span className="ml-2 text-sm font-medium">{label}</span>
                {index < 3 && <div className="flex-1 h-1 mx-4 bg-gray-300"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* 步骤1: 选择素材 */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">选择素材</h2>
            {/* 论文/博客列表 */}
          </div>
        )}

        {/* 步骤2: AI生成选项 */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">选择生成模式</h2>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleGenerate('summary')}
                disabled={generating}
                className="p-6 border-2 rounded-lg hover:border-indigo-600 transition"
              >
                <Wand2 className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                <h3 className="font-semibold mb-2">快速摘要</h3>
                <p className="text-sm text-gray-600">300-500字</p>
              </button>
              
              <button
                onClick={() => handleGenerate('deepDive')}
                disabled={generating}
                className="p-6 border-2 rounded-lg hover:border-indigo-600 transition"
              >
                <FileText className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                <h3 className="font-semibold mb-2">深度解读</h3>
                <p className="text-sm text-gray-600">1000-2000字</p>
              </button>
              
              <button
                onClick={() => handleGenerate('commentary')}
                disabled={generating}
                className="p-6 border-2 rounded-lg hover:border-indigo-600 transition"
              >
                <Send className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                <h3 className="font-semibold mb-2">观点评论</h3>
                <p className="text-sm text-gray-600">800-1500字</p>
              </button>
            </div>
          </div>
        )}

        {/* 步骤3: 编辑器 */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">编辑文章</h2>
            
            <input
              type="text"
              value={generatedArticle?.title}
              className="w-full text-2xl font-bold mb-4 p-2 border rounded"
              placeholder="文章标题"
            />

            <ReactQuill
              value={editedContent}
              onChange={setEditedContent}
              className="mb-4"
              style={{ height: '400px' }}
            />

            <div className="flex justify-end space-x-4 mt-16">
              <button
                onClick={() => {/* 保存草稿 */}}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Save className="h-4 w-4 inline mr-2" />
                保存草稿
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Send className="h-4 w-4 inline mr-2" />
                {publishing ? '发布中...' : '发布到微信'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPublish;
```

---

## 💰 成本估算

### AI服务成本

| 服务 | 价格 | 说明 |
|-----|------|-----|
| OpenAI GPT-4 | $0.03/1K tokens（输入）<br>$0.06/1K tokens（输出） | 约￥0.5/篇文章 |
| 通义千问 | ￥0.008/1K tokens | 约￥0.15/篇文章 |
| 文心一言 | ￥0.012/1K tokens | 约￥0.2/篇文章 |

### 微信公众号费用

- **订阅号**：免费，但功能有限
- **服务号**：免费，需认证（￥300/年）
- **企业号**：根据规模定价

---

## 📦 依赖安装

```bash
# 服务端
cd server
npm install openai axios form-data marked

# 客户端
cd client
npm install react-quill quill
```

---

## ⚙️ 环境配置

```bash
# .env
# OpenAI配置
OPENAI_API_KEY=sk-xxx

# 微信公众号配置
WECHAT_APPID=wx123456789
WECHAT_APPSECRET=abc123def456

# 或使用国产大模型
TONGYI_API_KEY=xxx
WENXIN_API_KEY=xxx
```

---

## 🚀 实施步骤

### 第一阶段：核心功能（1-2周）
- [x] AI内容生成服务
- [x] 富文本编辑器
- [x] 微信API集成
- [x] 基础发布流程

### 第二阶段：优化完善（1周）
- [ ] 草稿管理
- [ ] 发布历史
- [ ] 图片处理和上传
- [ ] 错误处理和重试

### 第三阶段：高级功能（1-2周）
- [ ] 多篇素材合并
- [ ] SEO优化建议
- [ ] 阅读数据分析
- [ ] 定时发布

---

## 🎯 使用流程

1. **浏览论文/博客** → 选择感兴趣的内容
2. **点击"生成文章"** → 选择生成模式
3. **AI自动生成** → 等待3-10秒
4. **在线编辑** → 润色修改内容
5. **预览检查** → 确认排版和格式
6. **一键发布** → 自动同步到微信公众号
7. **查看数据** → 追踪文章表现

---

## 📝 注意事项

### 合规性
- ✅ 注明来源和参考文献
- ✅ AI生成内容需要人工审核
- ✅ 遵守微信公众平台运营规范
- ✅ 避免侵权和违规内容

### 质量控制
- 🔍 人工审核AI生成的内容
- 📝 适当润色和补充
- 🖼️ 添加合适的配图
- 🎨 优化排版和格式

---

## 🔗 相关资源

- [微信公众平台开发文档](https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html)
- [OpenAI API文档](https://platform.openai.com/docs/api-reference)
- [通义千问API](https://help.aliyun.com/zh/dashscope/)
- [React Quill文档](https://github.com/zenoamaro/react-quill)

---

## ✅ 总结

这是一个完整的**AI辅助内容创作和微信发布系统**，核心优势：

1. **效率提升10倍**：从阅读到发布只需10分钟
2. **质量保证**：AI生成+人工审核
3. **一键发布**：无需手动操作微信后台
4. **数据追踪**：完整的创作和发布记录

建议先实现MVP版本，验证核心价值后再逐步完善功能。

