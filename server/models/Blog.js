const mongoose = require('mongoose');

/**
 * AI博客模型
 * 存储从RSS源获取的AI技术博客
 */
const blogSchema = new mongoose.Schema({
  // 唯一标识
  blogId: {
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
  
  summary: {
    type: String,
    trim: true
  },
  
  content: {
    type: String
  },
  
  // 作者和来源
  author: {
    type: String,
    trim: true,
    index: true
  },
  
  source: {
    type: String,
    required: true,
    index: true
  },
  
  company: {
    type: String,
    trim: true,
    index: true
  },
  
  // URL
  link: {
    type: String,
    required: true
  },
  
  imageUrl: {
    type: String
  },
  
  // 分类
  category: {
    type: String,
    enum: ['research', 'industry', 'tutorial', 'news', 'opinion', 'other'],
    default: 'other',
    index: true
  },
  
  // 标签和主题
  tags: [{
    type: String,
    trim: true
  }],
  
  topics: [{
    type: String,
    trim: true
  }],
  
  // 难度级别
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    index: true
  },
  
  // 阅读时间（分钟）
  readTime: {
    type: Number
  },
  
  // 时间信息
  publishedAt: {
    type: Date,
    required: true,
    index: true
  },
  
  fetchedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  lastCheckedAt: {
    type: Date,
    default: Date.now
  },
  
  // 统计信息
  views: {
    type: Number,
    default: 0
  },
  
  likes: {
    type: Number,
    default: 0
  },
  
  shares: {
    type: Number,
    default: 0
  },
  
  // 是否精选
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // 是否热门
  trending: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // 质量评分
  qualityScore: {
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
  
  // 是否有效（链接可访问）
  isValid: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 索引
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ author: 1, publishedAt: -1 });
blogSchema.index({ source: 1, publishedAt: -1 });
blogSchema.index({ category: 1, publishedAt: -1 });
blogSchema.index({ featured: 1, publishedAt: -1 });
blogSchema.index({ trending: 1, publishedAt: -1 });
blogSchema.index({ title: 'text', summary: 'text', content: 'text' }); // 全文搜索

// 虚拟字段：预估字数
blogSchema.virtual('wordCount').get(function() {
  if (!this.content) return 0;
  return this.content.split(/\s+/).length;
});

// 静态方法：获取最新博客
blogSchema.statics.getLatest = function(limit = 150, category = null) {
  const query = { status: 'active', isValid: true };
  if (category && category !== 'all') {
    query.category = category;
  }
  return this.find(query)
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// 静态方法：按作者获取
blogSchema.statics.getByAuthor = function(author, limit = 50) {
  return this.find({ 
    status: 'active', 
    isValid: true,
    author: author
  })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// 静态方法：按公司获取
blogSchema.statics.getByCompany = function(company, limit = 50) {
  return this.find({ 
    status: 'active', 
    isValid: true,
    company: company
  })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// 静态方法：按主题获取
blogSchema.statics.getByTopic = function(topic, limit = 50) {
  return this.find({ 
    status: 'active', 
    isValid: true,
    topics: topic
  })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// 静态方法：获取精选博客
blogSchema.statics.getFeatured = function(limit = 20) {
  return this.find({ 
    status: 'active', 
    isValid: true,
    featured: true 
  })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// 静态方法：搜索博客
blogSchema.statics.search = function(keyword, limit = 20) {
  return this.find({
    status: 'active',
    isValid: true,
    $text: { $search: keyword }
  })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// 静态方法：批量插入或更新
blogSchema.statics.upsertMany = async function(blogs) {
  const operations = blogs.map(blog => ({
    updateOne: {
      filter: { blogId: blog.blogId },
      update: { $set: blog },
      upsert: true
    }
  }));
  
  return this.bulkWrite(operations);
};

// 实例方法：增加浏览次数
blogSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// 实例方法：增加点赞数
blogSchema.methods.incrementLikes = function() {
  this.likes += 1;
  return this.save();
};

// 实例方法：计算质量评分
blogSchema.methods.calculateQualityScore = function() {
  // 简单的评分算法：浏览数/10 + 点赞数*2 + 分享数*3
  this.qualityScore = (this.views / 10) + (this.likes * 2) + (this.shares * 3);
  return this.qualityScore;
};

// 实例方法：标记为无效
blogSchema.methods.markAsInvalid = function() {
  this.isValid = false;
  return this.save();
};

// 前置钩子：保存前更新lastCheckedAt
blogSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.lastCheckedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);

