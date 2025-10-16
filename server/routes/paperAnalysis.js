const express = require('express');
const router = express.Router();
const aliyunBailianService = require('../services/aliyunBailianService');
const arxivService = require('../services/arxivService');
const pdfVisionService = require('../services/pdfVisionService');

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
      supportedModes: ['summary', 'deep', 'commentary'],
      hybridSupported: true
    }
  });
});

/**
 * POST /api/paper-analysis/analyze-hybrid
 * 混合模型分析：PDF转图片 + 视觉理解 + 文本生成
 * 
 * 支持三种级别：
 * - fast: 纯文本模式（0.02元，1-3分钟）
 * - standard: 关键图表模式（0.77元，2-4分钟）⭐推荐
 * - deep: 完整页面分析（1.52元，3-5分钟）
 */
router.post('/analyze-hybrid', async (req, res) => {
  try {
    const { paper, level = 'standard' } = req.body;
    
    if (!paper || !paper.title) {
      return res.status(400).json({
        success: false,
        message: '请提供论文信息'
      });
    }

    // 验证level参数
    const validLevels = ['fast', 'standard', 'deep'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: `无效的分析级别。支持: ${validLevels.join(', ')}`
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🚀 开始混合分析: ${paper.title}`);
    console.log(`📊 分析级别: ${level}`);
    console.log('='.repeat(60));

    // 快速模式：直接使用纯文本分析
    if (level === 'fast') {
      console.log('⚡ 使用快速模式（纯文本）');
      const result = await aliyunBailianService.analyzePaper(paper, 'deep');
      return res.json({
        success: true,
        data: {
          ...result,
          level: 'fast',
          cost: 0.02,
          duration: null
        },
        message: '快速分析完成'
      });
    }

    // 标准/完整模式：使用混合分析
    const pdfUrl = paper.pdfUrl || paper.pdf_url;
    
    if (!pdfUrl || pdfUrl === '#') {
      console.log('⚠️  无有效PDF URL，降级到快速模式');
      const result = await aliyunBailianService.analyzePaper(paper, 'deep');
      return res.json({
        success: true,
        data: {
          ...result,
          level: 'fast',
          cost: 0.02,
          fallback: true,
          fallbackReason: '无有效PDF URL'
        },
        message: '已降级到快速模式'
      });
    }

    // 检查Python环境
    const pythonOK = await pdfVisionService.checkPythonEnvironment();
    if (!pythonOK) {
      console.log('⚠️  Python环境未配置，降级到快速模式');
      const result = await aliyunBailianService.analyzePaper(paper, 'deep');
      return res.json({
        success: true,
        data: {
          ...result,
          level: 'fast',
          cost: 0.02,
          fallback: true,
          fallbackReason: 'Python环境未配置'
        },
        message: '已降级到快速模式（Python环境未配置）'
      });
    }

    // 执行混合分析
    const result = await pdfVisionService.hybridAnalysis(
      paper,
      aliyunBailianService,
      level === 'deep' ? 'deep' : 'standard'
    );

    // 计算成本
    const pagesAnalyzed = result.metadata.pagesAnalyzed;
    const estimatedCost = 0.001 + (pagesAnalyzed * 0.15) + 0.02;

    res.json({
      success: true,
      data: {
        title: `${paper.title} - 深度解读`,
        content: result.content,
        mode: 'deep',
        level: level,
        keyFigures: result.keyFigures.map(fig => ({
          pageNumber: fig.pageNumber,
          figureType: fig.figureType,
          description: fig.description,
          // 注意：实际生产环境应该将图片上传到OSS并返回URL
          imageBase64: fig.imageBase64.substring(0, 100) + '...',
          imagePreview: `data:image/jpeg;base64,${fig.imageBase64.substring(0, 1000)}...`
        })),
        metadata: {
          ...result.metadata,
          estimatedCost: estimatedCost.toFixed(2) + '元',
          duration: result.metadata.duration + '秒'
        },
        sourcePaper: {
          title: paper.title,
          link: pdfUrl,
          authors: paper.authors
        }
      },
      message: `${level === 'standard' ? '标准' : '完整'}分析完成`
    });

  } catch (error) {
    console.error('\n❌ 混合分析失败:', error.message);
    console.error(error.stack);
    
    // 降级到纯文本模式
    try {
      console.log('\n⚠️  尝试降级到纯文本模式...');
      const result = await aliyunBailianService.analyzePaper(req.body.paper, 'deep');
      
      res.json({
        success: true,
        data: {
          ...result,
          level: 'fast',
          cost: 0.02,
          fallback: true,
          fallbackReason: error.message
        },
        message: '已降级到快速模式'
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        message: '分析失败',
        error: error.message,
        fallbackError: fallbackError.message
      });
    }
  }
});

module.exports = router;

