/**
 * arXiv 高级搜索测试脚本
 */

require('dotenv').config();
const arxivService = require('./services/arxivService');
const connectDB = require('./config/database');

async function testSearch() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   arXiv 高级搜索测试脚本              ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // 连接数据库
    console.log('1️⃣  连接数据库...');
    await connectDB();
    console.log('✅ 数据库连接成功\n');

    // 获取测试类型
    const args = process.argv.slice(2);
    const testType = args[0] || 'all';

    // 测试1: 按 arXiv ID 搜索
    if (testType === 'id' || testType === 'all') {
      console.log('═'.repeat(50));
      console.log('测试1: 按 arXiv ID 搜索');
      console.log('═'.repeat(50));
      const results = await arxivService.searchArxivPapersAdvanced({
        arxivId: '2303.08774',  // GPT-4 论文
        maxResults: 5
      });
      console.log(`✅ 找到 ${results.length} 篇论文`);
      if (results.length > 0) {
        console.log(`   标题: ${results[0].title}`);
        console.log(`   作者: ${results[0].authors.join(', ')}`);
      }
      console.log('');
    }

    // 测试2: 按标题搜索
    if (testType === 'title' || testType === 'all') {
      console.log('═'.repeat(50));
      console.log('测试2: 按标题搜索');
      console.log('═'.repeat(50));
      const results = await arxivService.searchArxivPapersAdvanced({
        title: 'Attention Is All You Need',
        maxResults: 5
      });
      console.log(`✅ 找到 ${results.length} 篇论文`);
      results.slice(0, 3).forEach((paper, i) => {
        console.log(`   ${i + 1}. ${paper.title}`);
      });
      console.log('');
    }

    // 测试3: 按作者搜索
    if (testType === 'author' || testType === 'all') {
      console.log('═'.repeat(50));
      console.log('测试3: 按作者搜索');
      console.log('═'.repeat(50));
      const results = await arxivService.searchArxivPapersAdvanced({
        author: 'Yann LeCun',
        category: 'cs.AI',
        maxResults: 5
      });
      console.log(`✅ 找到 ${results.length} 篇论文`);
      results.slice(0, 3).forEach((paper, i) => {
        console.log(`   ${i + 1}. ${paper.title}`);
      });
      console.log('');
    }

    // 测试4: 按关键词搜索
    if (testType === 'keywords' || testType === 'all') {
      console.log('═'.repeat(50));
      console.log('测试4: 按关键词搜索');
      console.log('═'.repeat(50));
      const results = await arxivService.searchArxivPapersAdvanced({
        keywords: 'large language model',
        category: 'cs.CL',
        maxResults: 10,
        sortBy: 'submittedDate'
      });
      console.log(`✅ 找到 ${results.length} 篇论文`);
      results.slice(0, 3).forEach((paper, i) => {
        console.log(`   ${i + 1}. ${paper.title}`);
      });
      console.log('');
    }

    // 测试5: 组合搜索
    if (testType === 'combo' || testType === 'all') {
      console.log('═'.repeat(50));
      console.log('测试5: 组合搜索（标题+分类）');
      console.log('═'.repeat(50));
      const results = await arxivService.searchArxivPapersAdvanced({
        title: 'transformer',
        category: 'cs.CV',
        maxResults: 10
      });
      console.log(`✅ 找到 ${results.length} 篇论文`);
      results.slice(0, 3).forEach((paper, i) => {
        console.log(`   ${i + 1}. ${paper.title}`);
      });
      console.log('');
    }

    // 测试6: 保存到数据库
    if (testType === 'save' || testType === 'all') {
      console.log('═'.repeat(50));
      console.log('测试6: 搜索并保存到数据库');
      console.log('═'.repeat(50));
      const results = await arxivService.searchArxivPapersAdvanced({
        keywords: 'diffusion model',
        category: 'cs.CV',
        maxResults: 5,
        saveToDb: true  // 保存到数据库
      });
      console.log(`✅ 找到 ${results.length} 篇论文并已保存到数据库`);
      console.log('');
    }

    console.log('╔════════════════════════════════════════╗');
    console.log('║   测试完成！                           ║');
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
arXiv 高级搜索测试脚本

用法:
  node test-search.js [类型]

类型:
  all        - 测试所有搜索方式（默认）
  id         - 按 arXiv ID 搜索
  title      - 按标题搜索
  author     - 按作者搜索
  keywords   - 按关键词搜索
  combo      - 组合搜索
  save       - 搜索并保存到数据库

示例:
  node test-search.js              # 测试所有方式
  node test-search.js id           # 只测试 ID 搜索
  node test-search.js author       # 只测试作者搜索
  node test-search.js save         # 测试保存到数据库

注意:
  • 需要先配置 .env 文件
  • 需要MongoDB正常运行
  • 需要网络连接
  `);
  process.exit(0);
}

// 运行测试
testSearch();

