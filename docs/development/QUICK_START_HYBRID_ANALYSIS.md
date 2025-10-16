# 🚀 混合模型PDF分析 - 快速开始

## 🎯 目标

验证 **qwen-max + qwen-vl-plus** 混合方案的可行性，实现真正的PDF图表提取和深度解读。

---

## ✅ 前提条件

### 1. Python环境

```bash
# 检查Python版本（需要3.7+）
python3 --version

# 创建虚拟环境（推荐）
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows

# 安装依赖
pip install pdf2image pillow requests
```

### 2. 系统依赖

#### macOS:
```bash
brew install poppler
```

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install poppler-utils
```

#### Windows:
下载并安装 [Poppler for Windows](http://blog.alivate.com.au/poppler-windows/)

### 3. 验证安装

```bash
python3 -c "from pdf2image import convert_from_path; print('✅ pdf2image OK')"
python3 -c "from PIL import Image; print('✅ PIL OK')"
python3 -c "import requests; print('✅ requests OK')"
```

---

## 🧪 阶段1：测试PDF转图片（5分钟）

### 快速测试

```bash
cd server/scripts

# 测试转换（GPT-4论文）
./test-pdf-vision.py

# 或指定其他论文
./test-pdf-vision.py https://arxiv.org/pdf/2303.12712.pdf
```

### 预期输出

```
============================================================
🧪 PDF转图片测试 - 混合模型方案验证
============================================================

📄 测试PDF: https://arxiv.org/pdf/2303.08774.pdf

📥 下载PDF: https://arxiv.org/pdf/2303.08774.pdf
✅ PDF下载完成: 1234567 bytes

🔄 转换PDF为图片 (前5页, DPI=150)...
✅ 成功转换 5 页

  页面 1: 1240x1754 - 123.4 KB
  页面 2: 1240x1754 - 145.2 KB
  页面 3: 1240x1754 - 156.7 KB
  页面 4: 1240x1754 - 167.8 KB
  页面 5: 1240x1754 - 189.3 KB

📊 总计: 782.4 KB
💰 估算成本:
  - 图片数量: 5
  - 单价: 0.15元/张
  - 总成本: 0.75元

============================================================
✅ 测试完成！
============================================================

📝 结论:
  ✅ PDF转图片: 可行
  ✅ 转换速度: 快速（约5秒）
  ✅ 图片质量: 良好
  ✅ 成本估算: 0.75元/5页
```

**如果测试成功** → 进入阶段2
**如果失败** → 检查依赖安装

---

## 🔬 阶段2：测试视觉模型API（10分钟）

### 测试qwen-vl-plus

```bash
cd server

# 创建测试脚本
node -e "
const aliyunService = require('./services/aliyunBailianService');

// 测试图片URL（或base64）
const testImageUrl = 'https://example.com/test.jpg';

aliyunService.chatWithVision([
  {
    role: 'user',
    content: '请描述这张图片的内容'
  }
], testImageUrl, {
  model: 'qwen-vl-plus',
  maxTokens: 1000
})
.then(result => {
  console.log('✅ 视觉模型测试成功');
  console.log('响应:', result);
})
.catch(error => {
  console.error('❌ 视觉模型测试失败:', error.message);
});
"
```

### 或使用curl测试

```bash
# 获取base64图片
BASE64_IMAGE=$(python3 -c "
from pdf2image import convert_from_bytes
import requests
import base64
from io import BytesIO

pdf = requests.get('https://arxiv.org/pdf/2303.08774.pdf').content
imgs = convert_from_bytes(pdf, dpi=150, first_page=1, last_page=1)
buf = BytesIO()
imgs[0].save(buf, format='JPEG')
print(base64.b64encode(buf.getvalue()).decode())
")

# 测试API
curl -X POST https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation \
  -H "Authorization: Bearer $ALIYUN_BAILIAN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"qwen-vl-plus\",
    \"input\": {
      \"messages\": [
        {
          \"role\": \"user\",
          \"content\": [
            {
              \"type\": \"image\",
              \"image\": \"data:image/jpeg;base64,$BASE64_IMAGE\"
            },
            {
              \"type\": \"text\",
              \"text\": \"请描述这张图片的内容，重点关注是否包含技术架构图、流程图或实验结果图\"
            }
          ]
        }
      ]
    }
  }"
```

---

## 🎯 阶段3：完整流程测试（15分钟）

### 修改server/routes/paperAnalysis.js

```javascript
const pdfVisionService = require('../services/pdfVisionService');

// 添加新的混合分析路由
router.post('/analyze-hybrid', async (req, res) => {
  try {
    const { paper, mode = 'standard' } = req.body;
    
    // 检查Python环境
    const pythonOK = await pdfVisionService.checkPythonEnvironment();
    if (!pythonOK) {
      return res.status(500).json({
        success: false,
        error: 'Python环境未配置。请安装pdf2image和pillow'
      });
    }
    
    // 执行混合分析
    const result = await pdfVisionService.hybridAnalysis(
      paper,
      aliyunBailianService,
      mode
    );
    
    res.json({
      success: true,
      data: {
        content: result.content,
        keyFigures: result.keyFigures.map(fig => ({
          pageNumber: fig.pageNumber,
          figureType: fig.figureType,
          description: fig.description,
          // 注意：实际应用中需要将base64图片存储到云存储
          imageUrl: `data:image/jpeg;base64,${fig.imageBase64.substring(0, 100)}...`
        })),
        metadata: result.metadata
      }
    });
    
  } catch (error) {
    console.error('混合分析失败:', error);
    
    // 降级到文本模式
    try {
      const textResult = await aliyunBailianService.analyzePaper(
        req.body.paper,
        'deep'
      );
      
      res.json({
        success: true,
        data: textResult,
        fallback: true,
        fallbackReason: error.message
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        error: '分析失败',
        details: fallbackError.message
      });
    }
  }
});
```

### 测试完整流程

```bash
curl -X POST http://localhost:5000/paper-analysis/analyze-hybrid \
  -H "Content-Type: application/json" \
  -d '{
    "paper": {
      "title": "GPT-4 Technical Report",
      "abstract": "We report the development of GPT-4...",
      "pdfUrl": "https://arxiv.org/pdf/2303.08774.pdf",
      "authors": ["OpenAI"]
    },
    "mode": "standard"
  }'
```

---

## 📊 预期结果

### 成功示例

```json
{
  "success": true,
  "data": {
    "content": "## 🎯 研究背景与动机\n\n...\n\n![模型架构图](figure_1_page_3)\n\n...",
    "keyFigures": [
      {
        "pageNumber": 3,
        "figureType": "模型架构图",
        "description": "展示了GPT-4的完整Transformer架构...",
        "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
      }
    ],
    "metadata": {
      "pagesAnalyzed": 5,
      "figuresFound": 3,
      "duration": "45.2",
      "mode": "standard"
    }
  }
}
```

---

## 💰 成本统计

### 单次分析成本

```
标准模式（5页）:
- PDF转图片: 0.001元
- 视觉模型: 5 × 0.15 = 0.75元
- 文本模型: 0.02元
= 0.77元

完整模式（10页）:
- PDF转图片: 0.002元
- 视觉模型: 10 × 0.15 = 1.50元
- 文本模型: 0.02元
= 1.52元
```

### 月度成本（1000次）

```
如果70%快速 + 25%标准 + 5%完整:
= 700×0.02 + 250×0.77 + 50×1.52
= 14 + 192.5 + 76
= 282.5元/月
```

**可接受！**

---

## 🎨 前端集成

### 添加模式选择

```javascript
// client/src/pages/Papers.jsx

const [analysisMode, setAnalysisMode] = useState('fast');
const [analysisLevel, setAnalysisLevel] = useState('standard');

// 在AI解读modal中添加
<div className="mb-4">
  <label className="block text-sm font-medium mb-2">
    分析级别
  </label>
  <select 
    value={analysisLevel}
    onChange={(e) => setAnalysisLevel(e.target.value)}
    className="w-full p-2 border rounded"
  >
    <option value="fast">
      快速模式（文字描述，免费）
    </option>
    <option value="standard">
      标准模式（含关键图表，约0.8元）
    </option>
    <option value="deep">
      完整模式（深度分析，约1.5元）
    </option>
  </select>
  
  <div className="mt-2 text-xs text-gray-500">
    {analysisLevel === 'fast' && '⚡ 1-3分钟 | 纯文本分析'}
    {analysisLevel === 'standard' && '🖼️ 2-4分钟 | 提取关键图表'}
    {analysisLevel === 'deep' && '🔬 3-5分钟 | 完整页面分析'}
  </div>
</div>
```

---

## ✅ 验证清单

### 基础验证
- [ ] Python环境安装完成
- [ ] pdf2image和poppler可用
- [ ] PDF转图片测试成功

### API验证
- [ ] qwen-vl-plus API可用
- [ ] 图片base64上传成功
- [ ] 视觉分析返回正确

### 完整流程
- [ ] PDF下载和转换
- [ ] 多页并行分析
- [ ] 关键图表提取
- [ ] 深度解读生成
- [ ] 图片正确引用

### 性能验证
- [ ] 响应时间< 5分钟
- [ ] 成本< 2元/次
- [ ] 降级机制正常
- [ ] 错误处理完善

---

## 🐛 故障排除

### 问题1：pdf2image导入失败

```bash
# 检查poppler
which pdftoppm

# 如果没有，重新安装
brew install poppler  # macOS
```

### 问题2：内存不足

```python
# 降低DPI或减少页数
images = convert_from_bytes(pdf, dpi=100, last_page=3)
```

### 问题3：API超时

```javascript
// 增加超时时间
axios.post(url, data, { timeout: 300000 }) // 5分钟
```

---

## 🚀 下一步

### 立即可做
1. ✅ 运行测试脚本验证可行性
2. ✅ 测试单次混合分析
3. ✅ 评估成本和效果

### 短期计划（1-2周）
- [ ] 完善pdfVisionService
- [ ] 添加图片云存储
- [ ] 集成到现有API
- [ ] 前端UI更新

### 中期计划（1个月）
- [ ] 性能优化
- [ ] 成本控制
- [ ] 缓存策略
- [ ] 用户反馈收集

---

**准备好开始测试了吗？** 🎉

运行第一个测试：
```bash
cd server/scripts
./test-pdf-vision.py
```

