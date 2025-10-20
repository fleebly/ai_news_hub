const mongoose = require('mongoose');

/**
 * 学习主题数据模型
 * 基于费曼学习法的结构化学习内容
 */
const learningTopicSchema = new mongoose.Schema({
  // 基本信息
  topicId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  name: {
    type: String,
    required: true
  },
  
  nameEn: {
    type: String,
    required: true
  },
  
  category: {
    type: String,
    enum: ['computer_vision', 'nlp', 'reinforcement_learning', 'deep_learning', 'ml_basics'],
    required: true
  },
  
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  
  // 学习周期（天数）
  duration: {
    type: Number,
    default: 7,
    min: 1,
    max: 30
  },
  
  // 学习目标
  objectives: [{
    type: String
  }],
  
  // 先修知识
  prerequisites: [{
    topicId: String,
    name: String,
    required: Boolean
  }],
  
  // 费曼学习法四步骤内容
  feynmanSteps: {
    // 第1步：概念理解（Choose a concept）
    step1_concept: {
      title: String,
      description: String,
      keyPoints: [String],
      examples: [String],
      visualizations: [String]  // 图片/动画URL
    },
    
    // 第2步：简单讲解（Teach it to a child）
    step2_teach: {
      title: String,
      simpleExplanation: String,  // 用简单语言解释
      analogies: [String],  // 类比
      storyMode: String,  // 故事化讲解
      practiceQuestions: [{
        question: String,
        answer: String,
        explanation: String
      }]
    },
    
    // 第3步：识别缺口（Identify gaps）
    step3_gaps: {
      title: String,
      commonMisunderstandings: [{
        misconception: String,
        correction: String,
        explanation: String
      }],
      difficultPoints: [{
        point: String,
        breakdown: String,
        resources: [String]
      }],
      selfAssessment: [{
        question: String,
        options: [String],
        correctAnswer: Number,
        explanation: String
      }]
    },
    
    // 第4步：回顾简化（Review and simplify）
    step4_review: {
      title: String,
      summary: String,
      keyFormulas: [String],
      mindMap: String,  // 思维导图URL
      cheatSheet: String,  // 速查表
      practicalTips: [String]
    }
  },
  
  // 分阶段学习计划
  learningPlan: [{
    day: Number,
    title: String,
    content: String,
    activities: [{
      type: String,  // 'reading', 'video', 'quiz', 'coding', 'project'
      title: String,
      description: String,
      estimatedTime: Number,  // 分钟
      resourceUrl: String
    }],
    milestones: [String]
  }],
  
  // 实践项目
  projects: [{
    title: String,
    description: String,
    difficulty: String,
    estimatedTime: Number,  // 小时
    requirements: [String],
    hints: [String],
    solution: String,
    githubUrl: String
  }],
  
  // 参考资料
  resources: {
    papers: [{
      title: String,
      authors: [String],
      url: String,
      year: Number,
      summary: String
    }],
    videos: [{
      title: String,
      author: String,
      url: String,
      duration: Number,
      language: String
    }],
    books: [{
      title: String,
      authors: [String],
      isbn: String,
      chapters: [String]
    }],
    blogs: [{
      title: String,
      author: String,
      url: String,
      date: String
    }],
    tools: [{
      name: String,
      description: String,
      url: String,
      category: String
    }]
  },
  
  // 测试题库
  quizBank: [{
    question: String,
    type: String,  // 'single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'coding'
    options: [String],
    correctAnswer: mongoose.Schema.Types.Mixed,
    explanation: String,
    difficulty: String,
    tags: [String]
  }],
  
  // 统计信息
  stats: {
    totalLearners: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 }  // 平均完成时间（天）
  },
  
  // 是否已发布
  published: {
    type: Boolean,
    default: false
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时间中间件
learningTopicSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 静态方法：按分类获取主题
learningTopicSchema.statics.findByCategory = function(category) {
  return this.find({ category, published: true }).sort({ difficulty: 1, name: 1 });
};

// 静态方法：按难度获取主题
learningTopicSchema.statics.findByDifficulty = function(difficulty) {
  return this.find({ difficulty, published: true });
};

// 静态方法：获取热门主题
learningTopicSchema.statics.getPopularTopics = function(limit = 10) {
  return this.find({ published: true })
    .sort({ 'stats.totalLearners': -1 })
    .limit(limit);
};

// 实例方法：增加学习者数量
learningTopicSchema.methods.incrementLearners = function() {
  this.stats.totalLearners += 1;
  return this.save();
};

const LearningTopic = mongoose.model('LearningTopic', learningTopicSchema);

module.exports = LearningTopic;

