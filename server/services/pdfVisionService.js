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
        content: '你是一位资深的AI论文分析专家，擅长快速提取论文中的关键技术信息和图表内容。请仔细观察图片，进行深度分析。'
      },
      {
        role: 'user',
        content: `这是一篇AI论文PDF的第${pageNumber}页图片。请你详细分析这一页的内容：

📋 **分析任务**：

1. **页面类型识别**：
   - 这是论文的哪个部分？（标题页/摘要/引言/相关工作/方法/实验/结论/参考文献等）
   
2. **图表检测**（重要！）：
   - 是否包含图表（架构图/流程图/算法图/实验结果图/对比图/公式等）？
   - 如果有图表，它是什么类型？
   
3. **图表详细描述**（如果有图表，这是最重要的部分！）：
   - 图表的标题和编号
   - 图表展示了什么内容？
   - 图表的关键元素（模块/箭头/数据/趋势等）
   - 图表中的文字信息
   - 图表要表达的核心观点
   - 用至少150字详细描述
   
4. **文字内容提取**：
   - 提取这一页的关键技术信息（算法/公式/方法/结论等）
   - 至少提取3-5个关键点

5. **技术深度评估**：
   - 这一页的技术含量（高/中/低）
   - 是否包含核心创新点

🎯 **输出格式**（JSON）：

\`\`\`json
{
  "pageType": "页面类型",
  "hasImportantFigure": true/false,
  "figureType": "具体的图表类型（如：模型架构图、算法流程图、实验结果对比图、注意力机制示意图等）",
  "figureTitle": "图表标题和编号（如：Figure 1: Model Architecture）",
  "figureDescription": "详细的图表描述（150-300字，包括：1)图表整体结构 2)关键模块和组件 3)数据流向 4)重要标注 5)核心观点）",
  "keyPoints": [
    "关键技术点1（具体、详细）",
    "关键技术点2（具体、详细）",
    "关键技术点3（具体、详细）",
    "..."
  ],
  "technicalDepth": "high/medium/low",
  "containsCoreTech": true/false
}
\`\`\`

⚠️ **重要提示**：
- 如果页面中有图表，**必须**给出详细描述（至少150字）
- 图表描述要专业且详细，包含所有可见的关键信息
- 关键点要具体，不要泛泛而谈
- 严格按照JSON格式输出

现在开始分析：`
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
          maxTokens: 3000  // 增加token限制，支持更详细的分析
        }
      );

      // 尝试解析JSON
      try {
        // 先尝试提取JSON代码块
        let jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/);
        if (!jsonMatch) {
          // 如果没有代码块，直接匹配JSON对象
          jsonMatch = result.match(/\{[\s\S]*\}/);
        }
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const parsed = JSON.parse(jsonStr);
          
          // 确保所有必要字段都存在
          return {
            pageType: parsed.pageType || 'unknown',
            hasImportantFigure: parsed.hasImportantFigure || false,
            figureType: parsed.figureType || '',
            figureTitle: parsed.figureTitle || '',
            figureDescription: parsed.figureDescription || '',
            keyPoints: parsed.keyPoints || [],
            technicalDepth: parsed.technicalDepth || 'medium',
            containsCoreTech: parsed.containsCoreTech || false,
            rawAnalysis: result
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
        rawAnalysis: result,
        keyPoints: []
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
        const description = analysis.figureDescription || analysis.rawAnalysis || '重要图表';
        
        // 只保留描述足够详细的图表（至少80字）
        if (description.length >= 80) {
          keyFigures.push({
            pageNumber: index + 1,
            imageBase64: images[index],
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
   * 构建深度分析Prompt
   */
  buildDeepAnalysisPrompt(paper, analysisResults, keyFigures) {
    let prompt = `你是一位资深的AI研究专家，擅长撰写深入浅出的技术解读文章。请基于以下信息，撰写一篇3000-4000字的高质量论文深度解读：

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
        
        // 提供图片的引用格式
        prompt += `**在文章中请使用**: \`![${figure.figureType}](data:image/jpeg;base64,FIGURE_${figNum}_PLACEHOLDER)\`\n\n`;
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
`- **关键**：在此处嵌入模型架构图，使用上面提供的图片引用格式
- 配图说明：详细解读架构图中的每个模块和数据流\n` : ''}
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
`- **关键**：在此处嵌入算法流程图，使用上面提供的图片引用格式
- 配图说明：逐步解读流程图中的每个环节\n` : ''}
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
`- **关键**：在此处嵌入实验结果图，使用上面提供的图片引用格式
- 配图说明：详细分析图表中的数据趋势和关键指标\n` : ''}
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

2. **图文并茂**：
   - **必须**在合适位置嵌入上面提供的所有关键图表
   - 每张图都要有详细的文字说明（至少100字）
   - 图片使用提供的格式：\`![描述](data:image/jpeg;base64,FIGURE_X_PLACEHOLDER)\`

3. **专业但易懂**：
   - 使用类比和例子帮助理解
   - 复杂概念要拆解说明
   - 避免空洞的形容词

4. **Markdown格式**：
   - 使用标题层级（##、###）
   - 使用列表、表格、代码块
   - 数学公式用 $$公式$$
   - 行内公式用 \`$公式$\`

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

