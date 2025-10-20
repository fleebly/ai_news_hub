/**
 * 论文增强分析服务
 * 整合PDF视觉分析和多源检索，实现深度解读
 */
const aliyunBailianService = require('./aliyunBailianService');
const arxivService = require('./arxivService');
const pdfVisionService = require('./pdfVisionService');
const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

const searchCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

class PDFEnhancedAnalysisService {
  constructor() {
    this.textModel = process.env.ALIYUN_BAILIAN_TEXT_MODEL || 'qwen3-max';
  }

  /**
   * 从论文内容中提取核心Topic
   * @param {string} pdfUrl - PDF URL
   * @param {string} title - 论文标题
   * @param {string} abstract - 论文摘要
   * @returns {Promise<Array<string>>} - 核心主题列表
   */
  async extractCoreTopics(pdfUrl, title, abstract) {
    console.log('\n🔍 提取论文核心Topic...');
    
    const prompt = `你是一位资深的AI研究专家。请分析以下论文的标题和摘要，提取出3-5个核心技术主题/关键词。

论文标题: ${title}

论文摘要: ${abstract}

要求：
1. 提取具体的技术名词和概念
2. 优先提取可以搜索到相关资料的关键词
3. 包含主要算法、模型、方法名称

请以JSON数组格式返回：
\`\`\`json
["主题1", "主题2", "主题3"]
\`\`\``;

    try {
      // 将 prompt 转换为消息格式
      const messages = [
        { role: 'user', content: prompt }
      ];
      
      const response = await aliyunBailianService.chat(messages, {
        temperature: 0.5,
        maxTokens: 500
      });

      // 解析JSON
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/\[[\s\S]*?\]/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const topics = JSON.parse(jsonStr);
        console.log(`✅ 提取到${topics.length}个核心Topic:`, topics);
        return topics;
      }

      // 如果解析失败，从标题中提取
      console.log('⚠️  JSON解析失败，从标题中提取关键词');
      return this.extractTopicsFromTitle(title);

    } catch (error) {
      console.error('提取Topic失败:', error);
      return this.extractTopicsFromTitle(title);
    }
  }

  /**
   * 从标题中简单提取关键词
   */
  extractTopicsFromTitle(title) {
    // 简单的关键词提取逻辑
    const keywords = [];
    const commonTerms = ['transformer', 'bert', 'gpt', 'cnn', 'rnn', 'lstm', 'attention', 
                         'diffusion', 'gan', 'vae', 'rl', 'dpo', 'ppo', 'llm', 'vit'];
    
    const lowerTitle = title.toLowerCase();
    for (const term of commonTerms) {
      if (lowerTitle.includes(term)) {
        keywords.push(term.toUpperCase());
      }
    }
    
    return keywords.length > 0 ? keywords : [title.split(':')[0].trim()];
  }

  /**
   * 多源搜索相关资料
   * @param {Array<string>} topics - 核心主题
   * @returns {Promise<Object>} - 搜索结果
   */
  async searchMultiSource(topics) {
    console.log('\n🌐 开始多源搜索...');
    
    const results = {
      arxiv: [],
      openreview: [],
      zhihu: [],
      blogs: []
    };

    // 并行搜索
    await Promise.all([
      this.searchArxiv(topics).then(res => results.arxiv = res),
      this.searchOpenReview(topics).then(res => results.openreview = res),
      this.searchZhihu(topics).then(res => results.zhihu = res),
      this.searchBlogs(topics).then(res => results.blogs = res)
    ]);

    const totalResults = results.arxiv.length + results.openreview.length + 
                        results.zhihu.length + results.blogs.length;
    
    console.log(`✅ 多源搜索完成，共找到 ${totalResults} 条相关资料`);
    console.log(`   - arXiv: ${results.arxiv.length} 篇`);
    console.log(`   - OpenReview: ${results.openreview.length} 篇`);
    console.log(`   - 知乎: ${results.zhihu.length} 篇`);
    console.log(`   - 博客: ${results.blogs.length} 篇`);

    return results;
  }

  /**
   * 搜索arXiv相关论文
   */
  async searchArxiv(topics) {
    try {
      const keywords = topics.join(' ');
      const papers = await arxivService.searchArxivPapersAdvanced({
        keywords,
        maxResults: 10,
        sortBy: 'relevance',
        saveToDb: false
      });

      return papers.map(p => ({
        title: p.title,
        url: p.arxivUrl,
        authors: p.authors,
        abstract: p.abstract,
        publishedAt: p.publishedAt,
        source: 'arXiv'
      }));
    } catch (error) {
      console.error('arXiv搜索失败:', error.message);
      return [];
    }
  }

  /**
   * 搜索OpenReview论文
   */
  async searchOpenReview(topics) {
    try {
      const cacheKey = `openreview_${topics.join('_')}`;
      const cached = searchCache.get(cacheKey);
      if (cached) return cached;

      // OpenReview搜索API（模拟）
      // 实际使用时需要接入OpenReview API
      console.log('🔍 搜索OpenReview (模拟):', topics.join(', '));
      
      const results = [
        {
          title: `${topics[0]} 相关研究 - ICLR 2024`,
          url: 'https://openreview.net/forum?id=example1',
          authors: ['研究者A', '研究者B'],
          abstract: `关于${topics[0]}的深入研究...`,
          publishedAt: '2024-01-15',
          source: 'OpenReview'
        }
      ];

      searchCache.set(cacheKey, results);
      return results;

    } catch (error) {
      console.error('OpenReview搜索失败:', error.message);
      return [];
    }
  }

  /**
   * 搜索知乎文章
   */
  async searchZhihu(topics) {
    try {
      const cacheKey = `zhihu_${topics.join('_')}`;
      const cached = searchCache.get(cacheKey);
      if (cached) return cached;

      console.log('🔍 搜索知乎 (模拟):', topics.join(', '));
      
      // 知乎搜索（模拟）
      const results = [
        {
          title: `如何理解${topics[0]}？`,
          url: 'https://www.zhihu.com/question/example1',
          authors: ['知乎用户A'],
          abstract: `对${topics[0]}的通俗解释...`,
          publishedAt: '2024-01-10',
          source: '知乎'
        }
      ];

      searchCache.set(cacheKey, results);
      return results;

    } catch (error) {
      console.error('知乎搜索失败:', error.message);
      return [];
    }
  }

  /**
   * 搜索技术博客
   */
  async searchBlogs(topics) {
    try {
      const cacheKey = `blogs_${topics.join('_')}`;
      const cached = searchCache.get(cacheKey);
      if (cached) return cached;

      console.log('🔍 搜索技术博客 (模拟):', topics.join(', '));
      
      // 博客搜索（模拟）
      const results = [
        {
          title: `深入理解${topics[0]}原理`,
          url: 'https://blog.example.com/post1',
          authors: ['技术博主A'],
          abstract: `${topics[0]}的详细技术分析...`,
          publishedAt: '2023-12-20',
          source: 'Tech Blog'
        }
      ];

      searchCache.set(cacheKey, results);
      return results;

    } catch (error) {
      console.error('博客搜索失败:', error.message);
      return [];
    }
  }

  /**
   * 生成增强分析
   * @param {Object} paperInfo - 论文基本信息
   * @param {Object} searchResults - 搜索结果
   * @param {Function} sendProgress - 进度回调
   * @returns {Promise<string>} - 分析内容
   */
  async generateEnhancedAnalysis(paperInfo, searchResults, sendProgress) {
    console.log('\n🤖 生成增强分析...');
    sendProgress(60, '🤖 正在生成深度解读...', { stage: 'generate' });

    const prompt = this.buildEnhancedPrompt(paperInfo, searchResults);

    try {
      // 使用 chat 方法，传递正确的消息格式
      sendProgress(70, '🤖 AI正在生成深度长文（5000字+，预计2-5分钟）...', { stage: 'generate' });
      
      const messages = [
        { role: 'user', content: prompt }
      ];
      
      console.log(`📝 Prompt长度: ${prompt.length} 字符`);
      console.log(`⏰ 开始AI生成，请耐心等待...`);
      
      const startTime = Date.now();
      
      const fullContent = await Promise.race([
        aliyunBailianService.chat(messages, {
          model: this.textModel,
          temperature: 0.7,
          maxTokens: 20000  // 提升到20000，支持更长的深度解读（5000字+）
        }),
        // 15分钟超时保护（延长以支持更长内容生成）
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI生成超时（15分钟）')), 900000)
        )
      ]);

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`⏱️  AI生成耗时: ${elapsed}秒`);

      sendProgress(90, '🤖 深度解读生成完成...', { stage: 'generate' });

      console.log(`✅ 分析完成，共 ${fullContent.length} 字`);
      
      // 后处理：确保PDF图片被嵌入到文章中
      let enhancedContent = fullContent;
      
      if (paperInfo.visionAnalysis && paperInfo.visionAnalysis.croppedImageUrls && 
          paperInfo.visionAnalysis.croppedImageUrls.length > 0) {
        
        // 检查文章中是否已经包含了图片链接
        const hasImages = paperInfo.visionAnalysis.croppedImageUrls.some(url => 
          enhancedContent.includes(url)
        );
        
        // 如果AI没有自动嵌入图片，我们在文章末尾添加"论文图表"章节
        if (!hasImages) {
          console.log('⚠️  AI未自动嵌入图片，添加图表章节...');
          
          const figuresSection = '\n\n---\n\n## 📊 论文关键图表\n\n' +
            '以下是从论文中提取的关键图表，帮助更好地理解技术细节：\n\n' +
            paperInfo.visionAnalysis.keyFigures.map((fig, idx) => {
              const imageUrl = paperInfo.visionAnalysis.croppedImageUrls[idx];
              if (!imageUrl) return '';
              
              return `### 图 ${idx + 1}: ${fig.caption || '论文关键图表'}\n\n` +
                     `![${fig.caption || `图${idx + 1}`}](${imageUrl})\n\n` +
                     `${fig.analysis ? `**图表说明**: ${fig.analysis}\n\n` : ''}`;
            }).filter(Boolean).join('\n');
          
          enhancedContent += figuresSection;
          console.log(`✅ 已添加 ${paperInfo.visionAnalysis.croppedImageUrls.length} 张图表`);
        } else {
          console.log(`✅ AI已自动嵌入图片到文章中`);
        }
      }
      
      return enhancedContent;

    } catch (error) {
      console.error('生成分析失败:', error);
      
      // 提供更友好的错误信息
      if (error.message.includes('超时')) {
        throw new Error('AI生成超时（15分钟），论文过于复杂或资料过多。建议稍后重试或使用标准解读模式。');
      }
      
      throw error;
    }
  }

  /**
   * 构建增强分析提示词
   */
  buildEnhancedPrompt(paperInfo, searchResults) {
    const { title, abstract, topics, visionAnalysis } = paperInfo;

    // 格式化搜索结果
    const formatResults = (results, source) => {
      if (!results || results.length === 0) return '';
      
      return results.slice(0, 5).map((item, idx) => {
        return `### [${idx + 1}] ${item.title}\n来源: ${source}\n${item.abstract ? `摘要: ${item.abstract.slice(0, 200)}...\n` : ''}链接: ${item.url}\n`;
      }).join('\n');
    };

    const arxivSection = formatResults(searchResults.arxiv, 'arXiv');
    const openreviewSection = formatResults(searchResults.openreview, 'OpenReview');
    const zhihuSection = formatResults(searchResults.zhihu, '知乎');
    const blogSection = formatResults(searchResults.blogs, '技术博客');

    // 格式化PDF图表信息（包含图片URL）
    let figuresSection = '';
    let imageMarkdown = '';
    
    if (visionAnalysis && visionAnalysis.keyFigures && visionAnalysis.keyFigures.length > 0) {
      figuresSection = '\n## 论文关键图表\n\n' + 
        visionAnalysis.keyFigures.map((fig, idx) => {
          const imageUrl = visionAnalysis.croppedImageUrls?.[idx] || '';
          return `**图${idx + 1}**: ${fig.caption || '(未标注)'}\n${fig.analysis || ''}\n${imageUrl ? `图片URL: ${imageUrl}\n` : ''}`;
        }).join('\n');
      
      // 准备图片的Markdown格式（用于嵌入文章）
      imageMarkdown = visionAnalysis.keyFigures.map((fig, idx) => {
        const imageUrl = visionAnalysis.croppedImageUrls?.[idx] || '';
        if (!imageUrl) return '';
        return `![图${idx + 1}: ${fig.caption || '论文关键图表'}](${imageUrl})`;
      }).filter(Boolean).join('\n\n');
    }

    const prompt = `你是一位顶级的AI研究专家和技术作家，擅长深入浅出地解读前沿论文。

# 当前论文

**标题**: ${title}

**摘要**: ${abstract}

**核心主题**: ${topics.join(', ')}
${figuresSection}

---

# 相关资料（多源检索）

## arXiv相关论文
${arxivSection || '暂无'}

## OpenReview相关论文
${openreviewSection || '暂无'}

## 知乎深度文章
${zhihuSection || '暂无'}

## 技术博客
${blogSection || '暂无'}

---

# 任务要求

请基于当前论文和上述检索到的相关资料，撰写一篇**深度解读文章**，做到：

## 1. 知其然 - 理解核心内容
- 论文的核心贡献是什么？
- 提出了什么问题？如何解决的？
- 关键技术和方法是什么？

## 2. 知其所以然 - 理解深层原理
- 为什么这样设计？背后的动机是什么？
- 与现有方法相比有什么优势？
- 理论基础和数学原理是什么？

## 3. 引经据典 - 学术脉络
- 引用相关论文（使用[数字]标注）
- 说明本文在该领域的位置
- 梳理技术发展脉络

## 4. 博采众长 - 多角度分析
- 结合知乎、博客的通俗解释
- 对比不同观点和理解
- 提供多种视角

## 5. 举一反三 - 应用拓展
- 实际应用场景
- 可能的改进方向
- 对其他领域的启发

---

# 输出格式（严格遵守Markdown格式）

## 📝 论文概览

简明扼要地总结论文的核心内容（200字以内）

## 🎯 核心贡献

列出3-5个主要贡献点

## 🔬 技术深度解析

### 问题定义
论文要解决什么问题？

### 核心方法
详细解释主要技术方案

### 理论基础
背后的数学原理和理论支撑

### 关键创新
与现有方法的区别和优势

## 📚 学术脉络（引经据典）

引用相关论文，说明：
- 本文基于哪些前人工作
- 与同期工作的对比
- 在领域中的定位

## 💡 深度理解（知其所以然）

- 设计动机分析
- 为什么这样做有效？
- 潜在的局限性

## 🌐 多角度观点（博采众长）

结合知乎、博客等不同来源的见解：
- 学术视角
- 工程视角
- 初学者视角

## 🚀 应用与拓展（举一反三）

- 实际应用案例
- 可能的改进方向
- 对其他领域的启发
- 未来研究方向

## 📖 参考资料

列出所有引用的资料（包括arXiv、OpenReview、知乎、博客）

---

**重要提示**:
1. 使用Markdown格式
2. 公式使用LaTeX语法，行内公式用 $...$ ，独立公式用 $$...$$
3. 引用使用 [数字] 格式
4. 保持专业但易懂的风格
5. **总字数不少于5000字**，可根据论文复杂度和内容深度自由扩展，追求质量而非字数限制
6. 对于复杂论文，鼓励深入展开分析，充分利用所有检索到的参考资料
7. **重要**：如果论文关键图表中提供了图片URL，请在文章的适当位置使用Markdown图片语法 ![描述](URL) 来嵌入这些图片
8. 图片应该放在相关技术讲解的段落之后，帮助读者更好地理解内容`;

    return prompt;
  }

  /**
   * 完整的增强分析流程（整合PDF图表提取）
   * @param {string} pdfUrl - PDF URL
   * @param {string} title - 论文标题
   * @param {string} abstract - 论文摘要
   * @param {Function} sendProgress - 进度回调
   * @returns {Promise<Object>} - 分析结果
   */
  async analyzeWithEnhancement(pdfUrl, title, abstract, sendProgress) {
    try {
      sendProgress(0, '🚀 开始深度解读（含图表提取）...', { stage: 'init' });

      // 1. 提取核心Topic
      sendProgress(5, '🔍 提取核心主题...', { stage: 'extract_topics' });
      const topics = await this.extractCoreTopics(pdfUrl, title, abstract);

      // 2. 提取PDF图表（并行执行）
      sendProgress(10, '📄 提取PDF图表...', { stage: 'extract_figures' });
      let visionAnalysis = null;
      try {
        console.log('\n📄 开始PDF图表提取...');
        visionAnalysis = await pdfVisionService.hybridAnalysisWithProgress(
          pdfUrl,
          title,
          abstract || '',
          (progress, message, details) => {
            // 映射进度到10-40%范围
            const mappedProgress = 10 + (progress * 0.3);
            sendProgress(mappedProgress, `📄 ${message}`, { stage: 'extract_figures', ...details });
          }
        );
        console.log('✅ PDF图表提取完成');
      } catch (error) {
        console.warn('⚠️  PDF图表提取失败，将只使用文本分析:', error.message);
        // 继续执行，不中断流程
      }

      // 3. 多源搜索
      sendProgress(45, '🌐 联网搜索相关资料...', { stage: 'search' });
      const searchResults = await this.searchMultiSource(topics);

      // 4. 生成增强分析
      sendProgress(55, '🤖 AI整合所有资料...', { stage: 'generate' });
      const paperInfo = { 
        title, 
        abstract, 
        topics, 
        pdfUrl,
        visionAnalysis // 传入视觉分析结果
      };
      
      const content = await this.generateEnhancedAnalysis(paperInfo, searchResults, sendProgress);

      sendProgress(95, '✅ 分析完成，整理结果...', { stage: 'done' });

      return {
        content,
        topics,
        searchResults,
        visionAnalysis: visionAnalysis ? {
          hasImages: visionAnalysis.croppedImageUrls && visionAnalysis.croppedImageUrls.length > 0,
          imageCount: visionAnalysis.croppedImageUrls?.length || 0,
          keyFigures: visionAnalysis.keyFigures || []
        } : null,
        metadata: {
          totalSources: Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0),
          generatedAt: new Date().toISOString(),
          withPDFExtraction: !!visionAnalysis
        }
      };

    } catch (error) {
      console.error('❌ 增强分析失败:', error);
      throw error;
    }
  }
}

module.exports = new PDFEnhancedAnalysisService();

