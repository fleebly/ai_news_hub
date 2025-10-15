# AI编程教练 🚀

一个功能丰富的AI编程学习平台，支持多难度题库、升级系统和智能代码批注。

## ✨ 主要功能

### 🎯 多难度题库
- **初级题目**: 适合编程新手的基础算法和数据结构题目
- **中级题目**: 面向有一定编程经验的开发者
- **高级题目**: 挑战编程高手的复杂算法和系统设计题目
- **分类筛选**: 按算法、数据结构、Web开发等分类浏览题目

### 🏆 升级系统
- **经验值系统**: 通过解决题目获得经验值
- **等级进阶**: 10个等级，每级需要100经验值
- **成就徽章**: 解锁各种成就，激励持续学习
- **连续天数**: 记录学习连续天数，培养学习习惯

### 🤖 AI智能批注
- **代码分析**: 使用GPT-4分析代码质量和正确性
- **性能优化**: 提供代码优化建议
- **最佳实践**: 指导编程规范和最佳实践
- **智能提示**: 根据题目难度提供个性化提示

### 📊 学习统计
- **个人仪表板**: 查看学习进度和统计数据
- **排行榜**: 与其他学习者比较排名
- **进度追踪**: 详细的学习历史记录
- **成就系统**: 丰富的成就徽章收集

## 🛠️ 技术栈

### 后端
- **Node.js** + **Express.js** - 服务器框架
- **MongoDB** + **Mongoose** - 数据库
- **JWT** - 用户认证
- **OpenAI API** - AI代码分析
- **bcryptjs** - 密码加密

### 前端
- **React 18** - 用户界面框架
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Monaco Editor** - 代码编辑器
- **React Router** - 路由管理
- **Zustand** - 状态管理
- **Framer Motion** - 动画效果

## 🚀 快速开始

### 环境要求
- Node.js 16+
- MongoDB 4.4+
- OpenAI API Key

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd ai_teacher
```

2. **安装依赖**
```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

3. **环境配置**
```bash
# 复制环境变量模板
cp server/.env.example server/.env

# 编辑环境变量
nano server/.env
```

配置以下环境变量：
```env
# 服务器配置
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/ai_programming_coach

# JWT密钥
JWT_SECRET=your_super_secret_jwt_key_here

# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key_here

# 其他配置
BCRYPT_ROUNDS=12
```

4. **启动MongoDB**
```bash
# 使用Docker启动MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 或使用本地MongoDB服务
mongod
```

5. **初始化数据库**
```bash
cd server
node seed/index.js
```

6. **启动应用**
```bash
# 在根目录启动所有服务
npm run dev

# 或分别启动
# 启动后端
cd server && npm run dev

# 启动前端
cd client && npm run dev
```

7. **访问应用**
- 前端: http://localhost:3000
- 后端API: http://localhost:5000

## 📁 项目结构

```
ai_teacher/
├── client/                 # 前端React应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── stores/        # 状态管理
│   │   ├── services/      # API服务
│   │   └── App.jsx        # 主应用组件
│   ├── package.json
│   └── vite.config.js
├── server/                 # 后端Node.js应用
│   ├── config/            # 配置文件
│   ├── models/            # 数据模型
│   ├── routes/            # API路由
│   ├── middleware/        # 中间件
│   ├── seed/              # 数据库种子数据
│   ├── index.js           # 服务器入口
│   └── package.json
├── package.json           # 根目录配置
└── README.md
```

## 🎮 使用指南

### 1. 注册和登录
- 访问 http://localhost:3000
- 点击"注册"创建新账户
- 或使用现有账户登录

### 2. 选择题目
- 在"题库"页面浏览所有可用题目
- 使用筛选器按难度和分类筛选
- 点击题目卡片查看详情

### 3. 编写代码
- 在代码编辑器中编写解决方案
- 使用Monaco Editor的智能提示功能
- 支持JavaScript语法高亮和自动补全

### 4. 获取AI帮助
- 点击"AI分析"获取代码质量分析
- 点击"获取提示"查看解题提示
- AI会提供详细的代码改进建议

### 5. 提交答案
- 点击"提交答案"运行测试用例
- 查看提交结果和得分
- 获得经验值和等级提升

### 6. 查看进度
- 在"仪表板"查看学习统计
- 在"个人资料"查看详细进度
- 在"排行榜"与其他用户比较

## 🔧 API文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 题目接口
- `GET /api/questions` - 获取题目列表
- `GET /api/questions/:id` - 获取题目详情
- `POST /api/questions/:id/submit` - 提交答案
- `GET /api/questions/:id/hints` - 获取提示

### AI接口
- `POST /api/ai/analyze-code` - 代码分析
- `POST /api/ai/generate-hint` - 生成提示
- `POST /api/ai/optimize-code` - 代码优化

### 用户接口
- `GET /api/users/stats` - 获取用户统计
- `GET /api/users/leaderboard` - 获取排行榜
- `GET /api/users/achievements` - 获取成就列表

## 🎯 功能特色

### 智能代码分析
- 使用GPT-4进行代码质量评估
- 提供详细的改进建议
- 支持多种编程语言

### 个性化学习路径
- 根据用户水平推荐题目
- 自适应难度调整
- 学习进度追踪

### 社交学习功能
- 排行榜系统
- 成就分享
- 学习统计对比

### 现代化UI设计
- 响应式设计
- 暗色主题支持
- 流畅的动画效果

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [OpenAI](https://openai.com/) - 提供AI分析能力
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 代码编辑器
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [React](https://reactjs.org/) - 前端框架

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/your-username/ai_teacher/issues)
- 邮箱: your-email@example.com

---

⭐ 如果这个项目对你有帮助，请给它一个星标！

