const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// 获取用户排行榜
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'level', limit = 10 } = req.query;
    
    let sortField = 'level';
    if (type === 'experience') sortField = 'experience';
    if (type === 'solved') sortField = 'totalSolved';
    if (type === 'streak') sortField = 'streak';

    const users = await User.find({})
      .select('username level experience totalSolved streak')
      .sort({ [sortField]: -1, experience: -1 })
      .limit(parseInt(limit));

    res.json(users);
  } catch (error) {
    console.error('获取排行榜错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户统计信息
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('solvedQuestions.questionId', 'title difficulty points');

    const stats = {
      level: user.level,
      experience: user.experience,
      totalSolved: user.totalSolved,
      streak: user.streak,
      achievements: user.achievements,
      difficultyBreakdown: {
        beginner: 0,
        intermediate: 0,
        advanced: 0
      },
      categoryBreakdown: {},
      recentActivity: user.solvedQuestions.slice(-5).reverse()
    };

    // 统计各难度题目解决数量
    user.solvedQuestions.forEach(solved => {
      if (solved.questionId) {
        const difficulty = solved.questionId.difficulty;
        stats.difficultyBreakdown[difficulty]++;
        
        const category = solved.questionId.category;
        stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + 1;
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('获取用户统计错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户偏好设置
router.put('/preferences', auth, async (req, res) => {
  try {
    const { difficulty, language } = req.body;
    
    const updateData = {};
    if (difficulty) updateData['preferences.difficulty'] = difficulty;
    if (language) updateData['preferences.language'] = language;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    res.json({
      message: '偏好设置已更新',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('更新偏好设置错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户成就
router.get('/achievements', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const allAchievements = [
      {
        id: 'first_solve',
        name: '初出茅庐',
        description: '解决第一道编程题',
        icon: '🎯',
        unlocked: user.achievements.includes('first_solve')
      },
      {
        id: 'streak_7',
        name: '坚持不懈',
        description: '连续7天解决编程题',
        icon: '🔥',
        unlocked: user.achievements.includes('streak_7')
      },
      {
        id: 'streak_30',
        name: '编程达人',
        description: '连续30天解决编程题',
        icon: '💎',
        unlocked: user.achievements.includes('streak_30')
      },
      {
        id: 'level_5',
        name: '进阶学员',
        description: '达到5级',
        icon: '⭐',
        unlocked: user.achievements.includes('level_5')
      },
      {
        id: 'level_10',
        name: '编程大师',
        description: '达到10级',
        icon: '👑',
        unlocked: user.achievements.includes('level_10')
      },
      {
        id: 'perfect_score',
        name: '完美主义',
        description: '获得满分',
        icon: '💯',
        unlocked: user.achievements.includes('perfect_score')
      }
    ];

    res.json(allAchievements);
  } catch (error) {
    console.error('获取成就错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户进度历史
router.get('/progress', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const user = await User.findById(req.user._id)
      .populate('solvedQuestions.questionId', 'title difficulty points');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const recentSolved = user.solvedQuestions.filter(solved => 
      solved.solvedAt >= startDate && solved.solvedAt <= endDate
    );

    // 按日期分组统计
    const progressData = {};
    recentSolved.forEach(solved => {
      const date = solved.solvedAt.toISOString().split('T')[0];
      if (!progressData[date]) {
        progressData[date] = {
          date,
          solved: 0,
          experience: 0,
          questions: []
        };
      }
      progressData[date].solved++;
      progressData[date].experience += solved.questionId?.points || 0;
      progressData[date].questions.push({
        title: solved.questionId?.title,
        difficulty: solved.questionId?.difficulty,
        score: solved.score
      });
    });

    const progressArray = Object.values(progressData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.json(progressArray);
  } catch (error) {
    console.error('获取进度历史错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

