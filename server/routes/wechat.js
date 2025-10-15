const express = require('express');
const wechatService = require('../services/wechatService');

const router = express.Router();

/**
 * GET /api/wechat/articles
 * 获取微信公众号文章列表
 */
router.get('/wechat/articles', async (req, res) => {
  try {
    const { account, category, search, limit = 50 } = req.query;
    
    console.log('Fetching WeChat articles...', { account, category, search, limit });
    
    let articles = [];
    
    if (search) {
      // 搜索文章
      articles = await wechatService.searchArticles(search, parseInt(limit));
    } else if (account && account !== 'all') {
      // 按公众号获取
      articles = await wechatService.fetchArticlesByAccount(account, parseInt(limit));
    } else if (category && category !== 'all') {
      // 按分类获取
      articles = await wechatService.fetchArticlesByCategory(category, parseInt(limit));
    } else {
      // 获取所有文章
      articles = await wechatService.fetchAllWechatArticles(parseInt(limit));
    }
    
    res.json({
      success: true,
      articles: articles,
      count: articles.length,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching WeChat articles:', error);
    res.status(500).json({
      success: false,
      message: '获取微信公众号文章失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

/**
 * GET /api/wechat/featured
 * 获取精选文章
 */
router.get('/wechat/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const articles = await wechatService.getFeaturedArticles(parseInt(limit));
    
    res.json({
      success: true,
      articles: articles,
      count: articles.length
    });
  } catch (error) {
    console.error('Error fetching featured WeChat articles:', error);
    res.status(500).json({
      success: false,
      message: '获取精选文章失败'
    });
  }
});

/**
 * GET /api/wechat/accounts
 * 获取公众号列表
 */
router.get('/wechat/accounts', (req, res) => {
  try {
    const accounts = wechatService.getWechatAccounts();
    
    res.json({
      success: true,
      accounts: accounts,
      count: accounts.length
    });
  } catch (error) {
    console.error('Error fetching WeChat accounts:', error);
    res.status(500).json({
      success: false,
      message: '获取公众号列表失败'
    });
  }
});

/**
 * POST /api/wechat/refresh
 * 刷新文章缓存
 */
router.post('/wechat/refresh', (req, res) => {
  try {
    const result = wechatService.clearCache();
    
    res.json({
      success: true,
      message: '缓存已清除，下次请求将获取最新数据',
      ...result
    });
  } catch (error) {
    console.error('Error clearing WeChat cache:', error);
    res.status(500).json({
      success: false,
      message: '清除缓存失败'
    });
  }
});

module.exports = router;

