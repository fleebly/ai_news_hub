const mongoose = require('mongoose');

/**
 * AI资讯模型
 * 存储从RSS、Brave搜索和社交媒体聚合的AI资讯
 */
const newsSchema = new mongoose.Schema({
  // 唯一标识
  newsId: {
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
  
  // 来源信息
  source: {
    type: String,
    required: true,
    index: true
  },
  
  sourceType: {
    type: String,
    enum: ['rss', 'brave', 'reddit', 'twitter', 'weibo'],
    required: true,
    index: true
  },
  
  author: {
    type: String,
    trim: true
  },
  
  // URL
  link: {
    type: String,
    required: true
  },
  
  imageUrl: {
    type: String
  },
  
  // 分类和标签
  category: {
    type: String,
    index: true
  },
  
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
  
  fetchedAt: {
    type: Date,
    default: Date.now,
    index: true
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
  
  comments: {
    type: Number,
    default: 0
  },
  
  // 社交媒体特有字段
  platform: String, // reddit/twitter/weibo
  platformUrl: String,
  upvotes: Number,
  domain: String,
  
  // 状态
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
    index: true
  },
  
  // 是否热门
  trending: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// 索引
newsSchema.index({ publishedAt: -1 });
newsSchema.index({ source: 1, publishedAt: -1 });
newsSchema.index({ trending: 1, publishedAt: -1 });
newsSchema.index({ title: 'text', summary: 'text' }); // 全文搜索

// 静态方法：获取最新资讯
newsSchema.statics.getLatest = function(limit = 50, sourceType = null) {
  const query = { status: 'active' };
  if (sourceType) {
    query.sourceType = sourceType;
  }
  return this.find(query)
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// 静态方法：获取热门资讯
newsSchema.statics.getTrending = function(limit = 20) {
  return this.find({ status: 'active', trending: true })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// 静态方法：搜索资讯
newsSchema.statics.search = function(keyword, limit = 20) {
  return this.find({
    status: 'active',
    $text: { $search: keyword }
  })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// 静态方法：批量插入或更新
newsSchema.statics.upsertMany = async function(newsArray) {
  const operations = newsArray.map(news => ({
    updateOne: {
      filter: { newsId: news.newsId },
      update: { $set: news },
      upsert: true
    }
  }));
  
  return this.bulkWrite(operations);
};

// 实例方法：增加浏览次数
newsSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

module.exports = mongoose.model('News', newsSchema);

