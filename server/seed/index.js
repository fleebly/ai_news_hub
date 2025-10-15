const connectDB = require('../config/database');
const seedQuestions = require('./questions');

const seedDatabase = async () => {
  try {
    console.log('🌱 开始初始化数据库...');
    
    // 连接数据库
    await connectDB();
    
    // 导入题目数据
    await seedQuestions();
    
    console.log('🎉 数据库初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
};

// 如果直接运行此文件，则执行种子数据导入
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

