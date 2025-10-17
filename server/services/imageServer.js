const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * 本地图片服务器
 * 用于为阿里云视觉API提供图片URL
 */
class ImageServer {
  constructor(port = 8888) {
    this.port = port;
    this.app = express();
    this.server = null;
    this.tempDir = path.join(__dirname, '../temp/images');
    this.imageCache = new Map(); // imageId -> {base64, timestamp}
    this.cleanupInterval = null;
  }

  /**
   * 启动图片服务器
   */
  async start() {
    // 确保临时目录存在
    await fs.mkdir(this.tempDir, { recursive: true });

    // 配置路由
    this.app.get('/images/:imageId', async (req, res) => {
      try {
        const { imageId } = req.params;
        
        // 从缓存获取图片
        const cached = this.imageCache.get(imageId);
        if (!cached) {
          return res.status(404).json({ error: 'Image not found' });
        }

        // 解码base64并返回图片
        const imageBuffer = Buffer.from(cached.base64, 'base64');
        res.set('Content-Type', 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(imageBuffer);
      } catch (error) {
        console.error('图片服务器错误:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 启动服务器
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`📸 图片服务器启动: http://localhost:${this.port}`);
        
        // 启动定期清理（每10分钟清理超过30分钟的图片）
        this.startCleanup();
        
        resolve();
      }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`⚠️  端口 ${this.port} 已被占用，图片服务器可能已在运行`);
          resolve(); // 不报错，可能已有服务器在运行
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * 保存图片并返回URL
   */
  async saveImage(base64Data) {
    // 生成唯一ID
    const imageId = crypto.randomBytes(16).toString('hex');
    
    // 移除data URI前缀（如果有）
    let pureBase64 = base64Data;
    if (base64Data.startsWith('data:image/')) {
      const match = base64Data.match(/^data:image\/[^;]+;base64,(.+)$/);
      if (match) {
        pureBase64 = match[1];
      }
    }

    // 保存到内存缓存
    this.imageCache.set(imageId, {
      base64: pureBase64,
      timestamp: Date.now()
    });

    // 返回可访问的URL
    const url = `http://localhost:${this.port}/images/${imageId}`;
    return url;
  }

  /**
   * 启动定期清理
   */
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 30 * 60 * 1000; // 30分钟

      let cleanedCount = 0;
      for (const [imageId, data] of this.imageCache.entries()) {
        if (now - data.timestamp > maxAge) {
          this.imageCache.delete(imageId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🗑️  清理了 ${cleanedCount} 张过期图片，当前缓存: ${this.imageCache.size} 张`);
      }
    }, 10 * 60 * 1000); // 每10分钟检查一次
  }

  /**
   * 停止服务器
   */
  async stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('📸 图片服务器已停止');
          resolve();
        });
      });
    }
  }

  /**
   * 获取服务器状态
   */
  getStatus() {
    return {
      running: this.server !== null,
      port: this.port,
      cachedImages: this.imageCache.size
    };
  }
}

// 创建全局实例
const imageServer = new ImageServer(8888);

module.exports = imageServer;

