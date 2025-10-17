const OSS = require('ali-oss');
const crypto = require('crypto');

/**
 * 阿里云OSS服务
 * 用于上传PDF提取的图片，供视觉API访问
 */
class OSSService {
  constructor() {
    this.enabled = false;
    this.client = null;
    this.bucket = null;
    this.region = null;
    
    // 从环境变量读取配置
    const accessKeyId = process.env.ALIYUN_OSS_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_OSS_ACCESS_KEY_SECRET;
    const bucket = process.env.ALIYUN_OSS_BUCKET;
    const region = process.env.ALIYUN_OSS_REGION || 'oss-cn-beijing';
    
    if (accessKeyId && accessKeySecret && bucket) {
      try {
        this.client = new OSS({
          region,
          accessKeyId,
          accessKeySecret,
          bucket
        });
        this.bucket = bucket;
        this.region = region;
        this.enabled = true;
        console.log('✅ 阿里云OSS服务已启用');
        console.log(`   - Region: ${region}`);
        console.log(`   - Bucket: ${bucket}`);
      } catch (error) {
        console.error('❌ OSS初始化失败:', error.message);
      }
    } else {
      console.log('⚠️  OSS未配置，将使用降级模式');
      console.log('   需要配置: ALIYUN_OSS_ACCESS_KEY_ID, ALIYUN_OSS_ACCESS_KEY_SECRET, ALIYUN_OSS_BUCKET');
    }
  }

  /**
   * 上传base64图片到OSS
   * @param {string} base64Data - base64图片数据（可以带data URI前缀）
   * @param {object} options - 配置选项
   * @returns {Promise<string>} - 图片的公网URL
   */
  async uploadBase64Image(base64Data, options = {}) {
    if (!this.enabled) {
      throw new Error('OSS服务未启用');
    }

    try {
      // 移除data URI前缀（如果有）
      let pureBase64 = base64Data;
      if (base64Data.startsWith('data:image/')) {
        const match = base64Data.match(/^data:image\/[^;]+;base64,(.+)$/);
        if (match) {
          pureBase64 = match[1];
        }
      }

      // 转换为Buffer
      const buffer = Buffer.from(pureBase64, 'base64');

      // 生成唯一文件名
      const filename = options.filename || this.generateFilename();
      const objectKey = `pdf-images/${filename}.jpg`;

      // 上传到OSS
      const result = await this.client.put(objectKey, buffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400' // 24小时缓存
        }
      });

      console.log(`   ✅ 图片已上传: ${objectKey}`);
      
      // 返回公网URL
      return result.url;
    } catch (error) {
      console.error('❌ OSS上传失败:', error.message);
      throw error;
    }
  }

  /**
   * 批量上传图片
   * @param {Array<string>} base64Images - base64图片数组
   * @returns {Promise<Array<string>>} - 图片URL数组
   */
  async uploadImages(base64Images) {
    if (!this.enabled) {
      throw new Error('OSS服务未启用');
    }

    console.log(`📤 开始批量上传 ${base64Images.length} 张图片到OSS...`);
    
    const uploadPromises = base64Images.map((base64, index) => 
      this.uploadBase64Image(base64, { 
        filename: `${Date.now()}_${index}` 
      })
    );

    try {
      const urls = await Promise.all(uploadPromises);
      console.log(`✅ 批量上传完成: ${urls.length} 张图片`);
      return urls;
    } catch (error) {
      console.error('❌ 批量上传失败:', error.message);
      throw error;
    }
  }

  /**
   * 删除图片
   * @param {string} url - 图片URL
   */
  async deleteImage(url) {
    if (!this.enabled) {
      return;
    }

    try {
      // 从URL提取objectKey
      const objectKey = this.extractObjectKey(url);
      if (objectKey) {
        await this.client.delete(objectKey);
        console.log(`   🗑️  已删除: ${objectKey}`);
      }
    } catch (error) {
      console.error('⚠️  删除图片失败:', error.message);
      // 不抛出错误，删除失败不影响主流程
    }
  }

  /**
   * 批量删除图片
   * @param {Array<string>} urls - 图片URL数组
   */
  async deleteImages(urls) {
    if (!this.enabled || urls.length === 0) {
      return;
    }

    console.log(`🗑️  清理 ${urls.length} 张临时图片...`);
    
    const deletePromises = urls.map(url => this.deleteImage(url));
    await Promise.allSettled(deletePromises);
  }

  /**
   * 生成唯一文件名
   */
  generateFilename() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}_${random}`;
  }

  /**
   * 从URL提取objectKey
   */
  extractObjectKey(url) {
    try {
      const urlObj = new URL(url);
      // OSS URL格式: https://{bucket}.{region}.aliyuncs.com/{objectKey}
      const pathname = urlObj.pathname;
      return pathname.startsWith('/') ? pathname.substring(1) : pathname;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      enabled: this.enabled,
      bucket: this.bucket,
      region: this.region
    };
  }
}

// 创建全局实例
const ossService = new OSSService();

module.exports = ossService;

