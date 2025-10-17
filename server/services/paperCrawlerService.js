const axios = require('axios');
const cheerio = require('cheerio');
const Paper = require('../models/Paper');

/**
 * 综合论文爬虫服务
 * 从多个渠道获取最新热门AI论文：
 * 1. arXiv (AI分类论文)
 * 2. Reddit r/MachineLearning (社区热门)
 * 3. Papers with Code (带代码的热门论文)
 * 4. Hugging Face Papers (每日热门)
 * 5. Google Scholar Alerts (可选)
 */

/**
 * 带重试的axios请求
 */
async function axiosRetry(url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await axios.get(url, options);
    } catch (error) {
      if (i === retries) {
        throw error; // 最后一次重试仍失败，抛出错误
      }
      // 指数退避
      const delay = Math.min(1000 * Math.pow(2, i), 5000);
      console.log(`  ⚠️  请求失败，${delay}ms后重试 (${i + 1}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * 从Reddit r/MachineLearning获取热门论文
 */
async function fetchFromReddit(limit = 20) {
  console.log('📡 从Reddit r/MachineLearning获取热门论文...');
  
  // 检查是否配置了Reddit API
  const useRedditAPI = process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET;
  
  if (!useRedditAPI) {
    console.log('  ⚠️  未配置Reddit API，跳过（需要REDDIT_CLIENT_ID和REDDIT_CLIENT_SECRET）');
    return [];
  }
  
  try {
    const subreddits = ['MachineLearning', 'artificial', 'deeplearning'];
    const allPapers = [];

    for (const subreddit of subreddits) {
      try {
        const response = await axios.get(
          `https://www.reddit.com/r/${subreddit}/hot.json`,
          {
            headers: {
              'User-Agent': process.env.REDDIT_USER_AGENT || 'Mozilla/5.0 (compatible; PaperCrawler/1.0)',
              'Accept': 'application/json',
              'Accept-Language': 'en-US,en;q=0.9'
            },
            params: { limit: Math.ceil(limit / subreddits.length) },
            timeout: 15000
          }
        );

        if (response.data && response.data.data && response.data.data.children) {
          const posts = response.data.data.children
            .map(post => post.data)
            .filter(post => {
              // 过滤包含论文链接的帖子
              const title = post.title.toLowerCase();
              const url = post.url.toLowerCase();
              return (
                url.includes('arxiv.org') ||
                url.includes('openreview.net') ||
                url.includes('paperswithcode.com') ||
                title.includes('[r]') ||
                title.includes('[p]') ||
                title.includes('[d]') ||
                title.includes('paper')
              );
            });

          for (const post of posts) {
            const paper = await extractPaperFromRedditPost(post, subreddit);
            if (paper) {
              allPapers.push(paper);
            }
          }
        }
      } catch (error) {
        console.error(`  ⚠️  获取 r/${subreddit} 失败:`, error.message);
      }
    }

    console.log(`  ✅ 从Reddit获取到 ${allPapers.length} 篇论文`);
    return allPapers;
  } catch (error) {
    console.error('Reddit爬取失败:', error.message);
    return [];
  }
}

/**
 * 从Reddit帖子中提取论文信息
 */
async function extractPaperFromRedditPost(post, subreddit) {
  try {
    let arxivId = null;
    let pdfUrl = null;
    let arxivUrl = null;

    // 从URL中提取arXiv ID
    const arxivMatch = post.url.match(/arxiv\.org\/(abs|pdf)\/(\d+\.\d+)/);
    if (arxivMatch) {
      arxivId = arxivMatch[2];
      pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
      arxivUrl = `https://arxiv.org/abs/${arxivId}`;
    }

    // 从标题中提取arXiv ID
    if (!arxivId) {
      const titleMatch = post.title.match(/(\d{4}\.\d{4,5})/);
      if (titleMatch) {
        arxivId = titleMatch[1];
        pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
        arxivUrl = `https://arxiv.org/abs/${arxivId}`;
      }
    }

    // 如果没有arXiv ID，尝试从URL获取
    if (!arxivId && post.url) {
      const openreviewMatch = post.url.match(/openreview\.net\/forum\?id=([^&]+)/);
      if (openreviewMatch) {
        arxivId = `openreview_${openreviewMatch[1]}`;
        arxivUrl = post.url;
      }
    }

    if (!arxivId) {
      return null;
    }

    // 清理标题
    let title = post.title
      .replace(/\[R\]|\[P\]|\[D\]|\[N\]/gi, '')
      .replace(/\d{4}\.\d{4,5}/, '')
      .trim();

    return {
      paperId: `arxiv_${arxivId}`,
      title: title,
      abstract: post.selftext ? post.selftext.slice(0, 500) : '',
      authors: [],
      category: detectCategoryFromText(title),
      conference: 'arXiv',
      arxivUrl: arxivUrl || post.url,
      pdfUrl: pdfUrl,
      publishedAt: new Date(post.created_utc * 1000),
      tags: extractTagsFromText(title),
      views: post.num_comments * 10 + post.score * 5,
      citations: 0,
      trending: true,
      qualityScore: calculateRedditScore(post),
      source: 'reddit',
      sourceUrl: `https://www.reddit.com${post.permalink}`,
      redditScore: post.score,
      redditComments: post.num_comments
    };
  } catch (error) {
    console.error('提取Reddit帖子失败:', error.message);
    return null;
  }
}

/**
 * 从Papers with Code获取热门论文
 */
async function fetchFromPapersWithCode(limit = 20) {
  console.log('📡 从Papers with Code获取热门论文...');
  
  try {
    // Papers with Code API - 添加重试机制
    const response = await axiosRetry('https://paperswithcode.com/api/v1/papers/', {
      params: {
        ordering: '-stars',
        items_per_page: limit
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 30000  // 增加到30秒
    }, 3);  // 增加到3次重试

    if (!response.data || !response.data.results) {
      console.log('  ⚠️  Papers with Code响应为空');
      return [];
    }

    const papers = response.data.results.map(paper => {
      const arxivId = paper.arxiv_id || paper.url_abs?.split('/').pop() || `pwc_${paper.id}`;
      
      return {
        paperId: `arxiv_${arxivId}`,
        title: paper.title,
        abstract: paper.abstract || '',
        authors: paper.authors ? paper.authors.split(',').map(a => a.trim()) : [],
        category: detectCategoryFromText(paper.title),
        conference: paper.conference || 'arXiv',
        arxivUrl: paper.url_abs || `https://arxiv.org/abs/${arxivId}`,
        pdfUrl: paper.url_pdf || `https://arxiv.org/pdf/${arxivId}.pdf`,
        codeUrl: paper.official_code_url || paper.github_url || null,
        publishedAt: new Date(paper.published || Date.now()),
        tags: extractTagsFromText(paper.title),
        views: 0,
        citations: 0,
        stars: paper.stars || 0,
        trending: true,
        qualityScore: (paper.stars || 0) * 2,
        source: 'paperswithcode',
        sourceUrl: `https://paperswithcode.com/paper/${paper.id}`
      };
    });

    console.log(`  ✅ 从Papers with Code获取到 ${papers.length} 篇论文`);
    return papers;
  } catch (error) {
    console.error('Papers with Code爬取失败:', error.message);
    return [];
  }
}

/**
 * 从Hugging Face Papers获取每日热门
 */
async function fetchFromHuggingFace(limit = 20) {
  console.log('📡 从Hugging Face Papers获取每日热门...');
  
  try {
    // Hugging Face Papers API - 添加重试机制
    const response = await axiosRetry('https://huggingface.co/api/daily_papers', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 30000  // 增加到30秒
    }, 3);  // 增加到3次重试

    if (!response.data) {
      console.log('  ⚠️  Hugging Face响应为空');
      return [];
    }

    const papers = response.data.slice(0, limit).map(paper => {
      const arxivId = paper.paper?.id || paper.id;
      
      return {
        paperId: `arxiv_${arxivId}`,
        title: paper.paper?.title || paper.title,
        abstract: paper.paper?.summary || '',
        authors: paper.paper?.authors || [],
        category: detectCategoryFromText(paper.paper?.title || paper.title),
        conference: 'arXiv',
        arxivUrl: `https://arxiv.org/abs/${arxivId}`,
        pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
        publishedAt: new Date(paper.publishedAt || Date.now()),
        tags: extractTagsFromText(paper.paper?.title || paper.title),
        views: paper.upvotes || 0,
        citations: 0,
        trending: true,
        qualityScore: (paper.upvotes || 0) * 3,
        source: 'huggingface',
        sourceUrl: `https://huggingface.co/papers/${arxivId}`
      };
    });

    console.log(`  ✅ 从Hugging Face获取到 ${papers.length} 篇论文`);
    return papers;
  } catch (error) {
    console.error('Hugging Face爬取失败:', error.message);
    return [];
  }
}

/**
 * 从Twitter/X搜索AI论文相关推文
 * 注意：需要Twitter API密钥
 */
async function fetchFromTwitter(limit = 20) {
  console.log('📡 从Twitter搜索AI论文...');
  
  const twitterApiKey = process.env.TWITTER_BEARER_TOKEN;
  
  if (!twitterApiKey) {
    console.log('  ⚠️  未配置Twitter API密钥，跳过');
    return [];
  }

  try {
    // 搜索包含arXiv链接的热门推文
    const searchQuery = '(arxiv.org OR "new paper") (AI OR "machine learning" OR "deep learning") -is:retweet';
    
    const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
      headers: {
        'Authorization': `Bearer ${twitterApiKey}`,
        'User-Agent': 'Mozilla/5.0'
      },
      params: {
        query: searchQuery,
        max_results: limit,
        'tweet.fields': 'created_at,public_metrics,entities',
        expansions: 'author_id',
        'user.fields': 'username,verified'
      },
      timeout: 10000
    });

    if (!response.data || !response.data.data) {
      console.log('  ⚠️  Twitter响应为空');
      return [];
    }

    const papers = [];
    for (const tweet of response.data.data) {
      const paper = extractPaperFromTweet(tweet);
      if (paper) {
        papers.push(paper);
      }
    }

    console.log(`  ✅ 从Twitter获取到 ${papers.length} 篇论文`);
    return papers;
  } catch (error) {
    console.error('Twitter爬取失败:', error.message);
    return [];
  }
}

/**
 * 从推文中提取论文信息
 */
function extractPaperFromTweet(tweet) {
  try {
    // 从推文URL中提取arXiv链接
    const urls = tweet.entities?.urls || [];
    let arxivUrl = null;
    let arxivId = null;

    for (const url of urls) {
      const expandedUrl = url.expanded_url || url.url;
      const match = expandedUrl.match(/arxiv\.org\/(abs|pdf)\/(\d+\.\d+)/);
      if (match) {
        arxivId = match[2];
        arxivUrl = `https://arxiv.org/abs/${arxivId}`;
        break;
      }
    }

    if (!arxivId) {
      return null;
    }

    return {
      paperId: `arxiv_${arxivId}`,
      title: tweet.text.split('http')[0].trim(), // 提取链接前的文本作为标题
      abstract: '',
      authors: [],
      category: detectCategoryFromText(tweet.text),
      conference: 'arXiv',
      arxivUrl: arxivUrl,
      pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
      publishedAt: new Date(tweet.created_at),
      tags: extractTagsFromText(tweet.text),
      views: (tweet.public_metrics?.like_count || 0) * 2 + (tweet.public_metrics?.retweet_count || 0) * 5,
      citations: 0,
      trending: true,
      qualityScore: calculateTwitterScore(tweet),
      source: 'twitter',
      sourceUrl: `https://twitter.com/i/web/status/${tweet.id}`
    };
  } catch (error) {
    console.error('提取Twitter推文失败:', error.message);
    return null;
  }
}

/**
 * 综合爬取：从所有渠道获取论文
 */
async function crawlAllSources(options = {}) {
  const {
    reddit = true,
    papersWithCode = true,
    huggingface = true,
    twitter = false, // Twitter需要API密钥，默认关闭
    limit = 20
  } = options;

  console.log('\n🚀 开始综合爬取论文...\n');
  
  const promises = [];
  
  if (reddit) {
    promises.push(fetchFromReddit(limit));
  }
  
  if (papersWithCode) {
    promises.push(fetchFromPapersWithCode(limit));
  }
  
  if (huggingface) {
    promises.push(fetchFromHuggingFace(limit));
  }
  
  if (twitter) {
    promises.push(fetchFromTwitter(limit));
  }

  try {
    const results = await Promise.allSettled(promises);
    
    const allPapers = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allPapers.push(...result.value);
      } else {
        console.error(`渠道 ${index + 1} 失败:`, result.reason);
      }
    });

    // 去重（基于paperId）
    const uniquePapers = deduplicatePapers(allPapers);

    // 按质量分数排序
    uniquePapers.sort((a, b) => b.qualityScore - a.qualityScore);

    console.log(`\n✅ 综合爬取完成: 共获取 ${uniquePapers.length} 篇去重后的论文\n`);

    // 保存到数据库
    await savePapersToDatabase(uniquePapers);

    return {
      success: true,
      total: uniquePapers.length,
      papers: uniquePapers,
      sources: {
        reddit: reddit ? uniquePapers.filter(p => p.source === 'reddit').length : 0,
        papersWithCode: papersWithCode ? uniquePapers.filter(p => p.source === 'paperswithcode').length : 0,
        huggingface: huggingface ? uniquePapers.filter(p => p.source === 'huggingface').length : 0,
        twitter: twitter ? uniquePapers.filter(p => p.source === 'twitter').length : 0
      }
    };
  } catch (error) {
    console.error('综合爬取失败:', error);
    return {
      success: false,
      error: error.message,
      total: 0,
      papers: []
    };
  }
}

/**
 * 保存论文到数据库
 */
async function savePapersToDatabase(papersArray) {
  try {
    if (!papersArray || papersArray.length === 0) {
      console.log('  ⚠️  没有论文需要保存');
      return { upsertedCount: 0, modifiedCount: 0 };
    }

    // 转换为数据库格式
    const paperDocuments = papersArray.map(paper => ({
      paperId: paper.paperId,
      title: paper.title || 'Untitled',
      abstract: paper.abstract || '',
      authors: paper.authors || [],
      category: paper.category || 'other',
      conference: paper.conference || 'arXiv',
      arxivUrl: paper.arxivUrl || '',
      pdfUrl: paper.pdfUrl || '',
      codeUrl: paper.codeUrl || '',
      projectUrl: paper.projectUrl || '',
      tags: paper.tags || [],
      publishedAt: paper.publishedAt || new Date(),
      citations: paper.citations || 0,
      views: paper.views || 0,
      stars: paper.stars || 0,
      trending: paper.trending !== undefined ? paper.trending : true,
      qualityScore: paper.qualityScore || 0,
      fetchedAt: new Date(),
      status: 'active'
    }));

    // 批量插入或更新
    const result = await Paper.upsertMany(paperDocuments);
    
    console.log(`💾 成功保存 ${result.upsertedCount + result.modifiedCount} 篇论文到数据库`);
    console.log(`   - 新增: ${result.upsertedCount} 篇`);
    console.log(`   - 更新: ${result.modifiedCount} 篇`);
    
    return result;
  } catch (error) {
    console.error('保存论文到数据库失败:', error.message);
    throw error;
  }
}

/**
 * 去重论文
 */
function deduplicatePapers(papers) {
  const seen = new Map();
  
  papers.forEach(paper => {
    const existing = seen.get(paper.paperId);
    if (!existing || paper.qualityScore > existing.qualityScore) {
      seen.set(paper.paperId, paper);
    }
  });

  return Array.from(seen.values());
}

/**
 * 从文本中检测分类
 */
function detectCategoryFromText(text) {
  const textLower = text.toLowerCase();
  
  if (textLower.match(/vision|image|video|detection|segmentation|object|visual|cv|vit/)) {
    return 'cv';
  }
  if (textLower.match(/nlp|language|text|bert|gpt|llm|transformer|translation|summarization/)) {
    return 'nlp';
  }
  if (textLower.match(/reinforcement|rl|agent|policy|reward/)) {
    return 'rl';
  }
  if (textLower.match(/robot|manipulation|navigation|control/)) {
    return 'robotics';
  }
  if (textLower.match(/audio|speech|sound|voice|music/)) {
    return 'audio';
  }
  if (textLower.match(/multimodal|cross-modal|vision-language|vlm/)) {
    return 'multimodal';
  }
  
  return 'ml';
}

/**
 * 从文本中提取标签
 */
function extractTagsFromText(text) {
  const tags = [];
  const textLower = text.toLowerCase();
  
  const keywords = {
    'LLM': /\b(llm|large language model|gpt|bert|t5|llama|mistral)\b/i,
    'Transformer': /\btransformer\b/i,
    'Diffusion': /\bdiffusion\b/i,
    'Reinforcement Learning': /\b(rl|reinforcement learning|policy|agent)\b/i,
    'Computer Vision': /\b(cv|computer vision|image|visual)\b/i,
    'NLP': /\b(nlp|natural language|text)\b/i,
    'Multimodal': /\b(multimodal|cross-modal|vision-language)\b/i,
    'Fine-tuning': /\b(fine-tun|finetun|adaptation)\b/i,
    'Pre-training': /\b(pretrain|pre-train)\b/i,
    'Few-shot': /\b(few-shot|zero-shot|one-shot)\b/i,
    'Generation': /\b(generation|generative|generate)\b/i,
    'Classification': /\bclassification\b/i,
    'Detection': /\bdetection\b/i,
    'Segmentation': /\bsegmentation\b/i
  };

  Object.entries(keywords).forEach(([tag, pattern]) => {
    if (pattern.test(textLower)) {
      tags.push(tag);
    }
  });

  return tags.slice(0, 5);
}

/**
 * 计算Reddit帖子分数
 */
function calculateRedditScore(post) {
  return Math.round(
    post.score * 2 + 
    post.num_comments * 5 + 
    (post.upvote_ratio || 0.5) * 50
  );
}

/**
 * 计算Twitter推文分数
 */
function calculateTwitterScore(tweet) {
  const metrics = tweet.public_metrics || {};
  return Math.round(
    (metrics.like_count || 0) * 2 +
    (metrics.retweet_count || 0) * 5 +
    (metrics.reply_count || 0) * 3 +
    (metrics.quote_count || 0) * 4
  );
}

module.exports = {
  fetchFromReddit,
  fetchFromPapersWithCode,
  fetchFromHuggingFace,
  fetchFromTwitter,
  crawlAllSources,
  savePapersToDatabase
};

