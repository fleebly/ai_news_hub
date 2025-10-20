# ⏰ 定时任务配置指南

## 📋 功能说明

系统支持自动定时更新论文和博客，无需手动操作。默认每天早上9点自动执行更新任务。

---

## ✨ 核心功能

### 1. 论文自动更新
- **数据源**: arXiv（最稳定，100%成功率）
- **分类**: cs.AI, cs.LG, cs.CV, cs.CL, cs.NE, cs.RO
- **数量**: 每次获取50篇最新论文
- **存储**: 自动保存到MongoDB数据库

### 2. 博客自动更新
- **数据源**: AI相关RSS源
- **数量**: 每次获取50篇最新博客
- **缓存**: 自动刷新缓存

### 3. 可选外部爬虫
- **Reddit**: 获取热门AI讨论
- **Papers with Code**: 获取带代码的论文
- **Hugging Face**: 获取最新模型论文
- **注意**: 外部源可能不稳定，默认关闭

---

## 🔧 环境配置

### 1. 安装依赖

定时任务功能已集成到系统中，无需额外安装。使用的是 `node-cron` 包。

### 2. 配置 `.env` 文件

在 `server/.env` 文件中添加以下配置：

```bash
# ========================================
# 定时任务配置
# ========================================

# 是否启用定时任务 (true/false)
ENABLE_SCHEDULER=true

# 论文更新时间 (cron表达式)
# 格式: 分 时 日 月 周
# 默认: 每天上午9:00
PAPER_UPDATE_TIME=0 9 * * *

# 博客更新时间 (cron表达式)
# 默认: 每天上午9:00
BLOG_UPDATE_TIME=0 9 * * *

# 是否启用外部爬虫 (Reddit等，可能超时)
# 推荐设置为 false（不稳定）
ENABLE_EXTERNAL_CRAWL=false
```

### 3. Cron表达式说明

Cron表达式格式: `分 时 日 月 周`

| 表达式 | 说明 | 示例 |
|--------|------|------|
| `0 9 * * *` | 每天上午9:00 | ⭐ 推荐 |
| `0 0 * * *` | 每天午夜0:00 | 深夜更新 |
| `0 9,21 * * *` | 每天9:00和21:00 | 每日2次 |
| `0 9 * * 1-5` | 工作日上午9:00 | 仅工作日 |
| `*/30 * * * *` | 每30分钟 | 频繁更新 |
| `0 */6 * * *` | 每6小时 | 每日4次 |

**字段说明**:
- 分钟: 0-59
- 小时: 0-23
- 日: 1-31
- 月: 1-12
- 周: 0-7 (0和7都代表周日)

**时区**: 所有时间使用 `Asia/Shanghai` (北京时间)

---

## 🚀 使用方式

### 方式1: 自动执行（推荐）

启动服务器后，定时任务会自动运行：

```bash
cd /Users/cheng/Workspace/ai_news_hub/server
node index.js
```

**期望输出**:
```
🚀 AI编程教练服务器运行在端口 5000
📚 环境: development

⏰ ========== 定时任务服务启动 ==========
📄 论文更新任务: 0 9 * * *
   • cron表达式: 0 9 * * *
   • 说明: 每天上午9:00
📝 博客更新任务: 0 9 * * *
   • cron表达式: 0 9 * * *
   • 说明: 每天上午9:00
⏰ ======================================
```

### 方式2: 手动测试

使用测试脚本立即触发更新：

```bash
cd /Users/cheng/Workspace/ai_news_hub/server

# 测试所有任务
node test-scheduler.js

# 只测试论文更新
node test-scheduler.js papers

# 只测试博客更新
node test-scheduler.js blogs

# 查看帮助
node test-scheduler.js --help
```

### 方式3: API调用

通过HTTP API手动触发：

```bash
# 获取定时任务状态
curl http://localhost:5000/api/scheduler/status

# 触发论文更新
curl -X POST http://localhost:5000/api/scheduler/trigger/papers

# 触发博客更新
curl -X POST http://localhost:5000/api/scheduler/trigger/blogs

# 触发所有更新
curl -X POST http://localhost:5000/api/scheduler/trigger/all
```

---

## 📊 API接口

### 1. 获取任务状态

**请求**:
```
GET /api/scheduler/status
```

**响应**:
```json
{
  "success": true,
  "enabled": true,
  "tasks": [
    { "name": "paperUpdate", "running": true },
    { "name": "blogUpdate", "running": true }
  ],
  "schedule": {
    "paper": "0 9 * * *",
    "blog": "0 9 * * *"
  },
  "timezone": "Asia/Shanghai"
}
```

### 2. 触发论文更新

**请求**:
```
POST /api/scheduler/trigger/papers
```

**响应**:
```json
{
  "success": true,
  "message": "成功获取 50 篇论文",
  "count": 50
}
```

### 3. 触发博客更新

**请求**:
```
POST /api/scheduler/trigger/blogs
```

**响应**:
```json
{
  "success": true,
  "message": "成功获取 50 篇博客",
  "count": 50
}
```

### 4. 触发所有更新

**请求**:
```
POST /api/scheduler/trigger/all
```

**响应**:
```json
{
  "success": true,
  "message": "论文: 50篇, 博客: 50篇",
  "papers": {
    "success": true,
    "count": 50
  },
  "blogs": {
    "success": true,
    "count": 50
  }
}
```

---

## 🔍 监控与日志

### 1. 查看实时日志

```bash
# 查看服务器日志
tail -f /tmp/server.log

# 只看定时任务日志
tail -f /tmp/server.log | grep -E '定时任务|更新论文|更新博客'

# 只看论文更新
tail -f /tmp/server.log | grep -E '论文|arXiv'

# 只看博客更新
tail -f /tmp/server.log | grep -E '博客|RSS'
```

### 2. 定时任务执行日志

**论文更新日志示例**:
```
🔄 ========== 定时任务：更新论文 ==========
⏰ 触发时间: 2025-10-17 09:00:00

📡 方式1: 从arXiv获取最新论文...
✅ arXiv: 成功获取 50 篇论文
✅ 论文更新任务完成！
========================================
```

**博客更新日志示例**:
```
🔄 ========== 定时任务：更新博客 ==========
⏰ 触发时间: 2025-10-17 09:00:00

📡 从RSS源获取最新博客...
✅ 成功获取 50 篇博客
✅ 博客更新任务完成！
========================================
```

### 3. 监控脚本

创建监控脚本 `monitor-scheduler.sh`:

```bash
#!/bin/bash

echo "⏰ 定时任务监控面板"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 获取任务状态
echo "📊 任务状态:"
curl -s http://localhost:5000/api/scheduler/status | python3 -m json.tool
echo ""

# 查看最近的执行日志
echo "📝 最近执行日志:"
tail -20 /tmp/server.log | grep -E '定时任务|更新' | tail -10
echo ""

# 查看MongoDB中的论文数量
echo "💾 数据库状态:"
mongosh ai_programming_coach --quiet --eval "
  print('论文总数: ' + db.paper.countDocuments());
  print('博客总数: ' + db.blogs.countDocuments());
"
```

---

## ⚙️ 配置示例

### 场景1: 每天早上9点更新（推荐）

```bash
ENABLE_SCHEDULER=true
PAPER_UPDATE_TIME=0 9 * * *
BLOG_UPDATE_TIME=0 9 * * *
ENABLE_EXTERNAL_CRAWL=false
```

**优点**:
- ✅ 用户习惯（早上查看最新内容）
- ✅ 避免高峰期（夜间arXiv更新）
- ✅ 稳定可靠

### 场景2: 每天早晚各一次

```bash
ENABLE_SCHEDULER=true
PAPER_UPDATE_TIME=0 9,21 * * *
BLOG_UPDATE_TIME=0 9,21 * * *
ENABLE_EXTERNAL_CRAWL=false
```

**优点**:
- ✅ 内容更新更及时
- ✅ 早晚都有新内容

**缺点**:
- ⚠️ API调用次数增加

### 场景3: 仅工作日更新

```bash
ENABLE_SCHEDULER=true
PAPER_UPDATE_TIME=0 9 * * 1-5
BLOG_UPDATE_TIME=0 9 * * 1-5
ENABLE_EXTERNAL_CRAWL=false
```

**优点**:
- ✅ 节省API调用
- ✅ 符合工作习惯

### 场景4: 频繁更新（开发测试）

```bash
ENABLE_SCHEDULER=true
PAPER_UPDATE_TIME=*/30 * * * *
BLOG_UPDATE_TIME=*/30 * * * *
ENABLE_EXTERNAL_CRAWL=false
```

**注意**: 仅用于测试，生产环境不推荐！

### 场景5: 禁用定时任务

```bash
ENABLE_SCHEDULER=false
```

**说明**: 完全禁用定时任务，仅手动触发

---

## 🛠️ 故障排查

### 问题1: 定时任务没有执行

**检查步骤**:

1. 确认配置已启用
```bash
# 检查 .env 文件
cat server/.env | grep ENABLE_SCHEDULER
# 应该显示: ENABLE_SCHEDULER=true
```

2. 检查服务器启动日志
```bash
tail -50 /tmp/server.log | grep '定时任务'
# 应该看到: ⏰ ========== 定时任务服务启动 ==========
```

3. 验证cron表达式
```bash
# 访问 https://crontab.guru/ 验证表达式
# 或使用测试脚本
node test-scheduler.js
```

### 问题2: 任务执行失败

**检查步骤**:

1. 查看错误日志
```bash
tail -100 /tmp/server.log | grep -E '❌|失败|error'
```

2. 检查MongoDB连接
```bash
mongosh ai_programming_coach --eval "db.serverStatus()"
```

3. 检查网络连接
```bash
curl -I https://export.arxiv.org/api/query
```

4. 手动测试
```bash
node test-scheduler.js papers
```

### 问题3: arXiv超时

**解决方案**:

1. 增加超时时间（在 `arxivService.js` 中）
2. 减少单次获取数量
3. 分批次获取

### 问题4: 外部爬虫失败

**解决方案**:

1. 禁用外部爬虫（推荐）
```bash
ENABLE_EXTERNAL_CRAWL=false
```

2. 仅使用arXiv（最稳定）
3. 查看 `CRAWL_FIX_SUMMARY.md` 了解详情

---

## 📈 性能优化

### 1. 数据库索引

确保MongoDB有适当的索引：

```javascript
// 在MongoDB中创建索引
db.paper.createIndex({ arxivId: 1 }, { unique: true });
db.paper.createIndex({ publishedAt: -1 });
db.paper.createIndex({ category: 1 });
```

### 2. 缓存策略

- 论文数据自动去重（基于arXivId）
- 博客使用缓存机制（24小时）
- 定时任务强制刷新缓存

### 3. 并发控制

- arXiv API: 串行请求（避免限流）
- 数据库写入: 批量upsert（提升性能）
- 错误重试: 指数退避（避免雪崩）

---

## 📊 监控指标

### 1. 成功率

```bash
# 查看最近10次执行
tail -200 /tmp/server.log | grep -E '定时任务|成功|失败' | tail -20
```

### 2. 数据增长

```bash
# 每日数据增长
mongosh ai_programming_coach --eval "
  db.paper.aggregate([
    {
      \$group: {
        _id: {
          \$dateToString: { format: '%Y-%m-%d', date: '\$createdAt' }
        },
        count: { \$sum: 1 }
      }
    },
    { \$sort: { _id: -1 } },
    { \$limit: 7 }
  ]).forEach(printjson);
"
```

### 3. 执行时间

定时任务日志中会显示执行时间，可用于性能分析。

---

## 🔐 安全建议

### 1. API限流

定时任务的API接口建议添加认证：

```javascript
// 在 scheduler.js 中添加认证中间件
const auth = require('../middleware/auth');

router.post('/scheduler/trigger/papers', auth, async (req, res) => {
  // ...
});
```

### 2. 日志脱敏

确保日志中不包含敏感信息（API密钥等）

### 3. 错误处理

所有任务都有完善的错误处理，不会导致服务器崩溃

---

## 📚 相关文档

1. **`SCHEDULER_GUIDE.md`** - 本文档（完整配置指南）
2. **`CRAWL_FIX_SUMMARY.md`** - 爬取功能修复说明
3. **`PAPERS_DATABASE_UPDATE.md`** - 数据库更新文档
4. **`LATEST_IMPROVEMENTS.md`** - 最新功能说明

---

## 🎯 最佳实践

### 1. 生产环境推荐配置

```bash
# 启用定时任务
ENABLE_SCHEDULER=true

# 每天早上9:00更新（避开用户高峰期）
PAPER_UPDATE_TIME=0 9 * * *
BLOG_UPDATE_TIME=0 9 * * *

# 禁用不稳定的外部爬虫
ENABLE_EXTERNAL_CRAWL=false

# 时区设置为北京时间
TZ=Asia/Shanghai
```

### 2. 开发环境配置

```bash
# 启用定时任务（便于测试）
ENABLE_SCHEDULER=true

# 短周期（例如每30分钟，快速验证）
PAPER_UPDATE_TIME=*/30 * * * *
BLOG_UPDATE_TIME=*/30 * * * *

# 禁用外部爬虫（加快测试）
ENABLE_EXTERNAL_CRAWL=false
```

### 3. 测试环境配置

```bash
# 禁用自动任务（避免干扰测试）
ENABLE_SCHEDULER=false

# 仅通过API手动触发
# curl -X POST http://localhost:5000/api/scheduler/trigger/all
```

---

## 🚀 快速开始

### 1. 检查配置

```bash
cd /Users/cheng/Workspace/ai_news_hub/server
cat .env | grep SCHEDULER
```

### 2. 启动服务

```bash
node index.js
```

### 3. 验证任务

```bash
# 查看任务状态
curl http://localhost:5000/api/scheduler/status

# 手动触发测试
curl -X POST http://localhost:5000/api/scheduler/trigger/all
```

### 4. 监控日志

```bash
tail -f /tmp/server.log | grep -E '定时任务|更新'
```

---

## 🎉 总结

### ✅ 核心优势

1. **全自动** - 无需手动操作
2. **稳定可靠** - 使用arXiv官方API（100%成功率）
3. **灵活配置** - 支持自定义时间和频率
4. **完善监控** - 详细的日志和API接口
5. **优雅降级** - 失败不影响服务器运行

### 📊 默认配置

- ✅ **启用**: 是
- ⏰ **时间**: 每天9:00
- 📊 **数量**: 论文50篇，博客50篇
- 🌐 **数据源**: arXiv（最稳定）
- ⚠️ **外部源**: 禁用（不稳定）

### 🎯 推荐使用

**生产环境**: 
```
每天早上9:00自动更新
无需任何手动操作
稳定可靠，100%成功率
```

---

**更新时间**: 2025-10-17  
**版本**: v3.0 - 定时任务版

