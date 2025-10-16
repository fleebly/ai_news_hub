const axios = require('axios');
const NodeCache = require('node-cache');

// 创建缓存实例，缓存时间为30分钟（提升性能，减少API调用）
const cache = new NodeCache({ stdTTL: 1800 });

// 创建带重试功能的 axios 实例
const axiosWithRetry = axios.create();

/**
 * 带重试的请求函数
 */
async function requestWithRetry(config, maxRetries = 2) {
  let lastError;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await axiosWithRetry(config);
      return response;
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        // 指数退避：第1次等1秒，第2次等2秒
        const delay = (i + 1) * 1000;
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Reddit 热门讨论获取服务
 * 使用 Reddit 的公开 JSON API
 */
class RedditService {
  constructor() {
    this.baseUrl = 'https://www.reddit.com';
    this.subreddits = [
      'artificial',
      'MachineLearning',
      'ChatGPT',
      'OpenAI',
      'programming',
      'coding',
      'javascript',
      'python',
      'webdev'
    ];
  }

  /**
   * 获取指定 subreddit 的热门帖子
   */
  async getHotPosts(subreddit, limit = 5) {
    try {
      const response = await requestWithRetry({
        method: 'get',
        url: `${this.baseUrl}/r/${subreddit}/hot.json`,
        params: { limit },
        headers: {
          'User-Agent': 'AI News Hub/1.0 (by /u/ainewshub)'
        },
        timeout: 30000 // 增加到30秒超时
      }, 2); // 最多重试2次

      if (response.data && response.data.data && response.data.data.children) {
        return response.data.data.children.map(post => this.formatRedditPost(post.data, subreddit));
      }
      return [];
    } catch (error) {
      console.error(`❌ Error fetching Reddit posts from r/${subreddit}:`, error.message);
      return [];
    }
  }

  /**
   * 格式化 Reddit 帖子数据
   */
  formatRedditPost(post, subreddit) {
    return {
      id: `reddit_${post.id}`,
      platform: 'Reddit',
      type: 'discussion',
      title: post.title,
      summary: this.cleanText(post.selftext || '').slice(0, 200) || '点击查看详情',
      content: this.cleanText(post.selftext || ''),
      category: this.mapSubredditToCategory(subreddit),
      source: `r/${subreddit}`,
      author: post.author,
      publishedAt: new Date(post.created_utc * 1000).toISOString(),
      link: `https://www.reddit.com${post.permalink}`,
      externalLink: post.url,
      imageUrl: this.extractRedditImage(post),
      tags: this.extractRedditTags(post, subreddit),
      readTime: '5分钟',
      trending: post.score > 1000,
      views: post.num_comments * 10, // 估算
      likes: post.score,
      comments: post.num_comments,
      engagement: post.upvote_ratio,
      metadata: {
        awards: post.total_awards_received,
        gilded: post.gilded,
        over_18: post.over_18
      }
    };
  }

  /**
   * 提取 Reddit 图片
   */
  extractRedditImage(post) {
    // 优先使用缩略图
    if (post.thumbnail && post.thumbnail.startsWith('http')) {
      return post.thumbnail;
    }
    
    // 尝试从预览中提取
    if (post.preview && post.preview.images && post.preview.images[0]) {
      const image = post.preview.images[0];
      if (image.source && image.source.url) {
        return image.source.url.replace(/&amp;/g, '&');
      }
    }

    // 默认 Reddit 图标
    return 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=200&fit=crop';
  }

  /**
   * 清理文本
   */
  cleanText(text) {
    return text
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 映射 subreddit 到分类
   */
  mapSubredditToCategory(subreddit) {
    const categoryMap = {
      'artificial': 'AI技术',
      'MachineLearning': 'AI技术',
      'ChatGPT': 'AI应用',
      'OpenAI': 'AI技术',
      'programming': '编程',
      'coding': '编程',
      'javascript': '前端开发',
      'python': '后端开发',
      'webdev': 'Web开发'
    };
    return categoryMap[subreddit] || '技术讨论';
  }

  /**
   * 提取标签
   */
  extractRedditTags(post, subreddit) {
    const tags = [subreddit];
    const flair = post.link_flair_text;
    if (flair && !tags.includes(flair)) {
      tags.push(flair);
    }
    return tags.slice(0, 3);
  }

  /**
   * 获取所有配置的 subreddit 的热门内容
   */
  async getAllHotPosts() {
    const cacheKey = 'reddit_all_hot';
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`✅ Reddit posts from cache (${cached.length} posts)`);
      return cached;
    }

    try {
      console.log(`🔍 Fetching Reddit posts from ${this.subreddits.length} subreddits...`);
      
      // 批量处理，每批最多3个并发请求，减少服务器压力
      const batchSize = 3;
      const allPosts = [];
      
      for (let i = 0; i < this.subreddits.length; i += batchSize) {
        const batch = this.subreddits.slice(i, i + batchSize);
        const promises = batch.map(sub => this.getHotPosts(sub, 3));
        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            allPosts.push(...result.value);
            console.log(`✅ Fetched ${result.value.length} posts from r/${batch[index]}`);
          }
        });
        
        // 批次之间稍作延迟，避免请求过快
        if (i + batchSize < this.subreddits.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // 按点赞数排序
      allPosts.sort((a, b) => b.likes - a.likes);
      const topPosts = allPosts.slice(0, 20);
      
      if (topPosts.length > 0) {
        cache.set(cacheKey, topPosts);
        console.log(`✅ Successfully cached ${topPosts.length} Reddit posts`);
      }
      
      return topPosts;
    } catch (error) {
      console.error('❌ Error fetching Reddit posts:', error);
      return [];
    }
  }
}

/**
 * Twitter/X 服务
 * 注意：Twitter API v2 需要付费，这里提供框架
 */
class TwitterService {
  constructor() {
    this.apiKey = process.env.TWITTER_API_KEY || '';
    this.apiSecret = process.env.TWITTER_API_SECRET || '';
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN || '';
    this.enabled = !!this.bearerToken;
  }

  /**
   * 搜索热门推文
   */
  async searchTweets(query, maxResults = 10) {
    if (!this.enabled) {
      console.log('Twitter API not configured, skipping...');
      return [];
    }

    try {
      const response = await requestWithRetry({
        method: 'get',
        url: 'https://api.twitter.com/2/tweets/search/recent',
        params: {
          query: `${query} lang:en -is:retweet`,
          max_results: maxResults,
          'tweet.fields': 'created_at,public_metrics,author_id',
          'user.fields': 'name,username',
          expansions: 'author_id'
        },
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`
        },
        timeout: 30000 // 增加到30秒超时
      }, 2); // 最多重试2次

      if (response.data && response.data.data) {
        return response.data.data.map(tweet => this.formatTweet(tweet, response.data.includes));
      }
      return [];
    } catch (error) {
      console.error('Error fetching Twitter data:', error.message);
      return [];
    }
  }

  /**
   * 格式化推文数据
   */
  formatTweet(tweet, includes) {
    const author = includes?.users?.find(u => u.id === tweet.author_id);
    const metrics = tweet.public_metrics || {};

    return {
      id: `twitter_${tweet.id}`,
      platform: 'Twitter',
      type: 'tweet',
      title: this.extractTitle(tweet.text),
      summary: tweet.text.slice(0, 200),
      content: tweet.text,
      category: 'AI讨论',
      source: 'Twitter',
      author: author?.name || 'Unknown',
      authorUsername: author?.username,
      publishedAt: tweet.created_at,
      link: `https://twitter.com/${author?.username}/status/${tweet.id}`,
      imageUrl: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400&h=200&fit=crop',
      tags: this.extractTwitterTags(tweet.text),
      readTime: '1分钟',
      trending: metrics.like_count > 100,
      views: metrics.impression_count || 0,
      likes: metrics.like_count || 0,
      comments: metrics.reply_count || 0,
      engagement: (metrics.like_count || 0) + (metrics.retweet_count || 0),
      metadata: {
        retweets: metrics.retweet_count || 0,
        quotes: metrics.quote_count || 0
      }
    };
  }

  /**
   * 从推文中提取标题
   */
  extractTitle(text) {
    // 取前80个字符作为标题
    const cleaned = text.replace(/https?:\/\/\S+/g, '').trim();
    return cleaned.length > 80 ? cleaned.slice(0, 77) + '...' : cleaned;
  }

  /**
   * 提取推文标签
   */
  extractTwitterTags(text) {
    const hashtags = text.match(/#\w+/g) || [];
    return hashtags.map(tag => tag.slice(1)).slice(0, 3);
  }

  /**
   * 获取热门 AI 相关推文
   */
  async getAITrends() {
    const queries = [
      'AI OR artificial intelligence',
      'GPT OR ChatGPT',
      'machine learning OR deep learning'
    ];

    const promises = queries.map(q => this.searchTweets(q, 5));
    const results = await Promise.allSettled(promises);
    
    const allTweets = [];
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allTweets.push(...result.value);
      }
    });

    return allTweets.slice(0, 15);
  }
}

/**
 * 微博服务
 * 注意：微博 API 需要申请，这里提供框架
 */
class WeiboService {
  constructor() {
    this.appKey = process.env.WEIBO_APP_KEY || '';
    this.appSecret = process.env.WEIBO_APP_SECRET || '';
    this.accessToken = process.env.WEIBO_ACCESS_TOKEN || '';
    this.enabled = !!this.accessToken;
  }

  /**
   * 搜索微博
   */
  async searchWeibo(keyword, count = 10) {
    if (!this.enabled) {
      console.log('Weibo API not configured, skipping...');
      return [];
    }

    try {
      const response = await requestWithRetry({
        method: 'get',
        url: 'https://api.weibo.com/2/search/topics.json',
        params: {
          access_token: this.accessToken,
          q: keyword,
          count: count
        },
        timeout: 30000 // 增加到30秒超时
      }, 2); // 最多重试2次

      if (response.data && response.data.statuses) {
        return response.data.statuses.map(weibo => this.formatWeibo(weibo));
      }
      return [];
    } catch (error) {
      console.error('Error fetching Weibo data:', error.message);
      return [];
    }
  }

  /**
   * 格式化微博数据
   */
  formatWeibo(weibo) {
    return {
      id: `weibo_${weibo.id}`,
      platform: '微博',
      type: 'post',
      title: this.extractWeiboTitle(weibo.text),
      summary: this.cleanWeiboText(weibo.text).slice(0, 200),
      content: this.cleanWeiboText(weibo.text),
      category: 'AI热点',
      source: '微博',
      author: weibo.user?.screen_name || 'Unknown',
      publishedAt: new Date(weibo.created_at).toISOString(),
      link: `https://weibo.com/${weibo.user?.id}/${weibo.bid}`,
      imageUrl: weibo.pic_urls?.[0]?.thumbnail_pic || 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=200&fit=crop',
      tags: this.extractWeiboTags(weibo.text),
      readTime: '2分钟',
      trending: weibo.reposts_count > 100,
      views: weibo.attitudes_count * 10,
      likes: weibo.attitudes_count || 0,
      comments: weibo.comments_count || 0,
      engagement: (weibo.reposts_count || 0) + (weibo.attitudes_count || 0),
      metadata: {
        reposts: weibo.reposts_count || 0,
        verified: weibo.user?.verified || false
      }
    };
  }

  /**
   * 清理微博文本
   */
  cleanWeiboText(text) {
    return text
      .replace(/<[^>]+>/g, '') // 移除HTML标签
      .replace(/\[.*?\]/g, '') // 移除表情符号
      .trim();
  }

  /**
   * 提取微博标题
   */
  extractWeiboTitle(text) {
    const cleaned = this.cleanWeiboText(text);
    return cleaned.length > 60 ? cleaned.slice(0, 57) + '...' : cleaned;
  }

  /**
   * 提取微博标签
   */
  extractWeiboTags(text) {
    const tags = text.match(/#[^#]+#/g) || [];
    return tags.map(tag => tag.replace(/#/g, '')).slice(0, 3);
  }

  /**
   * 获取 AI 相关热门微博
   */
  async getAITrends() {
    const keywords = ['人工智能', 'AI', '机器学习', 'ChatGPT'];
    const promises = keywords.map(k => this.searchWeibo(k, 3));
    const results = await Promise.allSettled(promises);
    
    const allWeibo = [];
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allWeibo.push(...result.value);
      }
    });

    return allWeibo.slice(0, 10);
  }
}

/**
 * 社交媒体聚合服务
 */
class SocialMediaAggregator {
  constructor() {
    this.reddit = new RedditService();
    this.twitter = new TwitterService();
    this.weibo = new WeiboService();
  }

  /**
   * 获取所有社交媒体平台的内容
   */
  async aggregateAll() {
    const cacheKey = 'social_media_all';
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log('Fetching social media content...');
      
      const [redditPosts, twitterTweets, weiboPost] = await Promise.allSettled([
        this.reddit.getAllHotPosts(),
        this.twitter.getAITrends(),
        this.weibo.getAITrends()
      ]);

      const allContent = [];
      
      if (redditPosts.status === 'fulfilled') {
        allContent.push(...redditPosts.value);
        console.log(`✅ Fetched ${redditPosts.value.length} Reddit posts`);
      }
      
      if (twitterTweets.status === 'fulfilled') {
        allContent.push(...twitterTweets.value);
        console.log(`✅ Fetched ${twitterTweets.value.length} Twitter tweets`);
      }
      
      if (weiboPost.status === 'fulfilled') {
        allContent.push(...weiboPost.value);
        console.log(`✅ Fetched ${weiboPost.value.length} Weibo posts`);
      }

      // 按互动度排序（likes + comments）
      allContent.sort((a, b) => {
        const engagementA = a.likes + a.comments;
        const engagementB = b.likes + b.comments;
        return engagementB - engagementA;
      });

      const topContent = allContent.slice(0, 30);
      cache.set(cacheKey, topContent);
      
      console.log(`✅ Total social media content: ${topContent.length}`);
      return topContent;
    } catch (error) {
      console.error('Error aggregating social media:', error);
      return [];
    }
  }

  /**
   * 按平台获取内容
   */
  async getByPlatform(platform) {
    switch (platform.toLowerCase()) {
      case 'reddit':
        return await this.reddit.getAllHotPosts();
      case 'twitter':
        return await this.twitter.getAITrends();
      case 'weibo':
      case '微博':
        return await this.weibo.getAITrends();
      default:
        return [];
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    cache.flushAll();
    return { success: true, message: 'Social media cache cleared' };
  }
}

module.exports = new SocialMediaAggregator();

