#!/usr/bin/env node
/**
 * 数据同步脚本
 * 定时从外部源获取数据并更新数据库
 * 
 * 使用方法：
 * node server/scripts/syncData.js [options]
 * 
 * Options:
 * --type=news|papers|blogs|all  同步类型（默认：all）
 * --force                        强制刷新（忽略缓存）
 * --cleanup                      清理30天前的旧数据
 */

const mongoose = require('mongoose');
require('dotenv').config();

// 导入服务
const newsService = require('../services/newsService');
const arxivService = require('../services/arxivService');
const blogService = require('../services/blogService');

// 导入模型
const News = require('../models/News');
const Paper = require('../models/Paper');
const Blog = require('../models/Blog');

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  type: 'all',
  force: false,
  cleanup: false
};

args.forEach(arg => {
  if (arg.startsWith('--type=')) {
    options.type = arg.split('=')[1];
  } else if (arg === '--force') {
    options.force = true;
  } else if (arg === '--cleanup') {
    options.cleanup = true;
  }
});

/**
 * 主函数
 */
async function main() {
  console.log('🚀 数据同步脚本启动...');
  console.log('⚙️  选项:', options);
  console.log('');

  try {
    // 连接数据库
    await connectDatabase();

    // 执行同步
    if (options.type === 'all' || options.type === 'news') {
      await syncNews();
    }

    if (options.type === 'all' || options.type === 'papers') {
      await syncPapers();
    }

    if (options.type === 'all' || options.type === 'blogs') {
      await syncBlogs();
    }

    // 清理旧数据
    if (options.cleanup) {
      await cleanupOldData();
    }

    // 显示统计信息
    await showStatistics();

    console.log('');
    console.log('✅ 数据同步完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据同步失败:', error);
    process.exit(1);
  }
}

/**
 * 连接数据库
 */
async function connectDatabase() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_programming_coach';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB连接成功');
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message);
    throw error;
  }
}

/**
 * 同步新闻数据
 */
async function syncNews() {
  console.log('📰 开始同步新闻数据...');
  const startTime = Date.now();

  try {
    // 强制从外部源获取
    const news = await newsService.aggregateNews(true, options.force);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ 新闻同步完成: ${news.length} 条 (耗时 ${duration}秒)`);
  } catch (error) {
    console.error('❌ 新闻同步失败:', error.message);
  }
}

/**
 * 同步论文数据
 */
async function syncPapers() {
  console.log('📄 开始同步论文数据...');
  const startTime = Date.now();

  try {
    const categories = ['cs.AI', 'cs.LG', 'cs.CV', 'cs.CL'];
    const papers = await arxivService.fetchMultiCategoryPapers(categories, 20, options.force);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ 论文同步完成: ${papers.length} 篇 (耗时 ${duration}秒)`);
  } catch (error) {
    console.error('❌ 论文同步失败:', error.message);
  }
}

/**
 * 同步博客数据
 */
async function syncBlogs() {
  console.log('📝 开始同步博客数据...');
  const startTime = Date.now();

  try {
    const blogs = await blogService.fetchAllBlogs(150, options.force);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ 博客同步完成: ${blogs.length} 篇 (耗时 ${duration}秒)`);
  } catch (error) {
    console.error('❌ 博客同步失败:', error.message);
  }
}

/**
 * 清理旧数据（30天前）
 */
async function cleanupOldData() {
  console.log('🗑️  开始清理旧数据...');

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    // 清理新闻
    const newsResult = await News.deleteMany({
      publishedAt: { $lt: cutoffDate }
    });
    console.log(`  - 删除旧新闻: ${newsResult.deletedCount} 条`);

    // 清理论文
    const papersResult = await Paper.deleteMany({
      publishedAt: { $lt: cutoffDate }
    });
    console.log(`  - 删除旧论文: ${papersResult.deletedCount} 篇`);

    // 清理博客
    const blogsResult = await Blog.deleteMany({
      publishedAt: { $lt: cutoffDate }
    });
    console.log(`  - 删除旧博客: ${blogsResult.deletedCount} 篇`);

    console.log('✅ 旧数据清理完成');
  } catch (error) {
    console.error('❌ 清理旧数据失败:', error.message);
  }
}

/**
 * 显示统计信息
 */
async function showStatistics() {
  console.log('');
  console.log('📊 数据库统计:');
  console.log('─'.repeat(40));

  try {
    // 新闻统计
    const newsCount = await News.countDocuments({ status: 'active' });
    const newsTrendingCount = await News.countDocuments({ status: 'active', trending: true });
    console.log(`📰 新闻: ${newsCount} 条 (热门: ${newsTrendingCount})`);

    // 论文统计
    const papersCount = await Paper.countDocuments({ status: 'active' });
    const papersTrendingCount = await Paper.countDocuments({ status: 'active', trending: true });
    console.log(`📄 论文: ${papersCount} 篇 (热门: ${papersTrendingCount})`);

    // 博客统计
    const blogsCount = await Blog.countDocuments({ status: 'active', isValid: true });
    const blogsFeaturedCount = await Blog.countDocuments({ status: 'active', featured: true });
    console.log(`📝 博客: ${blogsCount} 篇 (精选: ${blogsFeaturedCount})`);

    console.log('─'.repeat(40));

    // 按来源统计新闻
    const newsBySources = await News.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$sourceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    if (newsBySources.length > 0) {
      console.log('');
      console.log('新闻来源分布:');
      newsBySources.forEach(item => {
        console.log(`  - ${item._id}: ${item.count} 条`);
      });
    }

    // 按分类统计论文
    const papersByCategory = await Paper.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    if (papersByCategory.length > 0) {
      console.log('');
      console.log('论文分类分布:');
      papersByCategory.forEach(item => {
        const categoryNames = {
          'nlp': '自然语言处理',
          'cv': '计算机视觉',
          'ml': '机器学习',
          'robotics': '机器人',
          'other': '其他'
        };
        console.log(`  - ${categoryNames[item._id] || item._id}: ${item.count} 篇`);
      });
    }

    // 按分类统计博客
    const blogsByCategory = await Blog.aggregate([
      { $match: { status: 'active', isValid: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    if (blogsByCategory.length > 0) {
      console.log('');
      console.log('博客分类分布:');
      blogsByCategory.forEach(item => {
        console.log(`  - ${item._id}: ${item.count} 篇`);
      });
    }

  } catch (error) {
    console.error('❌ 获取统计信息失败:', error.message);
  }
}

// 运行主函数
main();

