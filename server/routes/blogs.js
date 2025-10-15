const express = require('express');
const blogService = require('../services/blogService');

const router = express.Router();

/**
 * GET /api/blogs
 * 获取高质量博客文章列表
 */
router.get('/blogs', async (req, res) => {
  try {
    const { category, search, limit = 50 } = req.query;
    
    console.log('Fetching blogs...', { category, search, limit });
    
    let articles = [];
    
    if (search) {
      // 搜索文章
      articles = await blogService.searchBlogs(search, parseInt(limit));
    } else if (category && category !== 'all') {
      // 按分类获取
      articles = await blogService.fetchBlogsByCategory(category, parseInt(limit));
    } else {
      // 获取所有文章
      articles = await blogService.fetchAllBlogs(parseInt(limit));
    }
    
    res.json({
      success: true,
      articles: articles,
      count: articles.length,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: '获取博客文章失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

/**
 * GET /api/blogs/featured
 * 获取精选文章
 */
router.get('/blogs/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const articles = await blogService.getFeaturedBlogs(parseInt(limit));
    
    res.json({
      success: true,
      articles: articles,
      count: articles.length
    });
  } catch (error) {
    console.error('Error fetching featured blogs:', error);
    res.status(500).json({
      success: false,
      message: '获取精选文章失败'
    });
  }
});

/**
 * GET /api/blogs/sources
 * 获取博客源列表
 */
router.get('/blogs/sources', (req, res) => {
  try {
    const sources = blogService.getBlogSources();
    
    res.json({
      success: true,
      sources: sources,
      count: sources.length
    });
  } catch (error) {
    console.error('Error fetching blog sources:', error);
    res.status(500).json({
      success: false,
      message: '获取博客源列表失败'
    });
  }
});

/**
 * POST /api/blogs/refresh
 * 刷新博客缓存
 */
router.post('/blogs/refresh', (req, res) => {
  try {
    const result = blogService.clearCache();
    
    res.json({
      success: true,
      message: '缓存已清除，下次请求将获取最新数据',
      ...result
    });
  } catch (error) {
    console.error('Error clearing blog cache:', error);
    res.status(500).json({
      success: false,
      message: '清除缓存失败'
    });
  }
});

module.exports = router;

