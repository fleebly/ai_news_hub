const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // 基本信息
  reviewId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // 搜索关键词
  keywords: {
    type: [String],
    required: true
  },
  
  // 综述标题
  title: {
    type: String,
    required: true
  },
  
  // 综述内容（Markdown格式）
  content: {
    type: String,
    required: true
  },
  
  // 摘要
  abstract: {
    type: String,
    required: true
  },
  
  // 参考文献
  references: [{
    id: String,
    title: String,
    authors: [String],
    source: String, // arxiv, zhihu, blog, forum, etc.
    url: String,
    publishedAt: String,
    summary: String
  }],
  
  // 数据来源统计
  sourcesCount: {
    arxiv: { type: Number, default: 0 },
    zhihu: { type: Number, default: 0 },
    blog: { type: Number, default: 0 },
    forum: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  
  // 综述元数据
  metadata: {
    wordCount: Number,
    referenceCount: Number,
    sectionCount: Number,
    generationTime: Number, // 毫秒
    modelUsed: String
  },
  
  // 用户信息
  createdBy: {
    type: String,
    default: 'system'
  },
  
  // 状态
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  },
  
  // 浏览统计
  views: {
    type: Number,
    default: 0
  },
  
  likes: {
    type: Number,
    default: 0
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时间中间件
reviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 静态方法：按关键词搜索综述
reviewSchema.statics.findByKeywords = function(keywords) {
  return this.find({
    keywords: { $in: keywords },
    status: 'completed'
  }).sort({ createdAt: -1 });
};

// 静态方法：获取热门综述
reviewSchema.statics.getPopular = function(limit = 10) {
  return this.find({ status: 'completed' })
    .sort({ views: -1, likes: -1 })
    .limit(limit);
};

// 实例方法：增加浏览量
reviewSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

