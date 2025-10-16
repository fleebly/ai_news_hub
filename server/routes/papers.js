const express = require('express');
const arxivService = require('../services/arxivService');

const router = express.Router();

/**
 * GET /api/papers
 * 获取论文列表（混合arXiv实时数据和精选论文）
 */
router.get('/papers', async (req, res) => {
  try {
    const { category, conference, search, limit = 50 } = req.query;
    
    console.log('Fetching papers...', { category, conference, search });
    
    let papers = [];
    
    // 如果有搜索关键词，使用搜索API
    if (search) {
      papers = await arxivService.searchArxivPapers(search, parseInt(limit));
    } else {
      // 否则从多个分类获取最新论文
      const categories = ['cs.AI', 'cs.LG', 'cs.CV', 'cs.CL'];
      papers = await arxivService.fetchMultiCategoryPapers(categories, 15);
    }
    
    // 添加精选论文（经典论文）
    const curatedPapers = getCuratedPapers();
    papers = [...curatedPapers, ...papers];
    
    // 按热度分数排序
    papers.sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0));
    
    // 应用过滤
    if (category && category !== 'all') {
      papers = papers.filter(p => p.category === category);
    }
    
    if (conference && conference !== 'all') {
      papers = papers.filter(p => 
        p.conference.toLowerCase().includes(conference.toLowerCase())
      );
    }
    
    // 限制返回数量
    papers = papers.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      papers: papers,
      count: papers.length,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching papers:', error);
    res.status(500).json({
      success: false,
      message: '获取论文失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误',
      papers: getCuratedPapers() // 返回精选论文作为后备
    });
  }
});

/**
 * GET /api/papers/trending
 * 获取热门论文
 */
router.get('/papers/trending', async (req, res) => {
  try {
    const categories = ['cs.AI', 'cs.LG', 'cs.CV', 'cs.CL'];
    const papers = await arxivService.fetchMultiCategoryPapers(categories, 10);
    
    // 只返回热门论文
    const trendingPapers = papers.filter(p => p.trending);
    
    res.json({
      success: true,
      papers: trendingPapers,
      count: trendingPapers.length
    });
  } catch (error) {
    console.error('Error fetching trending papers:', error);
    res.status(500).json({
      success: false,
      message: '获取热门论文失败'
    });
  }
});

/**
 * POST /api/papers/refresh
 * 刷新论文缓存并更新数据库
 */
router.post('/papers/refresh', async (req, res) => {
  try {
    const result = await arxivService.clearCache();
    res.json({
      success: true,
      message: '缓存已清除，数据已从arXiv刷新并更新到数据库',
      ...result
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: '清除缓存失败'
    });
  }
});

/**
 * 获取精选论文列表（经典和热门论文）
 */
function getCuratedPapers() {
  return [
    {
      id: 'curated_1',
      title: "GPT-4 Technical Report",
      authors: ["OpenAI Team"],
      conference: "arXiv",
      category: "nlp",
      publishedAt: "2023-03-15",
      abstract: "We report the development of GPT-4, a large-scale, multimodal model which can accept image and text inputs and produce text outputs. While less capable than humans in many real-world scenarios, GPT-4 exhibits human-level performance on various professional and academic benchmarks, including passing a simulated bar exam with a score around the top 10% of test takers.",
      tags: ["GPT-4", "Multimodal", "LLM"],
      citations: 3250,
      views: 125000,
      pdfUrl: "https://arxiv.org/pdf/2303.08774.pdf",
      arxivUrl: "https://arxiv.org/abs/2303.08774",
      trending: true,
      hotScore: 98,
      ccfRank: 'A'
    },
    {
      id: 'curated_2',
      title: "Attention Is All You Need",
      authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit"],
      conference: "NeurIPS",
      category: "nlp",
      publishedAt: "2017-06-12",
      abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
      tags: ["Transformer", "Attention", "NeurIPS"],
      citations: 72000,
      views: 450000,
      pdfUrl: "https://arxiv.org/pdf/1706.03762.pdf",
      arxivUrl: "https://arxiv.org/abs/1706.03762",
      codeUrl: "https://github.com/tensorflow/tensor2tensor",
      trending: true,
      hotScore: 99,
      ccfRank: 'A'
    },
    {
      id: 'curated_3',
      title: "Deep Residual Learning for Image Recognition",
      authors: ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren", "Jian Sun"],
      conference: "CVPR",
      category: "cv",
      publishedAt: "2015-12-10",
      abstract: "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions.",
      tags: ["ResNet", "CVPR", "Deep Learning"],
      citations: 135000,
      views: 580000,
      pdfUrl: "https://arxiv.org/pdf/1512.03385.pdf",
      arxivUrl: "https://arxiv.org/abs/1512.03385",
      codeUrl: "https://github.com/KaimingHe/deep-residual-networks",
      trending: false,
      hotScore: 97,
      ccfRank: 'A'
    },
    {
      id: 'curated_4',
      title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
      authors: ["Jacob Devlin", "Ming-Wei Chang", "Kenton Lee", "Kristina Toutanova"],
      conference: "NAACL",
      category: "nlp",
      publishedAt: "2018-10-11",
      abstract: "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.",
      tags: ["BERT", "Pre-training", "ACL"],
      citations: 82000,
      views: 520000,
      pdfUrl: "https://arxiv.org/pdf/1810.04805.pdf",
      arxivUrl: "https://arxiv.org/abs/1810.04805",
      codeUrl: "https://github.com/google-research/bert",
      trending: false,
      hotScore: 96,
      ccfRank: 'A'
    },
    {
      id: 'curated_5',
      title: "LLaMA: Open and Efficient Foundation Language Models",
      authors: ["Hugo Touvron", "Thibaut Lavril", "Gautier Izacard", "Xavier Martinet"],
      conference: "arXiv",
      category: "nlp",
      publishedAt: "2023-02-27",
      abstract: "We introduce LLaMA, a collection of foundation language models ranging from 7B to 65B parameters. We train our models on trillions of tokens, and show that it is possible to train state-of-the-art models using publicly available datasets exclusively, without resorting to proprietary and inaccessible datasets.",
      tags: ["LLaMA", "Open Source", "LLM"],
      citations: 4200,
      views: 95000,
      pdfUrl: "https://arxiv.org/pdf/2302.13971.pdf",
      arxivUrl: "https://arxiv.org/abs/2302.13971",
      codeUrl: "https://github.com/facebookresearch/llama",
      trending: true,
      hotScore: 95,
      ccfRank: 'A'
    },
    {
      id: 'curated_6',
      title: "High-Resolution Image Synthesis with Latent Diffusion Models",
      authors: ["Robin Rombach", "Andreas Blattmann", "Dominik Lorenz", "Patrick Esser"],
      conference: "CVPR",
      category: "cv",
      publishedAt: "2021-12-20",
      abstract: "By decomposing the image formation process into a sequential application of denoising autoencoders, diffusion models (DMs) achieve state-of-the-art synthesis results on image data and beyond. Additionally, their formulation allows for a guiding mechanism to control the image generation process without retraining.",
      tags: ["Stable Diffusion", "CVPR", "Image Generation"],
      citations: 5800,
      views: 125000,
      pdfUrl: "https://arxiv.org/pdf/2112.10752.pdf",
      arxivUrl: "https://arxiv.org/abs/2112.10752",
      codeUrl: "https://github.com/CompVis/stable-diffusion",
      trending: true,
      hotScore: 94,
      ccfRank: 'A'
    },
    {
      id: 'curated_7',
      title: "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models",
      authors: ["Jason Wei", "Xuezhi Wang", "Dale Schuurmans", "Maarten Bosma"],
      conference: "NeurIPS",
      category: "nlp",
      publishedAt: "2022-01-28",
      abstract: "We explore how generating a chain of thought -- a series of intermediate reasoning steps -- significantly improves the ability of large language models to perform complex reasoning. In particular, we show that sufficiently large language models can generate intermediate steps when explicitly prompted to do so.",
      tags: ["Chain-of-Thought", "NeurIPS", "Reasoning"],
      citations: 6500,
      views: 98000,
      pdfUrl: "https://arxiv.org/pdf/2201.11903.pdf",
      arxivUrl: "https://arxiv.org/abs/2201.11903",
      trending: true,
      hotScore: 93,
      ccfRank: 'A'
    },
    {
      id: 'curated_8',
      title: "Masked Autoencoders Are Scalable Vision Learners",
      authors: ["Kaiming He", "Xinlei Chen", "Saining Xie", "Yanghao Li"],
      conference: "CVPR",
      category: "cv",
      publishedAt: "2021-11-11",
      abstract: "This paper shows that masked autoencoders (MAE) are scalable self-supervised learners for computer vision. Our MAE approach is simple: we mask random patches of the input image and reconstruct the missing pixels. It is based on two core designs. First, we develop an asymmetric encoder-decoder architecture.",
      tags: ["MAE", "CVPR", "Self-supervised"],
      citations: 3200,
      views: 68000,
      pdfUrl: "https://arxiv.org/pdf/2111.06377.pdf",
      arxivUrl: "https://arxiv.org/abs/2111.06377",
      codeUrl: "https://github.com/facebookresearch/mae",
      trending: true,
      hotScore: 92,
      ccfRank: 'A'
    },
    {
      id: 'curated_9',
      title: "InstructGPT: Training language models to follow instructions with human feedback",
      authors: ["Long Ouyang", "Jeff Wu", "Xu Jiang", "Diogo Almeida"],
      conference: "arXiv",
      category: "nlp",
      publishedAt: "2022-03-04",
      abstract: "Making language models bigger does not inherently make them better at following a user's intent. We show an avenue for aligning language models with user intent on a wide range of tasks by fine-tuning with human feedback. Starting with a set of labeler-written prompts and prompts submitted through the OpenAI API, we collect a dataset of labeler demonstrations of the desired model behavior.",
      tags: ["InstructGPT", "RLHF", "Alignment"],
      citations: 5100,
      views: 82000,
      pdfUrl: "https://arxiv.org/pdf/2203.02155.pdf",
      arxivUrl: "https://arxiv.org/abs/2203.02155",
      trending: true,
      hotScore: 91,
      ccfRank: 'A'
    },
    {
      id: 'curated_10',
      title: "Scaling Laws for Neural Language Models",
      authors: ["Jared Kaplan", "Sam McCandlish", "Tom Henighan", "Tom B. Brown"],
      conference: "arXiv",
      category: "ml",
      publishedAt: "2020-01-23",
      abstract: "We study empirical scaling laws for language model performance on the cross-entropy loss. The loss scales as a power-law with model size, dataset size, and the amount of compute used for training, with some trends spanning more than seven orders of magnitude.",
      tags: ["Scaling Laws", "Language Models", "Compute"],
      citations: 3800,
      views: 62000,
      pdfUrl: "https://arxiv.org/pdf/2001.08361.pdf",
      arxivUrl: "https://arxiv.org/abs/2001.08361",
      trending: false,
      hotScore: 88,
      ccfRank: 'A'
    }
  ];
}

module.exports = router;

