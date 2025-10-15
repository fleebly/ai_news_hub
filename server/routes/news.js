const express = require('express');
const newsService = require('../services/newsService');

const router = express.Router();

/**
 * GET /api/ai-news
 * 获取AI新闻列表
 */
router.get('/ai-news', async (req, res) => {
  try {
    console.log('Fetching AI news...');
    const news = await newsService.aggregateNews();
    
    res.json({
      success: true,
      news: news,
      lastUpdated: new Date().toISOString(),
      count: news.length
    });
  } catch (error) {
    console.error('Error fetching AI news:', error);
    res.status(500).json({
      success: false,
      message: '获取新闻失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

/**
 * GET /api/ai-news/:id
 * 获取单条新闻详情
 */
router.get('/ai-news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching news detail for ID:', id);
    
    const news = await newsService.getNewsById(id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: '新闻不存在'
      });
    }
    
    res.json({
      success: true,
      news: news
    });
  } catch (error) {
    console.error('Error fetching news detail:', error);
    res.status(500).json({
      success: false,
      message: '获取新闻详情失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

/**
 * POST /api/ai-news/refresh
 * 刷新新闻缓存（管理员功能）
 */
router.post('/ai-news/refresh', async (req, res) => {
  try {
    console.log('Clearing news cache...');
    const result = newsService.clearCache();
    
    res.json({
      success: true,
      message: '缓存已清除，下次请求将获取最新数据',
      ...result
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: '清除缓存失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

/**
 * GET /api/news/sources
 * 获取RSS源列表（调试用）
 */
router.get('/news/sources', async (req, res) => {
  try {
    const rssNews = await newsService.fetchFromRSS();
    
    res.json({
      success: true,
      message: 'RSS源数据',
      count: rssNews.length,
      news: rssNews
    });
  } catch (error) {
    console.error('Error fetching RSS sources:', error);
    res.status(500).json({
      success: false,
      message: '获取RSS源失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

module.exports = router;

