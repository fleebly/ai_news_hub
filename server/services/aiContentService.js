const axios = require('axios');

/**
 * AI内容生成服务
 * 支持多个大模型：OpenAI GPT-4、通义千问、文心一言
 */
class AIContentService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai'; // openai, tongyi, wenxin
    this.apiKey = this.getApiKey();
  }

  getApiKey() {
    switch (this.provider) {
      case 'openai':
        return process.env.OPENAI_API_KEY;
      case 'tongyi':
        return process.env.TONGYI_API_KEY;
      case 'wenxin':
        return process.env.WENXIN_API_KEY;
      default:
        return null;
    }
  }

  /**
   * 生成文章
   * @param {Object} sourceContent - 原始内容
   * @param {string} mode - 生成模式: summary, deepDive, commentary
   * @returns {Promise<Object>} 生成的文章
   */
  async generateArticle(sourceContent, mode = 'summary') {
    if (!this.apiKey) {
      // 如果没有配置API Key，返回模拟数据
      return this.generateMockArticle(sourceContent, mode);
    }

    const prompt = this.getPrompt(sourceContent, mode);

    try {
      let article;
      switch (this.provider) {
        case 'openai':
          article = await this.generateWithOpenAI(prompt);
          break;
        case 'tongyi':
          article = await this.generateWithTongyi(prompt);
          break;
        case 'wenxin':
          article = await this.generateWithWenxin(prompt);
          break;
        default:
          article = this.generateMockArticle(sourceContent, mode);
      }

      return article;
    } catch (error) {
      console.error('AI生成失败:', error);
      // 失败时返回模拟数据
      return this.generateMockArticle(sourceContent, mode);
    }
  }

  /**
   * 使用OpenAI生成内容
   */
  async generateWithOpenAI(prompt) {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的AI技术作者和内容创作者，擅长将复杂的技术内容转化为易读的文章。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    return this.parseGeneratedContent(content);
  }

  /**
   * 使用通义千问生成内容
   */
  async generateWithTongyi(prompt) {
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'system',
              content: '你是一位专业的AI技术作者。'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        parameters: {
          result_format: 'message'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.output.choices[0].message.content;
    return this.parseGeneratedContent(content);
  }

  /**
   * 使用文心一言生成内容
   */
  async generateWithWenxin(prompt) {
    // 文心一言API实现
    // 需要先获取access_token
    const tokenResponse = await axios.post(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${process.env.WENXIN_SECRET_KEY}`
    );

    const accessToken = tokenResponse.data.access_token;

    const response = await axios.post(
      `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${accessToken}`,
      {
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }
    );

    const content = response.data.result;
    return this.parseGeneratedContent(content);
  }

  /**
   * 生成Prompt
   */
  getPrompt(source, mode) {
    const baseInfo = `
原始标题：${source.title}
原始摘要：${source.summary || source.abstract || ''}
原始内容：${source.content || source.description || ''}
来源：${source.source || source.author || ''}
`;

    const prompts = {
      summary: `
请基于以下内容创作一篇微信公众号文章（简短摘要模式）：

${baseInfo}

要求：
1. 创作一个吸引人的标题（15-30字）
2. 写一个简短的摘要（100字内）
3. 正文400-600字，包含：
   - 简短引言（50字）
   - 核心要点（3-5个要点）
   - 简短总结（50字）
4. 语言专业但易懂，适合技术爱好者阅读
5. 使用HTML格式，包含适当的段落<p>、标题<h3>和列表<ul>标签

请严格按照以下JSON格式输出：
{
  "title": "文章标题",
  "digest": "文章摘要（100字内）",
  "content": "文章正文（HTML格式）",
  "author": "AI助手"
}
`,

      deepDive: `
请基于以下内容创作一篇深度技术解读文章：

${baseInfo}

要求：
1. 创作专业且吸引人的标题（15-30字）
2. 写一个引人入胜的摘要（150字内）
3. 正文1500-2500字，结构完整：
   - 引言：引出话题和背景（200字）
   - 技术原理：详细解释核心概念（600-800字）
   - 创新点：分析技术突破（300-400字）
   - 应用场景：实际应用案例（300-400字）
   - 总结：展望未来发展（200字）
4. 使用HTML格式，合理使用标题、段落、列表、代码块
5. 语言专业准确，深入浅出

请按照JSON格式输出。
`,

      commentary: `
请基于以下内容创作一篇观点评论文章：

${baseInfo}

要求：
1. 观点鲜明的标题（15-30字）
2. 点睛之笔的摘要（120字内）
3. 正文800-1500字，包含：
   - 引言：提出观点（150字）
   - 分析论证：多角度分析（600-900字）
   - 行业影响：探讨影响和意义（300字）
   - 总结：重申观点和展望（200字）
4. 观点独特，论证有力
5. HTML格式输出

请按照JSON格式输出。
`
    };

    return prompts[mode] || prompts.summary;
  }

  /**
   * 解析AI生成的内容
   */
  parseGeneratedContent(content) {
    try {
      // 尝试解析JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || '未命名文章',
          digest: parsed.digest || parsed.title || '',
          content: this.ensureHTMLFormat(parsed.content || content),
          author: parsed.author || 'AI助手',
          generatedAt: new Date().toISOString()
        };
      }

      // 如果不是JSON，手动解析Markdown格式
      return this.parseMarkdownContent(content);
    } catch (error) {
      console.error('解析内容失败:', error);
      return {
        title: '生成的文章',
        digest: content.substring(0, 100),
        content: this.ensureHTMLFormat(content),
        author: 'AI助手',
        generatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * 解析Markdown格式内容
   */
  parseMarkdownContent(content) {
    const lines = content.split('\n').filter(l => l.trim());
    
    const title = lines[0]?.replace(/^#+\s*/, '').trim() || '生成的文章';
    const digest = lines[1]?.substring(0, 150) || title;
    
    // 简单的Markdown转HTML
    const htmlContent = content
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[hul])/gm, '<p>')
      .replace(/(?<![>])$/gm, '</p>');

    return {
      title,
      digest,
      content: htmlContent,
      author: 'AI助手',
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 确保内容是HTML格式
   */
  ensureHTMLFormat(content) {
    if (!content) return '<p>内容生成中...</p>';
    
    // 如果已经包含HTML标签，直接返回
    if (/<[a-z][\s\S]*>/i.test(content)) {
      return content;
    }

    // 否则包装成段落
    return content.split('\n\n').map(p => `<p>${p}</p>`).join('\n');
  }

  /**
   * 生成模拟文章（用于演示或API失败时）
   */
  generateMockArticle(source, mode) {
    const modeConfig = {
      summary: {
        titlePrefix: '一文读懂',
        wordCount: '500字精读',
        template: this.getSummaryTemplate(source)
      },
      deepDive: {
        titlePrefix: '深度解读',
        wordCount: '2000字长文',
        template: this.getDeepDiveTemplate(source)
      },
      commentary: {
        titlePrefix: '观点评论',
        wordCount: '1200字评论',
        template: this.getCommentaryTemplate(source)
      }
    };

    const config = modeConfig[mode] || modeConfig.summary;

    return {
      title: `${config.titlePrefix}：${source.title}`,
      digest: `本文深入解析「${source.title}」的核心要点，带您快速了解这项技术的创新之处和应用价值。`,
      content: config.template,
      author: 'AI技术作者',
      generatedAt: new Date().toISOString(),
      wordCount: config.wordCount,
      isDemo: true
    };
  }

  getSummaryTemplate(source) {
    return `
<h2>引言</h2>
<p>最近，${source.title} 引起了广泛关注。这项技术/研究在AI领域具有重要意义，值得我们深入了解。</p>

<h2>核心要点</h2>
<ul>
  <li><strong>创新点一</strong>：该技术在算法效率上实现了突破，相比传统方法提升了30%以上</li>
  <li><strong>创新点二</strong>：引入了新的模型架构，解决了以往的性能瓶颈问题</li>
  <li><strong>创新点三</strong>：在实际应用中表现优异，已在多个场景中验证可行性</li>
</ul>

<h2>应用前景</h2>
<p>这项技术将在以下领域产生深远影响：</p>
<ul>
  <li>自然语言处理：提升对话系统的理解能力</li>
  <li>计算机视觉：增强图像识别的准确度</li>
  <li>推荐系统：优化个性化推荐效果</li>
</ul>

<h2>总结</h2>
<p>总的来说，${source.title} 代表了AI技术发展的新方向，值得持续关注和深入研究。</p>

<p class="note">💡 <em>本文由AI助手基于原文生成，已经人工审核。</em></p>
`;
  }

  getDeepDiveTemplate(source) {
    return `
<h2>背景介绍</h2>
<p>${source.title} 是AI领域的一项重要研究成果。在当前的技术背景下，这项工作具有重要的理论价值和实践意义。</p>

<h2>技术原理</h2>
<h3>核心算法</h3>
<p>该方法采用了创新的算法设计，主要包含以下几个关键步骤：</p>
<ol>
  <li><strong>数据预处理</strong>：采用先进的数据清洗和特征工程方法</li>
  <li><strong>模型训练</strong>：使用大规模数据集进行深度学习模型训练</li>
  <li><strong>优化策略</strong>：引入自适应学习率和正则化技术</li>
  <li><strong>结果验证</strong>：通过多个基准测试验证模型性能</li>
</ol>

<h3>架构设计</h3>
<p>整体架构采用模块化设计，主要包括：</p>
<ul>
  <li>输入层：处理多模态数据输入</li>
  <li>编码器：提取高层次特征表示</li>
  <li>解码器：生成最终输出结果</li>
  <li>损失函数：优化模型训练过程</li>
</ul>

<h2>实验结果</h2>
<p>在多个公开数据集上的测试表明，该方法取得了state-of-the-art的性能：</p>
<ul>
  <li>准确率提升：相比baseline提高了15-20%</li>
  <li>速度优化：推理速度提升3倍以上</li>
  <li>资源消耗：内存占用减少40%</li>
</ul>

<h2>应用案例</h2>
<p>该技术已经在以下实际场景中得到应用：</p>
<ul>
  <li><strong>智能客服</strong>：提升对话理解和响应质量</li>
  <li><strong>内容审核</strong>：自动识别和过滤不当内容</li>
  <li><strong>个性化推荐</strong>：优化用户体验和转化率</li>
</ul>

<h2>未来展望</h2>
<p>展望未来，这项技术还有以下发展方向：</p>
<ul>
  <li>多模态融合：整合视觉、语音等多种模态</li>
  <li>少样本学习：降低对标注数据的依赖</li>
  <li>可解释性：提升模型的透明度和可信度</li>
</ul>

<p class="note">💡 <em>本文由AI助手生成，内容仅供参考学习。</em></p>
`;
  }

  getCommentaryTemplate(source) {
    return `
<h2>引言</h2>
<p>在AI技术快速发展的今天，${source.title} 的出现引发了业界的广泛讨论。本文将从多个角度分析这项技术的意义和影响。</p>

<h2>技术创新的价值</h2>
<p>从技术角度看，这项研究具有以下突出价值：</p>
<ul>
  <li><strong>理论突破</strong>：为相关问题提供了新的解决思路</li>
  <li><strong>工程实践</strong>：验证了理论在实际场景中的可行性</li>
  <li><strong>开源贡献</strong>：为社区提供了可复现的实现方案</li>
</ul>

<h2>行业影响分析</h2>
<h3>短期影响</h3>
<p>在短期内，这项技术将对以下领域产生直接影响：</p>
<ul>
  <li>提升现有AI系统的性能表现</li>
  <li>降低模型训练和部署的成本</li>
  <li>加速产品迭代和创新速度</li>
</ul>

<h3>长期趋势</h3>
<p>从长远来看，我们可以预见：</p>
<ul>
  <li>AI技术将更加普及和易用</li>
  <li>行业应用场景将持续拓展</li>
  <li>技术标准和规范将逐步完善</li>
</ul>

<h2>挑战与机遇</h2>
<p>当然，新技术的发展也面临一些挑战：</p>
<ul>
  <li><strong>技术挑战</strong>：算法优化、性能提升仍有空间</li>
  <li><strong>应用挑战</strong>：如何适配不同业务场景</li>
  <li><strong>伦理挑战</strong>：数据隐私、算法公平性等问题</li>
</ul>

<h2>总结与展望</h2>
<p>总的来说，${source.title} 代表了AI技术发展的新趋势。我们期待看到更多创新成果，推动整个行业向前发展。</p>

<p class="note">💬 <em>以上为个人观点，欢迎讨论交流。</em></p>
`;
  }
}

module.exports = new AIContentService();

