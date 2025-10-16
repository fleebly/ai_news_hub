const mongoose = require('mongoose');

/**
 * AI论文模型
 * 存储从arXiv等来源获取的AI论文
 */
const paperSchema = new mongoose.Schema({
  // 唯一标识（arXiv ID或其他）
  paperId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // 基本信息
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  abstract: {
    type: String,
    required: true
  },
  
  summary: {
    type: String
  },
  
  // 作者信息
  authors: [{
    type: String,
    trim: true
  }],
  
  // 分类
  category: {
    type: String,
    enum: ['nlp', 'cv', 'ml', 'robotics', 'rl', 'audio', 'multimodal', 'other'],
    default: 'other',
    index: true
  },
  
  // 会议/期刊
  conference: {
    type: String,
    trim: true,
    index: true
  },
  
  // URL
  arxivUrl: {
    type: String
  },
  
  pdfUrl: {
    type: String
  },
  
  codeUrl: {
    type: String
  },
  
  projectUrl: {
    type: String
  },
  
  // 标签
  tags: [{
    type: String,
    trim: true
  }],
  
  // 时间信息
  publishedAt: {
    type: Date,
    required: true,
    index: true
  },
  
  updatedAt: {
    type: Date
  },
  
  fetchedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // 统计信息
  citations: {
    type: Number,
    default: 0
  },
  
  views: {
    type: Number,
    default: 0
  },
  
  downloads: {
    type: Number,
    default: 0
  },
  
  stars: {
    type: Number,
    default: 0
  },
  
  // 是否热门/精选
  trending: {
    type: Boolean,
    default: false,
    index: true
  },
  
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // AI解读
  hasAnalysis: {
    type: Boolean,
    default: false
  },
  
  analysisCount: {
    type: Number,
    default: 0
  },
  
  // 状态
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
    index: true
  },
  
  // 质量评分（可选，用于排序）
  qualityScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 索引
paperSchema.index({ publishedAt: -1 });
paperSchema.index({ category: 1, publishedAt: -1 });
paperSchema.index({ conference: 1, publishedAt: -1 });
paperSchema.index({ trending: 1, publishedAt: -1 });
paperSchema.index({ title: 'text', abstract: 'text' }); // 全文搜索

// 虚拟字段：完整作者列表
paperSchema.virtual('authorsList').get(function() {
  return this.authors.join(', ');
});

// 静态方法：获取最新论文
paperSchema.statics.getLatest = function(limit = 100, category = null) {
  const query = { status: 'active' };
  if (category && category !== 'all') {
    query.category = category;
  }
  return this.find(query)
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// 静态方法：获取热门论文
paperSchema.statics.getTrending = function(limit = 20) {
  return this.find({ status: 'active', trending: true })
    .sort({ publishedAt: -1, citations: -1 })
    .limit(limit);
};

// 静态方法：按会议获取
paperSchema.statics.getByConference = function(conference, limit = 50) {
  return this.find({ 
    status: 'active', 
    conference: new RegExp(conference, 'i') 
  })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// 静态方法：搜索论文
paperSchema.statics.search = function(keyword, limit = 20) {
  return this.find({
    status: 'active',
    $text: { $search: keyword }
  })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// 静态方法：批量插入或更新
paperSchema.statics.upsertMany = async function(papers) {
  const operations = papers.map(paper => ({
    updateOne: {
      filter: { paperId: paper.paperId },
      update: { $set: paper },
      upsert: true
    }
  }));
  
  return this.bulkWrite(operations);
};

// 实例方法：增加浏览次数
paperSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// 实例方法：标记为已解读
paperSchema.methods.markAsAnalyzed = function() {
  this.hasAnalysis = true;
  this.analysisCount += 1;
  return this.save();
};

// 实例方法：计算质量评分
paperSchema.methods.calculateQualityScore = function() {
  // 简单的评分算法：引用数 + 浏览数/100 + 是否有代码*10
  this.qualityScore = this.citations + (this.views / 100) + (this.codeUrl ? 10 : 0);
  return this.qualityScore;
};

module.exports = mongoose.model('Paper', paperSchema);

