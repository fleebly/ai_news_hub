/**
 * 初始化学习主题数据
 * 用于快速填充数据库
 */
const mongoose = require('mongoose');
require('dotenv').config();

// 预定义的主题数据
const predefinedTopics = [
  {
    topicId: 'cnn_basics',
    name: '卷积神经网络',
    nameEn: 'CNN',
    category: 'computer_vision',
    difficulty: 'intermediate',
    duration: 7,
    objectives: [
      '理解卷积操作的数学原理',
      '掌握CNN的核心组件（卷积层、池化层、全连接层）',
      '能够实现基础的图像分类模型',
      '理解CNN在计算机视觉中的应用',
      '掌握常见的CNN架构（LeNet、AlexNet、VGG）'
    ],
    prerequisites: [
      { topicId: 'python_basics', name: 'Python基础', required: true },
      { topicId: 'linear_algebra', name: '线性代数', required: true },
      { topicId: 'deep_learning_basics', name: '深度学习基础', required: false }
    ],
    published: true,
    stats: { totalLearners: 1200, completionRate: 75, averageScore: 82 }
  },
  {
    topicId: 'rnn_basics',
    name: '循环神经网络',
    nameEn: 'RNN',
    category: 'nlp',
    difficulty: 'intermediate',
    duration: 7,
    objectives: [
      '理解RNN的时序建模原理',
      '掌握LSTM和GRU的结构和原理',
      '能够处理序列数据',
      '理解梯度消失和梯度爆炸问题',
      '实现基础的文本生成模型'
    ],
    prerequisites: [
      { topicId: 'python_basics', name: 'Python基础', required: true },
      { topicId: 'deep_learning_basics', name: '深度学习基础', required: true }
    ],
    published: true,
    stats: { totalLearners: 980, completionRate: 70, averageScore: 78 }
  },
  {
    topicId: 'transformer',
    name: 'Transformer架构',
    nameEn: 'Transformer',
    category: 'nlp',
    difficulty: 'advanced',
    duration: 10,
    objectives: [
      '深入理解自注意力机制',
      '掌握Transformer的完整架构',
      '理解位置编码的作用',
      '掌握多头注意力的实现',
      '能够微调预训练Transformer模型'
    ],
    prerequisites: [
      { topicId: 'rnn_basics', name: 'RNN基础', required: true },
      { topicId: 'attention_mechanism', name: '注意力机制', required: true }
    ],
    published: true,
    stats: { totalLearners: 1560, completionRate: 68, averageScore: 85 }
  },
  {
    topicId: 'rl_basics',
    name: '强化学习基础',
    nameEn: 'Reinforcement Learning',
    category: 'reinforcement_learning',
    difficulty: 'advanced',
    duration: 14,
    objectives: [
      '理解强化学习的基本概念（状态、动作、奖励）',
      '掌握马尔可夫决策过程',
      '理解价值函数和策略',
      '掌握Q-Learning和Deep Q-Network',
      '能够训练简单的强化学习agent'
    ],
    prerequisites: [
      { topicId: 'deep_learning_basics', name: '深度学习基础', required: true },
      { topicId: 'probability', name: '概率论', required: true }
    ],
    published: true,
    stats: { totalLearners: 560, completionRate: 58, averageScore: 75 }
  },
  {
    topicId: 'ppo',
    name: '近端策略优化',
    nameEn: 'PPO',
    category: 'reinforcement_learning',
    difficulty: 'advanced',
    duration: 7,
    objectives: [
      '理解策略梯度方法',
      '掌握PPO的核心思想和算法',
      '理解裁剪目标函数的作用',
      '能够实现PPO算法',
      '掌握PPO在实际问题中的应用'
    ],
    prerequisites: [
      { topicId: 'rl_basics', name: '强化学习基础', required: true }
    ],
    published: true,
    stats: { totalLearners: 340, completionRate: 62, averageScore: 80 }
  },
  {
    topicId: 'dpo',
    name: '直接偏好优化',
    nameEn: 'DPO',
    category: 'reinforcement_learning',
    difficulty: 'advanced',
    duration: 7,
    objectives: [
      '理解RLHF的局限性',
      '掌握DPO的核心原理',
      '理解偏好数据的构建方法',
      '能够使用DPO微调语言模型',
      '理解DPO与其他对齐方法的区别'
    ],
    prerequisites: [
      { topicId: 'rl_basics', name: '强化学习基础', required: true },
      { topicId: 'transformer', name: 'Transformer', required: true }
    ],
    published: true,
    stats: { totalLearners: 280, completionRate: 55, averageScore: 82 }
  },
  {
    topicId: 'attention_mechanism',
    name: '注意力机制',
    nameEn: 'Attention Mechanism',
    category: 'deep_learning',
    difficulty: 'intermediate',
    duration: 5,
    objectives: [
      '理解注意力机制的动机',
      '掌握注意力的计算方法',
      '理解自注意力和交叉注意力',
      '掌握注意力在不同任务中的应用',
      '能够实现基础的注意力模块'
    ],
    prerequisites: [
      { topicId: 'rnn_basics', name: 'RNN基础', required: false }
    ],
    published: true,
    stats: { totalLearners: 890, completionRate: 72, averageScore: 80 }
  },
  {
    topicId: 'gan',
    name: '生成对抗网络',
    nameEn: 'GAN',
    category: 'deep_learning',
    difficulty: 'advanced',
    duration: 10,
    objectives: [
      '理解GAN的对抗训练原理',
      '掌握生成器和判别器的设计',
      '理解GAN的训练难点和技巧',
      '掌握常见的GAN变体',
      '能够训练基础的图像生成模型'
    ],
    prerequisites: [
      { topicId: 'cnn_basics', name: 'CNN基础', required: true },
      { topicId: 'deep_learning_basics', name: '深度学习基础', required: true }
    ],
    published: true,
    stats: { totalLearners: 670, completionRate: 60, averageScore: 76 }
  },
  {
    topicId: 'bert',
    name: 'BERT模型',
    nameEn: 'BERT',
    category: 'nlp',
    difficulty: 'advanced',
    duration: 7,
    objectives: [
      '理解BERT的预训练任务',
      '掌握Masked Language Model',
      '理解双向编码的重要性',
      '掌握BERT的微调方法',
      '能够使用BERT解决NLP任务'
    ],
    prerequisites: [
      { topicId: 'transformer', name: 'Transformer', required: true }
    ],
    published: true,
    stats: { totalLearners: 1120, completionRate: 70, averageScore: 83 }
  }
];

async function seedTopics() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_programming_coach');
    console.log('📦 MongoDB连接成功');

    const LearningTopic = require('../models/LearningTopic');

    console.log('\n🌱 开始初始化学习主题数据...\n');

    for (const topicData of predefinedTopics) {
      // 检查是否已存在
      const existing = await LearningTopic.findOne({ topicId: topicData.topicId });
      
      if (existing) {
        console.log(`⏭️  跳过已存在的主题: ${topicData.name}`);
        continue;
      }

      // 创建新主题（使用简化的数据结构）
      const topic = new LearningTopic({
        ...topicData,
        feynmanSteps: {
          step1_concept: {
            title: '第1步：理解核心概念',
            description: `${topicData.name}的核心概念讲解`,
            keyPoints: [],
            examples: [],
            visualizations: []
          },
          step2_teach: {
            title: '第2步：用简单语言教给别人',
            simpleExplanation: '',
            analogies: [],
            storyMode: '',
            practiceQuestions: []
          },
          step3_gaps: {
            title: '第3步：识别和填补知识缺口',
            commonMisunderstandings: [],
            difficultPoints: [],
            selfAssessment: []
          },
          step4_review: {
            title: '第4步：回顾和简化',
            summary: '',
            keyFormulas: [],
            mindMap: '',
            cheatSheet: '',
            practicalTips: []
          }
        },
        learningPlan: [],
        quizBank: [],
        projects: [],
        resources: {
          papers: [],
          videos: [],
          books: [],
          blogs: [],
          tools: []
        }
      });

      await topic.save();
      console.log(`✅ 创建主题: ${topicData.name} (${topicData.nameEn})`);
    }

    console.log('\n🎉 学习主题初始化完成！');
    console.log(`✅ 共创建 ${predefinedTopics.length} 个主题\n`);

    // 显示统计
    const total = await LearningTopic.countDocuments({ published: true });
    console.log(`📊 数据库中共有 ${total} 个已发布的主题`);

    process.exit(0);

  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedTopics();
}

module.exports = { predefinedTopics, seedTopics };

