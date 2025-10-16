const axios = require('axios');

/**
 * 阿里云百炼平台 AI 服务
 * 文档：https://help.aliyun.com/zh/model-studio/
 */

class AliyunBailianService {
  constructor() {
    this.apiKey = process.env.ALIYUN_BAILIAN_API_KEY;
    this.endpoint = process.env.ALIYUN_BAILIAN_ENDPOINT || 'https://dashscope.aliyuncs.com/api/v1';
    this.defaultModel = process.env.ALIYUN_BAILIAN_MODEL || 'qwen-turbo'; // qwen-turbo, qwen-plus, qwen-max
    this.enabled = !!this.apiKey;
    
    if (!this.enabled) {
      console.log('⚠️  阿里云百炼 API Key未配置，将使用模拟数据');
    } else {
      console.log('✅ 阿里云百炼服务已启用，模型:', this.defaultModel);
    }
  }

  /**
   * 调用阿里云百炼通义千问模型
   */
  async chat(messages, options = {}) {
    if (!this.enabled) {
      return this.getMockResponse(messages);
    }

    try {
      const response = await axios.post(
        `${this.endpoint}/services/aigc/text-generation/generation`,
        {
          model: options.model || this.defaultModel,
          input: {
            messages: messages
          },
          parameters: {
            max_tokens: options.maxTokens || 2000,
            temperature: options.temperature || 0.7,
            top_p: options.topP || 0.8,
            result_format: 'message'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 90000 // 90秒超时，给AI更多时间生成内容
        }
      );

      if (response.data.output && response.data.output.choices && response.data.output.choices.length > 0) {
        return response.data.output.choices[0].message.content;
      }

      throw new Error('无效的API响应格式');
    } catch (error) {
      console.error('阿里云百炼API调用失败:', error.message);
      
      // 如果是网络错误，返回模拟数据
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.log('⚠️  使用模拟数据代替');
        return this.getMockResponse(messages);
      }
      
      throw error;
    }
  }

  /**
   * 论文解读 - 生成摘要
   */
  async analyzePaper(paper, mode = 'summary') {
    const prompts = {
      summary: `请分析以下AI论文，生成一篇800-1000字的中文技术摘要博客：

论文标题：${paper.title}
论文摘要：${paper.abstract || paper.summary}
作者：${paper.authors ? paper.authors.join(', ') : '未知'}
发布时间：${paper.publishedAt || paper.published}

要求：
1. 用通俗易懂的语言解释核心创新点
2. 说明该研究解决了什么问题
3. 技术方法简介
4. 实验结果和性能指标
5. 应用前景分析
6. 使用Markdown格式，包含适当的标题和段落

请直接输出博客内容，不要包含"标题："等前缀。`,

      deep: `请对以下AI论文进行深度技术解读，生成一篇2000-3000字的图文并茂的专业分析文章：

论文标题：${paper.title}
论文摘要：${paper.abstract || paper.summary}
作者：${paper.authors ? paper.authors.join(', ') : '未知'}
发布时间：${paper.publishedAt || paper.published}

内容要求：
## 1. 研究背景（300字）
- 当前领域存在的问题
- 为什么需要这项研究
- 建议插入：![研究背景示意图](https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop)

## 2. 核心创新（500字）
- 本文的关键技术突破
- 与以往方法的本质区别
- 建议插入：![技术架构图](https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=400&fit=crop)

## 3. 方法详解（600字）
- 详细的技术方案
- 算法流程和关键步骤
- 使用代码块展示伪代码
- 建议插入：![方法流程图](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=400&fit=crop)

## 4. 实验结果（400字）
- 实验设置
- 性能对比表格
- 关键指标分析
- 建议插入：![实验结果对比](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop)

## 5. 应用前景（300字）
- 实际应用场景
- 工业界价值
- 建议插入：![应用场景示意](https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop)

格式要求：
1. 使用Markdown格式，层次分明
2. 每个大节后插入相关配图（使用Unsplash的高质量AI主题图片）
3. 适当使用引用块(>)突出重点
4. 使用代码块展示算法伪代码
5. 使用表格展示性能对比
6. 使用emoji图标点缀（💡📊🔬🚀等）
7. 文风专业但易读，面向AI从业者

请直接输出完整的图文文章，不要包含任何前缀说明。`,

      commentary: `请对以下AI论文撰写一篇观点评论文章（1000-1200字）：

论文标题：${paper.title}
论文摘要：${paper.abstract || paper.summary}
作者：${paper.authors ? paper.authors.join(', ') : '未知'}
发布时间：${paper.publishedAt || paper.published}

要求：
1. 对研究意义的个人见解
2. 技术趋势分析
3. 工业应用潜力评估
4. 可能的挑战和风险
5. 对AI发展的启示
6. 使用Markdown格式
7. 观点鲜明，有理有据

请直接输出评论文章。`
    };

    const messages = [
      {
        role: 'system',
        content: '你是一位资深的AI研究专家和技术博主，擅长将复杂的AI论文转化为易懂且有深度的技术文章。'
      },
      {
        role: 'user',
        content: prompts[mode] || prompts.summary
      }
    ];

    const content = await this.chat(messages, {
      maxTokens: mode === 'deep' ? 4000 : 2000, // 深度解读需要更多tokens
      temperature: 0.7
    });

    return {
      title: this.generateTitle(paper.title, mode),
      content: content,
      mode: mode,
      sourcePaper: {
        title: paper.title,
        link: paper.link || paper.pdf_url,
        authors: paper.authors,
        publishedAt: paper.publishedAt || paper.published
      },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 博客解读 - 生成总结或评论
   */
  async analyzeBlog(blog, mode = 'summary') {
    const prompts = {
      summary: `请阅读并总结以下AI技术博客，生成一篇800字左右的中文摘要：

标题：${blog.title}
作者：${blog.author}
原文摘要：${blog.summary}

要求：
1. 提取核心观点和技术要点
2. 用简洁的语言重新组织内容
3. 保留重要的技术细节
4. 使用Markdown格式

请直接输出摘要内容。`,

      commentary: `请对以下AI技术博客发表评论（1000字左右）：

标题：${blog.title}
作者：${blog.author}
原文摘要：${blog.summary}

要求：
1. 分析文章的技术价值
2. 提出自己的见解和补充
3. 讨论实践应用的可能性
4. 使用Markdown格式

请直接输出评论文章。`
    };

    const messages = [
      {
        role: 'system',
        content: '你是一位AI技术专家，擅长分析和评论技术博客。'
      },
      {
        role: 'user',
        content: prompts[mode] || prompts.summary
      }
    ];

    const content = await this.chat(messages);

    return {
      title: this.generateTitle(blog.title, mode),
      content: content,
      mode: mode,
      sourceBlog: {
        title: blog.title,
        link: blog.link,
        author: blog.author
      },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 批量解读论文
   */
  async analyzePapers(papers, mode = 'summary') {
    const results = [];
    
    for (const paper of papers) {
      try {
        console.log(`正在解读论文: ${paper.title}`);
        const result = await this.analyzePaper(paper, mode);
        results.push({ success: true, data: result, paper: paper });
        
        // 避免API限流，延迟1秒
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`解读论文失败: ${paper.title}`, error.message);
        results.push({ 
          success: false, 
          error: error.message, 
          paper: paper 
        });
      }
    }
    
    return results;
  }

  /**
   * 生成标题
   */
  generateTitle(originalTitle, mode) {
    const prefixes = {
      summary: '【论文速读】',
      deep: '【深度解读】',
      commentary: '【观点】'
    };
    
    const prefix = prefixes[mode] || '';
    return `${prefix}${originalTitle}`;
  }

  /**
   * 模拟响应（用于演示）
   */
  getMockResponse(messages) {
    const userMessage = messages[messages.length - 1].content;
    
    if (userMessage.includes('论文')) {
      return `# 人工智能前沿研究解读

## 核心创新

本文介绍的研究在AI领域取得了重要突破，主要创新点包括：

1. **新颖的网络架构设计**：提出了一种高效的注意力机制，大幅降低了计算复杂度
2. **训练方法优化**：引入了自监督学习策略，减少了对标注数据的依赖
3. **性能显著提升**：在多个基准测试中刷新了SOTA记录

## 技术方法

研究团队采用了创新的方法论：
- 结合Transformer和卷积网络的优势
- 动态调整模型参数以适应不同任务
- 引入知识蒸馏技术提升推理速度

## 实验结果

在ImageNet、COCO等主流数据集上的测试表明：
- 准确率提升5-10%
- 推理速度提高2-3倍
- 模型参数量减少30%

## 应用前景

这项研究为以下应用场景提供了新思路：
- 实时视频分析
- 移动端AI应用
- 边缘计算部署

*注：这是模拟生成的内容，仅供演示使用*`;
    }
    
    return '这是模拟生成的AI响应。请配置阿里云百炼API Key以使用真实服务。';
  }
}

// 导出单例
module.exports = new AliyunBailianService();

