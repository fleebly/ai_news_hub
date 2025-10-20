const axios = require('axios');
const NodeCache = require('node-cache');
const aliyunBailianService = require('./aliyunBailianService');
const arxivService = require('./arxivService');
const Review = require('../models/Review');

// 缓存搜索结果（30分钟）
const cache = new NodeCache({ stdTTL: 1800 });

/**
 * AI论文综述服务
 * 从多个来源搜索并生成专业综述文章
 */
class ReviewService {
  constructor() {
    this.maxResultsPerSource = 15; // 每个来源最多获取的结果数
  }

  /**
   * 生成综述文章（主入口）
   * @param {Array<string>} keywords - 关键词列表
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Object>} - 综述结果
   */
  async generateReview(keywords, progressCallback = () => {}) {
    const startTime = Date.now();
    
    try {
      progressCallback(5, '🔍 开始搜索相关资料...');
      
      // 1. 从多个来源搜索
      const searchResults = await this.searchMultipleSources(keywords, progressCallback);
      
      progressCallback(40, '📊 整理搜索结果...');
      
      // 2. 处理和筛选结果
      const processedResults = this.processSearchResults(searchResults);
      
      progressCallback(50, '🤖 AI生成综述中...');
      
      // 3. 生成综述文章
      const reviewContent = await this.generateReviewContent(keywords, processedResults, progressCallback);
      
      progressCallback(90, '💾 保存综述...');
      
      // 4. 保存到数据库
      const review = await this.saveReview({
        keywords,
        ...reviewContent,
        references: processedResults.references,
        sourcesCount: processedResults.sourcesCount,
        metadata: {
          wordCount: reviewContent.content.length,
          referenceCount: processedResults.references.length,
          sectionCount: this.countSections(reviewContent.content),
          generationTime: Date.now() - startTime,
          modelUsed: 'qwen3-max'
        }
      });
      
      progressCallback(100, '✅ 综述生成完成！');
      
      return review;
      
    } catch (error) {
      console.error('❌ 综述生成失败:', error);
      throw error;
    }
  }

  /**
   * 从多个来源搜索
   * @param {Array<string>} keywords
   * @param {Function} progressCallback
   * @returns {Promise<Object>}
   */
  async searchMultipleSources(keywords, progressCallback) {
    const searchPromises = [];
    
    // 1. arXiv搜索
    progressCallback(10, '📚 搜索arXiv论文...');
    searchPromises.push(
      this.searchArxiv(keywords).catch(err => {
        console.warn('arXiv搜索失败:', err.message);
        return [];
      })
    );
    
    // 2. 知乎搜索
    progressCallback(15, '💡 搜索知乎文章...');
    searchPromises.push(
      this.searchZhihu(keywords).catch(err => {
        console.warn('知乎搜索失败:', err.message);
        return [];
      })
    );
    
    // 3. 博客搜索
    progressCallback(20, '📝 搜索技术博客...');
    searchPromises.push(
      this.searchBlogs(keywords).catch(err => {
        console.warn('博客搜索失败:', err.message);
        return [];
      })
    );
    
    // 4. 论坛搜索
    progressCallback(25, '💬 搜索技术论坛...');
    searchPromises.push(
      this.searchForums(keywords).catch(err => {
        console.warn('论坛搜索失败:', err.message);
        return [];
      })
    );
    
    const results = await Promise.all(searchPromises);
    
    return {
      arxiv: results[0] || [],
      zhihu: results[1] || [],
      blogs: results[2] || [],
      forums: results[3] || []
    };
  }

  /**
   * 搜索arXiv
   * @param {Array<string>} keywords
   * @returns {Promise<Array>}
   */
  async searchArxiv(keywords) {
    const keywordStr = keywords.join(' ');
    const cacheKey = `arxiv_${keywordStr}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    
    try {
      // 使用现有的arxivService
      const papers = await arxivService.searchArxivPapersAdvanced({
        keywords: keywordStr,
        maxResults: this.maxResultsPerSource,
        sortBy: 'relevance'
      });
      
      const results = papers.map(paper => ({
        id: paper.arxivId,
        title: paper.title,
        authors: paper.authors,
        source: 'arXiv',
        url: paper.arxivUrl || `https://arxiv.org/abs/${paper.arxivId}`,
        publishedAt: paper.publishedAt,
        summary: paper.abstract,
        categories: paper.categories || []
      }));
      
      cache.set(cacheKey, results);
      console.log(`✅ arXiv搜索: ${results.length} 篇论文`);
      return results;
      
    } catch (error) {
      console.error('arXiv搜索失败:', error.message);
      return [];
    }
  }

  /**
   * 搜索知乎（模拟实现）
   * @param {Array<string>} keywords
   * @returns {Promise<Array>}
   */
  async searchZhihu(keywords) {
    const keywordStr = keywords.join(' ');
    const cacheKey = `zhihu_${keywordStr}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    
    try {
      // 注意：实际实现需要知乎API或爬虫
      // 这里提供模拟实现框架
      console.log('💡 知乎搜索（模拟）:', keywordStr);
      
      const mockResults = [
        {
          id: 'zhihu_1',
          title: `${keywords[0]}技术深度解析`,
          authors: ['知乎用户'],
          source: '知乎',
          url: 'https://zhihu.com/question/example',
          publishedAt: new Date().toISOString().split('T')[0],
          summary: `关于${keywords[0]}的知乎高质量回答...`
        }
      ];
      
      cache.set(cacheKey, mockResults);
      console.log(`✅ 知乎搜索: ${mockResults.length} 篇文章`);
      return mockResults;
      
    } catch (error) {
      console.error('知乎搜索失败:', error.message);
      return [];
    }
  }

  /**
   * 搜索技术博客
   * @param {Array<string>} keywords
   * @returns {Promise<Array>}
   */
  async searchBlogs(keywords) {
    const keywordStr = keywords.join(' ');
    const cacheKey = `blogs_${keywordStr}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    
    try {
      // 可以集成：CSDN、掘金、Medium等
      console.log('📝 博客搜索（模拟）:', keywordStr);
      
      const mockResults = [
        {
          id: 'blog_1',
          title: `${keywords[0]}实战指南`,
          authors: ['技术博主'],
          source: 'CSDN',
          url: 'https://blog.csdn.net/example',
          publishedAt: new Date().toISOString().split('T')[0],
          summary: `${keywords[0]}的实战经验分享...`
        }
      ];
      
      cache.set(cacheKey, mockResults);
      console.log(`✅ 博客搜索: ${mockResults.length} 篇文章`);
      return mockResults;
      
    } catch (error) {
      console.error('博客搜索失败:', error.message);
      return [];
    }
  }

  /**
   * 搜索技术论坛
   * @param {Array<string>} keywords
   * @returns {Promise<Array>}
   */
  async searchForums(keywords) {
    const keywordStr = keywords.join(' ');
    const cacheKey = `forums_${keywordStr}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    
    try {
      // 可以集成：Stack Overflow、GitHub Discussions、Reddit等
      console.log('💬 论坛搜索（模拟）:', keywordStr);
      
      const mockResults = [
        {
          id: 'forum_1',
          title: `${keywords[0]} Discussion`,
          authors: ['Community'],
          source: 'Stack Overflow',
          url: 'https://stackoverflow.com/questions/example',
          publishedAt: new Date().toISOString().split('T')[0],
          summary: `Community discussion about ${keywords[0]}...`
        }
      ];
      
      cache.set(cacheKey, mockResults);
      console.log(`✅ 论坛搜索: ${mockResults.length} 篇讨论`);
      return mockResults;
      
    } catch (error) {
      console.error('论坛搜索失败:', error.message);
      return [];
    }
  }

  /**
   * 处理搜索结果
   * @param {Object} searchResults
   * @returns {Object}
   */
  processSearchResults(searchResults) {
    const allResults = [];
    const sourcesCount = {
      arxiv: 0,
      zhihu: 0,
      blog: 0,
      forum: 0,
      other: 0
    };
    
    // 合并所有来源
    if (searchResults.arxiv) {
      allResults.push(...searchResults.arxiv);
      sourcesCount.arxiv = searchResults.arxiv.length;
    }
    if (searchResults.zhihu) {
      allResults.push(...searchResults.zhihu);
      sourcesCount.zhihu = searchResults.zhihu.length;
    }
    if (searchResults.blogs) {
      allResults.push(...searchResults.blogs);
      sourcesCount.blog = searchResults.blogs.length;
    }
    if (searchResults.forums) {
      allResults.push(...searchResults.forums);
      sourcesCount.forum = searchResults.forums.length;
    }
    
    console.log(`📊 搜索结果统计:`, sourcesCount);
    console.log(`📚 总计: ${allResults.length} 篇资料`);
    
    return {
      references: allResults,
      sourcesCount
    };
  }

  /**
   * 生成综述内容
   * @param {Array<string>} keywords
   * @param {Object} processedResults
   * @param {Function} progressCallback
   * @returns {Promise<Object>}
   */
  async generateReviewContent(keywords, processedResults, progressCallback) {
    const { references } = processedResults;
    
    // 构建提示词
    const prompt = this.buildReviewPrompt(keywords, references);
    
    progressCallback(60, '🤖 AI分析资料中...');
    
    try {
      // 调用AI生成综述
      const response = await aliyunBailianService.chat(prompt, {
        temperature: 0.7,
        maxTokens: 8000
      });
      
      progressCallback(85, '📝 格式化综述...');
      
      // 解析AI生成的内容
      const parsed = this.parseReviewResponse(response, keywords, references);
      
      return parsed;
      
    } catch (error) {
      console.error('AI生成综述失败:', error);
      throw new Error('综述生成失败: ' + error.message);
    }
  }

  /**
   * 构建综述提示词
   * @param {Array<string>} keywords
   * @param {Array} references
   * @returns {string}
   */
  buildReviewPrompt(keywords, references) {
    const keywordStr = keywords.join('、');
    
    // 格式化参考文献
    const referencesText = references.map((ref, index) => {
      return `[${index + 1}] ${ref.title}\n   作者: ${ref.authors.join(', ')}\n   来源: ${ref.source}\n   摘要: ${ref.summary.slice(0, 200)}...\n   链接: ${ref.url}`;
    }).join('\n\n');
    
    return `你是一位资深的AI技术研究专家和技术写作大师。请基于以下资料，撰写一篇关于「${keywordStr}」的**专业技术综述文章**。

## 📚 参考资料（共${references.length}篇）

${referencesText}

## 📝 写作要求

### 文章结构
请严格按照以下结构组织文章：

1. **摘要（Abstract）**
   - 200-300字
   - 概括研究现状、核心技术、应用前景

2. **引言（Introduction）**
   - 研究背景和意义
   - 问题定义
   - 本文组织结构

3. **核心技术综述**
   - 技术原理与方法
   - 关键技术点
   - 技术演进路线
   - 各方法的对比分析

4. **应用场景与案例**
   - 典型应用场景
   - 成功案例分析
   - 效果评估

5. **挑战与未来方向**
   - 当前面临的挑战
   - 未来研究方向
   - 技术趋势预测

6. **总结（Conclusion）**
   - 核心观点总结
   - 技术价值评估
   - 展望

7. **参考文献（References）**
   - 列出所有引用的文献
   - 按照 [序号] 格式标注

### 写作风格
- ✅ 专业、严谨、客观
- ✅ 逻辑清晰，层次分明
- ✅ 使用Markdown格式
- ✅ 适当使用表格、列表增强可读性
- ✅ 关键概念用**粗体**强调
- ✅ 重要段落使用 > 引用格式
- ✅ 技术术语首次出现时提供简要解释

### 引用规范
- 必须在文中使用 [1]、[2] 等数字标注引用来源
- 每个重要观点都要标注出处
- 参考文献部分要完整列出所有引用

### 内容要求
- 字数：5000-8000字
- 深度：技术原理要讲透彻
- 广度：覆盖技术的各个方面
- 实用性：包含实际应用案例
- 前瞻性：分析未来发展趋势

## 输出格式

请按以下JSON格式输出：

\`\`\`json
{
  "title": "文章标题",
  "abstract": "摘要内容",
  "content": "完整的Markdown格式文章内容（包含所有章节和参考文献）"
}
\`\`\`

**重要**: 
1. 必须在文中标注引用 [1]、[2]等
2. 文章末尾必须包含完整的参考文献列表
3. 参考文献格式: [序号] 标题. 作者. 来源. 链接
4. 确保JSON格式正确，content中的换行使用\\n

现在开始撰写这篇专业的技术综述文章。`;
  }

  /**
   * 解析AI响应
   * @param {string} response
   * @param {Array<string>} keywords
   * @param {Array} references
   * @returns {Object}
   */
  parseReviewResponse(response, keywords, references) {
    try {
      // 尝试提取JSON
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/\{[\s\S]*"title"[\s\S]*"content"[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        // 确保参考文献部分正确格式化
        if (!parsed.content.includes('## 参考文献') && !parsed.content.includes('## References')) {
          parsed.content += '\n\n## 参考文献\n\n' + this.formatReferences(references);
        }
        
        return {
          title: parsed.title || `${keywords.join('、')}技术综述`,
          abstract: parsed.abstract || '本文对相关技术进行了全面综述...',
          content: parsed.content
        };
      }
      
      // 如果没有JSON格式，直接使用响应内容
      return {
        title: `${keywords.join('、')}技术综述`,
        abstract: response.slice(0, 300),
        content: response + '\n\n## 参考文献\n\n' + this.formatReferences(references)
      };
      
    } catch (error) {
      console.error('解析AI响应失败:', error);
      throw new Error('综述内容解析失败');
    }
  }

  /**
   * 格式化参考文献
   * @param {Array} references
   * @returns {string}
   */
  formatReferences(references) {
    return references.map((ref, index) => {
      const authors = ref.authors.join(', ');
      return `[${index + 1}] ${ref.title}. ${authors}. ${ref.source}. [链接](${ref.url})`;
    }).join('\n\n');
  }

  /**
   * 保存综述到数据库
   * @param {Object} reviewData
   * @returns {Promise<Object>}
   */
  async saveReview(reviewData) {
    try {
      const review = new Review({
        reviewId: `review_${Date.now()}`,
        ...reviewData,
        status: 'completed'
      });
      
      await review.save();
      console.log('✅ 综述已保存到数据库');
      
      return review;
      
    } catch (error) {
      console.error('保存综述失败:', error);
      throw error;
    }
  }

  /**
   * 统计章节数量
   * @param {string} content
   * @returns {number}
   */
  countSections(content) {
    const matches = content.match(/^##\s+/gm);
    return matches ? matches.length : 0;
  }

  /**
   * 获取综述列表
   * @param {Object} options
   * @returns {Promise<Array>}
   */
  async getReviews(options = {}) {
    const { limit = 20, skip = 0, keywords } = options;
    
    const query = { status: 'completed' };
    if (keywords && keywords.length > 0) {
      query.keywords = { $in: keywords };
    }
    
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return reviews;
  }

  /**
   * 根据ID获取综述
   * @param {string} reviewId
   * @returns {Promise<Object>}
   */
  async getReviewById(reviewId) {
    const review = await Review.findOne({ reviewId });
    if (review) {
      await review.incrementViews();
    }
    return review;
  }
}

module.exports = new ReviewService();

