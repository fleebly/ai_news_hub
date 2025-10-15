const express = require('express');
const OpenAI = require('openai');
const auth = require('../middleware/auth');

const router = express.Router();

// 初始化OpenAI客户端（如果配置了API key）
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('✅ OpenAI客户端初始化成功');
} else {
  console.warn('⚠️  OpenAI API key未配置，AI功能将不可用');
}

// AI代码批注和分析
router.post('/analyze-code', auth, async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ message: 'AI服务未配置，请联系管理员配置OpenAI API key' });
    }

    const { code, questionTitle, language = 'javascript' } = req.body;

    if (!code) {
      return res.status(400).json({ message: '请提供代码' });
    }

    const prompt = `
作为一位经验丰富的编程教练，请分析以下代码并提供详细的反馈：

题目：${questionTitle}
编程语言：${language}

代码：
\`\`\`${language}
${code}
\`\`\`

请从以下几个方面进行分析：
1. 代码正确性 - 逻辑是否正确
2. 代码质量 - 可读性、可维护性
3. 性能优化 - 时间复杂度和空间复杂度
4. 最佳实践 - 是否遵循编程规范
5. 改进建议 - 具体的优化建议

请用中文回复，格式要清晰易读。
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "你是一位专业的编程教练，擅长代码审查和教学。请用中文提供详细、友好的代码分析反馈。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    const analysis = completion.choices[0].message.content;

    res.json({
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI分析错误:', error);
    res.status(500).json({ 
      message: 'AI分析服务暂时不可用',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

// AI生成编程提示
router.post('/generate-hint', auth, async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ message: 'AI服务未配置，请联系管理员配置OpenAI API key' });
    }

    const { questionDescription, userCode, difficulty } = req.body;

    if (!questionDescription) {
      return res.status(400).json({ message: '请提供题目描述' });
    }

    const prompt = `
作为编程教练，请为以下编程题目生成一个有用的提示：

题目描述：${questionDescription}
难度：${difficulty || '未知'}
用户当前代码：${userCode || '无'}

请生成一个提示，帮助用户理解题目要求或提供解题思路，但不要直接给出答案。
提示应该：
1. 引导思考方向
2. 指出关键概念
3. 提供解题思路
4. 保持适度的挑战性

请用中文回复，语言要友好和鼓励性。
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "你是一位耐心的编程教练，善于通过提示引导学生思考，而不是直接给出答案。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.8
    });

    const hint = completion.choices[0].message.content;

    res.json({
      hint,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI生成提示错误:', error);
    res.status(500).json({ 
      message: 'AI提示生成服务暂时不可用',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

// AI代码优化建议
router.post('/optimize-code', auth, async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ message: 'AI服务未配置，请联系管理员配置OpenAI API key' });
    }

    const { code, language = 'javascript', focus = 'performance' } = req.body;

    if (!code) {
      return res.status(400).json({ message: '请提供代码' });
    }

    const focusMap = {
      performance: '性能优化',
      readability: '可读性改进',
      maintainability: '可维护性提升',
      best_practices: '最佳实践应用'
    };

    const prompt = `
作为编程专家，请对以下代码进行${focusMap[focus] || '综合'}优化：

编程语言：${language}
代码：
\`\`\`${language}
${code}
\`\`\`

请提供：
1. 优化后的代码
2. 优化说明
3. 性能对比（如果适用）
4. 其他改进建议

请用中文回复，代码要完整可运行。
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "你是一位代码优化专家，能够提供高质量的代码改进建议。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.5
    });

    const optimization = completion.choices[0].message.content;

    res.json({
      optimization,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI代码优化错误:', error);
    res.status(500).json({ 
      message: 'AI优化服务暂时不可用',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

module.exports = router;

