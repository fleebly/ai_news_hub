const express = require('express');
const newsService = require('../services/newsService');

const router = express.Router();

/**
 * GET /api/ai-news
 * 获取AI新闻列表
 * Query参数:
 * - includeSocial: boolean, 是否包含社交媒体内容（默认true）
 * - platform: string, 可选的平台过滤（reddit, twitter, weibo）
 */
router.get('/ai-news', async (req, res) => {
  try {
    const { includeSocial = 'true', platform } = req.query;
    const shouldIncludeSocial = includeSocial === 'true';
    
    console.log('Fetching AI news...', { includeSocial: shouldIncludeSocial, platform });
    
    let news;
    if (platform) {
      // 只获取特定平台的内容
      news = await newsService.getSocialMediaContent(platform);
    } else {
      // 获取所有内容
      news = await newsService.aggregateNews(shouldIncludeSocial);
    }
    
    res.json({
      success: true,
      news: news,
      lastUpdated: new Date().toISOString(),
      count: news.length,
      filters: {
        includeSocial: shouldIncludeSocial,
        platform: platform || 'all'
      }
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
 * 刷新新闻缓存并更新数据库（管理员功能）
 */
router.post('/ai-news/refresh', async (req, res) => {
  try {
    console.log('Clearing news cache and refreshing from external sources...');
    const result = await newsService.clearCache();
    
    res.json({
      success: true,
      message: '缓存已清除，数据已从外部源刷新并更新到数据库',
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

/**
 * GET /api/social-media
 * 获取社交媒体内容
 * Query参数:
 * - platform: reddit | twitter | weibo (可选)
 */
router.get('/social-media', async (req, res) => {
  try {
    const { platform } = req.query;
    console.log('Fetching social media content...', { platform: platform || 'all' });
    
    const content = await newsService.getSocialMediaContent(platform);
    
    res.json({
      success: true,
      content: content,
      platform: platform || 'all',
      count: content.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching social media:', error);
    res.status(500).json({
      success: false,
      message: '获取社交媒体内容失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

module.exports = router;

