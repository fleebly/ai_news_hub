# 🌟 AI头条 - 智能AI资讯聚合平台

一个专为AI从业者和学习者打造的一站式信息平台，聚合实时资讯、学术论文、顶级博客、开源项目和编程练习。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue.svg)](https://reactjs.org)

## ✨ 核心功能

### 📰 AI实时资讯
- **多源聚合**: 整合RSS订阅和Brave Search API
- **智能缓存**: 1小时自动更新，确保信息时效性
- **无限滚动**: 流畅的阅读体验
- **详情页**: 完整的新闻内容展示

### 📚 学术论文库
- **arXiv集成**: 实时抓取最新AI论文
- **CCF-A会议**: 覆盖顶级会议（NeurIPS, ICML, CVPR等）
- **热度评分**: 智能识别热门论文
- **多维筛选**: 按分类、热度、时间筛选
- **直达链接**: PDF、代码、arXiv详情页

### 🎓 大牛博客（精华！）
- **20个顶级源**: 涵盖全球AI领域顶尖作者和机构
- **5维筛选系统**:
  - 🔍 全文搜索
  - 📂 分类筛选（AI技术、论文解读、创新创业）
  - 👤 作者筛选（Andrej Karpathy、Lilian Weng等20+位大V）
  - 🏢 公司筛选（OpenAI、Google、Meta等15家机构）
  - 🏷️ 主题筛选（GPT、Transformer、LLM等30+主题）
- **精选标记**: ⭐标识优先级≥9的顶级内容
- **公司徽章**: 彩色徽章标识所属机构

### 🚀 开源项目
- **GitHub Trending**: 热门开源项目
- **技术分类**: 按语言和领域分类
- **项目详情**: Stars、Forks、描述等

### 💻 编程练习
- **多难度题库**: 初级、中级、高级题目
- **AI辅助**: GPT-4代码分析和优化建议
- **升级系统**: 经验值、等级、成就徽章
- **代码编辑器**: Monaco Editor集成

### 👤 用户系统
- **注册登录**: JWT认证
- **个人主页**: 学习统计、成就展示
- **排行榜**: 与其他学习者比较

## 🎯 顶级博客源

我们精心挑选了20个全球顶级AI博客源：

### 教父级大V（4位）
- **Andrej Karpathy** - 前Tesla AI总监，OpenAI创始成员
- **Lilian Weng** - OpenAI安全研究员，深度学习系统化解读
- **Jay Alammar** - Transformer可视化大师
- **Christopher Olah** - 神经网络可解释性先驱

### 顶级公司（6家）
- **OpenAI** - GPT系列创造者
- **Google AI** - Transformer发明者
- **DeepMind** - AlphaGo、AlphaFold
- **Meta AI** - LLaMA开源领导者
- **Anthropic** - Claude AI
- **Microsoft Research** - Azure AI

### AI研究者（3位）
- **Sebastian Ruder** (Google) - NLP、迁移学习
- **Ferenc Huszár** - 机器学习理论
- **Chip Huyen** - MLOps专家

### 学术社区（3个）
- **Distill** - 可视化解读领导者
- **Hugging Face** - 开源AI社区
- **Papers with Code** - 连接论文和代码

### 创业商业（3个）
- **Y Combinator** - 硅谷顶级孵化器
- **a16z** - 知名VC的AI洞察
- **Sam Altman** - OpenAI CEO

### 中文媒体（1个）
- **机器之心** - 专业AI媒体

## 🛠️ 技术栈

### 前端
- **React 18** + **Vite** - 现代化构建
- **TailwindCSS** - 响应式设计
- **Zustand** - 状态管理
- **React Router** - 路由管理
- **Lucide React** - 图标库
- **Monaco Editor** - 代码编辑器

### 后端
- **Node.js** + **Express** - 服务器框架
- **MongoDB** - 用户数据和题目
- **SQLite** - 轻量级存储
- **JWT** - 身份认证
- **node-cache** - 智能缓存

### API集成
- **arXiv API** - 学术论文
- **Brave Search API** - 网络搜索
- **RSS Parser** - RSS订阅
- **OpenAI API** - AI代码分析（可选）

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
# 克隆仓库
git clone https://code.alibaba-inc.com/ai_innovation/ai_news_hub.git
cd ai_news_hub

# 安装服务端依赖
cd server
npm install

# 安装客户端依赖
cd ../client
npm install
```

### 配置环境变量

创建 `server/.env` 文件：

```env
# 数据库配置（可选，如不配置将跳过MongoDB功能）
MONGODB_URI=mongodb://localhost:27017/ai_teacher

# JWT密钥
JWT_SECRET=your-secret-key-here

# OpenAI API（可选，用于AI代码分析）
OPENAI_API_KEY=sk-your-openai-key

# Brave Search API（可选，用于增强新闻搜索）
BRAVE_API_KEY=your-brave-api-key
```

### 启动服务

#### 开发环境

```bash
# 终端1: 启动后端
cd server
npm start

# 终端2: 启动前端
cd client
npm run dev
```

访问: http://localhost:3000

#### 生产环境

```bash
# 使用启动脚本
chmod +x start.sh
./start.sh

# 或使用 Docker
docker-compose up -d
```

## 📖 功能详解

### 1. AI资讯

**特点:**
- 实时抓取RSS和Brave搜索结果
- 1小时智能缓存
- 无限滚动加载
- 图片自动降级

**使用:**
```
访问: /news
点击文章 → 查看详情
下拉到底部 → 自动加载更多
```

### 2. 学术论文

**特点:**
- arXiv实时抓取
- CCF-A会议分类
- 热度智能计算
- 直达PDF和代码

**使用:**
```
访问: /papers
选择分类 → 筛选论文
开启"只显示热门" → 查看热门论文
点击按钮 → 查看PDF/代码
```

### 3. 大牛博客

**特点:**
- 20个顶级博客源
- 5维高级筛选
- 精选内容标记
- 公司和主题标签

**使用示例:**

**学习GPT:**
```
公司筛选: OpenAI
主题筛选: GPT
→ OpenAI官方GPT系列文章
```

**学习Transformer:**
```
作者筛选: Jay Alammar
主题筛选: Transformer
→ 最佳Transformer可视化教程
```

**了解AGI:**
```
作者筛选: Sam Altman
搜索: AGI
→ OpenAI CEO的AGI思考
```

### 4. 编程练习

**特点:**
- 多难度题库
- AI智能批注
- 经验值系统
- 成就徽章

**使用:**
```
访问: /questions
选择题目 → 开始作答
提交代码 → AI分析反馈
获取经验 → 升级解锁
```

## 🎨 界面预览

### 首页
- Tech Banner - AI技术趋势
- AI资讯流 - 无限滚动

### 大牛博客
- 高级筛选面板
- 精美文章卡片
- 公司和主题标签

### 论文库
- CCF-A分类
- 热门论文标记
- 直达链接

## 📊 数据统计

- **博客源**: 20个顶级源
- **论文来源**: arXiv + 15+顶级会议
- **新闻源**: 18+ RSS订阅
- **题目数量**: 50+编程题
- **总代码**: 12,743行

## 🔧 开发

### 项目结构

```
ai_news_hub/
├── client/                 # 前端代码
│   ├── src/
│   │   ├── components/    # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API服务
│   │   └── stores/        # 状态管理
│   └── package.json
├── server/                # 后端代码
│   ├── routes/           # API路由
│   ├── services/         # 业务逻辑
│   │   ├── newsService.js    # 资讯服务
│   │   ├── blogService.js    # 博客服务
│   │   └── arxivService.js   # 论文服务
│   ├── models/           # 数据模型
│   └── package.json
└── docs/                 # 文档
    ├── BLOGS_PREMIUM_UPDATE.md
    ├── PAPERS_ENHANCEMENT.md
    └── ...
```

### 添加新的博客源

编辑 `server/services/blogService.js`:

```javascript
{
  name: '博客名称',
  url: 'RSS地址',
  category: 'AI技术',  // 或其他分类
  author: '作者名',
  company: '公司名',
  description: '描述',
  language: 'zh',      // 或 'en'
  topics: ['主题1', '主题2'],
  priority: 9          // 1-10
}
```

### API端点

**资讯:**
- `GET /api/ai-news` - 获取资讯列表
- `GET /api/ai-news/:id` - 获取资讯详情
- `POST /api/ai-news/refresh` - 刷新缓存

**博客:**
- `GET /api/blogs` - 获取博客列表
- `GET /api/blogs/featured` - 获取精选
- `GET /api/blogs/sources` - 获取博客源
- `POST /api/blogs/refresh` - 刷新缓存

**论文:**
- `GET /api/papers` - 获取论文列表
- `POST /api/papers/refresh` - 刷新缓存

## 📚 文档

- [ARCHITECTURE.md](ARCHITECTURE.md) - 架构设计
- [BLOGS_PREMIUM_UPDATE.md](BLOGS_PREMIUM_UPDATE.md) - 博客功能详解
- [BLOGS_USAGE_GUIDE.md](BLOGS_USAGE_GUIDE.md) - 博客使用指南
- [PAPERS_ENHANCEMENT.md](PAPERS_ENHANCEMENT.md) - 论文库功能
- [GIT_PUSH_GUIDE.md](GIT_PUSH_GUIDE.md) - Git推送指南

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 更新日志

### v1.0.0 (2025-10-15)

#### 新增功能
- ✅ AI实时资讯聚合
- ✅ 学术论文库（arXiv + CCF-A）
- ✅ 大牛博客（20个顶级源）
- ✅ 5维高级筛选系统
- ✅ 开源项目展示
- ✅ 编程练习平台
- ✅ 用户系统

#### 技术优化
- ✅ 无限滚动加载
- ✅ 智能缓存机制
- ✅ 响应式设计
- ✅ 图片自动降级
- ✅ 错误边界处理

## 🐛 问题反馈

如遇到问题，请通过以下方式反馈：

1. GitHub Issues
2. 邮件: your-email@alibaba-inc.com
3. 钉钉群: [群号]

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

感谢所有顶级AI作者和机构提供的优质内容：

- Andrej Karpathy
- Lilian Weng
- Jay Alammar
- OpenAI
- Google AI
- DeepMind
- 以及所有其他贡献者

---

**Built with ❤️ by AI Innovation Team**

**访问:** http://localhost:3000

**仓库:** https://code.alibaba-inc.com/ai_innovation/ai_news_hub
