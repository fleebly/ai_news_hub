/**
 * 定时任务管理路由
 */

const express = require('express');
const router = express.Router();
const schedulerService = require('../services/schedulerService');

/**
 * GET /api/scheduler/status
 * 获取定时任务状态
 */
router.get('/scheduler/status', (req, res) => {
  try {
    const status = schedulerService.getStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('获取定时任务状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取状态失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

/**
 * POST /api/scheduler/trigger/papers
 * 手动触发论文更新
 */
router.post('/scheduler/trigger/papers', async (req, res) => {
  try {
    console.log('\n🔔 收到手动触发请求：更新论文');
    const result = await schedulerService.triggerPaperUpdate();
    
    res.json({
      success: result.success,
      message: result.success 
        ? `成功获取 ${result.count} 篇论文`
        : '更新失败',
      count: result.count || 0,
      error: result.error
    });
  } catch (error) {
    console.error('手动触发论文更新失败:', error);
    res.status(500).json({
      success: false,
      message: '触发失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

/**
 * POST /api/scheduler/trigger/blogs
 * 手动触发博客更新
 */
router.post('/scheduler/trigger/blogs', async (req, res) => {
  try {
    console.log('\n🔔 收到手动触发请求：更新博客');
    const result = await schedulerService.triggerBlogUpdate();
    
    res.json({
      success: result.success,
      message: result.success 
        ? `成功获取 ${result.count} 篇博客`
        : '更新失败',
      count: result.count || 0,
      error: result.error
    });
  } catch (error) {
    console.error('手动触发博客更新失败:', error);
    res.status(500).json({
      success: false,
      message: '触发失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

/**
 * POST /api/scheduler/trigger/all
 * 手动触发所有更新任务
 */
router.post('/scheduler/trigger/all', async (req, res) => {
  try {
    console.log('\n🔔 收到手动触发请求：更新所有');
    
    const paperResult = await schedulerService.triggerPaperUpdate();
    const blogResult = await schedulerService.triggerBlogUpdate();
    
    res.json({
      success: paperResult.success && blogResult.success,
      message: `论文: ${paperResult.count || 0}篇, 博客: ${blogResult.count || 0}篇`,
      papers: {
        success: paperResult.success,
        count: paperResult.count || 0
      },
      blogs: {
        success: blogResult.success,
        count: blogResult.count || 0
      }
    });
  } catch (error) {
    console.error('手动触发全部更新失败:', error);
    res.status(500).json({
      success: false,
      message: '触发失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

module.exports = router;

