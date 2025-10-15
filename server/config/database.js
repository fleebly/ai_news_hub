const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // 如果没有配置MongoDB URI，跳过数据库连接（新闻功能不需要数据库）
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_programming_coach';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5秒超时
    });

    console.log(`📦 MongoDB连接成功: ${conn.connection.host}`);
  } catch (error) {
    console.warn('⚠️  MongoDB连接失败:', error.message);
    console.warn('⚠️  某些功能（用户认证、题目管理）将不可用');
    console.warn('✅ 新闻API仍然可以正常工作');
    // 不退出进程，允许服务器继续运行
  }
};

module.exports = connectDB;

