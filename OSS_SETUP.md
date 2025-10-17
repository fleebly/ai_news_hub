# 🗄️ 阿里云OSS配置指南

## 为什么需要OSS？

**阿里云通义千问VL视觉API只支持URL格式的图片，不支持base64！**

错误示例：
```
❌ The provided URL does not appear to be valid
❌ The image format is illegal and cannot be opened
```

正确方案：
```
✅ 将PDF提取的图片上传到OSS
✅ 使用OSS的公网URL传递给视觉API
✅ 分析完成后自动清理临时图片
```

---

## 📋 配置步骤

### 1. 开通阿里云OSS服务

1. 登录 [阿里云控制台](https://oss.console.aliyun.com/)
2. 开通OSS服务（如果还没开通）
3. 创建一个Bucket：
   - 区域：选择离你最近的（如：华北2-北京）
   - 读写权限：**公共读**（重要！）
   - 存储类型：标准存储
   - 名称：例如 `ai-paper-images`

### 2. 创建AccessKey

1. 进入 [RAM访问控制](https://ram.console.aliyun.com/)
2. 创建用户（如果还没有）
3. 为用户添加权限：`AliyunOSSFullAccess`
4. 创建AccessKey，记录：
   - AccessKey ID
   - AccessKey Secret

### 3. 配置环境变量

编辑 `server/.env` 文件，添加：

```bash
# 阿里云OSS配置（用于PDF图片临时存储）
ALIYUN_OSS_ACCESS_KEY_ID=your_access_key_id
ALIYUN_OSS_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_OSS_BUCKET=ai-paper-images
ALIYUN_OSS_REGION=oss-cn-beijing
```

**参数说明**：
- `ALIYUN_OSS_ACCESS_KEY_ID`: AccessKey ID
- `ALIYUN_OSS_ACCESS_KEY_SECRET`: AccessKey Secret
- `ALIYUN_OSS_BUCKET`: Bucket名称
- `ALIYUN_OSS_REGION`: Bucket所在区域
  - 华北2-北京：`oss-cn-beijing`
  - 华东1-杭州：`oss-cn-hangzhou`
  - 华东2-上海：`oss-cn-shanghai`
  - 华南1-深圳：`oss-cn-shenzhen`

### 4. 重启服务

```bash
cd server
npm start
```

看到以下日志表示配置成功：
```
✅ 阿里云OSS服务已启用
   - Region: oss-cn-beijing
   - Bucket: ai-paper-images
```

---

## 🔍 工作流程

```
PDF文件
   ↓
[PDF → 图片] (Python pdf2image)
   ↓
[上传到OSS] (ali-oss SDK)
   ↓
获取图片URL (https://bucket.oss-region.aliyuncs.com/path)
   ↓
[视觉API分析] (qwen-vl-plus + URL)
   ↓
提取关键图表
   ↓
[清理OSS临时图片] (自动删除)
   ↓
生成解读文章
```

---

## 💰 费用说明

### OSS存储费用
- 标准存储：0.12元/GB/月
- 每张图片约：100-500KB
- 临时存储（自动清理）：几乎免费

### 流量费用
- 内网流量（阿里云间）：免费
- 外网流出：0.50元/GB
- 视觉API访问图片：使用内网，免费

### 示例计算
```
每次解读: 5张图片 × 300KB = 1.5MB
存储时间: < 30分钟（自动清理）
每月1000次解读:
- 存储费用: 几乎为0
- 流量费用: 几乎为0（内网访问）
- 总计: < 1元/月
```

---

## 🛡️ 安全建议

### 1. 使用RAM子用户
```
✅ 不要使用主账号的AccessKey
✅ 创建专用的RAM子用户
✅ 只授予OSS相关权限
```

### 2. 设置Bucket权限
```
✅ 读写权限：公共读
✅ 服务端加密：开启（可选）
✅ 防盗链：配置白名单（可选）
```

### 3. 设置生命周期规则
```
✅ 路径：pdf-images/
✅ 规则：30天后自动删除
✅ 作用：清理可能遗留的图片
```

在OSS控制台 → Bucket → 基础设置 → 生命周期规则：
```
规则名称: 清理临时图片
前缀: pdf-images/
操作: 删除
过期天数: 30天
```

---

## 🧪 测试验证

### 1. 检查OSS配置
```javascript
// server/routes/paperAnalysis.js 已添加状态检查
GET /api/paper-analysis/status

响应:
{
  "ready": true,
  "ossEnabled": true,
  "ossStatus": {
    "enabled": true,
    "bucket": "ai-paper-images",
    "region": "oss-cn-beijing"
  }
}
```

### 2. 测试上传功能
启动服务后，查看日志：
```
✅ 阿里云OSS服务已启用
   - Region: oss-cn-beijing
   - Bucket: ai-paper-images

📤 上传图片到OSS...
   ✅ 图片已上传: pdf-images/1729123456789_abc123.jpg
   ✅ 图片已上传: pdf-images/1729123456790_def456.jpg
✅ 5 张图片已上传到OSS
```

### 3. 测试解读功能
前端点击"AI解读"，观察进度：
```
✅ PDF转换完成: 5页
📤 上传图片到云端...
✅ 图片上传完成
👁️ AI视觉分析中...
✅ 视觉分析完成: 5页
✅ 找到3个关键图表
📝 AI生成深度解读...
✅ 分析完成
```

---

## ❌ 常见问题

### 问题1：OSS未配置
```
错误: OSS服务未配置，无法进行视觉分析
解决: 
1. 检查.env文件是否配置OSS相关变量
2. 重启服务使配置生效
```

### 问题2：AccessDenied
```
错误: AccessDenied: You have no right to access this object
解决:
1. 确认Bucket权限设置为"公共读"
2. 确认RAM用户有OSS访问权限
```

### 问题3：NoSuchBucket
```
错误: NoSuchBucket: The specified bucket does not exist
解决:
1. 检查ALIYUN_OSS_BUCKET名称是否正确
2. 检查ALIYUN_OSS_REGION是否与Bucket匹配
```

### 问题4：InvalidAccessKeyId
```
错误: InvalidAccessKeyId: The Access Key ID provided does not exist
解决:
1. 检查AccessKey ID是否正确
2. 检查是否使用了正确的账号
```

---

## 🔄 迁移方案

### 方案1：OSS（推荐）✅
- 优点：阿里云官方推荐，稳定可靠
- 缺点：需要配置和少量费用
- 适用：生产环境

### 方案2：其他云存储
如果不想用OSS，可以使用：
- 腾讯云COS
- 七牛云
- 又拍云

修改 `ossService.js`，替换SDK即可。

### 方案3：自建图片服务器
- 优点：完全免费
- 缺点：需要公网IP，需要维护
- 适用：有服务器资源的情况

---

## 📚 相关文档

### 阿里云官方文档
- [OSS快速入门](https://help.aliyun.com/zh/oss/getting-started/)
- [OSS定价说明](https://www.aliyun.com/price/product#/oss/detail)
- [Node.js SDK](https://help.aliyun.com/zh/oss/developer-reference/node-js-overview)

### 通义千问VL API
- [multimodal-generation](https://help.aliyun.com/zh/model-studio/developer-reference/vision-understanding)
- [图片格式要求](https://help.aliyun.com/zh/model-studio/developer-reference/qwen-vl-plus-api)

---

## ✅ 配置完成检查清单

- [ ] 开通阿里云OSS服务
- [ ] 创建Bucket（公共读权限）
- [ ] 创建RAM用户和AccessKey
- [ ] 配置环境变量（.env）
- [ ] 重启后端服务
- [ ] 查看日志确认OSS启用
- [ ] 测试AI解读功能
- [ ] 设置生命周期规则（可选）

---

**完成以上配置后，PDF图片提取功能将完全可用！** 🎉

_最后更新：2025-10-17_

