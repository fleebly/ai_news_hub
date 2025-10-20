/**
 * 定时任务测试脚本
 * 用于手动测试定时任务功能
 */

require('dotenv').config();
const schedulerService = require('./services/schedulerService');
const connectDB = require('./config/database');

async function testScheduler() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   定时任务测试脚本                      ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // 连接数据库
    console.log('1️⃣  连接数据库...');
    await connectDB();
    console.log('✅ 数据库连接成功\n');

    // 显示当前配置
    console.log('2️⃣  当前配置:');
    const status = schedulerService.getStatus();
    console.log(`   • 定时任务启用: ${status.enabled ? '是' : '否'}`);
    console.log(`   • 论文更新时间: ${status.schedule.paper}`);
    console.log(`   • 博客更新时间: ${status.schedule.blog}`);
    console.log(`   • 时区: ${status.timezone}\n`);

    // 选择测试项
    const args = process.argv.slice(2);
    const testType = args[0] || 'all';

    if (testType === 'papers' || testType === 'all') {
      console.log('3️⃣  测试论文更新...');
      console.log('─'.repeat(50));
      const paperResult = await schedulerService.triggerPaperUpdate();
      if (paperResult.success) {
        console.log(`✅ 论文更新成功: ${paperResult.count} 篇\n`);
      } else {
        console.error(`❌ 论文更新失败: ${paperResult.error}\n`);
      }
    }

    if (testType === 'blogs' || testType === 'all') {
      console.log('4️⃣  测试博客更新...');
      console.log('─'.repeat(50));
      const blogResult = await schedulerService.triggerBlogUpdate();
      if (blogResult.success) {
        console.log(`✅ 博客更新成功: ${blogResult.count} 篇\n`);
      } else {
        console.error(`❌ 博客更新失败: ${blogResult.error}\n`);
      }
    }

    console.log('╔════════════════════════════════════════╗');
    console.log('║   测试完成！                            ║');
    console.log('╚════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 显示帮助信息
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
定时任务测试脚本

用法:
  node test-scheduler.js [类型]

类型:
  all        - 测试所有任务（默认）
  papers     - 只测试论文更新
  blogs      - 只测试博客更新

示例:
  node test-scheduler.js              # 测试所有任务
  node test-scheduler.js papers       # 只测试论文更新
  node test-scheduler.js blogs        # 只测试博客更新

注意:
  • 需要先配置 .env 文件
  • 需要MongoDB正常运行
  • 需要网络连接
  `);
  process.exit(0);
}

// 运行测试
testScheduler();

