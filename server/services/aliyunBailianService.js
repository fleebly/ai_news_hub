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
          timeout: 180000 // 180秒(3分钟)超时，深度解读需要更长时间
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

      deep: `请对以下AI论文进行深度技术解读，生成一篇2500-3500字的专业分析文章：

**论文信息：**
- 标题：${paper.title}
- 摘要：${paper.abstract || paper.summary}
- 作者：${paper.authors ? paper.authors.join(', ') : '未知'}
- 发布时间：${paper.publishedAt || paper.published}

**文章结构要求：**

## 🎯 1. 研究背景与动机（400-500字）
- 详细分析当前领域的技术瓶颈和挑战
- 从论文摘要中提取研究的必要性和紧迫性
- 说明这项研究如何填补现有研究空白
- 可以提及相关的前序工作或经典方法
**配图说明**：在此章节末尾添加配图占位符，使用描述性alt文本，例如：\`![研究背景 - 展示当前AI领域面临的主要挑战]\`

## 💡 2. 核心创新点（600-700字）
- **深入剖析**论文的主要技术创新（2-3个核心点）
- 每个创新点单独成段，配以：
  - 创新的原理和思想
  - 与传统方法的本质区别
  - 为什么这种改进是有效的
- 使用引用块 \`>\` 突出关键洞察
- 如果论文涉及新模型架构，详细描述其组成部分

**配图说明**：在此章节末尾添加技术架构配图占位符，例如：\`![技术架构 - 展示论文提出的创新模型结构图]\`

## 🔬 3. 方法详解（700-900字）
- **逐步拆解**论文提出的技术方案
- 如果有算法，用Markdown代码块展示伪代码（**必须标注语言**）：
\`\`\`python
# 算法伪代码示例
def proposed_method(input_data):
    # 第一步：特征提取
    features = extract_features(input_data)
    # 第二步：注意力机制
    attention = compute_attention(features)
    # 第三步：输出生成
    output = generate_output(attention)
    return output
\`\`\`
- 如果涉及重要数学公式，使用LaTeX格式：
  - **行内公式**（单个$符号）：\`$f(x) = \\sum_{i=1}^{n} w_i x_i + b$\`
  - **独立公式**（双$符号）：\`$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$\`
- 解释每个关键步骤的作用和意义
- 分析方法的优势和可能的局限性

**配图说明**：在此章节插入方法流程图占位符，例如：\`![方法流程 - 展示算法执行的各个关键步骤]\`

## 📊 4. 实验结果与分析（500-600字）
- 描述实验设置（数据集、基线方法、评估指标）
- 使用Markdown表格展示性能对比：

| 方法 | 准确率 | 速度 | 参数量 |
|------|--------|------|--------|
| Baseline | XX% | XXms | XXM |
| 本文方法 | XX% | XXms | XXM |

- **深度分析**实验结果：
  - 为什么本文方法更好？
  - 在哪些场景下提升明显？
  - 有哪些意外发现或有趣的现象？
- 讨论消融实验（如果论文有）
**插入实验结果可视化图表**

## 🚀 5. 应用前景与思考（300-400字）
- 具体的实际应用场景（至少3个）
- 工业界部署的可行性分析
- 该研究对AI发展的启示
- 未来可能的改进方向
- 对读者的建议（如何应用这项技术）
**插入应用场景示意图**

## 💭 6. 总结与评价（200-300字）
- 总结论文的主要贡献
- 客观评价论文的优点和不足
- 展望该方向的未来发展

---

**格式规范：**
1. 使用清晰的Markdown层级（H2/H3/H4）
2. 重要概念使用**加粗**
3. 关键洞察使用 \`> 引用块\` 标注
4. 代码和算法使用 \`\`\`代码块\`\`\`
5. 数据对比使用Markdown表格
6. 适当使用emoji增强可读性（💡📊🔬🚀🎯💻⚡等）
7. 每个大章节后插入一张Unsplash配图（使用上述格式）
8. 专业但不晦涩，面向有一定基础的AI从业者

**重要提示：**
- 基于论文摘要深入分析，不要编造不存在的内容
- 如果论文是关于NLP，配图应选择AI/机器学习主题的图片
- 如果论文是关于CV，配图应选择视觉/图像相关的图片
- 文章要有深度，避免泛泛而谈
- 展现批判性思维，提出独到见解

请直接输出完整的Markdown格式文章，不要包含"以下是文章"等前缀说明。`,

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
      maxTokens: mode === 'deep' ? 6000 : 2000, // 深度解读需要更多tokens以支持更长文章
      temperature: 0.7,
      model: mode === 'deep' ? 'qwen-max' : this.defaultModel // 深度解读使用最强模型
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

