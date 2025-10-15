const Parser = require('rss-parser');
const NodeCache = require('node-cache');
const axios = require('axios');

// 创建缓存实例，缓存时间为10分钟
const cache = new NodeCache({ stdTTL: 600 });
const parser = new Parser({
  customFields: {
    item: ['media:thumbnail', 'media:content']
  }
});

// RSS订阅源列表 - AI和编程相关的高质量内容源
const RSS_FEEDS = [
  { url: 'https://openai.com/blog/rss.xml', category: 'AI技术', source: 'OpenAI' },
  { url: 'https://blog.google/technology/ai/rss/', category: 'AI技术', source: 'Google AI' },
  { url: 'https://engineering.fb.com/feed/', category: 'AI技术', source: 'Meta Engineering' },
  { url: 'https://github.blog/feed/', category: '开发工具', source: 'GitHub Blog' },
  { url: 'https://blog.tensorflow.org/feeds/posts/default', category: 'AI技术', source: 'TensorFlow' },
  { url: 'https://huggingface.co/blog/feed.xml', category: '开源项目', source: 'Hugging Face' },
  { url: 'https://aws.amazon.com/blogs/machine-learning/feed/', category: 'AI应用', source: 'AWS ML' },
];

// AI相关搜索关键词
const AI_KEYWORDS = [
  'GPT-4', 'Claude', 'Gemini', 'LLM', 'AI coding',
  'GitHub Copilot', 'machine learning', 'deep learning',
  'transformer', 'neural network', 'AI tools'
];

/**
 * 从RSS订阅源获取新闻
 */
async function fetchFromRSS() {
  const cacheKey = 'rss_news';
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const allNews = [];
    
    // 并行获取所有RSS源
    const feedPromises = RSS_FEEDS.map(async (feed) => {
      try {
        const feedData = await parser.parseURL(feed.url);
        
        return feedData.items.slice(0, 3).map(item => ({
          id: `rss_${Buffer.from(item.link || item.guid).toString('base64').slice(0, 16)}`,
          title: item.title || '无标题',
          summary: (item.contentSnippet || item.content || '').slice(0, 200),
          content: item.content || item.contentSnippet || '',
          category: feed.category,
          source: feed.source,
          publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
          link: item.link,
          imageUrl: extractImageUrl(item),
          tags: extractTags(item.title, item.contentSnippet),
          readTime: calculateReadTime(item.content || item.contentSnippet),
          trending: isRecent(item.pubDate || item.isoDate),
          views: Math.floor(Math.random() * 5000) + 1000,
          likes: Math.floor(Math.random() * 300) + 50,
          comments: Math.floor(Math.random() * 150) + 10
        }));
      } catch (error) {
        console.error(`Error fetching RSS feed ${feed.url}:`, error.message);
        return [];
      }
    });

    const results = await Promise.allSettled(feedPromises);
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allNews.push(...result.value);
      }
    });

    // 按发布时间排序，最新的在前
    allNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    const topNews = allNews.slice(0, 20);
    cache.set(cacheKey, topNews);
    
    return topNews;
  } catch (error) {
    console.error('Error fetching RSS news:', error);
    return [];
  }
}

/**
 * 使用Brave Search API搜索最新AI资讯
 * 注意：需要在.env中配置BRAVE_API_KEY
 */
async function searchWithBrave(query) {
  const apiKey = process.env.BRAVE_API_KEY;
  
  if (!apiKey) {
    console.log('Brave API key not configured, skipping Brave search');
    return [];
  }

  try {
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: {
        q: query,
        count: 10,
        freshness: 'pw' // 过去一周
      },
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey
      }
    });

    if (response.data && response.data.web && response.data.web.results) {
      return response.data.web.results.map((item, index) => ({
        id: `brave_${Date.now()}_${index}`,
        title: item.title,
        summary: item.description || '',
        content: item.description || '',
        category: 'AI技术',
        source: extractDomain(item.url),
        publishedAt: item.age || new Date().toISOString(),
        link: item.url,
        imageUrl: item.thumbnail?.src || getDefaultImage(),
        tags: extractTags(item.title, item.description),
        readTime: '3分钟',
        trending: true,
        views: Math.floor(Math.random() * 5000) + 1000,
        likes: Math.floor(Math.random() * 300) + 50,
        comments: Math.floor(Math.random() * 150) + 10
      }));
    }

    return [];
  } catch (error) {
    console.error('Brave search error:', error.message);
    return [];
  }
}

/**
 * 聚合所有来源的新闻
 */
async function aggregateNews() {
  const cacheKey = 'all_news';
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // 并行获取多个来源
    const [rssNews, braveNews] = await Promise.allSettled([
      fetchFromRSS(),
      searchWithBrave('AI artificial intelligence latest news OR GPT OR Claude OR machine learning')
    ]);

    const allNews = [];
    
    if (rssNews.status === 'fulfilled') {
      allNews.push(...rssNews.value);
    }
    
    if (braveNews.status === 'fulfilled') {
      allNews.push(...braveNews.value);
    }

    // 去重（基于标题相似度）
    const uniqueNews = deduplicateNews(allNews);
    
    // 按发布时间排序
    uniqueNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    // 取前30条
    const topNews = uniqueNews.slice(0, 30);
    
    cache.set(cacheKey, topNews);
    return topNews;
  } catch (error) {
    console.error('Error aggregating news:', error);
    return [];
  }
}

/**
 * 获取单条新闻详情
 */
async function getNewsById(id) {
  const allNews = await aggregateNews();
  return allNews.find(news => news.id === id);
}

/**
 * 辅助函数：提取图片URL
 */
function extractImageUrl(item) {
  // 尝试从多个可能的位置提取图片
  if (item['media:thumbnail']) {
    return item['media:thumbnail'].$ ? item['media:thumbnail'].$.url : item['media:thumbnail'];
  }
  if (item['media:content']) {
    return item['media:content'].$ ? item['media:content'].$.url : item['media:content'];
  }
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }
  
  // 默认图片（使用Unsplash的AI相关图片）
  return getDefaultImage();
}

/**
 * 获取默认图片
 */
function getDefaultImage() {
  const images = [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop'
  ];
  return images[Math.floor(Math.random() * images.length)];
}

/**
 * 提取标签
 */
function extractTags(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  const tags = [];
  
  const tagMap = {
    'gpt': 'GPT',
    'claude': 'Claude',
    'gemini': 'Gemini',
    'openai': 'OpenAI',
    'google': 'Google',
    'github': 'GitHub',
    'copilot': 'Copilot',
    'llm': 'LLM',
    'ai': 'AI',
    'machine learning': '机器学习',
    'deep learning': '深度学习',
    'neural': '神经网络',
    'transformer': 'Transformer',
    'coding': '编程',
    'python': 'Python',
    'javascript': 'JavaScript',
    'react': 'React',
    'node': 'Node.js'
  };

  for (const [keyword, tag] of Object.entries(tagMap)) {
    if (text.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag);
      if (tags.length >= 3) break;
    }
  }

  // 如果没有找到标签，添加默认标签
  if (tags.length === 0) {
    tags.push('AI', '技术');
  }

  return tags;
}

/**
 * 计算阅读时间
 */
function calculateReadTime(content) {
  if (!content) return '3分钟';
  const words = content.length;
  const minutes = Math.ceil(words / 500); // 假设每分钟阅读500字符
  return `${Math.max(minutes, 1)}分钟`;
}

/**
 * 判断是否是最近发布的（24小时内）
 */
function isRecent(dateString) {
  if (!dateString) return false;
  const publishDate = new Date(dateString);
  const now = new Date();
  const hoursDiff = (now - publishDate) / (1000 * 60 * 60);
  return hoursDiff <= 24;
}

/**
 * 提取域名
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}

/**
 * 去重新闻（基于标题相似度）
 */
function deduplicateNews(news) {
  const unique = [];
  const seenTitles = new Set();

  for (const item of news) {
    const normalizedTitle = item.title.toLowerCase().trim();
    
    // 检查是否有非常相似的标题
    let isDuplicate = false;
    for (const seenTitle of seenTitles) {
      if (calculateSimilarity(normalizedTitle, seenTitle) > 0.8) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      unique.push(item);
      seenTitles.add(normalizedTitle);
    }
  }

  return unique;
}

/**
 * 计算字符串相似度（简单的Jaccard相似度）
 */
function calculateSimilarity(str1, str2) {
  const set1 = new Set(str1.split(' '));
  const set2 = new Set(str2.split(' '));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * 清除缓存
 */
function clearCache() {
  cache.flushAll();
  return { success: true, message: 'Cache cleared' };
}

module.exports = {
  aggregateNews,
  getNewsById,
  clearCache,
  fetchFromRSS,
  searchWithBrave
};

