const express = require('express');
const router = express.Router();
const learningService = require('../services/learningService');
const LearningTopic = require('../models/LearningTopic');
const UserProgress = require('../models/UserProgress');

/**
 * GET /api/learning/topics
 * 获取所有学习主题
 */
router.get('/learning/topics', async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    
    let query = { published: true };
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    
    const topics = await LearningTopic.find(query)
      .sort({ 'stats.totalLearners': -1, name: 1 });
    
    res.json({
      success: true,
      topics: topics.map(t => ({
        topicId: t.topicId,
        name: t.name,
        nameEn: t.nameEn,
        category: t.category,
        difficulty: t.difficulty,
        duration: t.duration,
        objectives: t.objectives,
        prerequisites: t.prerequisites,
        stats: t.stats
      })),
      count: topics.length
    });
    
  } catch (error) {
    console.error('获取主题列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取主题列表失败'
    });
  }
});

/**
 * GET /api/learning/topics/:topicId
 * 获取主题详情
 */
router.get('/learning/topics/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    
    const topic = await LearningTopic.findOne({ topicId, published: true });
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '主题不存在'
      });
    }
    
    res.json({
      success: true,
      topic
    });
    
  } catch (error) {
    console.error('获取主题详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取主题详情失败'
    });
  }
});

/**
 * POST /api/learning/topics/:topicId/start
 * 开始学习主题
 */
router.post('/learning/topics/:topicId/start', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { userId = 'guest' } = req.body;
    
    // 检查主题是否存在
    const topic = await LearningTopic.findOne({ topicId, published: true });
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '主题不存在'
      });
    }
    
    // 检查是否已经开始学习
    let progress = await UserProgress.findOne({ userId, topicId });
    
    if (progress) {
      return res.json({
        success: true,
        message: '继续学习',
        progress
      });
    }
    
    // 创建新的学习进度
    progress = new UserProgress({
      userId,
      topicId,
      status: 'in_progress',
      currentDay: 1,
      currentFeynmanStep: 1
    });
    
    await progress.save();
    
    // 增加学习者数量
    await topic.incrementLearners();
    
    res.json({
      success: true,
      message: '开始学习',
      progress
    });
    
  } catch (error) {
    console.error('开始学习失败:', error);
    res.status(500).json({
      success: false,
      message: '开始学习失败'
    });
  }
});

/**
 * GET /api/learning/progress/:userId
 * 获取用户学习进度
 */
router.get('/learning/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const progress = await UserProgress.findByUser(userId);
    
    // 填充主题信息
    const progressWithTopics = await Promise.all(
      progress.map(async (p) => {
        const topic = await LearningTopic.findOne({ topicId: p.topicId });
        return {
          ...p.toObject(),
          topic: topic ? {
            name: topic.name,
            nameEn: topic.nameEn,
            category: topic.category,
            difficulty: topic.difficulty,
            duration: topic.duration
          } : null
        };
      })
    );
    
    res.json({
      success: true,
      progress: progressWithTopics,
      count: progress.length
    });
    
  } catch (error) {
    console.error('获取学习进度失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学习进度失败'
    });
  }
});

/**
 * PUT /api/learning/progress/:progressId
 * 更新学习进度
 */
router.put('/learning/progress/:progressId', async (req, res) => {
  try {
    const { progressId } = req.params;
    const { currentDay, currentFeynmanStep, completedActivity } = req.body;
    
    const progress = await UserProgress.findById(progressId);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: '进度记录不存在'
      });
    }
    
    // 更新进度
    if (currentDay !== undefined) {
      progress.currentDay = currentDay;
    }
    
    if (currentFeynmanStep !== undefined) {
      progress.currentFeynmanStep = currentFeynmanStep;
    }
    
    // 添加完成的活动
    if (completedActivity) {
      progress.completedActivities.push({
        ...completedActivity,
        completedAt: new Date()
      });
    }
    
    // 更新连续学习天数
    await progress.updateStreak();
    
    // 获取主题信息计算完成百分比
    const topic = await LearningTopic.findOne({ topicId: progress.topicId });
    if (topic) {
      await progress.calculateCompletion(topic.duration);
    }
    
    await progress.save();
    
    res.json({
      success: true,
      message: '进度已更新',
      progress
    });
    
  } catch (error) {
    console.error('更新进度失败:', error);
    res.status(500).json({
      success: false,
      message: '更新进度失败'
    });
  }
});

/**
 * POST /api/learning/evaluate
 * 评估费曼教学
 */
router.post('/learning/evaluate', async (req, res) => {
  try {
    const { topicName, userExplanation, userId, progressId } = req.body;
    
    if (!topicName || !userExplanation) {
      return res.status(400).json({
        success: false,
        message: '请提供主题名称和解释内容'
      });
    }
    
    console.log(`\n📝 评估费曼教学: ${topicName}`);
    
    // AI评估
    const evaluation = await learningService.evaluateFeynmanExplanation(
      topicName,
      userExplanation
    );
    
    // 保存评估记录
    if (userId && progressId) {
      const progress = await UserProgress.findById(progressId);
      if (progress) {
        progress.feynmanExplanations.push({
          step: progress.currentFeynmanStep,
          content: userExplanation,
          createdAt: new Date(),
          aiReview: evaluation
        });
        await progress.save();
      }
    }
    
    console.log(`✅ 评估完成: ${evaluation.score}分`);
    
    res.json({
      success: true,
      evaluation
    });
    
  } catch (error) {
    console.error('评估失败:', error);
    res.status(500).json({
      success: false,
      message: '评估失败',
      error: error.message
    });
  }
});

/**
 * POST /api/learning/generate-topic
 * 生成新主题（管理员功能）
 */
router.post('/learning/generate-topic', async (req, res) => {
  try {
    const { topicName, difficulty = 'intermediate', duration = 7 } = req.body;
    
    if (!topicName) {
      return res.status(400).json({
        success: false,
        message: '请提供主题名称'
      });
    }
    
    console.log(`\n🎓 生成新主题: ${topicName}`);
    
    // 生成内容
    const topicData = await learningService.generateTopicContent(topicName, {
      difficulty,
      duration
    });
    
    // 保存到数据库
    const topic = new LearningTopic(topicData);
    await topic.save();
    
    console.log(`✅ 主题已生成并保存: ${topic.topicId}`);
    
    res.json({
      success: true,
      message: '主题生成成功',
      topic
    });
    
  } catch (error) {
    console.error('生成主题失败:', error);
    res.status(500).json({
      success: false,
      message: '生成主题失败',
      error: error.message
    });
  }
});

module.exports = router;

