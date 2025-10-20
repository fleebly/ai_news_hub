const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const fs = require('fs').promises;
const ossService = require('./ossService');

/**
 * PDF视觉分析服务
 * 串联多个模型实现PDF深度解读
 */
class PDFVisionService {
  constructor() {
    this.pythonScript = path.join(__dirname, '../scripts/pdf_converter.py');
    this.enabled = true; // 可以通过环境变量控制
    
    // 随机解读风格配置
    this.writingStyles = [
      {
        name: '学术严谨风格',
        tone: '严谨、专业、学术化',
        structure: '按照学术论文结构组织，强调理论基础和实验验证',
        language: '使用专业术语，逻辑严密，引用规范'
      },
      {
        name: '通俗易懂风格',
        tone: '轻松、生动、易理解',
        structure: '采用总分总结构，多用类比和比喻',
        language: '避免过多术语，用日常语言解释复杂概念'
      },
      {
        name: '工程实践风格',
        tone: '实用、直接、面向应用',
        structure: '重点关注方法实现和工程细节',
        language: '强调可操作性，提供代码示例思路'
      },
      {
        name: '批判分析风格',
        tone: '客观、批判、深入',
        structure: '在介绍的基础上增加批判性分析',
        language: '指出优势和局限性，提出改进方向'
      },
      {
        name: '故事叙述风格',
        tone: '有趣、引人入胜',
        structure: '以故事线索展开，强调研究动机和发展过程',
        language: '使用叙事手法，让技术内容更有吸引力'
      }
    ];
    
    // 随机格式配置
    this.formatStyles = [
      {
        name: '标准学术格式',
        sections: ['研究背景', '核心贡献', '技术方法', '实验结果', '结论展望'],
        emphasis: '结构完整，层次分明'
      },
      {
        name: '问答式格式',
        sections: ['问题提出', '为什么重要', '如何解决', '效果如何', '未来方向'],
        emphasis: '以问题驱动，逻辑清晰'
      },
      {
        name: '亮点优先格式',
        sections: ['核心亮点', '创新之处', '技术细节', '性能表现', '应用价值'],
        emphasis: '突出创新点，吸引读者'
      },
      {
        name: '对比式格式',
        sections: ['现有方法局限', '本文解决方案', '关键改进', '实验对比', '总结'],
        emphasis: '强调对比，突出优势'
      }
    ];
  }
  
  /**
   * 随机选择解读风格
   */
  getRandomStyle() {
    const style = this.writingStyles[Math.floor(Math.random() * this.writingStyles.length)];
    const format = this.formatStyles[Math.floor(Math.random() * this.formatStyles.length)];
    
    console.log(`🎨 随机选择风格: ${style.name}`);
    console.log(`📋 随机选择格式: ${format.name}`);
    
    return { style, format };
  }

  /**
   * 调用Python脚本转换PDF为图片
   */
  async convertPdfToImages(pdfUrl, options = {}) {
    const {
      maxPages = 999,  // 默认不限制页数，读取完整论文
      dpi = 150,
      quality = 85
    } = options;

    console.log(`📄 开始转换PDF: ${pdfUrl}`);
    console.log(`   - 最多页数: ${maxPages === 999 ? '不限制（完整论文）' : maxPages}`);
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
   * @param {string} imageData - 图片URL(推荐)或base64数据
   * @param {number} pageNumber - 页码
   * @param {object} aliyunService - 阿里云服务实例
   */
  async analyzePageWithVision(imageData, pageNumber, aliyunService) {
    console.log(`👁️  分析第 ${pageNumber} 页...`);
    
    const isUrl = imageData.startsWith('http://') || imageData.startsWith('https://');
    if (isUrl) {
      console.log(`   使用OSS URL: ${imageData.substring(0, 80)}...`);
    }

    const messages = [
      {
        role: 'system',
        content: '你是一位资深的AI论文分析专家，擅长快速提取论文中的关键技术信息和图表内容。请仔细观察图片，进行深度分析。'
      },
      {
        role: 'user',
        content: `这是一篇AI论文PDF的第${pageNumber}页图片。请识别页面中的**核心图表**并返回其位置和描述。

返回JSON格式：
{
  "pageType": "页面类型",
  "hasImportantFigure": true或false,
  "figureType": "具体图表类型",
  "figureTitle": "图表标题",
  "figureDescription": "图表详细描述（150-300字）",
  "figureBbox": {
    "x": 0.1,
    "y": 0.2,
    "width": 0.8,
    "height": 0.6
  },
  "keyPoints": ["关键信息1", "关键信息2"],
  "technicalDepth": "high/medium/low",
  "containsCoreTech": true或false
}

**关键要求**：
1. **figureBbox**是图表的边界框，使用相对坐标（0.0-1.0）：
   - x: 左边距占页面宽度的比例（0=最左，1=最右）
   - y: 上边距占页面高度的比例（0=最上，1=最下）
   - width: 图表宽度占页面宽度的比例
   - height: 图表高度占页面高度的比例
   
2. 请仔细观察图表的实际位置，**尽量精确**地标注边界框
3. 如果图表占据大部分页面，bbox可能是 {"x": 0.05, "y": 0.1, "width": 0.9, "height": 0.8}
4. 如果图表在页面中部，bbox可能是 {"x": 0.1, "y": 0.3, "width": 0.8, "height": 0.4}

5. figureDescription只描述图表本身（不包括周围文字）

立即分析并返回JSON：`
      }
    ];

    // 添加重试机制（最多3次）
    let lastError;
    for (let retry = 0; retry < 3; retry++) {
      try {
        if (retry > 0) {
          console.log(`  🔄 重试第${retry}次 (第${pageNumber}页)...`);
          // 重试前等待，避免立即触发限流
          await this.delay(2000 * retry); // 2s, 4s
        }

        // 使用aliyunBailianService的chatWithVision方法
        // imageData可以是：
        // 1. OSS URL（推荐）- 阿里云视觉API直接访问
        // 2. data URI - service会自动提取纯base64（但API可能拒绝）
        // 3. 纯base64 - service直接使用（但API可能拒绝）
        const result = await aliyunService.chatWithVision(
          messages,
          imageData,  // 传递URL或base64数据
          {
            model: 'qwen-vl-plus',
            maxTokens: 3000  // 增加token限制，支持更详细的分析
          }
        );
        
        // 如果成功，跳出重试循环
        lastError = null;

        // 确保result是字符串
        const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
        console.log(`   响应类型: ${typeof result}, 长度: ${resultStr.length}字`);
        
        // 调试：输出前200字符
        if (resultStr.length < 500) {
          console.log(`   响应内容: ${resultStr.substring(0, 200)}`);
        }

        // 尝试解析JSON
        try {
          let jsonStr = null;
          
          // 先尝试提取JSON代码块
          let jsonMatch = resultStr.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            jsonStr = jsonMatch[1].trim();
          } else {
            // 如果没有代码块，直接匹配JSON对象
            jsonMatch = resultStr.match(/(\{[\s\S]*\})/);
            if (jsonMatch && jsonMatch[1]) {
              jsonStr = jsonMatch[1].trim();
            }
          }
          
          if (jsonStr) {
            console.log(`   尝试解析JSON (前100字符): ${jsonStr.substring(0, 100)}`);
            const parsed = JSON.parse(jsonStr);
            
            // 确保所有必要字段都存在
            return {
              pageType: parsed.pageType || 'unknown',
              hasImportantFigure: parsed.hasImportantFigure || false,
              figureType: parsed.figureType || '',
              figureTitle: parsed.figureTitle || '',
              figureDescription: parsed.figureDescription || '',
              figureBbox: parsed.figureBbox || null,  // 新增：图表边界框
              keyPoints: parsed.keyPoints || [],
              technicalDepth: parsed.technicalDepth || 'medium',
              containsCoreTech: parsed.containsCoreTech || false,
              rawAnalysis: resultStr
            };
          }
        } catch (e) {
          console.warn(`⚠️  JSON解析失败 (第${pageNumber}页):`, e.message);
          // 如果JSON解析失败，尝试从文本中提取关键信息
        }

        // 如果不是JSON或解析失败，返回原始文本分析
        return {
          pageType: 'unknown',
          hasImportantFigure: false,
          rawAnalysis: resultStr,
          keyPoints: []
        };

      } catch (error) {
        lastError = error;
        console.error(`❌ 分析第${pageNumber}页失败 (尝试${retry + 1}/3):`, error.message);
        
        // 如果是429错误（限流），继续重试
        if (error.response && error.response.status === 429 && retry < 2) {
          continue;
        }
        
        // 其他错误或最后一次重试，直接退出
        if (retry === 2) {
          break;
        }
      }
    }

    // 所有重试都失败
    console.error(`❌ 分析第${pageNumber}页最终失败，已重试3次`);
    return {
      pageType: 'error',
      hasImportantFigure: false,
      error: lastError?.message || '分析失败'
    };
  }

  /**
   * 批量分析多页（并行处理）
   */
  async analyzePagesInParallel(images, aliyunService, concurrency = 4) {
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

      // 批次间延迟，避免API限流（减少到500ms）
      if (i + concurrency < images.length) {
        await this.delay(500);
      }
    }

    return results;
  }

  /**
   * 裁剪图表
   * @param {Array} images - Base64图片数组
   * @param {Array} analysisResults - 视觉分析结果（包含bbox）
   * @returns {Promise<Array>} 裁剪后的图片数组
   */
  async cropFigures(images, analysisResults) {
    console.log('✂️  裁剪关键图表...');
    
    const { spawn } = require('child_process');
    const path = require('path');
    
    // 准备输入数据
    const inputData = {
      images: analysisResults.map((analysis, index) => ({
        index,
        base64: images[index],
        bbox: analysis.figureBbox
      }))
    };
    
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, '../scripts/crop_figures.py');
      const python = spawn('python3', [pythonScript]);
      
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          console.error('⚠️  图表裁剪失败，使用原图:', stderr);
          // 失败时返回原图
          resolve(images);
        } else {
          try {
            const result = JSON.parse(stdout);
            if (result.success) {
              const croppedImages = result.croppedImages
                .sort((a, b) => a.index - b.index)
                .map(img => img.base64);
              
              const croppedCount = result.croppedImages.filter(img => img.cropped).length;
              console.log(`✅ 成功裁剪 ${croppedCount}/${images.length} 张图片`);
              
              resolve(croppedImages);
            } else {
              console.error('⚠️  裁剪返回失败，使用原图:', result.error);
              resolve(images);
            }
          } catch (e) {
            console.error('⚠️  解析裁剪结果失败，使用原图:', e.message);
            resolve(images);
          }
        }
      });
      
      // 发送输入数据
      python.stdin.write(JSON.stringify(inputData));
      python.stdin.end();
      
      // 超时保护（30秒）
      setTimeout(() => {
        python.kill();
        console.error('⚠️  裁剪超时，使用原图');
        resolve(images);
      }, 30000);
    });
  }

  /**
   * 从分析结果中提取关键图表
   * @param {Array} analysisResults - 视觉分析结果
   * @param {Array} images - Base64图片数据（用于降级）
   * @param {Array} imageUrls - OSS图片URL（优先使用）
   */
  extractKeyFigures(analysisResults, images, imageUrls = []) {
    console.log('🖼️  提取关键图表...');

    const keyFigures = [];

    analysisResults.forEach((analysis, index) => {
      if (analysis.hasImportantFigure) {
        const description = analysis.figureDescription || analysis.rawAnalysis || '重要图表';
        
        // 只保留描述足够详细的图表（至少80字）
        if (description.length >= 80) {
          keyFigures.push({
            pageNumber: index + 1,
            imageBase64: images[index], // 保留base64作为降级选项
            imageUrl: imageUrls[index] || null, // OSS URL（优先使用）
            figureType: analysis.figureType || '图表',
            figureTitle: analysis.figureTitle || `第${index + 1}页图表`,
            description: description,
            keyPoints: analysis.keyPoints || [],
            technicalDepth: analysis.technicalDepth || 'medium'
          });
          
          console.log(`  ✅ 第${index + 1}页: ${analysis.figureType || '图表'} (${description.length}字描述)`);
        } else {
          console.log(`  ⚠️  第${index + 1}页: 图表描述太短，跳过 (${description.length}字)`);
        }
      }
    });

    console.log(`\n✅ 共提取 ${keyFigures.length} 个关键图表`);
    
    // 按技术深度排序，优先保留高质量图表
    keyFigures.sort((a, b) => {
      const depthOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return (depthOrder[b.technicalDepth] || 0) - (depthOrder[a.technicalDepth] || 0);
    });
    
    return keyFigures;
  }

  /**
   * 混合分析：完整流程（带进度回调）
   */
  async hybridAnalysisWithProgress(paper, aliyunService, mode = 'standard', progressCallback = null) {
    const sendProgress = (progress, message, data = {}) => {
      if (progressCallback) {
        progressCallback(progress, message, data);
      }
    };

    console.log('\n' + '='.repeat(60));
    console.log('🚀 开始混合模型PDF分析');
    console.log('='.repeat(60));

    const startTime = Date.now();

    try {
      // 阶段1: 转换PDF为图片 (0-20%)
      sendProgress(0, '📄 阶段1/4: 下载并转换PDF...', { stage: 'pdf' });
      console.log('\n📄 阶段1: 转换PDF为图片...');
      
      const pdfResult = await this.convertPdfToImages(paper.pdfUrl || paper.pdf_url, {
        maxPages: 999,  // 不限制页数，读取完整论文
        dpi: 150        // 统一使用150 DPI
      });

      if (!pdfResult.images || pdfResult.images.length === 0) {
        throw new Error('PDF转换失败：没有生成图片');
      }

      sendProgress(20, `✅ PDF转换完成: ${pdfResult.images.length}页`, { 
        stage: 'pdf', 
        pages: pdfResult.images.length 
      });

      // 阶段1.5: 上传图片到OSS (20-25%)
      sendProgress(20, '📤 上传图片到云端...', { stage: 'upload' });
      console.log('\n📤 上传图片到OSS...');
      
      let imageUrls = [];
      let uploadedToOSS = false;
      
      if (!ossService.enabled) {
        throw new Error('OSS服务未配置，无法进行视觉分析。请配置ALIYUN_OSS相关环境变量。');
      }
      
      imageUrls = await ossService.uploadImages(pdfResult.images);
      uploadedToOSS = true;
      console.log(`✅ ${imageUrls.length} 张图片已上传到OSS`);
      sendProgress(25, `✅ 图片上传完成`, { stage: 'upload' });

      // 阶段2: 视觉模型分析 (25-60%)
      sendProgress(25, '👁️ 阶段2/4: AI视觉分析中...', { stage: 'vision' });
      console.log('\n👁️  阶段2: 视觉模型分析...');
      
      const totalPages = pdfResult.images.length;
      const analysisResults = [];
      
      // 分批并行处理，每批发送进度（提高并发度到4）
      const concurrency = 4;
      for (let i = 0; i < totalPages; i += concurrency) {
        const batch = imageUrls.slice(i, i + concurrency);
        const batchNum = Math.floor(i / concurrency) + 1;
        const totalBatches = Math.ceil(totalPages / concurrency);
        
        sendProgress(
          20 + (i / totalPages) * 40,
          `🔍 分析第${i + 1}-${Math.min(i + concurrency, totalPages)}页 (${batchNum}/${totalBatches}批)`,
          { stage: 'vision', current: i + 1, total: totalPages }
        );
        
        const batchPromises = batch.map((img, idx) =>
          this.analyzePageWithVision(img, i + idx + 1, aliyunService)
        );

        const batchResults = await Promise.all(batchPromises);
        analysisResults.push(...batchResults);

        // 批次间延迟（减少到500ms）
        if (i + concurrency < totalPages) {
          await this.delay(500);
        }
      }

      sendProgress(60, `✅ 视觉分析完成: ${totalPages}页`, { stage: 'vision' });

      // 阶段2.5: 裁剪图表 (60-70%)
      sendProgress(60, '✂️ 阶段3/5: 裁剪核心图表...', { stage: 'crop' });
      console.log('\n✂️  阶段2.5: 裁剪核心图表...');
      
      const croppedImages = await this.cropFigures(pdfResult.images, analysisResults);
      
      sendProgress(65, `✅ 图表裁剪完成`, { stage: 'crop' });

      // 阶段2.6: 上传裁剪后的图片到OSS (65-70%)
      sendProgress(65, '📤 上传裁剪后的图片...', { stage: 'upload_cropped' });
      console.log('\n📤 上传裁剪后的图片到OSS...');
      
      const croppedImageUrls = await ossService.uploadImages(croppedImages, 'pdf-figures');
      console.log(`✅ ${croppedImageUrls.length} 张裁剪后的图片已上传`);
      sendProgress(70, `✅ 裁剪图片上传完成`, { stage: 'upload_cropped' });

      // 阶段3: 提取关键图表 (70-75%)
      sendProgress(70, '🖼️ 阶段4/5: 提取关键图表...', { stage: 'figures' });
      console.log('\n🖼️  阶段3: 提取关键图表...');
      
      // 提取关键图表，使用裁剪后的图片和URL
      const keyFigures = this.extractKeyFigures(analysisResults, croppedImages, croppedImageUrls);
      
      sendProgress(75, `✅ 找到${keyFigures.length}个关键图表`, { 
        stage: 'figures', 
        count: keyFigures.length 
      });

      // 注意：OSS图片不立即清理，交由生命周期规则处理（30天后自动删除）
      // 保留整页图片用于视觉分析，裁剪后的图片用于最终文章展示
      if (uploadedToOSS && imageUrls.length > 0) {
        console.log(`📦 OSS图片已嵌入文章（裁剪版），将在30天后自动清理`);
        console.log(`   - 整页图片: ${imageUrls.length}张（用于分析）`);
        console.log(`   - 裁剪图片: ${croppedImageUrls.length}张（用于展示）`);
      }

      // 检查是否需要降级（无图片时的纯文字解读）
      const useFallbackMode = keyFigures.length === 0;
      if (useFallbackMode) {
        console.log('\n⚠️  未提取到关键图表，使用纯文字解读');
        sendProgress(75, '⚠️ 未提取到图表，将生成纯文字解读...', { 
          stage: 'fallback',
          warning: true
        });
      }

      // 阶段4: 生成深度解读 (75-95%)
      sendProgress(75, '📝 阶段5/5: AI生成深度解读...', { stage: 'generate' });
      console.log('\n📝 阶段4: 生成深度解读...');
      
      const deepAnalysisPrompt = useFallbackMode 
        ? this.buildFallbackAnalysisPrompt(paper)  // 降级：纯文字解读
        : this.buildDeepAnalysisPrompt(paper, analysisResults, keyFigures);  // 正常：图文并茂

      sendProgress(70, '🤖 AI模型思考中（预计1-2分钟）...', { stage: 'generate' });

      let content = await aliyunService.chat(
        [
          {
            role: 'system',
            content: `你是一位顶尖的AI研究专家和技术写作大师，精通以下技能：

1. **深度技术分析**：能够深入理解复杂的AI论文，提炼核心创新点
2. **专业Markdown写作**：精通Markdown语法，排版清晰美观
3. **LaTeX数学公式**：能够正确使用LaTeX语法编写数学公式
4. **图文并茂表达**：善于将视觉图表与文字内容完美结合

**写作风格要求**：
- 专业但易懂，深入浅出
- 结构清晰，层次分明
- 图文并茂，视觉丰富
- 公式准确，格式规范
- 排版美观，阅读舒适

你的目标是撰写一篇高质量的、图文并茂的、可以直接发布的技术博客文章。`
          },
          {
            role: 'user',
            content: deepAnalysisPrompt
          }
        ],
        {
          maxTokens: 8000, // 阿里云模型最大支持8192，这里设置8000以留出余量
          model: 'qwen-max',
          temperature: 0.6 // 降低温度以提高输出的稳定性和准确性
        }
      );

      sendProgress(90, '🖼️ 嵌入图片...', { stage: 'embed' });

      // 替换图片placeholder为实际的图片URL或base64数据
      console.log('\n🖼️  嵌入图片...');
      let ossUsed = 0;
      let base64Used = 0;
      
      keyFigures.forEach((figure, index) => {
        const figNum = index + 1;
        const placeholder = `FIGURE_${figNum}_PLACEHOLDER`;
        
        // 优先使用OSS URL（更轻量），如果没有则使用base64
        const actualImageData = figure.imageUrl || figure.imageBase64;
        
        if (figure.imageUrl) {
          ossUsed++;
          console.log(`  图${figNum}: 使用OSS URL (${figure.imageUrl.length}字符)`);
        } else {
          base64Used++;
          console.log(`  图${figNum}: 使用Base64降级 (${figure.imageBase64.length}字符)`);
        }
        
        content = content.replace(
          new RegExp(placeholder, 'g'),
          actualImageData
        );
      });

      console.log(`✅ 已嵌入 ${keyFigures.length} 张图片 (OSS: ${ossUsed}, Base64: ${base64Used})`);

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);

      console.log('\n' + '='.repeat(60));
      console.log(`✅ 混合分析完成！耗时: ${duration}秒`);
      console.log(`📊 分析页数: ${pdfResult.images.length} 页`);
      console.log(`🖼️  关键图表: ${keyFigures.length} 个`);
      console.log(`📝 文章字数: ${content.length} 字`);
      console.log('='.repeat(60));

      sendProgress(95, '✅ 分析完成，准备返回结果...', { stage: 'done' });

      // 清理OSS图片（解读完成后删除临时图片）
      if (uploadedToOSS && imageUrls.length > 0) {
        sendProgress(97, '🗑️ 清理临时图片...', { stage: 'cleanup' });
        console.log('\n🗑️  清理OSS临时图片...');
        try {
          await ossService.deleteImages(imageUrls.concat(croppedImageUrls || []));
          console.log(`✅ 已删除 ${imageUrls.length + (croppedImageUrls?.length || 0)} 张临时图片`);
        } catch (error) {
          console.warn('⚠️  清理OSS图片失败（不影响主流程）:', error.message);
        }
      }

      sendProgress(100, '✅ 所有任务完成！', { stage: 'done' });

      return {
        content,
        keyFigures,
        analysisResults,
        metadata: {
          pagesAnalyzed: pdfResult.images.length,
          figuresFound: keyFigures.length,
          duration: duration,
          mode: mode,
          contentLength: content.length
        }
      };

    } catch (error) {
      console.error('\n❌ 混合分析失败:', error.message);
      sendProgress(0, `❌ 分析失败: ${error.message}`, { stage: 'error', error: true });
      throw error;
    }
  }

  /**
   * 混合分析：完整流程（无进度回调）
   */
  async hybridAnalysis(paper, aliyunService, mode = 'standard') {
    return this.hybridAnalysisWithProgress(paper, aliyunService, mode, null);
  }

  /**
   * 旧版混合分析方法（保留兼容性）
   */
  async _hybridAnalysisOld(paper, aliyunService, mode = 'standard') {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 开始混合模型PDF分析');
    console.log('='.repeat(60));

    const startTime = Date.now();

    try {
      // 阶段1: 转换PDF为图片
      console.log('\n📄 阶段1: 转换PDF为图片...');
      const pdfResult = await this.convertPdfToImages(paper.pdfUrl || paper.pdf_url, {
        maxPages: 999,  // 不限制页数，读取完整论文
        dpi: 150        // 统一使用150 DPI
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

      let content = await aliyunService.chat(
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
          maxTokens: 8000,
          model: 'qwen-max',
          temperature: 0.7
        }
      );

      // 替换图片placeholder为实际的base64数据
      console.log('\n🖼️  嵌入图片...');
      keyFigures.forEach((figure, index) => {
        const figNum = index + 1;
        const placeholder = `FIGURE_${figNum}_PLACEHOLDER`;
        const actualImageData = figure.imageBase64;
        
        // 替换所有出现的placeholder
        content = content.replace(
          new RegExp(placeholder, 'g'),
          actualImageData
        );
      });

      console.log(`✅ 已嵌入 ${keyFigures.length} 张图片`);

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);

      console.log('\n' + '='.repeat(60));
      console.log(`✅ 混合分析完成！耗时: ${duration}秒`);
      console.log(`📊 分析页数: ${pdfResult.images.length} 页`);
      console.log(`🖼️  关键图表: ${keyFigures.length} 个`);
      console.log(`📝 文章字数: ${content.length} 字`);
      console.log('='.repeat(60));

      return {
        content,
        keyFigures,
        analysisResults,
        metadata: {
          pagesAnalyzed: pdfResult.images.length,
          figuresFound: keyFigures.length,
          duration: duration,
          mode: mode,
          contentLength: content.length
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
   * 构建降级分析Prompt（纯文字，无图片）
   */
  buildFallbackAnalysisPrompt(paper) {
    return `你是一位资深的AI研究专家，请基于论文的标题和摘要，撰写一篇2000-3000字的高质量论文解读：

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 论文基本信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**标题**: ${paper.title}
**作者**: ${paper.authors ? paper.authors.join(', ') : '未知'}
**发表时间**: ${paper.publishedAt || paper.published || '未知'}
**会议/期刊**: ${paper.conference || '未知'}
**论文摘要**:
${paper.abstract || paper.summary || '暂无摘要'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 写作要求
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **文章结构** (必须包含以下部分):
   - 📌 核心要点速览 (3-5点，每点一句话)
   - 🎯 研究背景与动机
   - 💡 核心创新点详解
   - 🔬 技术方法说明
   - 📊 实验结果分析
   - 💭 个人评价与展望

2. **内容深度**:
   - 深入浅出，专业但易懂
   - 重点解释核心创新点
   - 分析技术优势和局限性
   - 讨论实际应用价值

3. **数学公式格式** (⚠️ 非常重要):
   - 行内公式: 使用单个美元符号包裹 \`$公式$\`
   - 块级公式: 使用双美元符号独立成行
     \`\`\`
     $$
     公式内容
     $$
     \`\`\`
   - 示例:
     * 行内: "损失函数定义为 $L = \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2$"
     * 块级:
       $$
       \\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V
       $$

4. **Markdown格式要求**:
   - 使用 # 二级标题 (##)
   - 列表使用 - 或 1. 
   - 重点内容使用 **加粗**
   - 代码/公式使用行内代码格式 \`code\`
   - 表格使用标准Markdown格式

5. **特别注意**:
   ⚠️ 由于PDF图片提取失败，本文为纯文字解读
   ⚠️ 请在文章开头注明"注：本文基于论文摘要生成，不含论文图表"
   ⚠️ 尽可能详细地描述方法和结果，弥补无图表的缺憾

请现在开始撰写，确保公式格式正确、内容深入、排版美观！`;
  }

  /**
   * 构建深度分析Prompt
   */
  buildDeepAnalysisPrompt(paper, analysisResults, keyFigures, styleConfig = null) {
    // 获取随机风格（如果未提供）
    if (!styleConfig) {
      styleConfig = this.getRandomStyle();
    }
    
    const { style, format } = styleConfig;
    
    let prompt = `你是一位资深的AI研究专家，擅长撰写深入浅出的技术解读文章。

🎨 本次解读风格: ${style.name}
- 语调: ${style.tone}
- 结构: ${style.structure}
- 语言: ${style.language}

📋 本次解读格式: ${format.name}
- 章节结构: ${format.sections.join(' → ')}
- 写作重点: ${format.emphasis}

请严格按照以上风格和格式，基于以下信息，撰写一篇3000-5000字的高质量论文深度解读：

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 论文基本信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**标题**: ${paper.title}
**作者**: ${paper.authors ? paper.authors.join(', ') : '未知'}
**摘要**: ${paper.abstract || paper.summary || '（详见PDF内容分析）'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 PDF完整内容分析（已通过AI视觉模型逐页分析）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    // 添加每一页的详细分析结果
    analysisResults.forEach((analysis, index) => {
      const pageNum = index + 1;
      const depth = analysis.technicalDepth || 'medium';
      const hasCore = analysis.containsCoreTech ? ' ⭐核心' : '';
      
      prompt += `### 第${pageNum}页 - ${analysis.pageType || '内容页'}${hasCore} [技术深度: ${depth}]\n\n`;
      
      // 如果有图表，优先显示图表信息
      if (analysis.hasImportantFigure) {
        if (analysis.figureTitle) {
          prompt += `📊 **图表**: ${analysis.figureTitle}\n`;
        }
        if (analysis.figureType) {
          prompt += `🏷️ **类型**: ${analysis.figureType}\n`;
        }
        if (analysis.figureDescription) {
          prompt += `\n💡 **图表详细说明**:\n${analysis.figureDescription}\n`;
        }
        prompt += '\n';
      }
      
      // 添加关键技术点
      if (analysis.keyPoints && analysis.keyPoints.length > 0) {
        prompt += `**关键技术信息**:\n`;
        analysis.keyPoints.forEach(point => {
          prompt += `- ${point}\n`;
        });
        prompt += '\n';
      }
      
      // 如果没有结构化信息，使用原始分析
      if (!analysis.keyPoints || analysis.keyPoints.length === 0) {
        if (analysis.rawAnalysis) {
          prompt += `${analysis.rawAnalysis}\n`;
        }
      }
      
      prompt += '\n---\n\n';
    });

    // 添加关键图表的详细信息
    if (keyFigures.length > 0) {
      prompt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      prompt += `🖼️ 关键图表详解（${keyFigures.length}个）\n`;
      prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      keyFigures.forEach((figure, index) => {
        const figNum = index + 1;
        prompt += `**【图${figNum}】${figure.figureType}** (PDF第${figure.pageNumber}页)\n\n`;
        prompt += `${figure.description}\n\n`;
        
        // 提供图片的引用格式（placeholder将被替换为完整的data URI）
        prompt += `**在文章中请使用**: \`![${figure.figureType}](FIGURE_${figNum}_PLACEHOLDER)\`\n\n`;
        prompt += `---\n\n`;
      });
    }

    prompt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✍️ 文章撰写要求
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

请按以下结构撰写一篇**深度且专业**的论文解读文章：

## 1️⃣ 研究背景与动机 (500-600字)

**必须包含**:
- 当前技术领域的发展现状（引用具体数据/案例）
- 存在的核心问题和技术瓶颈（至少3个）
- 为什么需要这项研究（技术必要性和实际需求）
- 相关工作的局限性对比
- 本研究的切入点和创新之处

## 2️⃣ 核心技术创新 (800-1000字)

**必须包含**:
- 主要技术创新点的**深度剖析**（不少于3个创新点）
- 每个创新点的**技术原理**和**与传统方法的对比**
- 创新点之间的**协同关系**
${keyFigures.find(f => f.figureType && (
  f.figureType.includes('架构') || 
  f.figureType.includes('模型') ||
  f.figureType.includes('结构') ||
  f.figureType.toLowerCase().includes('architecture') ||
  f.figureType.toLowerCase().includes('model')
)) ? 
`- **图片嵌入要求**：
  * 在介绍完核心创新点的文字说明后
  * 立即插入模型架构图
  * 图片后紧跟200-300字的架构图解读
  * 解读要点：各模块功能、数据流向、创新设计\n` : ''}
- 使用类比或比喻帮助理解复杂概念

**示例代码块**（如果适用）:
\`\`\`python
# 关键算法的伪代码实现
# 必须注释清楚
\`\`\`

## 3️⃣ 技术方法详解 (900-1200字)

**必须包含**:
- **完整的技术流程**（从输入到输出）
- **关键算法的逐步拆解**（使用数学公式 $$公式$$）
- **技术细节的深度剖析**（至少覆盖5个技术要点）
${keyFigures.find(f => f.figureType && (
  f.figureType.includes('流程') || 
  f.figureType.includes('算法') ||
  f.figureType.includes('步骤') ||
  f.figureType.toLowerCase().includes('flow') ||
  f.figureType.toLowerCase().includes('pipeline')
)) ? 
`- **图片嵌入要求**：
  * 在描述完技术流程的文字说明后
  * 立即插入算法流程图/流程图
  * 图片后紧跟200-300字的流程图解读
  * 解读要点：逐步说明每个环节、数据变换、关键步骤\n` : ''}
- **参数设置**和**超参数调优策略**
- **实现难点**和**解决方案**
- 与baseline方法的**技术对比表格**

**对比表格示例**:
| 方法 | 特点1 | 特点2 | 优势 | 劣势 |
|------|-------|-------|------|------|
| 传统方法 | ... | ... | ... | ... |
| 本文方法 | ... | ... | ... | ... |

## 4️⃣ 实验设计与结果分析 (700-900字)

**必须包含**:
- **实验设置**：数据集、评估指标、对比基线
- **消融实验**：验证各个组件的有效性（表格展示）
- **性能对比**：与SOTA方法的详细对比（至少3个指标）
${keyFigures.find(f => f.figureType && (
  f.figureType.includes('实验') || 
  f.figureType.includes('结果') ||
  f.figureType.includes('性能') ||
  f.figureType.toLowerCase().includes('result') ||
  f.figureType.toLowerCase().includes('performance')
)) ? 
`- **图片嵌入要求**：
  * 在说明实验设置和对比方法后
  * 立即插入实验结果图/性能对比图
  * 图片后紧跟200-300字的结果图解读
  * 解读要点：数据趋势、性能提升幅度、关键指标对比、异常值分析\n` : ''}
- **结果分析**：为什么能达到这样的效果？
- **可视化案例**：展示具体的预测/生成结果

**性能对比表**:
| 模型 | 指标1 | 指标2 | 指标3 | 参数量 | 推理速度 |
|------|-------|-------|-------|--------|----------|
| ... | ... | ... | ... | ... | ... |

## 5️⃣ 深度技术洞察 (400-500字)

**必须包含**:
- **方法的优势**：为什么有效？理论支撑是什么？
- **适用场景**：最适合哪些具体应用？（至少5个场景）
- **局限性分析**：存在哪些不足？（诚实评价）
- **改进方向**：如何进一步优化？
- **工程化考量**：实际部署的挑战和建议

## 6️⃣ 行业影响与应用前景 (300-400字)

**必须包含**:
- **短期应用**（1-2年内）：具体的落地场景
- **中期影响**（3-5年）：可能改变的技术范式
- **长期价值**：对领域的深远影响
- **商业化潜力**：市场机会分析

## 7️⃣ 总结与评价 (300-400字)

**必须包含**:
- 论文的**核心贡献总结**（3-5条）
- **技术创新的价值评估**（★★★★★ 评分）
- **推荐阅读人群**
- **学习建议**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 重要写作要求
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **深度优先**：
   - 不要泛泛而谈，要有技术深度
   - 每个技术点都要展开详细说明
   - 使用数学公式、代码、图表辅助说明

2. **图文并茂（核心要求）**：
   
   **图片嵌入原则**（参考腾讯元宝深度阅读模式）：
   - **必须**将所有关键图表（${keyFigures.length}张）嵌入到**对应的技术说明段落中**
   - **不要**把所有图片堆在一起，而要**分散嵌入**到相关章节
   - 图片格式：![图表描述](FIGURE_X_PLACEHOLDER)
   
   **嵌入时机**（非常重要）：
   - 在说明某个技术点/方法/结果**之后**，立即插入对应的图片
   - 图片前后必须空行，单独成段
   - 图片之后跟200-300字的**图片解读段落**
   
   **图片解读段落必须包含**：
   - "图中展示了..." 开头说明图片内容
   - 解读图中的关键模块/组件/数据
   - 指出图中的亮点和重要细节
   - 与前文的技术说明相呼应
   
   **示例格式**：
   \`\`\`markdown
   ...（技术说明文字）...
   
   ![Transformer架构图](FIGURE_1_PLACEHOLDER)
   
   图中展示了完整的Transformer模型架构。可以看到，模型分为编码器和解码器两部分...（200-300字详细解读）
   
   ...（继续后续内容）...
   \`\`\`

3. **专业但易懂**：
   - 使用类比和例子帮助理解
   - 复杂概念要拆解说明
   - 避免空洞的形容词

4. **Markdown和LaTeX格式严格要求** (⚠️ 非常重要):
   
   **数学公式规范**：
   - 行内公式: 使用单个美元符号包裹 \`$公式$\`
     * 示例: "损失函数为 $L = \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2$"
   - 块级公式: 使用双美元符号独立成行，前后必须空行
     \`\`\`
     $$
     \\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V
     $$
     \`\`\`
   - LaTeX符号必须使用双反斜杠转义: \\\\alpha, \\\\beta, \\\\sum, \\\\int
   
   **Markdown排版规范**：
   - 标题：使用 ## 和 ### 层级，标题前后空行
   - 列表：每项前空行，内容详实
   - 表格：必须对齐，前后空行
   - 代码块：使用三个反引号加语言名
   - 段落：段与段之间空一行

5. **基于真实内容**：
   - 严格基于上面提供的PDF分析结果
   - 不要编造数据和结论
   - 引用原文的关键信息

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

现在，请开始撰写这篇深度技术解读文章。记住：
- ✅ 必须深入详细（3000-4000字）
- ✅ 必须嵌入所有关键图表
- ✅ 必须有技术深度
- ✅ 必须易于理解

请直接输出Markdown格式的完整文章：`;

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

