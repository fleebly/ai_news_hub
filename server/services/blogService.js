const Parser = require('rss-parser');
const NodeCache = require('node-cache');
const Blog = require('../models/Blog');
const axios = require('axios');

// 创建缓存实例，缓存2小时，提升性能
const cache = new NodeCache({ stdTTL: 7200 });

// 配置 parser 超时为15秒，避免长时间等待
const parser = new Parser({
  customFields: {
    item: ['media:thumbnail', 'media:content', 'content:encoded']
  },
  timeout: 15000, // 15秒超时
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; AI News Hub/1.0)'
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
  // Anthropic 博客经常返回404，已在下方添加其他URL
  // {
  //   name: 'Anthropic',
  //   url: 'https://www.anthropic.com/blog/rss',
  //   category: 'AI技术',
  //   author: 'Anthropic Team',
  //   company: 'Anthropic',
  //   description: 'Claude AI背后的公司',
  //   language: 'en',
  //   topics: ['Claude', 'AI安全', '宪法AI'],
  //   priority: 9
  // },
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
  // Hugging Face 经常超时，暂时禁用
  // {
  //   name: 'Hugging Face Blog',
  //   url: 'https://huggingface.co/blog/feed.xml',
  //   category: 'AI技术',
  //   author: 'Hugging Face',
  //   company: 'Hugging Face',
  //   description: '开源AI社区领导者',
  //   language: 'en',
  //   topics: ['Transformers', '开源模型', 'Diffusion'],
  //   priority: 9
  // },
  // Papers with Code 经常超时，暂时禁用
  // {
  //   name: 'Papers with Code',
  //   url: 'https://paperswithcode.com/blog/rss',
  //   category: '论文解读',
  //   author: 'Papers with Code',
  //   company: 'Meta',
  //   description: '连接论文和代码实现',
  //   language: 'en',
  //   topics: ['SOTA', 'Benchmark', '代码实现'],
  //   priority: 8
  // },
  
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
  // a16z 经常返回404，暂时禁用
  // {
  //   name: 'a16z',
  //   url: 'https://a16z.com/feed/',
  //   category: '创新创业',
  //   author: 'Andreessen Horowitz',
  //   company: 'a16z',
  //   description: '硅谷知名VC的AI投资洞察',
  //   language: 'en',
  //   topics: ['AI投资', '科技趋势', '创业'],
  //   priority: 8
  // },
  // Sam Altman 博客经常返回404，暂时禁用
  // {
  //   name: 'Sam Altman',
  //   url: 'https://blog.samaltman.com/feed',
  //   category: '创新创业',
  //   author: 'Sam Altman',
  //   company: 'OpenAI',
  //   description: 'OpenAI CEO，YC前总裁',
  //   language: 'en',
  //   topics: ['AGI', '创业哲学', '未来'],
  //   priority: 10
  // },
  
  // === 中文顶级AI媒体 ===
  // 机器之心经常返回404，暂时禁用
  // {
  //   name: '机器之心',
  //   url: 'https://www.jiqizhixin.com/rss',
  //   category: 'AI技术',
  //   author: '机器之心',
  //   company: '机器之心',
  //   description: '中国最专业的AI媒体',
  //   language: 'zh',
  //   topics: ['AI技术', '论文解读', '行业动态'],
  //   priority: 9
  // }
  {
    name: 'Anthropic',
    url: 'https://www.anthropic.com/news/rss.xml',
    category: 'AI技术',
    author: 'Anthropic Team',
    company: 'Anthropic',
    description: 'Claude创造者，AI安全研究',
    language: 'en',
    topics: ['Claude', 'AI安全', 'Constitutional AI'],
    priority: 10
  }
];

/**
 * 获取所有高质量博客文章
 */
async function fetchAllBlogs(limit = 150, forceRefresh = false) {
  try {
    // 1. 尝试从数据库获取
    if (!forceRefresh) {
      const dbBlogs = await Blog.getLatest(limit);
      if (dbBlogs && dbBlogs.length > 0) {
        console.log(`✅ 从数据库返回 ${dbBlogs.length} 篇博客`);
        // 转换数据库格式为API格式
        return dbBlogs.map(blog => ({
          id: blog.blogId,
          title: blog.title,
          summary: blog.summary,
          content: blog.content,
          author: blog.author,
          company: blog.company,
          blogName: blog.source,
          category: blog.category,
          publishedAt: blog.publishedAt.toISOString(),
          link: blog.link,
          imageUrl: blog.imageUrl,
          tags: blog.tags,
          topics: blog.topics,
          readTime: blog.readTime,
          difficulty: blog.difficulty,
          views: blog.views,
          likes: blog.likes,
          featured: blog.featured,
          trending: blog.trending,
          qualityScore: blog.qualityScore
        }));
      }
    }

    // 2. 数据库为空或强制刷新，从RSS获取
    console.log('📡 从RSS源获取博客...');
    const cacheKey = `all_blogs_${limit}`;
    
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
    
    // 3. 保存到数据库（后台操作，不阻塞返回）
    saveBlogsToDatabase(topArticles).catch(err => {
      console.error('保存博客到数据库失败:', err.message);
    });
    
    cache.set(cacheKey, topArticles);
    console.log(`✅ Successfully fetched ${topArticles.length} blog articles`);
    
    return topArticles;
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return [];
  }
}

/**
 * 保存博客到数据库
 */
async function saveBlogsToDatabase(blogsArray) {
  try {
    // 转换为数据库格式
    const blogDocuments = blogsArray.map(blog => ({
      blogId: blog.id,
      title: blog.title,
      summary: blog.summary || '',
      content: blog.content || '',
      author: blog.author || '',
      source: blog.blogName || '',
      company: blog.company || '',
      link: blog.link,
      imageUrl: blog.imageUrl || '',
      category: blog.category || 'other',
      tags: blog.tags || [],
      topics: blog.topics || [],
      difficulty: blog.difficulty || 'intermediate',
      readTime: blog.readTime || 5,
      publishedAt: new Date(blog.publishedAt),
      views: blog.views || 0,
      likes: blog.likes || 0,
      shares: blog.shares || 0,
      featured: blog.featured || false,
      trending: blog.trending || false,
      qualityScore: blog.qualityScore || 0,
      fetchedAt: new Date()
    }));

    // 批量插入或更新
    const result = await Blog.upsertMany(blogDocuments);
    console.log(`💾 成功保存 ${result.upsertedCount + result.modifiedCount} 篇博客到数据库`);
    
    return result;
  } catch (error) {
    console.error('保存博客到数据库失败:', error);
    throw error;
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

    const articles = feed.items.slice(0, maxArticles).map((item, index) => {
      const publishedAt = new Date(item.pubDate || item.isoDate || Date.now());
      
      // 生成唯一ID：使用完整的base64编码，不截断，确保100%唯一
      const randomSuffix = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      const uniqueString = `${item.link || item.guid}_${blog.name}_idx${index}_${randomSuffix}`;
      const id = Buffer.from(uniqueString).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
      
      const title = cleanText(item.title);
      
      return {
        id,
        title,
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
        imageUrl: extractImage(item, title, blog.category),
        tags: extractBlogTags(title, item.content || item.contentSnippet, blog.category),
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

function extractImage(item, title = '', category = '') {
  // 1. 尝试从 RSS feed 的标准字段提取图片
  if (item['media:thumbnail']) {
    const url = item['media:thumbnail'].$ ? item['media:thumbnail'].$.url : item['media:thumbnail'];
    if (url && typeof url === 'string') return url;
  }
  
  if (item['media:content']) {
    const url = item['media:content'].$ ? item['media:content'].$.url : item['media:content'];
    if (url && typeof url === 'string') return url;
  }
  
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }
  
  // 2. 从内容中提取第一张图片（改进正则，支持单引号和更多格式）
  const content = item.content || item['content:encoded'] || item.description || '';
  const imgPatterns = [
    /<img[^>]+src=["']([^"']+)["']/i,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i
  ];
  
  for (const pattern of imgPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // 3. 使用固定的高质量AI主题占位图（基于标题hash选择，确保稳定）
  const hash = (title + category).split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const aiThemeImages = [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&q=80', // AI芯片
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=600&fit=crop&q=80', // AI网络
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop&q=80', // AI代码
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=800&h=600&fit=crop&q=80', // AI大脑
    'https://images.unsplash.com/photo-1676277791608-ac52a2f66b47?w=800&h=600&fit=crop&q=80', // AI机器人
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop&q=80', // AI数据
    'https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=800&h=600&fit=crop&q=80', // AI未来
    'https://images.unsplash.com/photo-1686191128892-3b8e41692c5c?w=800&h=600&fit=crop&q=80', // AI深度学习
  ];
  
  // 使用hash确保同一篇文章总是显示相同的占位图
  const index = Math.abs(hash) % aiThemeImages.length;
  return aiThemeImages[index];
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
async function clearCache() {
  cache.flushAll();
  
  // 强制刷新：从RSS源获取最新数据并保存到数据库
  try {
    await fetchAllBlogs(150, true);
    return { success: true, message: '缓存已清除，数据已从RSS源刷新' };
  } catch (error) {
    return { success: true, message: '缓存已清除，但数据刷新失败: ' + error.message };
  }
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

