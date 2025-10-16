const express = require('express');
const router = express.Router();
const aliyunBailianService = require('../services/aliyunBailianService');
const arxivService = require('../services/arxivService');

/**
 * 论文解读和博客生成路由
 */

/**
 * POST /api/paper-analysis/analyze
 * 解读单篇论文并生成博客
 */
router.post('/analyze', async (req, res) => {
  try {
    const { paper, mode = 'summary' } = req.body;
    
    if (!paper || !paper.title) {
      return res.status(400).json({
        success: false,
        message: '请提供论文信息'
      });
    }

    console.log(`开始解读论文: ${paper.title}, 模式: ${mode}`);
    
    const result = await aliyunBailianService.analyzePaper(paper, mode);
    
    res.json({
      success: true,
      data: result,
      message: '论文解读完成'
    });
  } catch (error) {
    console.error('论文解读失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '论文解读失败'
    });
  }
});

/**
 * POST /api/paper-analysis/analyze-batch
 * 批量解读论文
 */
router.post('/analyze-batch', async (req, res) => {
  try {
    const { papers, mode = 'summary' } = req.body;
    
    if (!papers || !Array.isArray(papers) || papers.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供论文列表'
      });
    }

    console.log(`开始批量解读 ${papers.length} 篇论文, 模式: ${mode}`);
    
    const results = await aliyunBailianService.analyzePapers(papers, mode);
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      data: results,
      message: `批量解读完成，成功 ${successCount}/${papers.length} 篇`
    });
  } catch (error) {
    console.error('批量解读失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '批量解读失败'
    });
  }
});

/**
 * POST /api/paper-analysis/from-arxiv
 * 从arXiv ID获取论文并解读
 */
router.post('/from-arxiv', async (req, res) => {
  try {
    const { arxivId, mode = 'summary' } = req.body;
    
    if (!arxivId) {
      return res.status(400).json({
        success: false,
        message: '请提供arXiv ID'
      });
    }

    console.log(`从arXiv获取论文: ${arxivId}`);
    
    // 从arXiv获取论文详情
    const papers = await arxivService.searchPapers({ ids: [arxivId] });
    
    if (!papers || papers.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该论文'
      });
    }
    
    const paper = papers[0];
    
    // 解读论文
    const result = await aliyunBailianService.analyzePaper(paper, mode);
    
    res.json({
      success: true,
      data: result,
      message: '论文解读完成'
    });
  } catch (error) {
    console.error('解读arXiv论文失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '解读arXiv论文失败'
    });
  }
});

/**
 * POST /api/paper-analysis/blog
 * 解读技术博客
 */
router.post('/blog', async (req, res) => {
  try {
    const { blog, mode = 'summary' } = req.body;
    
    if (!blog || !blog.title) {
      return res.status(400).json({
        success: false,
        message: '请提供博客信息'
      });
    }

    console.log(`开始解读博客: ${blog.title}, 模式: ${mode}`);
    
    const result = await aliyunBailianService.analyzeBlog(blog, mode);
    
    res.json({
      success: true,
      data: result,
      message: '博客解读完成'
    });
  } catch (error) {
    console.error('博客解读失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '博客解读失败'
    });
  }
});

/**
 * GET /api/paper-analysis/status
 * 获取服务状态
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      enabled: aliyunBailianService.enabled,
      model: aliyunBailianService.defaultModel,
      endpoint: aliyunBailianService.endpoint,
      supportedModes: ['summary', 'deep', 'commentary']
    }
  });
});

module.exports = router;

