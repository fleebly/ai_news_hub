const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const newsRoutes = require('./routes/news');
const papersRoutes = require('./routes/papers');
const blogsRoutes = require('./routes/blogs');
// const wechatRoutes = require('./routes/wechat');
const aiPublishRoutes = require('./routes/aiPublishRoutes');
const paperAnalysisRoutes = require('./routes/paperAnalysis');
const schedulerRoutes = require('./routes/scheduler');
const schedulerService = require('./services/schedulerService');

const app = express();
const PORT = process.env.PORT || 5000;

// 安全中间件
app.use(helmet());

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use(limiter);

// CORS配置
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', newsRoutes);
app.use('/api', papersRoutes);
app.use('/api', blogsRoutes);
// app.use('/api', wechatRoutes); // 临时禁用以提升性能
app.use('/api/ai-publish', aiPublishRoutes);
app.use('/api/paper-analysis', paperAnalysisRoutes);
app.use('/api', schedulerRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器错误'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

// 连接数据库并启动服务器
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 AI编程教练服务器运行在端口 ${PORT}`);
      console.log(`📚 环境: ${process.env.NODE_ENV || 'development'}`);
      
      // 启动定时任务服务
      schedulerService.start();
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n收到退出信号，正在关闭服务...');
  schedulerService.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n收到终止信号，正在关闭服务...');
  schedulerService.stop();
  process.exit(0);
});

startServer();
