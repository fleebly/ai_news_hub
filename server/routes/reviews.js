const express = require('express');
const router = express.Router();
const reviewService = require('../services/reviewService');

/**
 * POST /api/reviews/generate
 * 生成综述（SSE流式传输进度）
 */
router.post('/reviews/generate-stream', async (req, res) => {
  const { keywords } = req.body;
  
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供至少一个关键词'
    });
  }
  
  console.log('\n🔍 ========== 开始生成综述 ==========');
  console.log('关键词:', keywords);
  
  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // 进度回调
  const sendProgress = (progress, message, data = {}) => {
    res.write(`data: ${JSON.stringify({ progress, message, ...data })}\n\n`);
  };
  
  try {
    // 生成综述
    const review = await reviewService.generateReview(keywords, sendProgress);
    
    // 发送最终结果
    res.write(`data: ${JSON.stringify({
      progress: 100,
      message: '✅ 综述生成完成',
      success: true,
      review: {
        reviewId: review.reviewId,
        title: review.title,
        abstract: review.abstract,
        content: review.content,
        references: review.references,
        metadata: review.metadata,
        sourcesCount: review.sourcesCount
      }
    })}\n\n`);
    
    res.end();
    
    console.log('✅ 综述生成成功');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('❌ 综述生成失败:', error);
    
    res.write(`data: ${JSON.stringify({
      progress: 100,
      message: '❌ 综述生成失败',
      success: false,
      error: error.message
    })}\n\n`);
    
    res.end();
  }
});

/**
 * POST /api/reviews/generate
 * 生成综述（普通请求）
 */
router.post('/reviews/generate', async (req, res) => {
  const { keywords } = req.body;
  
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供至少一个关键词'
    });
  }
  
  console.log('\n🔍 ========== 开始生成综述 ==========');
  console.log('关键词:', keywords);
  
  try {
    const review = await reviewService.generateReview(keywords);
    
    console.log('✅ 综述生成成功');
    console.log('========================================\n');
    
    res.json({
      success: true,
      review: {
        reviewId: review.reviewId,
        title: review.title,
        abstract: review.abstract,
        content: review.content,
        references: review.references,
        metadata: review.metadata,
        sourcesCount: review.sourcesCount
      }
    });
    
  } catch (error) {
    console.error('❌ 综述生成失败:', error);
    
    res.status(500).json({
      success: false,
      message: '综述生成失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

/**
 * GET /api/reviews
 * 获取综述列表
 */
router.get('/reviews', async (req, res) => {
  try {
    const { limit = 20, skip = 0, keywords } = req.query;
    
    const options = {
      limit: parseInt(limit),
      skip: parseInt(skip)
    };
    
    if (keywords) {
      options.keywords = keywords.split(',').map(k => k.trim());
    }
    
    const reviews = await reviewService.getReviews(options);
    
    res.json({
      success: true,
      reviews: reviews.map(r => ({
        reviewId: r.reviewId,
        title: r.title,
        abstract: r.abstract,
        keywords: r.keywords,
        sourcesCount: r.sourcesCount,
        metadata: r.metadata,
        views: r.views,
        likes: r.likes,
        createdAt: r.createdAt
      })),
      count: reviews.length
    });
    
  } catch (error) {
    console.error('获取综述列表失败:', error);
    
    res.status(500).json({
      success: false,
      message: '获取综述列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

/**
 * GET /api/reviews/:reviewId
 * 获取单个综述详情
 */
router.get('/reviews/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await reviewService.getReviewById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '综述不存在'
      });
    }
    
    res.json({
      success: true,
      review: {
        reviewId: review.reviewId,
        title: review.title,
        abstract: review.abstract,
        content: review.content,
        keywords: review.keywords,
        references: review.references,
        sourcesCount: review.sourcesCount,
        metadata: review.metadata,
        views: review.views,
        likes: review.likes,
        createdAt: review.createdAt
      }
    });
    
  } catch (error) {
    console.error('获取综述详情失败:', error);
    
    res.status(500).json({
      success: false,
      message: '获取综述详情失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

/**
 * DELETE /api/reviews/:reviewId
 * 删除综述
 */
router.delete('/reviews/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const Review = require('../models/Review');
    const result = await Review.deleteOne({ reviewId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: '综述不存在'
      });
    }
    
    res.json({
      success: true,
      message: '综述已删除'
    });
    
  } catch (error) {
    console.error('删除综述失败:', error);
    
    res.status(500).json({
      success: false,
      message: '删除综述失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

module.exports = router;

