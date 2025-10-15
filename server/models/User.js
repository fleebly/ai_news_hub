const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  experience: {
    type: Number,
    default: 0
  },
  totalSolved: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date,
    default: Date.now
  },
  preferences: {
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    language: {
      type: String,
      default: 'javascript'
    }
  },
  achievements: [{
    type: String,
    enum: ['first_solve', 'streak_7', 'streak_30', 'level_5', 'level_10', 'perfect_score']
  }],
  solvedQuestions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    solvedAt: {
      type: Date,
      default: Date.now
    },
    score: Number,
    timeSpent: Number, // 分钟
    attempts: Number
  }]
}, {
  timestamps: true
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 验证密码方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 计算经验值
userSchema.methods.addExperience = function(amount) {
  this.experience += amount;
  
  // 检查是否升级
  const newLevel = Math.floor(this.experience / 100) + 1;
  if (newLevel > this.level && newLevel <= 10) {
    this.level = newLevel;
    return { leveledUp: true, newLevel };
  }
  
  return { leveledUp: false };
};

// 更新连续天数
userSchema.methods.updateStreak = function() {
  const today = new Date();
  const lastActive = new Date(this.lastActiveDate);
  const diffTime = today - lastActive;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    this.streak += 1;
  } else if (diffDays > 1) {
    this.streak = 1;
  }
  
  this.lastActiveDate = today;
  return this.streak;
};

module.exports = mongoose.model('User', userSchema);

