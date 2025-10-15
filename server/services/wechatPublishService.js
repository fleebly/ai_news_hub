const axios = require('axios');
const FormData = require('form-data');

/**
 * 微信公众号发布服务
 * 文档：https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html
 */
class WechatPublishService {
  constructor() {
    this.appId = process.env.WECHAT_APPID;
    this.appSecret = process.env.WECHAT_APPSECRET;
    this.accessToken = null;
    this.tokenExpireTime = null;
  }

  /**
   * 检查是否已配置微信API
   */
  isConfigured() {
    return !!(this.appId && this.appSecret);
  }

  /**
   * 获取access_token
   * 文档：https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Get_access_token.html
   */
  async getAccessToken() {
    // 如果token未过期，直接返回
    if (this.accessToken && this.tokenExpireTime > Date.now()) {
      return this.accessToken;
    }

    try {
      console.log('正在获取微信access_token...');
      const response = await axios.get(
        'https://api.weixin.qq.com/cgi-bin/token',
        {
          params: {
            grant_type: 'client_credential',
            appid: this.appId,
            secret: this.appSecret
          }
        }
      );

      if (response.data.access_token) {
        this.accessToken = response.data.access_token;
        // 提前5分钟过期，避免边界情况
        this.tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000;
        console.log('✅ access_token获取成功');
        return this.accessToken;
      } else {
        throw new Error(response.data.errmsg || '获取access_token失败');
      }
    } catch (error) {
      console.error('获取access_token失败:', error.message);
      throw new Error('微信API认证失败: ' + error.message);
    }
  }

  /**
   * 上传图片素材
   * 文档：https://developers.weixin.qq.com/doc/offiaccount/Asset_Management/New_temporary_materials.html
   */
  async uploadImage(imageBuffer, filename = 'image.jpg') {
    const token = await this.getAccessToken();

    const form = new FormData();
    form.append('media', imageBuffer, {
      filename: filename,
      contentType: 'image/jpeg'
    });

    try {
      console.log(`正在上传图片: ${filename}...`);
      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`,
        form,
        {
          headers: form.getHeaders()
        }
      );

      if (response.data.media_id) {
        console.log('✅ 图片上传成功');
        return response.data.media_id;
      } else {
        throw new Error(response.data.errmsg || '上传图片失败');
      }
    } catch (error) {
      console.error('上传图片失败:', error.message);
      throw error;
    }
  }

  /**
   * 下载网络图片
   */
  async downloadImage(url) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('下载图片失败:', url, error.message);
      return null;
    }
  }

  /**
   * 新增草稿
   * 文档：https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html
   */
  async addDraft(article) {
    const token = await this.getAccessToken();

    // 准备草稿数据
    const draftData = {
      articles: [
        {
          title: article.title,
          author: article.author || 'AI技术作者',
          digest: article.digest || article.title.substring(0, 100),
          content: article.content,
          content_source_url: article.sourceUrl || '',
          thumb_media_id: article.thumbMediaId || '',
          need_open_comment: article.needComment ? 1 : 0,
          only_fans_can_comment: article.onlyFansComment ? 1 : 0,
          show_cover_pic: article.showCoverPic ? 1 : 0
        }
      ]
    };

    try {
      console.log('正在创建草稿...');
      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`,
        draftData
      );

      if (response.data.media_id) {
        console.log('✅ 草稿创建成功:', response.data.media_id);
        return response.data.media_id;
      } else {
        throw new Error(response.data.errmsg || '创建草稿失败');
      }
    } catch (error) {
      console.error('创建草稿失败:', error.message);
      throw error;
    }
  }

  /**
   * 发布草稿
   * 文档：https://developers.weixin.qq.com/doc/offiaccount/Publish/Publish.html
   */
  async publishDraft(mediaId) {
    const token = await this.getAccessToken();

    try {
      console.log('正在发布文章...');
      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${token}`,
        {
          media_id: mediaId
        }
      );

      if (response.data.publish_id) {
        console.log('✅ 文章发布成功');
        return {
          publishId: response.data.publish_id,
          msgDataId: response.data.msg_data_id,
          msgId: response.data.msg_id
        };
      } else {
        throw new Error(response.data.errmsg || '发布失败');
      }
    } catch (error) {
      console.error('发布失败:', error.message);
      throw error;
    }
  }

  /**
   * 完整的发布流程
   * @param {Object} article - 文章对象
   * @returns {Promise<Object>} 发布结果
   */
  async publishArticle(article) {
    if (!this.isConfigured()) {
      console.log('⚠️  微信API未配置，使用模拟发布');
      return this.mockPublish(article);
    }

    try {
      // 步骤1: 上传封面图（如果有）
      let thumbMediaId = article.thumbMediaId;
      if (article.coverImage && !thumbMediaId) {
        console.log('步骤 1/3: 上传封面图...');
        const imageBuffer = await this.downloadImage(article.coverImage);
        if (imageBuffer) {
          thumbMediaId = await this.uploadImage(imageBuffer, 'cover.jpg');
        }
      }

      // 步骤2: 创建草稿
      console.log('步骤 2/3: 创建草稿...');
      const draftMediaId = await this.addDraft({
        ...article,
        thumbMediaId
      });

      // 步骤3: 发布文章
      console.log('步骤 3/3: 发布文章...');
      const publishResult = await this.publishDraft(draftMediaId);

      return {
        success: true,
        message: '发布成功！',
        data: {
          ...publishResult,
          draftMediaId,
          thumbMediaId,
          publishedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ 发布流程失败:', error.message);
      return {
        success: false,
        message: error.message,
        error: error.toString()
      };
    }
  }

  /**
   * 模拟发布（用于演示或API未配置时）
   */
  mockPublish(article) {
    console.log('📝 模拟发布文章:', article.title);
    
    return {
      success: true,
      message: '✅ 发布成功（演示模式）',
      data: {
        publishId: 'mock_' + Date.now(),
        msgDataId: Math.floor(Math.random() * 1000000),
        msgId: Math.floor(Math.random() * 1000000),
        publishedAt: new Date().toISOString(),
        mockMode: true,
        note: '这是演示模式，文章未真实发布。配置WECHAT_APPID和WECHAT_APPSECRET以启用真实发布。'
      }
    };
  }

  /**
   * 获取草稿列表
   */
  async getDraftList(offset = 0, count = 20) {
    if (!this.isConfigured()) {
      return this.getMockDraftList();
    }

    const token = await this.getAccessToken();

    try {
      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/draft/batchget?access_token=${token}`,
        {
          offset,
          count,
          no_content: 0
        }
      );

      return {
        success: true,
        total: response.data.total_count,
        items: response.data.item
      };
    } catch (error) {
      console.error('获取草稿列表失败:', error.message);
      return this.getMockDraftList();
    }
  }

  /**
   * 获取发布记录
   */
  async getPublishList(offset = 0, count = 20) {
    if (!this.isConfigured()) {
      return this.getMockPublishList();
    }

    const token = await this.getAccessToken();

    try {
      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/freepublish/batchget?access_token=${token}`,
        {
          offset,
          count,
          no_content: 0
        }
      );

      return {
        success: true,
        total: response.data.total_count,
        items: response.data.item
      };
    } catch (error) {
      console.error('获取发布记录失败:', error.message);
      return this.getMockPublishList();
    }
  }

  /**
   * 模拟草稿列表
   */
  getMockDraftList() {
    return {
      success: true,
      total: 3,
      items: [
        {
          media_id: 'mock_draft_1',
          update_time: Date.now() / 1000 - 3600,
          content: {
            news_item: [{
              title: '深度学习最新进展解读',
              author: 'AI技术作者',
              digest: '本文详细介绍了深度学习领域的最新研究成果...'
            }]
          }
        },
        {
          media_id: 'mock_draft_2',
          update_time: Date.now() / 1000 - 7200,
          content: {
            news_item: [{
              title: 'Transformer架构全面解析',
              author: 'AI技术作者',
              digest: '从原理到应用，全方位了解Transformer...'
            }]
          }
        }
      ],
      mockMode: true
    };
  }

  /**
   * 模拟发布列表
   */
  getMockPublishList() {
    return {
      success: true,
      total: 5,
      items: [
        {
          article_id: 'mock_article_1',
          update_time: Date.now() / 1000 - 86400,
          content: {
            news_item: [{
              title: 'GPT-4技术解读',
              author: 'AI技术作者'
            }]
          }
        }
      ],
      mockMode: true
    };
  }
}

module.exports = new WechatPublishService();

