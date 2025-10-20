const express = require('express');
const router = express.Router();
const aliyunBailianService = require('../services/aliyunBailianService');
const arxivService = require('../services/arxivService');
const pdfVisionService = require('../services/pdfVisionService');
const pdfEnhancedAnalysisService = require('../services/pdfEnhancedAnalysisService');

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
 * POST /api/paper-analysis/analyze-hybrid-stream
 * 混合模型分析（带实时进度）：PDF转图片 + 视觉理解 + 文本生成
 * 使用Server-Sent Events实时推送进度
 */
router.post('/analyze-hybrid-stream', async (req, res) => {
  const { paper, level = 'standard' } = req.body;
  
  if (!paper || !paper.title) {
    return res.status(400).json({
      success: false,
      message: '请提供论文信息'
    });
  }

  // 设置SSE头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // 禁用nginx缓冲

  // 发送进度的辅助函数
  const sendProgress = (progress, message, data = {}) => {
    res.write(`data: ${JSON.stringify({
      progress,
      message,
      ...data
    })}\n\n`);
  };

  try {
    sendProgress(0, '开始分析...', { stage: 'init' });

    // 验证level参数
    const validLevels = ['fast', 'standard', 'deep'];
    if (!validLevels.includes(level)) {
      sendProgress(0, '无效的分析级别', { error: true });
      res.write(`data: ${JSON.stringify({ done: true, success: false, message: '无效的分析级别' })}\n\n`);
      return res.end();
    }

    sendProgress(5, `📊 分析级别: ${level}`, { stage: 'validate' });

    // 快速模式
    if (level === 'fast') {
      sendProgress(10, '⚡ 使用快速模式（纯文本）', { stage: 'fast' });
      sendProgress(50, '🤖 AI生成中...', { stage: 'generating' });
      
      const result = await aliyunBailianService.analyzePaper(paper, 'deep');
      
      sendProgress(100, '✅ 分析完成！', { stage: 'done' });
      res.write(`data: ${JSON.stringify({
        done: true,
        success: true,
        data: { ...result, level: 'fast', cost: 0.02 }
      })}\n\n`);
      return res.end();
    }

    // 标准/完整模式
    const pdfUrl = paper.pdfUrl || paper.pdf_url;
    
    if (!pdfUrl || pdfUrl === '#') {
      sendProgress(10, '⚠️ 无PDF URL，降级到快速模式', { stage: 'fallback' });
      const result = await aliyunBailianService.analyzePaper(paper, 'deep');
      res.write(`data: ${JSON.stringify({
        done: true,
        success: true,
        data: { ...result, level: 'fast', fallback: true }
      })}\n\n`);
      return res.end();
    }

    // 检查Python环境
    sendProgress(10, '🔍 检查环境...', { stage: 'check' });
    const pythonOK = await pdfVisionService.checkPythonEnvironment();
    
    if (!pythonOK) {
      sendProgress(15, '⚠️ Python环境未配置，降级', { stage: 'fallback' });
      const result = await aliyunBailianService.analyzePaper(paper, 'deep');
      res.write(`data: ${JSON.stringify({
        done: true,
        success: true,
        data: { ...result, level: 'fast', fallback: true }
      })}\n\n`);
      return res.end();
    }

    // 执行混合分析（带进度回调）
    sendProgress(15, '📄 开始PDF处理...', { stage: 'pdf' });
    
    const result = await pdfVisionService.hybridAnalysisWithProgress(
      paper,
      aliyunBailianService,
      level === 'deep' ? 'deep' : 'standard',
      (progress, message, data) => {
        sendProgress(15 + progress * 0.85, message, data); // 15-100%
      }
    );

    // 计算成本
    const pagesAnalyzed = result.metadata.pagesAnalyzed;
    const estimatedCost = 0.001 + (pagesAnalyzed * 0.15) + 0.02;

    sendProgress(100, '✅ 分析完成！', { stage: 'done' });
    res.write(`data: ${JSON.stringify({
      done: true,
      success: true,
      data: {
        title: `${paper.title} - 深度解读`,
        content: result.content,
        mode: 'deep',
        level: level,
        metadata: {
          ...result.metadata,
          estimatedCost: estimatedCost.toFixed(2) + '元',
          duration: result.metadata.duration + '秒'
        }
      }
    })}\n\n`);
    res.end();

  } catch (error) {
    console.error('分析失败:', error);
    sendProgress(0, `❌ 错误: ${error.message}`, { error: true });
    res.write(`data: ${JSON.stringify({
      done: true,
      success: false,
      error: error.message
    })}\n\n`);
    res.end();
  }
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

/**
 * POST /api/paper-analysis/analyze-enhanced-stream
 * 增强分析（SSE流式）- 整合多源搜索
 */
router.post('/analyze-enhanced-stream', async (req, res) => {
  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const sendProgress = (progress, message, details = {}) => {
    sendEvent({ type: 'progress', progress, message, ...details });
  };

  try {
    const { paper } = req.body;
    
    if (!paper || !paper.title) {
      sendEvent({ type: 'error', message: '请提供论文信息' });
      return res.end();
    }

    const { title, abstract, pdfUrl } = paper;
    
    // 验证PDF URL
    if (!pdfUrl || pdfUrl === 'undefined' || pdfUrl === '#') {
      console.error('❌ PDF URL缺失或无效:', pdfUrl);
      sendEvent({ 
        type: 'error', 
        message: `PDF URL无效: ${pdfUrl || '未提供'}。请确保论文有可用的PDF链接。` 
      });
      return res.end();
    }
    
    console.log('\n🔬 ========== 增强分析 ==========');
    console.log(`论文: ${title}`);
    console.log(`PDF URL: ${pdfUrl}`);
    console.log(`模式: 多源检索 + 深度解读`);

    // 执行增强分析
    const result = await pdfEnhancedAnalysisService.analyzeWithEnhancement(
      pdfUrl,
      title,
      abstract || '',
      sendProgress
    );

    // 发送完成事件
    sendEvent({
      type: 'complete',
      content: result.content,
      topics: result.topics,
      searchResults: result.searchResults,
      metadata: result.metadata
    });

    console.log('✅ 增强分析完成');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ 增强分析失败:', error);
    sendEvent({ 
      type: 'error', 
      message: error.message || '增强分析失败'
    });
  } finally {
    res.end();
  }
});

module.exports = router;

