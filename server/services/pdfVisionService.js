const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const fs = require('fs').promises;

/**
 * PDF视觉分析服务
 * 串联多个模型实现PDF深度解读
 */
class PDFVisionService {
  constructor() {
    this.pythonScript = path.join(__dirname, '../scripts/pdf_converter.py');
    this.enabled = true; // 可以通过环境变量控制
  }

  /**
   * 调用Python脚本转换PDF为图片
   */
  async convertPdfToImages(pdfUrl, options = {}) {
    const {
      maxPages = 5,
      dpi = 150,
      quality = 85
    } = options;

    console.log(`📄 开始转换PDF: ${pdfUrl}`);
    console.log(`   - 最多页数: ${maxPages}`);
    console.log(`   - 分辨率: ${dpi} DPI`);

    return new Promise((resolve, reject) => {
      const args = [
        this.pythonScript,
        pdfUrl,
        maxPages.toString(),
        dpi.toString(),
        quality.toString()
      ];

      const python = spawn('python3', args);
      
      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log('Python:', data.toString());
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`PDF转换失败 (code ${code}): ${errorOutput}`));
          return;
        }

        try {
          const result = JSON.parse(output);
          console.log(`✅ PDF转换成功: ${result.images.length} 页`);
          resolve(result);
        } catch (error) {
          reject(new Error(`解析结果失败: ${error.message}\n${output}`));
        }
      });
    });
  }

  /**
   * 使用qwen-vl-plus分析单页PDF图片
   */
  async analyzePageWithVision(imageBase64, pageNumber, aliyunService) {
    console.log(`👁️  分析第 ${pageNumber} 页...`);

    const messages = [
      {
        role: 'system',
        content: '你是一位AI论文分析专家。请仔细观察这一页内容，识别关键信息。'
      },
      {
        role: 'user',
        content: `这是一篇AI论文的第${pageNumber}页，请分析：

1. **页面类型**: 这是哪个部分？（标题页/摘要/方法/实验/结论等）
2. **关键图表**: 是否包含重要的图表（架构图/流程图/实验结果图）？
3. **图表描述**: 如果有图表，请详细描述图表内容（至少100字）
4. **关键信息**: 提取这一页的核心技术信息

请用JSON格式输出：
{
  "pageType": "页面类型",
  "hasImportantFigure": true/false,
  "figureType": "图表类型（如果有）",
  "figureDescription": "详细描述（如果有）",
  "keyPoints": ["关键点1", "关键点2", ...]
}`
      }
    ];

    try {
      // 使用aliyunBailianService的chatWithVision方法
      // 需要将base64转换为临时URL或直接传递
      const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;
      
      const result = await aliyunService.chatWithVision(
        messages,
        imageDataUrl,
        {
          model: 'qwen-vl-plus',
          maxTokens: 2000
        }
      );

      // 尝试解析JSON
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // 如果不是JSON，返回原始文本
      }

      return {
        pageType: 'unknown',
        hasImportantFigure: false,
        rawAnalysis: result
      };

    } catch (error) {
      console.error(`❌ 分析第${pageNumber}页失败:`, error.message);
      return {
        pageType: 'error',
        hasImportantFigure: false,
        error: error.message
      };
    }
  }

  /**
   * 批量分析多页（并行处理）
   */
  async analyzePagesInParallel(images, aliyunService, concurrency = 3) {
    console.log(`🔄 批量分析 ${images.length} 页（并发数：${concurrency}）...`);

    const results = [];
    
    // 分批并行处理
    for (let i = 0; i < images.length; i += concurrency) {
      const batch = images.slice(i, i + concurrency);
      
      const batchPromises = batch.map((img, idx) =>
        this.analyzePageWithVision(img, i + idx + 1, aliyunService)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 批次间延迟，避免API限流
      if (i + concurrency < images.length) {
        await this.delay(1000);
      }
    }

    return results;
  }

  /**
   * 从分析结果中提取关键图表
   */
  extractKeyFigures(analysisResults, images) {
    console.log('🖼️  提取关键图表...');

    const keyFigures = [];

    analysisResults.forEach((analysis, index) => {
      if (analysis.hasImportantFigure) {
        keyFigures.push({
          pageNumber: index + 1,
          imageBase64: images[index],
          figureType: analysis.figureType || 'unknown',
          description: analysis.figureDescription || analysis.rawAnalysis || '重要图表',
          keyPoints: analysis.keyPoints || []
        });
      }
    });

    console.log(`✅ 找到 ${keyFigures.length} 个关键图表`);
    return keyFigures;
  }

  /**
   * 混合分析：完整流程
   */
  async hybridAnalysis(paper, aliyunService, mode = 'standard') {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 开始混合模型PDF分析');
    console.log('='.repeat(60));

    const startTime = Date.now();

    try {
      // 阶段1: 转换PDF为图片
      console.log('\n📄 阶段1: 转换PDF为图片...');
      const pdfResult = await this.convertPdfToImages(paper.pdfUrl || paper.pdf_url, {
        maxPages: mode === 'deep' ? 10 : 5,
        dpi: mode === 'deep' ? 200 : 150
      });

      if (!pdfResult.images || pdfResult.images.length === 0) {
        throw new Error('PDF转换失败：没有生成图片');
      }

      // 阶段2: 视觉模型分析
      console.log('\n👁️  阶段2: 视觉模型分析...');
      const analysisResults = await this.analyzePagesInParallel(
        pdfResult.images,
        aliyunService,
        3 // 并发数
      );

      // 阶段3: 提取关键图表
      console.log('\n🖼️  阶段3: 提取关键图表...');
      const keyFigures = this.extractKeyFigures(analysisResults, pdfResult.images);

      // 阶段4: 生成深度解读
      console.log('\n📝 阶段4: 生成深度解读...');
      const deepAnalysisPrompt = this.buildDeepAnalysisPrompt(
        paper,
        analysisResults,
        keyFigures
      );

      const content = await aliyunService.chat(
        [
          {
            role: 'system',
            content: '你是一位资深的AI研究专家和技术博主，擅长将复杂的AI论文转化为易懂且有深度的技术文章。'
          },
          {
            role: 'user',
            content: deepAnalysisPrompt
          }
        ],
        {
          maxTokens: 6000,
          model: 'qwen-max',
          temperature: 0.7
        }
      );

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);

      console.log('\n' + '='.repeat(60));
      console.log(`✅ 混合分析完成！耗时: ${duration}秒`);
      console.log('='.repeat(60));

      return {
        content,
        keyFigures,
        analysisResults,
        metadata: {
          pagesAnalyzed: pdfResult.images.length,
          figuresFound: keyFigures.length,
          duration: duration,
          mode: mode
        }
      };

    } catch (error) {
      console.error('\n❌ 混合分析失败:', error.message);
      
      // 降级到纯文本模式
      console.log('⚠️  降级到纯文本模式...');
      throw error; // 让上层处理降级
    }
  }

  /**
   * 构建深度分析Prompt
   */
  buildDeepAnalysisPrompt(paper, analysisResults, keyFigures) {
    let prompt = `请对以下AI论文进行深度技术解读，生成一篇2500-3500字的专业分析文章：

**论文信息：**
- 标题：${paper.title}
- 摘要：${paper.abstract || paper.summary}
- 作者：${paper.authors ? paper.authors.join(', ') : '未知'}

**PDF视觉分析结果：**

`;

    // 添加每一页的分析结果
    analysisResults.forEach((analysis, index) => {
      prompt += `第${index + 1}页 (${analysis.pageType}):\n`;
      if (analysis.keyPoints && analysis.keyPoints.length > 0) {
        analysis.keyPoints.forEach(point => {
          prompt += `  - ${point}\n`;
        });
      }
      prompt += '\n';
    });

    // 添加关键图表信息
    if (keyFigures.length > 0) {
      prompt += `\n**关键图表 (${keyFigures.length}个)：**\n\n`;
      keyFigures.forEach((figure, index) => {
        prompt += `图${index + 1} (第${figure.pageNumber}页 - ${figure.figureType}):\n`;
        prompt += `${figure.description}\n\n`;
        prompt += `**请在文章中引用此图**: ![${figure.figureType}](figure_${index + 1}_page_${figure.pageNumber})\n\n`;
      });
    }

    prompt += `\n**文章结构要求：**

## 🎯 1. 研究背景与动机（400-500字）
- 详细分析当前领域的技术瓶颈
- 说明这项研究如何填补空白

## 💡 2. 核心创新点（600-700字）
- 深入剖析主要技术创新
${keyFigures.find(f => f.figureType.includes('架构') || f.figureType.includes('模型')) ? 
  '- **在此引用模型架构图**\n' : ''}

## 🔬 3. 方法详解（700-900字）
- 逐步拆解技术方案
- 使用代码块展示关键算法
${keyFigures.find(f => f.figureType.includes('流程') || f.figureType.includes('算法')) ? 
  '- **在此引用算法流程图**\n' : ''}

## 📊 4. 实验结果与分析（500-600字）
- 使用Markdown表格展示性能对比
${keyFigures.find(f => f.figureType.includes('实验') || f.figureType.includes('结果')) ? 
  '- **在此引用实验结果图**\n' : ''}

## 🚀 5. 应用前景与思考（300-400字）
- 具体的实际应用场景（至少3个）

## 💭 6. 总结与评价（200-300字）
- 总结论文的主要贡献

**重要提示：**
- 基于PDF视觉分析和论文摘要，深入分析
- 在合适位置引用提供的图表（使用上面指定的格式）
- 使用Markdown格式
- 专业但易懂

请直接输出完整的Markdown格式文章。`;

    return prompt;
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 检查Python环境
   */
  async checkPythonEnvironment() {
    return new Promise((resolve) => {
      const python = spawn('python3', ['-c', 'import pdf2image, PIL; print("OK")']);
      
      python.on('close', (code) => {
        resolve(code === 0);
      });
    });
  }
}

module.exports = new PDFVisionService();

