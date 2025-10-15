const Parser = require('rss-parser');
const NodeCache = require('node-cache');
const axios = require('axios');

// 创建缓存实例，缓存1小时
const cache = new NodeCache({ stdTTL: 3600 });
const parser = new Parser({
  customFields: {
    item: ['media:thumbnail', 'media:content', 'content:encoded']
  }
});

/**
 * 顶级AI大V博客RSS源列表
 * 仅包含知名AI研究者和顶级公司，确保内容质量
 */
const HIGH_QUALITY_BLOGS = [
  // === AI领域教父级大V ===
  {
    name: 'Andrej Karpathy',
    url: 'http://karpathy.github.io/feed.xml',
    category: 'AI技术',
    author: 'Andrej Karpathy',
    company: 'OpenAI',
    description: '前Tesla AI总监，OpenAI创始成员',
    language: 'en',
    avatar: 'https://avatars.githubusercontent.com/u/241138',
    topics: ['深度学习', '神经网络', 'AI教育'],
    priority: 10
  },
  {
    name: 'Lil\'Log',
    url: 'https://lilianweng.github.io/lil-log/feed.xml',
    category: '论文解读',
    author: 'Lilian Weng',
    company: 'OpenAI',
    description: 'OpenAI安全研究员，深度学习系统化解读',
    language: 'en',
    avatar: 'https://avatars.githubusercontent.com/u/3058411',
    topics: ['注意力机制', 'RL', '生成模型'],
    priority: 10
  },
  {
    name: 'Jay Alammar',
    url: 'http://jalammar.github.io/feed.xml',
    category: '论文解读',
    author: 'Jay Alammar',
    company: '独立',
    description: 'Transformer和LLM可视化解读专家',
    language: 'en',
    avatar: 'https://jalammar.github.io/images/jay_alammar.png',
    topics: ['Transformer', 'LLM', '可视化'],
    priority: 10
  },
  {
    name: 'Christopher Olah',
    url: 'https://colah.github.io/rss.xml',
    category: '论文解读',
    author: 'Christopher Olah',
    company: 'Anthropic',
    description: '神经网络可解释性研究先驱',
    language: 'en',
    topics: ['可解释性', '神经网络', 'LSTM'],
    priority: 10
  },
  
  // === 顶级公司AI博客 ===
  {
    name: 'OpenAI Blog',
    url: 'https://openai.com/blog/rss.xml',
    category: 'AI技术',
    author: 'OpenAI Team',
    company: 'OpenAI',
    description: 'GPT系列创造者，AGI先驱',
    language: 'en',
    topics: ['GPT', 'ChatGPT', 'DALL-E', 'AGI'],
    priority: 10
  },
  {
    name: 'Google AI Blog',
    url: 'https://blog.google/technology/ai/rss/',
    category: 'AI技术',
    author: 'Google AI',
    company: 'Google',
    description: 'Transformer的发明者',
    language: 'en',
    topics: ['Transformer', 'Gemini', 'TPU'],
    priority: 10
  },
  {
    name: 'DeepMind Blog',
    url: 'https://deepmind.google/blog/rss.xml',
    category: 'AI技术',
    author: 'DeepMind Team',
    company: 'Google DeepMind',
    description: 'AlphaGo、AlphaFold背后的公司',
    language: 'en',
    topics: ['AlphaGo', 'AlphaFold', '强化学习'],
    priority: 10
  },
  {
    name: 'Meta AI',
    url: 'https://ai.meta.com/blog/rss/',
    category: 'AI技术',
    author: 'Meta AI',
    company: 'Meta',
    description: 'LLaMA开源领导者',
    language: 'en',
    topics: ['LLaMA', '开源AI', 'PyTorch'],
    priority: 9
  },
  {
    name: 'Anthropic',
    url: 'https://www.anthropic.com/blog/rss',
    category: 'AI技术',
    author: 'Anthropic Team',
    company: 'Anthropic',
    description: 'Claude AI背后的公司',
    language: 'en',
    topics: ['Claude', 'AI安全', '宪法AI'],
    priority: 9
  },
  {
    name: 'Microsoft Research AI',
    url: 'https://www.microsoft.com/en-us/research/blog/category/artificial-intelligence/feed/',
    category: 'AI技术',
    author: 'Microsoft Research',
    company: 'Microsoft',
    description: 'Turing-NLG、Azure AI',
    language: 'en',
    topics: ['Azure AI', '大模型', 'AI基础设施'],
    priority: 9
  },
  
  // === AI研究者个人博客 ===
  {
    name: 'Sebastian Ruder',
    url: 'https://ruder.io/rss/',
    category: '论文解读',
    author: 'Sebastian Ruder',
    company: 'Google',
    description: 'NLP研究员，Transfer Learning专家',
    language: 'en',
    topics: ['NLP', '迁移学习', '多语言模型'],
    priority: 9
  },
  {
    name: 'Ferenc Huszár',
    url: 'https://www.inference.vc/rss/',
    category: '论文解读',
    author: 'Ferenc Huszár',
    company: '独立',
    description: '机器学习理论和推理',
    language: 'en',
    topics: ['ML理论', '贝叶斯', '因果推断'],
    priority: 8
  },
  {
    name: 'Chip Huyen',
    url: 'https://huyenchip.com/feed.xml',
    category: 'AI技术',
    author: 'Chip Huyen',
    company: '独立',
    description: 'MLOps和生产环境AI专家',
    language: 'en',
    topics: ['MLOps', '系统设计', '生产AI'],
    priority: 8
  },
  
  // === 学术机构和社区 ===
  {
    name: 'Distill',
    url: 'https://distill.pub/rss.xml',
    category: '论文解读',
    author: 'Distill Team',
    company: '学术社区',
    description: '机器学习可视化解读领导者',
    language: 'en',
    topics: ['可视化', '可解释性', '交互式论文'],
    priority: 10
  },
  {
    name: 'Hugging Face Blog',
    url: 'https://huggingface.co/blog/feed.xml',
    category: 'AI技术',
    author: 'Hugging Face',
    company: 'Hugging Face',
    description: '开源AI社区领导者',
    language: 'en',
    topics: ['Transformers', '开源模型', 'Diffusion'],
    priority: 9
  },
  {
    name: 'Papers with Code',
    url: 'https://paperswithcode.com/blog/rss',
    category: '论文解读',
    author: 'Papers with Code',
    company: 'Meta',
    description: '连接论文和代码实现',
    language: 'en',
    topics: ['SOTA', 'Benchmark', '代码实现'],
    priority: 8
  },
  
  // === 创业与商业洞察 ===
  {
    name: 'Y Combinator',
    url: 'https://www.ycombinator.com/blog/feed',
    category: '创新创业',
    author: 'Y Combinator',
    company: 'YC',
    description: '硅谷顶级孵化器',
    language: 'en',
    topics: ['创业', '融资', '产品'],
    priority: 9
  },
  {
    name: 'a16z',
    url: 'https://a16z.com/feed/',
    category: '创新创业',
    author: 'Andreessen Horowitz',
    company: 'a16z',
    description: '硅谷知名VC的AI投资洞察',
    language: 'en',
    topics: ['AI投资', '科技趋势', '创业'],
    priority: 8
  },
  {
    name: 'Sam Altman',
    url: 'https://blog.samaltman.com/feed',
    category: '创新创业',
    author: 'Sam Altman',
    company: 'OpenAI',
    description: 'OpenAI CEO，YC前总裁',
    language: 'en',
    topics: ['AGI', '创业哲学', '未来'],
    priority: 10
  },
  
  // === 中文顶级AI媒体 ===
  {
    name: '机器之心',
    url: 'https://www.jiqizhixin.com/rss',
    category: 'AI技术',
    author: '机器之心',
    company: '机器之心',
    description: '中国最专业的AI媒体',
    language: 'zh',
    topics: ['AI技术', '论文解读', '行业动态'],
    priority: 9
  }
];

/**
 * 获取所有高质量博客文章
 */
async function fetchAllBlogs(limit = 50) {
  const cacheKey = `all_blogs_${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    console.log('Fetching blogs from', HIGH_QUALITY_BLOGS.length, 'sources...');
    
    // 并行获取所有博客
    const blogPromises = HIGH_QUALITY_BLOGS.map(blog => fetchBlogArticles(blog, 5));
    const results = await Promise.allSettled(blogPromises);
    
    const allArticles = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      } else {
        console.error(`Failed to fetch ${HIGH_QUALITY_BLOGS[index].name}:`, result.reason?.message);
      }
    });

    // 按优先级和时间排序
    allArticles.sort((a, b) => {
      const priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });

    // 限制数量
    const topArticles = allArticles.slice(0, limit);
    
    cache.set(cacheKey, topArticles);
    console.log(`✅ Successfully fetched ${topArticles.length} blog articles`);
    
    return topArticles;
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return [];
  }
}

/**
 * 获取单个博客的文章
 */
async function fetchBlogArticles(blog, maxArticles = 5) {
  try {
    const feed = await parser.parseURL(blog.url);
    
    if (!feed.items || feed.items.length === 0) {
      return [];
    }

    const articles = feed.items.slice(0, maxArticles).map(item => {
      const publishedAt = new Date(item.pubDate || item.isoDate || Date.now());
      
      return {
        id: `blog_${Buffer.from(item.link || item.guid).toString('base64').slice(0, 20)}`,
        title: cleanText(item.title),
        summary: extractSummary(item),
        content: extractContent(item),
        author: blog.author,
        authorAvatar: blog.avatar,
        company: blog.company,
        blogName: blog.name,
        category: blog.category,
        language: blog.language,
        publishedAt: publishedAt.toISOString(),
        link: item.link,
        imageUrl: extractImage(item),
        tags: extractBlogTags(item.title, item.content || item.contentSnippet, blog.category),
        topics: blog.topics || [],
        readTime: calculateReadTime(item.content || item.contentSnippet),
        featured: blog.priority >= 9,
        priority: blog.priority,
        views: Math.floor(Math.random() * 50000) + 5000,
        likes: Math.floor(Math.random() * 1000) + 100,
        comments: Math.floor(Math.random() * 200) + 10,
        quality: 'high'
      };
    });

    return articles;
  } catch (error) {
    console.error(`Error fetching blog ${blog.name}:`, error.message);
    return [];
  }
}

/**
 * 按分类获取文章
 */
async function fetchBlogsByCategory(category, limit = 20) {
  const allArticles = await fetchAllBlogs(100);
  
  if (category === 'all' || !category) {
    return allArticles.slice(0, limit);
  }
  
  const filtered = allArticles.filter(article => 
    article.category === category
  );
  
  return filtered.slice(0, limit);
}

/**
 * 搜索文章
 */
async function searchBlogs(keywords, limit = 20) {
  const allArticles = await fetchAllBlogs(100);
  const keywordsLower = keywords.toLowerCase();
  
  const filtered = allArticles.filter(article => 
    article.title.toLowerCase().includes(keywordsLower) ||
    article.summary.toLowerCase().includes(keywordsLower) ||
    article.author.toLowerCase().includes(keywordsLower)
  );
  
  return filtered.slice(0, limit);
}

/**
 * 获取精选文章（高优先级）
 */
async function getFeaturedBlogs(limit = 10) {
  const allArticles = await fetchAllBlogs(50);
  const featured = allArticles.filter(article => article.featured);
  return featured.slice(0, limit);
}

/**
 * 工具函数
 */

function cleanText(text) {
  if (!text) return '';
  return text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractSummary(item) {
  const content = item.contentSnippet || item.description || item.summary || '';
  return cleanText(content).slice(0, 300);
}

function extractContent(item) {
  return item['content:encoded'] || item.content || item.contentSnippet || extractSummary(item);
}

function extractImage(item) {
  // 尝试多种方式提取图片
  if (item['media:thumbnail']) {
    return item['media:thumbnail'].$ ? item['media:thumbnail'].$.url : item['media:thumbnail'];
  }
  if (item['media:content']) {
    return item['media:content'].$ ? item['media:content'].$.url : item['media:content'];
  }
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }
  
  // 从内容中提取第一张图片
  const content = item.content || item['content:encoded'] || '';
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) {
    return imgMatch[1];
  }
  
  // 默认图片
  const defaultImages = [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop'
  ];
  return defaultImages[Math.floor(Math.random() * defaultImages.length)];
}

function extractBlogTags(title, content, category) {
  const text = `${title} ${content}`.toLowerCase();
  const tags = new Set();
  
  // 添加分类作为标签
  tags.add(category);
  
  // 关键词匹配
  const keywords = {
    'AI技术': ['gpt', 'llm', 'transformer', 'neural', 'deep learning', 'machine learning', 'ai'],
    '论文解读': ['paper', 'research', 'arxiv', 'sota', 'benchmark'],
    '创新创业': ['startup', 'funding', 'vc', 'entrepreneur', 'business'],
    '前沿科技': ['innovation', 'breakthrough', 'future', 'trend', 'emerging']
  };
  
  Object.entries(keywords).forEach(([tag, words]) => {
    if (words.some(word => text.includes(word))) {
      tags.add(tag);
    }
  });
  
  // 技术关键词
  const techKeywords = [
    'ChatGPT', 'GPT-4', 'Claude', 'LLaMA', 'Stable Diffusion',
    'Transformer', 'Attention', 'BERT', 'Vision', 'NLP',
    'Computer Vision', 'Reinforcement Learning', 'AGI'
  ];
  
  techKeywords.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      tags.add(keyword);
    }
  });
  
  return Array.from(tags).slice(0, 5);
}

function calculateReadTime(content) {
  if (!content) return '3分钟';
  const words = content.length;
  const minutes = Math.ceil(words / 800); // 中英文混合，假设每分钟800字符
  return `${Math.max(minutes, 1)}分钟`;
}

/**
 * 清除缓存
 */
function clearCache() {
  cache.flushAll();
  return { success: true, message: 'Blog cache cleared' };
}

/**
 * 获取博客源列表
 */
function getBlogSources() {
  return HIGH_QUALITY_BLOGS.map(blog => ({
    name: blog.name,
    category: blog.category,
    author: blog.author,
    company: blog.company,
    description: blog.description,
    language: blog.language,
    topics: blog.topics,
    priority: blog.priority
  }));
}

module.exports = {
  fetchAllBlogs,
  fetchBlogsByCategory,
  searchBlogs,
  getFeaturedBlogs,
  getBlogSources,
  clearCache
};

