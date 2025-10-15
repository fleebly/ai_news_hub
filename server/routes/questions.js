const express = require('express');
const Question = require('../models/Question');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// 获取题目列表（支持筛选）
router.get('/', async (req, res) => {
  try {
    const { difficulty, category, language, page = 1, limit = 10 } = req.query;
    
    const filter = { isActive: true };
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;
    if (language) filter.language = language;

    const questions = await Question.find(filter)
      .select('-solution -testCases')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Question.countDocuments(filter);

    res.json({
      questions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('获取题目列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个题目详情
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question || !question.isActive) {
      return res.status(404).json({ message: '题目不存在' });
    }

    // 不返回答案和测试用例
    const questionData = question.toObject();
    delete questionData.solution;
    delete questionData.testCases;

    res.json(questionData);
  } catch (error) {
    console.error('获取题目详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 提交代码答案
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const { code, language } = req.body;
    const questionId = req.params.id;

    if (!code) {
      return res.status(400).json({ message: '请提供代码' });
    }

    const question = await Question.findById(questionId);
    if (!question || !question.isActive) {
      return res.status(404).json({ message: '题目不存在' });
    }

    // 这里应该调用代码执行服务来运行测试用例
    // 暂时返回模拟结果
    const isCorrect = Math.random() > 0.3; // 模拟70%通过率
    const timeSpent = Math.floor(Math.random() * 30) + 5; // 模拟5-35分钟

    // 更新题目统计
    await question.updateStats(isCorrect, timeSpent);

    // 更新用户进度
    const user = await User.findById(req.user._id);
    if (isCorrect) {
      const experienceGained = question.points;
      const levelResult = user.addExperience(experienceGained);
      
      user.totalSolved += 1;
      
      // 检查成就
      if (user.totalSolved === 1 && !user.achievements.includes('first_solve')) {
        user.achievements.push('first_solve');
      }
      
      if (user.streak === 7 && !user.achievements.includes('streak_7')) {
        user.achievements.push('streak_7');
      }
      
      if (user.level >= 5 && !user.achievements.includes('level_5')) {
        user.achievements.push('level_5');
      }

      await user.save();

      res.json({
        success: true,
        message: '恭喜！答案正确',
        score: question.points,
        experienceGained,
        leveledUp: levelResult.leveledUp,
        newLevel: levelResult.newLevel,
        timeSpent
      });
    } else {
      res.json({
        success: false,
        message: '答案不正确，请重试',
        hints: question.hints
      });
    }
  } catch (error) {
    console.error('提交答案错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取题目提示
router.get('/:id/hints', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question || !question.isActive) {
      return res.status(404).json({ message: '题目不存在' });
    }

    res.json({ hints: question.hints });
  } catch (error) {
    console.error('获取提示错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取题目统计信息
router.get('/:id/stats', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: '题目不存在' });
    }

    res.json({
      totalAttempts: question.stats.totalAttempts,
      successfulAttempts: question.stats.successfulAttempts,
      successRate: question.successRate,
      averageTime: question.stats.averageTime
    });
  } catch (error) {
    console.error('获取题目统计错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

