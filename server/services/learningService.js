const aliyunBailianService = require('./aliyunBailianService');
const LearningTopic = require('../models/LearningTopic');
const UserProgress = require('../models/UserProgress');

/**
 * 费曼学习法AI学习服务
 * 生成结构化学习内容，辅助用户掌握AI技术主题
 */
class LearningService {
  constructor() {
    // 预定义的AI主题
    this.predefinedTopics = [
      { id: 'cnn', name: '卷积神经网络', nameEn: 'CNN', category: 'computer_vision', difficulty: 'intermediate', duration: 7 },
      { id: 'rnn', name: '循环神经网络', nameEn: 'RNN', category: 'nlp', difficulty: 'intermediate', duration: 7 },
      { id: 'transformer', name: 'Transformer架构', nameEn: 'Transformer', category: 'nlp', difficulty: 'advanced', duration: 10 },
      { id: 'rl', name: '强化学习', nameEn: 'Reinforcement Learning', category: 'reinforcement_learning', difficulty: 'advanced', duration: 14 },
      { id: 'dpo', name: '直接偏好优化', nameEn: 'DPO', category: 'reinforcement_learning', difficulty: 'advanced', duration: 7 },
      { id: 'ppo', name: '近端策略优化', nameEn: 'PPO', category: 'reinforcement_learning', difficulty: 'advanced', duration: 7 },
      { id: 'gan', name: '生成对抗网络', nameEn: 'GAN', category: 'deep_learning', difficulty: 'advanced', duration: 10 },
      { id: 'bert', name: 'BERT模型', nameEn: 'BERT', category: 'nlp', difficulty: 'advanced', duration: 7 },
      { id: 'attention', name: '注意力机制', nameEn: 'Attention Mechanism', category: 'deep_learning', difficulty: 'intermediate', duration: 5 }
    ];
  }

  /**
   * 生成主题学习内容（基于费曼学习法）
   * @param {string} topicName - 主题名称
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} - 生成的学习内容
   */
  async generateTopicContent(topicName, options = {}) {
    const {
      difficulty = 'intermediate',
      duration = 7,
      userId = 'system'
    } = options;

    console.log(`\n🎓 ========== 生成学习内容 ==========`);
    console.log(`主题: ${topicName}`);
    console.log(`难度: ${difficulty}`);
    console.log(`周期: ${duration}天`);

    try {
      // 1. 生成费曼学习法四步骤内容
      const feynmanSteps = await this.generateFeynmanSteps(topicName, difficulty);
      
      // 2. 生成分阶段学习计划
      const learningPlan = await this.generateLearningPlan(topicName, duration, difficulty);
      
      // 3. 生成测试题库
      const quizBank = await this.generateQuizBank(topicName, difficulty);
      
      // 4. 整理参考资料（可选：调用搜索API）
      const resources = await this.gatherResources(topicName);
      
      // 5. 生成实践项目
      const projects = await this.generateProjects(topicName, difficulty);

      const topicData = {
        topicId: `topic_${Date.now()}`,
        name: topicName,
        nameEn: topicName,
        difficulty,
        duration,
        objectives: feynmanSteps.objectives,
        prerequisites: feynmanSteps.prerequisites,
        feynmanSteps: feynmanSteps.content,
        learningPlan,
        quizBank,
        resources,
        projects,
        published: true
      };

      console.log('✅ 学习内容生成完成');
      console.log('========================================\n');

      return topicData;

    } catch (error) {
      console.error('❌ 生成学习内容失败:', error);
      throw error;
    }
  }

  /**
   * 生成费曼学习法四步骤内容
   * @param {string} topicName
   * @param {string} difficulty
   * @returns {Promise<Object>}
   */
  async generateFeynmanSteps(topicName, difficulty) {
    const prompt = `你是一位资深的AI教育专家。请为「${topicName}」这个主题，使用费曼学习法设计完整的学习内容。

费曼学习法四步骤：

## 第1步：概念理解（Choose a concept）
请深入讲解${topicName}的核心概念：
- 定义和本质
- 核心原理
- 关键要点（5-8个）
- 具体例子（2-3个）
- 可视化建议

## 第2步：简单讲解（Teach it to a child）
请用最简单的语言解释${topicName}：
- 用小学生都能懂的话讲解
- 使用生活中的类比（3-5个）
- 故事化讲解
- 练习问题（3-5个基础问题）

## 第3步：识别缺口（Identify gaps）
请列出学习${topicName}时的常见问题：
- 常见误解（5-7个，附正确理解）
- 难点分析（3-5个，附详细拆解）
- 自我评估题（10个选择题）

## 第4步：回顾简化（Review and simplify）
请提供${topicName}的总结材料：
- 一句话总结
- 核心公式（如有）
- 关键要点速查表
- 实用技巧（5-8个）

## 学习目标（Objectives）
请列出学习完${topicName}后应达到的5-7个具体目标

## 先修知识（Prerequisites）
请列出学习${topicName}前需要掌握的3-5个前置知识点

难度等级：${difficulty}

请按照以下JSON格式输出：

\`\`\`json
{
  "objectives": ["目标1", "目标2", ...],
  "prerequisites": [
    {"topicId": "math_linear_algebra", "name": "线性代数", "required": true},
    ...
  ],
  "content": {
    "step1_concept": {
      "title": "第1步：理解核心概念",
      "description": "...",
      "keyPoints": ["要点1", "要点2", ...],
      "examples": ["例子1", "例子2", ...],
      "visualizations": ["图片描述1", ...]
    },
    "step2_teach": {
      "title": "第2步：用简单语言教给别人",
      "simpleExplanation": "...",
      "analogies": ["类比1", "类比2", ...],
      "storyMode": "...",
      "practiceQuestions": [
        {"question": "...", "answer": "...", "explanation": "..."},
        ...
      ]
    },
    "step3_gaps": {
      "title": "第3步：识别和填补知识缺口",
      "commonMisunderstandings": [
        {"misconception": "...", "correction": "...", "explanation": "..."},
        ...
      ],
      "difficultPoints": [
        {"point": "...", "breakdown": "...", "resources": [...]},
        ...
      ],
      "selfAssessment": [
        {"question": "...", "options": ["A...", "B...", ...], "correctAnswer": 0, "explanation": "..."},
        ...
      ]
    },
    "step4_review": {
      "title": "第4步：回顾和简化",
      "summary": "...",
      "keyFormulas": ["公式1", ...],
      "mindMap": "思维导图描述",
      "cheatSheet": "速查表内容",
      "practicalTips": ["技巧1", "技巧2", ...]
    }
  }
}
\`\`\``;

    try {
      const response = await aliyunBailianService.chat(prompt, {
        temperature: 0.7,
        maxTokens: 8000
      });

      // 解析JSON
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/\{[\s\S]*"objectives"[\s\S]*"content"[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        return parsed;
      }

      throw new Error('无法解析AI响应');

    } catch (error) {
      console.error('生成费曼步骤失败:', error);
      return this.getDefaultFeynmanSteps(topicName);
    }
  }

  /**
   * 生成分阶段学习计划
   * @param {string} topicName
   * @param {number} duration
   * @param {string} difficulty
   * @returns {Promise<Array>}
   */
  async generateLearningPlan(topicName, duration, difficulty) {
    const prompt = `为「${topicName}」设计一个${duration}天的学习计划。

要求：
1. 循序渐进，由浅入深
2. 每天包含：理论学习、实践练习、测试
3. 每天学习时间：1-2小时
4. 包含里程碑

请按以下JSON格式输出${duration}天的计划：

\`\`\`json
[
  {
    "day": 1,
    "title": "第1天：基础概念",
    "content": "今天的学习内容概述...",
    "activities": [
      {
        "type": "reading",
        "title": "阅读：什么是${topicName}",
        "description": "...",
        "estimatedTime": 30,
        "resourceUrl": ""
      },
      {
        "type": "video",
        "title": "观看：${topicName}入门视频",
        "description": "...",
        "estimatedTime": 20,
        "resourceUrl": ""
      },
      {
        "type": "quiz",
        "title": "测试：基础概念检测",
        "description": "...",
        "estimatedTime": 10,
        "resourceUrl": ""
      }
    ],
    "milestones": ["理解基本定义", "掌握核心术语"]
  },
  ...
]
\`\`\``;

    try {
      const response = await aliyunBailianService.chat(prompt, {
        temperature: 0.7,
        maxTokens: 6000
      });

      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/\[[\s\S]*"day"[\s\S]*\]/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr);
      }

      throw new Error('无法解析学习计划');

    } catch (error) {
      console.error('生成学习计划失败:', error);
      return this.getDefaultLearningPlan(topicName, duration);
    }
  }

  /**
   * 生成测试题库
   * @param {string} topicName
   * @param {string} difficulty
   * @returns {Promise<Array>}
   */
  async generateQuizBank(topicName, difficulty) {
    const prompt = `为「${topicName}」生成20道测试题，涵盖不同难度和题型。

题型：
- single_choice: 单选题
- multiple_choice: 多选题
- true_false: 判断题
- fill_blank: 填空题

难度：${difficulty}

JSON格式：
\`\`\`json
[
  {
    "question": "问题内容",
    "type": "single_choice",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "correctAnswer": 0,
    "explanation": "答案解析",
    "difficulty": "easy",
    "tags": ["tag1", "tag2"]
  },
  ...
]
\`\`\``;

    try {
      const response = await aliyunBailianService.chat(prompt, {
        temperature: 0.8,
        maxTokens: 6000
      });

      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/\[[\s\S]*"question"[\s\S]*\]/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr);
      }

      throw new Error('无法解析题库');

    } catch (error) {
      console.error('生成题库失败:', error);
      return this.getDefaultQuizBank(topicName);
    }
  }

  /**
   * 收集参考资料
   * @param {string} topicName
   * @returns {Promise<Object>}
   */
  async gatherResources(topicName) {
    // TODO: 集成arXiv搜索、视频搜索等
    return {
      papers: [],
      videos: [],
      books: [],
      blogs: [],
      tools: []
    };
  }

  /**
   * 生成实践项目
   * @param {string} topicName
   * @param {string} difficulty
   * @returns {Promise<Array>}
   */
  async generateProjects(topicName, difficulty) {
    const prompt = `为「${topicName}」设计3个实践项目，难度递增。

要求：
1. 项目1：入门项目（2-4小时）
2. 项目2：进阶项目（6-10小时）
3. 项目3：综合项目（12-20小时）

JSON格式：
\`\`\`json
[
  {
    "title": "项目标题",
    "description": "项目描述",
    "difficulty": "beginner",
    "estimatedTime": 3,
    "requirements": ["要求1", "要求2"],
    "hints": ["提示1", "提示2"],
    "solution": "解决方案概述"
  },
  ...
]
\`\`\``;

    try {
      const response = await aliyunBailianService.chat(prompt, {
        temperature: 0.7,
        maxTokens: 4000
      });

      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/\[[\s\S]*"title"[\s\S]*\]/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr);
      }

      throw new Error('无法解析项目');

    } catch (error) {
      console.error('生成项目失败:', error);
      return this.getDefaultProjects(topicName);
    }
  }

  /**
   * AI评估费曼教学
   * @param {string} topicName
   * @param {string} userExplanation
   * @returns {Promise<Object>}
   */
  async evaluateFeynmanExplanation(topicName, userExplanation) {
    const prompt = `作为AI教育专家，请评估学生对「${topicName}」的费曼教学解释。

学生的解释：
${userExplanation}

请从以下维度评分（0-100）：
1. 准确性：概念是否正确
2. 简洁性：是否用简单语言表达
3. 完整性：是否覆盖核心要点
4. 类比质量：类比是否恰当

JSON格式：
\`\`\`json
{
  "score": 85,
  "feedback": "总体评价...",
  "suggestions": ["建议1", "建议2", ...]
}
\`\`\``;

    try {
      const response = await aliyunBailianService.chat(prompt, {
        temperature: 0.6,
        maxTokens: 1000
      });

      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/\{[\s\S]*"score"[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr);
      }

      return { score: 70, feedback: '评估完成', suggestions: [] };

    } catch (error) {
      console.error('评估失败:', error);
      return { score: 70, feedback: '评估失败', suggestions: [] };
    }
  }

  // ========== 默认内容生成方法 ==========

  getDefaultFeynmanSteps(topicName) {
    return {
      objectives: [`理解${topicName}的核心概念`, `掌握${topicName}的应用场景`],
      prerequisites: [],
      content: {
        step1_concept: {
          title: '第1步：理解核心概念',
          description: `${topicName}的基础知识`,
          keyPoints: ['要点1', '要点2'],
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
      }
    };
  }

  getDefaultLearningPlan(topicName, duration) {
    const plan = [];
    for (let i = 1; i <= duration; i++) {
      plan.push({
        day: i,
        title: `第${i}天：学习计划`,
        content: `${topicName}第${i}天的学习内容`,
        activities: [],
        milestones: []
      });
    }
    return plan;
  }

  getDefaultQuizBank(topicName) {
    return [];
  }

  getDefaultProjects(topicName) {
    return [];
  }
}

module.exports = new LearningService();

