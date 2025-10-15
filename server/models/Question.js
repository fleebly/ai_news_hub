const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['algorithm', 'data-structure', 'web-development', 'database', 'system-design']
  },
  language: {
    type: String,
    default: 'javascript',
    enum: ['javascript', 'python', 'java', 'cpp', 'typescript']
  },
  starterCode: {
    type: String,
    required: true
  },
  testCases: [{
    input: mongoose.Schema.Types.Mixed,
    expectedOutput: mongoose.Schema.Types.Mixed,
    description: String
  }],
  hints: [{
    type: String
  }],
  solution: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  timeLimit: {
    type: Number, // 分钟
    default: 30
  },
  points: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  stats: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    successfulAttempts: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// 计算成功率
questionSchema.virtual('successRate').get(function() {
  if (this.stats.totalAttempts === 0) return 0;
  return (this.stats.successfulAttempts / this.stats.totalAttempts * 100).toFixed(2);
});

// 更新统计信息
questionSchema.methods.updateStats = function(isSuccessful, timeSpent) {
  this.stats.totalAttempts += 1;
  if (isSuccessful) {
    this.stats.successfulAttempts += 1;
  }
  
  // 更新平均时间
  const totalTime = this.stats.averageTime * (this.stats.totalAttempts - 1) + timeSpent;
  this.stats.averageTime = Math.round(totalTime / this.stats.totalAttempts);
  
  return this.save();
};

module.exports = mongoose.model('Question', questionSchema);

