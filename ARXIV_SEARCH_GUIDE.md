# 🔍 arXiv 论文高级搜索指南

## 📋 功能说明

系统支持多种方式搜索 arXiv 论文，包括按 ID、标题、作者、关键词、摘要等精确或模糊搜索。

---

## ✨ 核心功能

### 1. 支持的搜索方式

| 搜索方式 | 字段 | 说明 | 示例 |
|---------|------|------|------|
| **arXiv ID** | `arxivId` | 精确搜索（最精准）| `2303.08774` |
| **标题** | `title` | 标题关键词 | `Attention Is All You Need` |
| **作者** | `author` | 作者名称 | `Yann LeCun` |
| **关键词** | `keywords` | 全文关键词 | `deep learning` |
| **摘要** | `abstract` | 摘要内容 | `neural network` |
| **分类** | `category` | 分类过滤 | `cs.AI` |

### 2. 排序方式

- `relevance` - 按相关性排序（默认）⭐
- `submittedDate` - 按提交日期排序
- `lastUpdatedDate` - 按最后更新日期排序

### 3. 其他选项

- `maxResults` - 最大结果数（默认30）
- `saveToDb` - 是否保存到数据库（默认false）

---

## 🚀 使用方式

### 方式1: API调用（推荐）

#### 1.1 按 arXiv ID 搜索（精确）

```bash
curl -X POST http://localhost:5000/api/papers/search \
  -H "Content-Type: application/json" \
  -d '{
    "arxivId": "2303.08774",
    "maxResults": 10
  }'
```

**响应示例**:
```json
{
  "success": true,
  "papers": [
    {
      "id": "arxiv_2303.08774",
      "arxivId": "2303.08774",
      "title": "GPT-4 Technical Report",
      "authors": ["OpenAI"],
      "category": "nlp",
      "publishedAt": "2023-03-15",
      "abstract": "We report the development of GPT-4...",
      "pdfUrl": "https://arxiv.org/pdf/2303.08774.pdf",
      "arxivUrl": "https://arxiv.org/abs/2303.08774"
    }
  ],
  "count": 1,
  "query": {
    "arxivId": "2303.08774"
  }
}
```

#### 1.2 按标题搜索

```bash
curl -X POST http://localhost:5000/api/papers/search \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Attention Is All You Need",
    "maxResults": 10
  }'
```

#### 1.3 按作者搜索

```bash
curl -X POST http://localhost:5000/api/papers/search \
  -H "Content-Type: application/json" \
  -d '{
    "author": "Yann LeCun",
    "category": "cs.AI",
    "maxResults": 20
  }'
```

#### 1.4 按关键词搜索

```bash
curl -X POST http://localhost:5000/api/papers/search \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "large language model",
    "category": "cs.CL",
    "sortBy": "submittedDate",
    "maxResults": 30
  }'
```

#### 1.5 组合搜索

```bash
curl -X POST http://localhost:5000/api/papers/search \
  -H "Content-Type: application/json" \
  -d '{
    "title": "transformer",
    "author": "Vaswani",
    "category": "cs.CL",
    "maxResults": 10
  }'
```

#### 1.6 搜索并保存到数据库

```bash
curl -X POST http://localhost:5000/api/papers/search \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "diffusion model",
    "category": "cs.CV",
    "maxResults": 20,
    "saveToDb": true
  }'
```

---

### 方式2: 代码调用

#### 2.1 在路由中使用

```javascript
const arxivService = require('../services/arxivService');

// 搜索特定论文
const papers = await arxivService.searchArxivPapersAdvanced({
  arxivId: '2303.08774',
  maxResults: 10
});

// 搜索最新的 LLM 论文
const llmPapers = await arxivService.searchArxivPapersAdvanced({
  keywords: 'large language model',
  category: 'cs.CL',
  sortBy: 'submittedDate',
  maxResults: 20,
  saveToDb: true  // 自动保存到数据库
});

// 搜索特定作者的论文
const authorPapers = await arxivService.searchArxivPapersAdvanced({
  author: 'Yann LeCun',
  category: 'cs.AI',
  maxResults: 50
});
```

#### 2.2 兼容旧版API

```javascript
// 简单搜索（向后兼容）
const papers = await arxivService.searchArxivPapers('transformer', 30);
```

---

### 方式3: 测试脚本

#### 3.1 测试所有搜索方式

```bash
cd /Users/cheng/Workspace/ai_news_hub/server
node test-search.js
```

#### 3.2 测试特定搜索方式

```bash
# 测试 ID 搜索
node test-search.js id

# 测试标题搜索
node test-search.js title

# 测试作者搜索
node test-search.js author

# 测试关键词搜索
node test-search.js keywords

# 测试组合搜索
node test-search.js combo

# 测试保存到数据库
node test-search.js save

# 查看帮助
node test-search.js --help
```

---

## 📊 API接口详解

### POST /api/papers/search

**请求参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|-----|------|------|--------|------|
| `arxivId` | string | 否 | - | arXiv ID（如：2303.08774） |
| `title` | string | 否 | - | 标题关键词 |
| `author` | string | 否 | - | 作者名称 |
| `keywords` | string | 否 | - | 全文关键词 |
| `abstract` | string | 否 | - | 摘要关键词 |
| `category` | string | 否 | - | 分类（如：cs.AI） |
| `maxResults` | number | 否 | 30 | 最大结果数 |
| `sortBy` | string | 否 | relevance | 排序方式 |
| `saveToDb` | boolean | 否 | false | 是否保存到数据库 |

**响应格式**:

```json
{
  "success": true,
  "papers": [
    {
      "id": "arxiv_2303.08774",
      "arxivId": "2303.08774",
      "title": "GPT-4 Technical Report",
      "authors": ["OpenAI"],
      "conference": "arXiv",
      "category": "nlp",
      "publishedAt": "2023-03-15",
      "abstract": "We report the development of GPT-4...",
      "tags": ["LLM", "GPT", "Deep Learning"],
      "citations": 500,
      "views": 5000,
      "pdfUrl": "https://arxiv.org/pdf/2303.08774.pdf",
      "arxivUrl": "https://arxiv.org/abs/2303.08774",
      "trending": true,
      "categories": ["cs.AI", "cs.CL"]
    }
  ],
  "count": 1,
  "query": {
    "arxivId": "2303.08774",
    "title": null,
    "author": null,
    "keywords": null,
    "abstract": null,
    "category": null,
    "sortBy": "relevance"
  }
}
```

---

## 🔍 搜索技巧

### 1. 精确搜索（推荐优先级）

```
优先级排序：
1️⃣ arXiv ID（最精确）
2️⃣ 标题
3️⃣ 作者
4️⃣ 摘要
5️⃣ 关键词（最模糊）
```

### 2. 组合搜索

**示例1**: 搜索特定作者在特定领域的论文
```json
{
  "author": "Yann LeCun",
  "category": "cs.CV",
  "sortBy": "submittedDate",
  "maxResults": 20
}
```

**示例2**: 搜索包含特定关键词的最新论文
```json
{
  "keywords": "vision transformer",
  "category": "cs.CV",
  "sortBy": "submittedDate",
  "maxResults": 30
}
```

**示例3**: 搜索标题中包含特定词且由特定作者撰写的论文
```json
{
  "title": "attention",
  "author": "Vaswani",
  "maxResults": 10
}
```

### 3. 分类过滤

**可用分类**:
- `cs.AI` - Artificial Intelligence
- `cs.LG` - Machine Learning
- `cs.CV` - Computer Vision
- `cs.CL` - Natural Language Processing
- `cs.NE` - Neural Networks
- `cs.RO` - Robotics

### 4. 排序策略

**按相关性** (`relevance`):
- 适合关键词搜索
- arXiv 根据匹配度排序
- 最相关的论文在前

**按日期** (`submittedDate`):
- 适合查找最新论文
- 按提交时间倒序
- 最新论文在前

---

## 💡 使用场景

### 场景1: 查找特定论文

**需求**: 已知论文的 arXiv ID

```bash
curl -X POST http://localhost:5000/api/papers/search \
  -H "Content-Type: application/json" \
  -d '{
    "arxivId": "2303.08774"
  }'
```

### 场景2: 研究某位作者

**需求**: 查找某位作者的所有论文

```bash
curl -X POST http://localhost:5000/api/papers/search \
  -H "Content-Type: application/json" \
  -d '{
    "author": "Yann LeCun",
    "maxResults": 50,
    "sortBy": "submittedDate"
  }'
```

### 场景3: 追踪研究方向

**需求**: 关注 "Diffusion Model" 领域的最新进展

```bash
curl -X POST http://localhost:5000/api/papers/search \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "diffusion model",
    "category": "cs.CV",
    "sortBy": "submittedDate",
    "maxResults": 30,
    "saveToDb": true
  }'
```

### 场景4: 寻找经典论文

**需求**: 查找 "Attention is All You Need"

```bash
curl -X POST http://localhost:5000/api/papers/search \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Attention Is All You Need"
  }'
```

### 场景5: 批量获取论文

**需求**: 获取大量 Transformer 相关论文并保存

```bash
curl -X POST http://localhost:5000/api/papers/search \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "transformer",
    "category": "cs.CL",
    "maxResults": 100,
    "saveToDb": true
  }'
```

---

## 📝 搜索示例集

### 1. 热门模型搜索

#### GPT 系列
```json
{
  "title": "GPT",
  "category": "cs.CL",
  "sortBy": "submittedDate",
  "maxResults": 20
}
```

#### BERT 系列
```json
{
  "title": "BERT",
  "category": "cs.CL",
  "maxResults": 20
}
```

#### Stable Diffusion
```json
{
  "keywords": "stable diffusion",
  "category": "cs.CV",
  "sortBy": "submittedDate",
  "maxResults": 20
}
```

### 2. 著名作者搜索

#### Yann LeCun
```json
{
  "author": "Yann LeCun",
  "maxResults": 50
}
```

#### Geoffrey Hinton
```json
{
  "author": "Geoffrey Hinton",
  "maxResults": 50
}
```

#### Yoshua Bengio
```json
{
  "author": "Yoshua Bengio",
  "maxResults": 50
}
```

### 3. 研究方向搜索

#### 计算机视觉
```json
{
  "keywords": "object detection",
  "category": "cs.CV",
  "sortBy": "submittedDate",
  "maxResults": 30
}
```

#### 自然语言处理
```json
{
  "keywords": "question answering",
  "category": "cs.CL",
  "sortBy": "submittedDate",
  "maxResults": 30
}
```

#### 强化学习
```json
{
  "keywords": "reinforcement learning",
  "category": "cs.LG",
  "sortBy": "submittedDate",
  "maxResults": 30
}
```

---

## 🛠️ 开发指南

### 1. 在前端集成搜索

```javascript
// 搜索函数
async function searchPapers(options) {
  try {
    const response = await fetch('http://localhost:5000/api/papers/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`找到 ${data.count} 篇论文`);
      return data.papers;
    } else {
      console.error('搜索失败:', data.message);
      return [];
    }
  } catch (error) {
    console.error('搜索错误:', error);
    return [];
  }
}

// 使用示例
const papers = await searchPapers({
  keywords: 'transformer',
  category: 'cs.CL',
  maxResults: 30
});
```

### 2. 添加搜索UI

```jsx
// React 组件示例
function PaperSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  const handleSearch = async () => {
    const papers = await searchPapers({
      keywords: query,
      maxResults: 20
    });
    setResults(papers);
  };
  
  return (
    <div>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索论文..."
      />
      <button onClick={handleSearch}>搜索</button>
      
      <div>
        {results.map(paper => (
          <div key={paper.id}>
            <h3>{paper.title}</h3>
            <p>{paper.authors.join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## ⚙️ 配置选项

### 1. 缓存设置

搜索结果会自动缓存30分钟（1800秒）:

```javascript
// 在 arxivService.js 中
const cache = new NodeCache({ stdTTL: 1800 });
```

### 2. 超时设置

API请求超时设置为15秒:

```javascript
timeout: 15000  // 15秒
```

### 3. 结果数量限制

默认最多返回30篇论文，可自定义:

```javascript
maxResults: 30  // 可调整
```

---

## 🔧 故障排查

### 问题1: 搜索无结果

**可能原因**:
1. 搜索条件太严格
2. 关键词拼写错误
3. 分类设置错误

**解决方案**:
- 放宽搜索条件
- 检查拼写
- 尝试不同分类
- 使用更通用的关键词

### 问题2: 搜索超时

**可能原因**:
1. 网络连接问题
2. arXiv API 响应慢
3. 请求数量太大

**解决方案**:
- 检查网络连接
- 减少 maxResults
- 稍后重试

### 问题3: 特殊字符问题

**注意事项**:
- 避免使用特殊字符
- 使用英文引号
- 转义特殊字符

---

## 📖 相关文档

1. **`ARXIV_SEARCH_GUIDE.md`** - 本文档（搜索功能完整指南）
2. **`SCHEDULER_GUIDE.md`** - 定时任务配置指南
3. **`LATEST_IMPROVEMENTS.md`** - 最新功能说明
4. **`PAPERS_DATABASE_UPDATE.md`** - 数据库更新文档

---

## 🎯 最佳实践

### 1. 精确搜索优先

**推荐**:
```json
{
  "arxivId": "2303.08774"
}
```

**不推荐**:
```json
{
  "keywords": "GPT-4 OpenAI 2023"
}
```

### 2. 合理使用分类过滤

**推荐**:
```json
{
  "keywords": "object detection",
  "category": "cs.CV"
}
```

**不推荐**:
```json
{
  "keywords": "object detection"
  // 会搜索所有分类，结果可能不精确
}
```

### 3. 保存有价值的结果

**推荐**:
```json
{
  "keywords": "diffusion model",
  "maxResults": 50,
  "saveToDb": true  // 保存到数据库
}
```

### 4. 使用缓存

重复搜索会自动使用缓存，提升速度。

---

## 🎉 总结

### ✅ 核心功能

1. **多维度搜索** - 支持 ID、标题、作者、关键词等
2. **灵活组合** - 可组合多个搜索条件
3. **智能排序** - 支持相关性和日期排序
4. **自动保存** - 可选将结果保存到数据库
5. **缓存优化** - 提升重复搜索速度

### 📊 搜索优先级

```
arXiv ID（精确） > 标题 > 作者 > 摘要 > 关键词（模糊）
```

### 🚀 快速开始

```bash
# 1. 测试搜索功能
cd server
node test-search.js

# 2. API 搜索
curl -X POST http://localhost:5000/api/papers/search \
  -H "Content-Type: application/json" \
  -d '{"arxivId": "2303.08774"}'

# 3. 查看结果
# 返回包含论文详情的 JSON 数据
```

---

**更新时间**: 2025-10-17  
**版本**: v3.1 - arXiv 搜索版

