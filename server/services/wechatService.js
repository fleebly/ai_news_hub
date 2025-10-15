const axios = require('axios');
const NodeCache = require('node-cache');

// 创建缓存实例，缓存2小时
const cache = new NodeCache({ stdTTL: 7200 });

/**
 * 知名AI领域微信公众号列表
 * 由于微信公众号获取文章需要API授权，这里提供配置化的公众号列表
 */
const AI_WECHAT_ACCOUNTS = [
  {
    id: 'jiqizhixin',
    name: '机器之心',
    account: 'almosthuman2014',
    description: '专业的人工智能媒体和产业服务平台',
    avatar: 'https://mmbiz.qpic.cn/mmbiz_jpg/KmXPKA19gW8Ol4ibnmVXJECqzN1ZHXpYdibJzSmzYAia3VFnvXwHLQBNAY0OqzHkZ5MKLgNOq4ibibqxVLibGCcicC9g/0?wx_fmt=jpeg',
    category: 'AI资讯',
    priority: 10,
    topics: ['机器学习', '深度学习', 'AI应用', '论文解读']
  },
  {
    id: 'aifront',
    name: 'AI前线',
    account: 'ai-front',
    description: 'InfoQ旗下AI技术社区',
    avatar: 'https://mmbiz.qpic.cn/mmbiz_jpg/KmXPKA19gW8Ol4ibnmVXJECqzN1ZHXpYdibJzSmzYAia3VFnvXwHLQBNAY0OqzHkZ5MKLgNOq4ibibqxVLibGCcicC9g/0?wx_fmt=jpeg',
    category: 'AI技术',
    priority: 9,
    topics: ['AI工程', 'MLOps', '大模型应用']
  },
  {
    id: 'xinzhiyuan',
    name: '新智元',
    account: 'AI_era',
    description: '中国人工智能产业智库',
    avatar: 'https://mmbiz.qpic.cn/mmbiz_jpg/KmXPKA19gW8Ol4ibnmVXJECqzN1ZHXpYdibJzSmzYAia3VFnvXwHLQBNAY0OqzHkZ5MKLgNOq4ibibqxVLibGCcicC9g/0?wx_fmt=jpeg',
    category: 'AI资讯',
    priority: 9,
    topics: ['AI新闻', '产业动态', '技术趋势']
  },
  {
    id: 'qbitai',
    name: '量子位',
    account: 'QbitAI',
    description: '追踪人工智能新趋势，关注科技行业新突破',
    avatar: 'https://mmbiz.qpic.cn/mmbiz_jpg/KmXPKA19gW8Ol4ibnmVXJECqzN1ZHXpYdibJzSmzYAia3VFnvXwHLQBNAY0OqzHkZ5MKLgNOq4ibibqxVLibGCcicC9g/0?wx_fmt=jpeg',
    category: 'AI资讯',
    priority: 10,
    topics: ['AI应用', '创业公司', '技术突破']
  },
  {
    id: 'leiphone-sz',
    name: '雷峰网',
    account: 'leiphone-sz',
    description: '关注智能与未来',
    avatar: 'https://mmbiz.qpic.cn/mmbiz_jpg/KmXPKA19gW8Ol4ibnmVXJECqzN1ZHXpYdibJzSmzYAia3VFnvXwHLQBNAY0OqzHkZ5MKLgNOq4ibibqxVLibGCcicC9g/0?wx_fmt=jpeg',
    category: 'AI资讯',
    priority: 8,
    topics: ['智能硬件', 'AI产业', '技术分析']
  },
  {
    id: 'deeptech',
    name: 'DeepTech深科技',
    account: 'deeptechchina',
    description: '关注全球新兴科技产业化',
    avatar: 'https://mmbiz.qpic.cn/mmbiz_jpg/KmXPKA19gW8Ol4ibnmVXJECqzN1ZHXpYdibJzSmzYAia3VFnvXwHLQBNAY0OqzHkZ5MKLgNOq4ibibqxVLibGCcicC9g/0?wx_fmt=jpeg',
    category: 'AI资讯',
    priority: 8,
    topics: ['科技创新', 'AI前沿', '产业分析']
  }
];

/**
 * 生成模拟的微信文章数据
 * 实际生产环境中，应该接入微信API或第三方数据源
 */
function generateMockWechatArticles() {
  const articles = [];
  const now = Date.now();
  
  AI_WECHAT_ACCOUNTS.forEach((account, accountIndex) => {
    // 为每个公众号生成5-8篇文章
    const articleCount = 5 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < articleCount; i++) {
      const dayOffset = accountIndex * 5 + i;
      const publishedAt = new Date(now - dayOffset * 24 * 60 * 60 * 1000);
      
      const titles = {
        'jiqizhixin': [
          '最新GPT-5架构曝光！多模态能力全面升级',
          'Meta发布最强开源模型Llama 4，性能逼近GPT-4',
          '斯坦福发布AI Agent新框架，自主决策能力提升10倍',
          '国产大模型突破！清华团队提出全新训练方法',
          '一文详解Transformer演进史：从BERT到GPT-4'
        ],
        'aifront': [
          'LangChain 2.0发布：构建AI应用更简单了',
          '如何优化大模型推理速度？实战经验分享',
          'AI工程师必备：2024年MLOps工具链全景图',
          '从0到1搭建企业级RAG系统完整指南',
          'Stable Diffusion 3.0实战：图像生成质量大幅提升'
        ],
        'xinzhiyuan': [
          '震撼！OpenAI新产品发布会全记录',
          '中国AI产业报告：大模型商业化加速',
          '马斯克xAI获新一轮融资，估值冲击500亿',
          'AI取代程序员？行业专家这样说',
          '2024年最值得关注的10大AI趋势'
        ],
        'qbitai': [
          '00后大学生用AI一周开发出爆款APP',
          'GitHub Copilot使用量破千万，开发效率提升40%',
          '这家AI初创公司，刚成立3个月就被收购',
          'AI生成视频又进化了！效果堪比好莱坞',
          '清华姚班学生创业做AI，半年融资过亿'
        ],
        'leiphone-sz': [
          '智能音箱市场大洗牌，AI助手成关键',
          '自动驾驶进入新阶段，L4级量产在即',
          'AI芯片战争：英伟达的挑战者们',
          '扫地机器人新突破，真正实现自主决策',
          '可穿戴设备+AI，健康监测革命来临'
        ],
        'deeptech': [
          '神经形态芯片：AI硬件的下一个风口',
          '量子计算+AI：可能改变一切的组合',
          '脑机接口最新进展，人机融合不再是科幻',
          'AI for Science：科学研究范式的革命',
          '合成生物学遇见AI，生命科学迎来奇点'
        ]
      };
      
      const summaries = {
        'jiqizhixin': [
          '据知情人士透露，OpenAI即将发布的GPT-5在多模态理解、推理能力等方面都有显著提升。本文详细解析了新架构的技术细节和可能的应用场景。',
          'Meta AI团队正式发布Llama 4系列模型，包括多个规模版本。基准测试显示，其性能已经接近GPT-4水平，且完全开源。',
          '斯坦福大学研究团队提出的新型AI Agent框架，通过改进规划和决策机制，使Agent能够更好地完成复杂任务。',
          '清华大学团队在大模型训练效率上取得突破，新方法可以将训练时间缩短50%，同时保持模型性能。',
          '从2017年的Transformer诞生，到如今的GPT-4，本文梳理了自注意力机制在NLP领域的发展脉络。'
        ],
        'aifront': [
          'LangChain 2.0带来了更直观的API设计和更强大的功能，让开发者可以更快速地构建生产级AI应用。',
          '分享在实际项目中优化大模型推理的经验，包括量化、缓存、批处理等多种技术手段。',
          '全面盘点2024年MLOps领域的主流工具，包括模型训练、部署、监控等各个环节。',
          '详细介绍如何从零开始构建企业级RAG系统，涵盖向量数据库选型、检索优化等关键环节。',
          'Stable Diffusion 3.0在图像细节、文本渲染等方面都有显著改进，本文通过实例展示其强大能力。'
        ],
        'xinzhiyuan': [
          'OpenAI春季发布会推出了多款新产品，包括GPT-4.5、新版DALL-E等，引发行业热议。',
          '报告显示，中国大模型厂商已超过100家，商业化落地案例快速增长，产业进入新阶段。',
          'xAI完成新一轮融资，Grok模型的表现得到投资者认可，估值大幅提升。',
          '多位行业专家深度探讨AI对程序员职业的影响，认为AI是工具而非替代者。',
          '从技术突破到应用落地，盘点2024年最值得关注的AI发展趋势。'
        ],
        'qbitai': [
          '一位00后大学生利用Claude和GPT-4，仅用一周时间就开发出月活10万+的应用。',
          'GitHub官方数据显示，Copilot已被超过1000万开发者使用，显著提升了编程效率。',
          '这家专注于垂直领域AI的初创公司，凭借独特的技术优势被大厂收购。',
          '最新的AI视频生成技术可以创造出电影级别的画面效果，成本却大幅降低。',
          '清华姚班学生创立的AI公司，凭借创新的技术方案快速获得资本青睐。'
        ],
        'leiphone-sz': [
          '随着大模型的加入，智能音箱的交互体验有了质的飞跃，市场格局或将重塑。',
          '多家车企宣布L4级自动驾驶即将量产，自动驾驶真正走向大众市场。',
          '多家芯片公司挑战英伟达在AI芯片领域的统治地位，竞争日趋激烈。',
          '新一代扫地机器人搭载多模态大模型，能够真正理解环境并做出智能决策。',
          '结合AI能力的可穿戴设备，可以实现7×24小时的健康监测和预警。'
        ],
        'deeptech': [
          '神经形态芯片模仿大脑工作方式，有望突破传统AI芯片的能效瓶颈。',
          '量子计算与AI的结合可能带来计算能力的指数级提升，多个研究团队取得进展。',
          'Neuralink等公司在脑机接口领域不断突破，人机交互迎来新时代。',
          'AI正在加速科学发现过程，从材料科学到药物研发都出现了突破性进展。',
          'AI与合成生物学的交叉应用，正在开创生命科学研究的新范式。'
        ]
      };
      
      const accountTitles = titles[account.id] || titles['jiqizhixin'];
      const accountSummaries = summaries[account.id] || summaries['jiqizhixin'];
      
      const title = accountTitles[i % accountTitles.length];
      const summary = accountSummaries[i % accountSummaries.length];
      
      // 生成唯一ID
      const id = `wechat_${account.id}_${i}_${Date.now()}`;
      
      // 为不同公众号使用不同的封面图
      const coverImages = [
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1676277791608-ac52a2f66b47?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=800&h=600&fit=crop&q=80'
      ];
      
      const hash = (title + account.name).split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      
      articles.push({
        id,
        title,
        summary,
        content: summary, // 实际应该是完整的文章内容
        account: account.name,
        accountId: account.account,
        accountAvatar: account.avatar,
        category: account.category,
        publishedAt: publishedAt.toISOString(),
        link: `https://mp.weixin.qq.com/s/${id}`, // 模拟的微信文章链接
        coverImage: coverImages[Math.abs(hash) % coverImages.length],
        topics: account.topics,
        readTime: `${3 + Math.floor(Math.random() * 7)}分钟`,
        views: Math.floor(Math.random() * 50000) + 10000,
        likes: Math.floor(Math.random() * 5000) + 500,
        comments: Math.floor(Math.random() * 500) + 50,
        featured: account.priority >= 9 && i === 0,
        priority: account.priority
      });
    }
  });
  
  // 按优先级和发布时间排序
  articles.sort((a, b) => {
    const priorityDiff = b.priority - a.priority;
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });
  
  return articles;
}

/**
 * 获取所有微信公众号文章
 */
async function fetchAllWechatArticles(limit = 50) {
  const cacheKey = `wechat_articles_${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    console.log('Fetching WeChat articles...');
    
    // TODO: 实际生产环境中，这里应该调用微信API或第三方服务
    // 目前使用模拟数据
    const articles = generateMockWechatArticles();
    
    const result = articles.slice(0, limit);
    cache.set(cacheKey, result);
    
    console.log(`✅ Successfully fetched ${result.length} WeChat articles`);
    return result;
    
  } catch (error) {
    console.error('Error fetching WeChat articles:', error);
    return [];
  }
}

/**
 * 按公众号筛选文章
 */
async function fetchArticlesByAccount(accountId, limit = 20) {
  const allArticles = await fetchAllWechatArticles(100);
  
  if (!accountId || accountId === 'all') {
    return allArticles.slice(0, limit);
  }
  
  const filtered = allArticles.filter(article => 
    article.accountId === accountId
  );
  
  return filtered.slice(0, limit);
}

/**
 * 按分类筛选文章
 */
async function fetchArticlesByCategory(category, limit = 20) {
  const allArticles = await fetchAllWechatArticles(100);
  
  if (!category || category === 'all') {
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
async function searchArticles(keywords, limit = 20) {
  const allArticles = await fetchAllWechatArticles(100);
  const keywordsLower = keywords.toLowerCase();
  
  const filtered = allArticles.filter(article => 
    article.title.toLowerCase().includes(keywordsLower) ||
    article.summary.toLowerCase().includes(keywordsLower) ||
    article.account.toLowerCase().includes(keywordsLower)
  );
  
  return filtered.slice(0, limit);
}

/**
 * 获取精选文章
 */
async function getFeaturedArticles(limit = 10) {
  const allArticles = await fetchAllWechatArticles(50);
  const featured = allArticles.filter(article => article.featured);
  return featured.slice(0, limit);
}

/**
 * 获取公众号列表
 */
function getWechatAccounts() {
  return AI_WECHAT_ACCOUNTS;
}

/**
 * 清除缓存
 */
function clearCache() {
  cache.flushAll();
  return { success: true, message: 'WeChat articles cache cleared' };
}

module.exports = {
  fetchAllWechatArticles,
  fetchArticlesByAccount,
  fetchArticlesByCategory,
  searchArticles,
  getFeaturedArticles,
  getWechatAccounts,
  clearCache
};

