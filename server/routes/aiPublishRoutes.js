const express = require('express');
const router = express.Router();
const aiContentService = require('../services/aiContentService');
const wechatPublishService = require('../services/wechatPublishService');

// AI生成文章
router.post('/generate', async (req, res) => {
  try {
    const { sourceContent, mode } = req.body;

    if (!sourceContent) {
      return res.status(400).json({
        success: false,
        message: '缺少源内容'
      });
    }

    console.log(`🤖 AI生成文章请求 - 模式: ${mode}`);
    
    // 调用AI服务生成文章
    const article = await aiContentService.generateArticle(sourceContent, mode);

    res.json({
      success: true,
      article,
      message: 'AI生成完成'
    });
  } catch (error) {
    console.error('生成文章失败:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.toString()
    });
  }
});

// 发布到微信公众号
router.post('/publish', async (req, res) => {
  try {
    const { article } = req.body;

    if (!article || !article.title || !article.content) {
      return res.status(400).json({
        success: false,
        message: '文章信息不完整'
      });
    }

    console.log(`📤 发布文章: ${article.title}`);

    // 调用微信发布服务
    const result = await wechatPublishService.publishArticle(article);

    res.json(result);
  } catch (error) {
    console.error('发布失败:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.toString()
    });
  }
});

// 获取草稿列表
router.get('/drafts', async (req, res) => {
  try {
    const { offset = 0, count = 20 } = req.query;
    
    const result = await wechatPublishService.getDraftList(
      parseInt(offset),
      parseInt(count)
    );

    res.json(result);
  } catch (error) {
    console.error('获取草稿列表失败:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取发布记录
router.get('/publish-history', async (req, res) => {
  try {
    const { offset = 0, count = 20 } = req.query;
    
    const result = await wechatPublishService.getPublishList(
      parseInt(offset),
      parseInt(count)
    );

    res.json(result);
  } catch (error) {
    console.error('获取发布记录失败:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 检查配置状态
router.get('/status', async (req, res) => {
  const status = {
    aiConfigured: aiContentService.apiKey ? true : false,
    aiProvider: aiContentService.provider,
    wechatConfigured: wechatPublishService.isConfigured(),
    features: {
      aiGeneration: aiContentService.apiKey ? 'enabled' : 'mock',
      wechatPublish: wechatPublishService.isConfigured() ? 'enabled' : 'mock'
    }
  };

  res.json({
    success: true,
    status
  });
});

module.exports = router;

