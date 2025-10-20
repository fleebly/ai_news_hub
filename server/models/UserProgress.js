const mongoose = require('mongoose');

/**
 * 用户学习进度模型
 * 记录用户的学习轨迹和成果
 */
const userProgressSchema = new mongoose.Schema({
  // 用户ID
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // 主题ID
  topicId: {
    type: String,
    required: true,
    index: true
  },
  
  // 学习状态
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'paused'],
    default: 'not_started'
  },
  
  // 当前进度
  currentDay: {
    type: Number,
    default: 1
  },
  
  // 当前步骤（费曼学习法）
  currentFeynmanStep: {
    type: Number,
    min: 1,
    max: 4,
    default: 1
  },
  
  // 已完成的活动
  completedActivities: [{
    day: Number,
    activityIndex: Number,
    completedAt: Date,
    timeSpent: Number  // 分钟
  }],
  
  // 测试成绩
  quizScores: [{
    quizId: String,
    score: Number,
    totalQuestions: Number,
    correctAnswers: Number,
    timeSpent: Number,  // 秒
    completedAt: Date,
    answers: [{
      questionId: String,
      userAnswer: mongoose.Schema.Types.Mixed,
      isCorrect: Boolean
    }]
  }],
  
  // 项目完成情况
  projects: [{
    projectId: String,
    status: String,  // 'not_started', 'in_progress', 'completed'
    githubUrl: String,
    submittedAt: Date,
    feedback: String,
    score: Number
  }],
  
  // 学习笔记
  notes: [{
    day: Number,
    content: String,
    tags: [String],
    createdAt: Date,
    updatedAt: Date
  }],
  
  // 费曼教学记录（用户用自己的话解释）
  feynmanExplanations: [{
    step: Number,
    content: String,
    createdAt: Date,
    aiReview: {
      score: Number,
      feedback: String,
      suggestions: [String]
    }
  }],
  
  // 识别的知识缺口
  knowledgeGaps: [{
    description: String,
    resources: [String],
    resolved: Boolean,
    resolvedAt: Date
  }],
  
  // 学习统计
  stats: {
    totalTimeSpent: { type: Number, default: 0 },  // 分钟
    daysActive: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },  // 连续学习天数
    longestStreak: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    completionPercentage: { type: Number, default: 0 }
  },
  
  // 学习习惯
  studyHabits: {
    preferredTime: String,  // 'morning', 'afternoon', 'evening'
    averageSessionDuration: Number,  // 分钟
    studyDays: [String]  // ['monday', 'tuesday', ...]
  },
  
  // 时间戳
  startedAt: {
    type: Date,
    default: Date.now
  },
  
  completedAt: {
    type: Date
  },
  
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 复合索引
userProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });

// 更新时间中间件
userProgressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.lastAccessedAt = Date.now();
  next();
});

// 静态方法：获取用户所有学习进度
userProgressSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ lastAccessedAt: -1 });
};

// 静态方法：获取用户正在学习的主题
userProgressSchema.statics.findInProgressByUser = function(userId) {
  return this.find({ userId, status: 'in_progress' }).sort({ lastAccessedAt: -1 });
};

// 实例方法：更新进度
userProgressSchema.methods.updateProgress = function(day, step) {
  this.currentDay = day;
  this.currentFeynmanStep = step;
  this.status = 'in_progress';
  this.lastAccessedAt = Date.now();
  return this.save();
};

// 实例方法：完成主题
userProgressSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = Date.now();
  this.stats.completionPercentage = 100;
  return this.save();
};

// 实例方法：计算完成百分比
userProgressSchema.methods.calculateCompletion = function(totalDays) {
  const percentage = Math.round((this.currentDay / totalDays) * 100);
  this.stats.completionPercentage = Math.min(percentage, 100);
  return this.save();
};

// 实例方法：更新连续学习天数
userProgressSchema.methods.updateStreak = function() {
  const today = new Date().setHours(0, 0, 0, 0);
  const lastAccessed = new Date(this.lastAccessedAt).setHours(0, 0, 0, 0);
  const daysDiff = Math.floor((today - lastAccessed) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 1) {
    // 连续学习
    this.stats.currentStreak += 1;
    this.stats.longestStreak = Math.max(this.stats.currentStreak, this.stats.longestStreak);
  } else if (daysDiff > 1) {
    // 中断了
    this.stats.currentStreak = 1;
  }
  
  return this.save();
};

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

module.exports = UserProgress;

