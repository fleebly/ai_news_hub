const axios = require('axios');
const xml2js = require('xml2js');
const NodeCache = require('node-cache');
const Paper = require('../models/Paper');

// 创建缓存实例，缓存30分钟
const cache = new NodeCache({ stdTTL: 1800 });

/**
 * arXiv分类对应关系
 * https://arxiv.org/category_taxonomy
 */
const ARXIV_CATEGORIES = {
  'cs.AI': { name: 'Artificial Intelligence', ccf: 'A', conference: 'AAAI/IJCAI' },
  'cs.LG': { name: 'Machine Learning', ccf: 'A', conference: 'NeurIPS/ICML/ICLR' },
  'cs.CV': { name: 'Computer Vision', ccf: 'A', conference: 'CVPR/ICCV' },
  'cs.CL': { name: 'Natural Language Processing', ccf: 'A', conference: 'ACL/EMNLP' },
  'cs.RO': { name: 'Robotics', ccf: 'B', conference: 'ICRA/IROS' },
  'cs.NE': { name: 'Neural Networks', ccf: 'A', conference: 'NeurIPS' },
};

/**
 * CCF-A类顶会列表
 */
const CCF_A_CONFERENCES = [
  // AI领域
  { id: 'aaai', name: 'AAAI', fullName: 'AAAI Conference on Artificial Intelligence', category: 'nlp' },
  { id: 'ijcai', name: 'IJCAI', fullName: 'International Joint Conference on Artificial Intelligence', category: 'nlp' },
  { id: 'neurips', name: 'NeurIPS', fullName: 'Neural Information Processing Systems', category: 'ml' },
  { id: 'icml', name: 'ICML', fullName: 'International Conference on Machine Learning', category: 'ml' },
  { id: 'iclr', name: 'ICLR', fullName: 'International Conference on Learning Representations', category: 'ml' },
  
  // 计算机视觉
  { id: 'cvpr', name: 'CVPR', fullName: 'IEEE/CVF Conference on Computer Vision and Pattern Recognition', category: 'cv' },
  { id: 'iccv', name: 'ICCV', fullName: 'IEEE International Conference on Computer Vision', category: 'cv' },
  
  // 自然语言处理
  { id: 'acl', name: 'ACL', fullName: 'Annual Meeting of the Association for Computational Linguistics', category: 'nlp' },
  { id: 'emnlp', name: 'EMNLP', fullName: 'Conference on Empirical Methods in Natural Language Processing', category: 'nlp' },
  
  // 数据挖掘
  { id: 'kdd', name: 'KDD', fullName: 'ACM SIGKDD Conference on Knowledge Discovery and Data Mining', category: 'ml' },
  { id: 'www', name: 'WWW', fullName: 'The Web Conference', category: 'ml' },
];

/**
 * 从arXiv抓取论文
 */
async function fetchArxivPapers(category = 'cs.AI', maxResults = 50) {
  const cacheKey = `arxiv_${category}_${maxResults}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const query = `cat:${category}`;
    const url = 'http://export.arxiv.org/api/query';
    
    const response = await axios.get(url, {
      params: {
        search_query: query,
        sortBy: 'submittedDate',
        sortOrder: 'descending',
        max_results: maxResults
      },
      timeout: 10000
    });

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    
    if (!result.feed || !result.feed.entry) {
      return [];
    }

    const papers = result.feed.entry.map(entry => {
      const arxivId = entry.id[0].split('/abs/')[1];
      const authors = entry.author ? entry.author.map(a => a.name[0]) : [];
      const categories = entry.category ? entry.category.map(c => c.$.term) : [];
      const published = new Date(entry.published[0]);
      
      return {
        id: `arxiv_${arxivId}`,
        arxivId: arxivId,
        title: entry.title[0].trim().replace(/\n/g, ' '),
        authors: authors,
        conference: 'arXiv',
        category: detectCategory(categories),
        publishedAt: published.toISOString().split('T')[0],
        abstract: entry.summary[0].trim().replace(/\n/g, ' ').slice(0, 500),
        tags: extractTags(entry.title[0], categories),
        citations: Math.floor(Math.random() * 1000) + 100, // 模拟数据
        views: Math.floor(Math.random() * 10000) + 1000,
        pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
        arxivUrl: `https://arxiv.org/abs/${arxivId}`,
        trending: isRecent(published),
        categories: categories
      };
    });

    cache.set(cacheKey, papers);
    return papers;
  } catch (error) {
    console.error(`Error fetching arXiv papers for ${category}:`, error.message);
    return [];
  }
}

/**
 * 获取多个分类的论文
 * 优先从数据库读取，后台同步更新
 */
async function fetchMultiCategoryPapers(categories = ['cs.AI', 'cs.LG', 'cs.CV', 'cs.CL'], maxPerCategory = 20, forceRefresh = false) {
  try {
    // 1. 尝试从数据库获取
    if (!forceRefresh) {
      const dbPapers = await Paper.getLatest(100);
      if (dbPapers && dbPapers.length > 0) {
        console.log(`✅ 从数据库返回 ${dbPapers.length} 篇论文`);
        // 转换数据库格式为API格式
        return dbPapers.map(paper => ({
          id: paper.paperId,
          arxivId: paper.paperId.replace('arxiv_', ''),
          title: paper.title,
          authors: paper.authors,
          conference: paper.conference,
          category: paper.category,
          publishedAt: paper.publishedAt.toISOString().split('T')[0],
          abstract: paper.abstract,
          tags: paper.tags,
          citations: paper.citations,
          views: paper.views,
          pdfUrl: paper.pdfUrl,
          arxivUrl: paper.arxivUrl,
          codeUrl: paper.codeUrl,
          trending: paper.trending,
          hotScore: paper.qualityScore
        }));
      }
    }

    // 2. 数据库为空或强制刷新，从arXiv获取
    console.log('📡 从arXiv获取论文...');
    const promises = categories.map(cat => fetchArxivPapers(cat, maxPerCategory));
    const results = await Promise.allSettled(promises);
    
    const allPapers = [];
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allPapers.push(...result.value);
      }
    });

    // 去重（基于arxivId）
    const uniquePapers = Array.from(
      new Map(allPapers.map(p => [p.arxivId, p])).values()
    );

    // 按发布时间排序
    uniquePapers.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // 计算热门度并标记
    const enrichedPapers = uniquePapers.map(paper => ({
      ...paper,
      trending: calculateTrending(paper),
      hotScore: calculateHotScore(paper)
    }));

    // 3. 保存到数据库（后台操作，不阻塞返回）
    savePapersToDatabase(enrichedPapers).catch(err => {
      console.error('保存论文到数据库失败:', err.message);
    });

    return enrichedPapers;
  } catch (error) {
    console.error('Error fetching multi-category papers:', error);
    return [];
  }
}

/**
 * 保存论文到数据库
 */
async function savePapersToDatabase(papersArray) {
  try {
    // 转换为数据库格式
    const paperDocuments = papersArray.map(paper => ({
      paperId: paper.id,
      title: paper.title,
      abstract: paper.abstract,
      authors: paper.authors || [],
      category: paper.category || 'other',
      conference: paper.conference || 'arXiv',
      arxivUrl: paper.arxivUrl || '',
      pdfUrl: paper.pdfUrl || '',
      codeUrl: paper.codeUrl || '',
      tags: paper.tags || [],
      publishedAt: new Date(paper.publishedAt),
      citations: paper.citations || 0,
      views: paper.views || 0,
      trending: paper.trending || false,
      qualityScore: paper.hotScore || 0,
      fetchedAt: new Date()
    }));

    // 批量插入或更新
    const result = await Paper.upsertMany(paperDocuments);
    console.log(`💾 成功保存 ${result.upsertedCount + result.modifiedCount} 篇论文到数据库`);
    
    return result;
  } catch (error) {
    console.error('保存论文到数据库失败:', error);
    throw error;
  }
}

/**
 * 搜索arXiv论文
 */
async function searchArxivPapers(keywords, maxResults = 30) {
  const cacheKey = `search_${keywords}_${maxResults}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const query = `all:${keywords}`;
    const url = 'http://export.arxiv.org/api/query';
    
    const response = await axios.get(url, {
      params: {
        search_query: query,
        sortBy: 'relevance',
        max_results: maxResults
      },
      timeout: 10000
    });

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    
    if (!result.feed || !result.feed.entry) {
      return [];
    }

    const papers = result.feed.entry.map(entry => {
      const arxivId = entry.id[0].split('/abs/')[1];
      const authors = entry.author ? entry.author.map(a => a.name[0]) : [];
      const categories = entry.category ? entry.category.map(c => c.$.term) : [];
      
      return {
        id: `arxiv_${arxivId}`,
        arxivId: arxivId,
        title: entry.title[0].trim().replace(/\n/g, ' '),
        authors: authors,
        conference: 'arXiv',
        category: detectCategory(categories),
        publishedAt: new Date(entry.published[0]).toISOString().split('T')[0],
        abstract: entry.summary[0].trim().replace(/\n/g, ' ').slice(0, 500),
        tags: extractTags(entry.title[0], categories),
        pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
        arxivUrl: `https://arxiv.org/abs/${arxivId}`,
        trending: false,
        categories: categories
      };
    });

    cache.set(cacheKey, papers);
    return papers;
  } catch (error) {
    console.error('Error searching arXiv papers:', error.message);
    return [];
  }
}

/**
 * 检测论文分类
 */
function detectCategory(categories) {
  if (categories.some(c => c.includes('cs.CV'))) return 'cv';
  if (categories.some(c => c.includes('cs.CL') || c.includes('cs.AI'))) return 'nlp';
  if (categories.some(c => c.includes('cs.LG') || c.includes('cs.NE'))) return 'ml';
  if (categories.some(c => c.includes('cs.RO'))) return 'robotics';
  return 'ml';
}

/**
 * 提取标签
 */
function extractTags(title, categories) {
  const tags = [];
  const titleLower = title.toLowerCase();
  
  // 从标题提取关键词
  const keywords = [
    'GPT', 'BERT', 'Transformer', 'Attention', 'LLM', 'Large Language Model',
    'Diffusion', 'GAN', 'VAE', 'ResNet', 'CNN', 'Vision', 'Multimodal',
    'Reinforcement Learning', 'RL', 'Deep Learning', 'Neural Network',
    'Classification', 'Detection', 'Segmentation', 'Generation',
    'Pre-training', 'Fine-tuning', 'Transfer Learning', 'Few-shot',
    'Self-supervised', 'Contrastive', 'Prompt', 'In-context Learning'
  ];

  keywords.forEach(keyword => {
    if (titleLower.includes(keyword.toLowerCase())) {
      tags.push(keyword);
    }
  });

  // 从分类提取
  categories.forEach(cat => {
    if (cat.includes('cs.CV')) tags.push('Computer Vision');
    if (cat.includes('cs.CL')) tags.push('NLP');
    if (cat.includes('cs.AI')) tags.push('AI');
    if (cat.includes('cs.LG')) tags.push('Machine Learning');
  });

  // 去重并限制数量
  return [...new Set(tags)].slice(0, 5);
}

/**
 * 判断是否是最近的论文（7天内）
 */
function isRecent(publishDate) {
  const now = new Date();
  const diff = now - publishDate;
  const days = diff / (1000 * 60 * 60 * 24);
  return days <= 7;
}

/**
 * 计算热门度
 */
function calculateTrending(paper) {
  const published = new Date(paper.publishedAt);
  const now = new Date();
  const daysDiff = (now - published) / (1000 * 60 * 60 * 24);
  
  // 30天内的论文才可能是热门
  if (daysDiff > 30) return false;
  
  // 基于时间衰减和引用量
  const timeScore = Math.max(0, 1 - daysDiff / 30);
  const citationScore = Math.min(paper.citations / 1000, 1);
  const viewScore = Math.min(paper.views / 10000, 1);
  
  const totalScore = timeScore * 0.5 + citationScore * 0.3 + viewScore * 0.2;
  
  return totalScore > 0.6;
}

/**
 * 计算热度分数
 */
function calculateHotScore(paper) {
  const published = new Date(paper.publishedAt);
  const now = new Date();
  const daysDiff = (now - published) / (1000 * 60 * 60 * 24);
  
  const timeScore = Math.max(0, 100 - daysDiff);
  const citationScore = Math.log10(paper.citations + 1) * 10;
  const viewScore = Math.log10(paper.views + 1) * 5;
  
  return Math.round(timeScore + citationScore + viewScore);
}

/**
 * 清除缓存并强制刷新数据
 */
async function clearCache() {
  cache.flushAll();
  
  // 强制刷新：从arXiv获取最新数据并保存到数据库
  try {
    await fetchMultiCategoryPapers(['cs.AI', 'cs.LG', 'cs.CV', 'cs.CL'], 20, true);
    return { success: true, message: '缓存已清除，数据已从arXiv刷新' };
  } catch (error) {
    return { success: true, message: '缓存已清除，但数据刷新失败: ' + error.message };
  }
}

module.exports = {
  fetchArxivPapers,
  fetchMultiCategoryPapers,
  searchArxivPapers,
  clearCache,
  CCF_A_CONFERENCES,
  ARXIV_CATEGORIES
};

