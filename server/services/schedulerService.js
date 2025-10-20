/**
 * 定时任务服务
 * 负责定期更新论文和博客
 */

const cron = require('node-cron');
const arxivService = require('./arxivService');
const blogService = require('./blogService');
const paperCrawlerService = require('./paperCrawlerService');

class SchedulerService {
  constructor() {
    this.tasks = [];
    this.isEnabled = process.env.ENABLE_SCHEDULER !== 'false'; // 默认启用
    this.paperUpdateTime = process.env.PAPER_UPDATE_TIME || '0 9 * * *'; // 默认每天9:00
    this.blogUpdateTime = process.env.BLOG_UPDATE_TIME || '0 9 * * *'; // 默认每天9:00
  }

  /**
   * 启动所有定时任务
   */
  start() {
    if (!this.isEnabled) {
      console.log('⏰ 定时任务已禁用（ENABLE_SCHEDULER=false）');
      return;
    }

    console.log('\n⏰ ========== 定时任务服务启动 ==========');
    
    // 任务1: 更新论文（每天9:00）
    this.schedulePaperUpdate();
    
    // 任务2: 更新博客（每天9:00）
    this.scheduleBlogUpdate();
    
    console.log('⏰ ======================================\n');
  }

  /**
   * 定时更新论文
   */
  schedulePaperUpdate() {
    console.log(`📄 论文更新任务: ${this.paperUpdateTime}`);
    console.log(`   • cron表达式: ${this.paperUpdateTime}`);
    console.log(`   • 说明: ${this.getCronDescription(this.paperUpdateTime)}`);

    const task = cron.schedule(this.paperUpdateTime, async () => {
      console.log('\n🔄 ========== 定时任务：更新论文 ==========');
      console.log(`⏰ 触发时间: ${new Date().toLocaleString('zh-CN')}`);
      
      try {
        // 方式1: 从arXiv获取最新论文（推荐，最稳定）
        console.log('\n📡 方式1: 从arXiv获取最新论文...');
        const categories = ['cs.AI', 'cs.LG', 'cs.CV', 'cs.CL', 'cs.NE', 'cs.RO'];
        const arxivPapers = await arxivService.fetchMultiCategoryPapers(categories, 50, true);
        
        if (arxivPapers && arxivPapers.length > 0) {
          console.log(`✅ arXiv: 成功获取 ${arxivPapers.length} 篇论文`);
        } else {
          console.log('⚠️  arXiv: 未获取到新论文');
        }

        // 方式2: 尝试从其他渠道获取（可选，可能超时）
        if (process.env.ENABLE_EXTERNAL_CRAWL === 'true') {
          console.log('\n📡 方式2: 从其他渠道获取论文...');
          try {
            const crawlResult = await paperCrawlerService.crawlAllSources({
              reddit: true,
              papersWithCode: false, // 经常超时，默认关闭
              huggingface: false,    // 经常超时，默认关闭
              twitter: false,
              limit: 10
            });
            
            if (crawlResult.success && crawlResult.total > 0) {
              console.log(`✅ 其他渠道: 成功获取 ${crawlResult.total} 篇论文`);
            }
          } catch (error) {
            console.error('⚠️  其他渠道爬取失败（不影响主流程）:', error.message);
          }
        }

        console.log('✅ 论文更新任务完成！');
        console.log('========================================\n');
        
      } catch (error) {
        console.error('❌ 论文更新任务失败:', error.message);
        console.error('========================================\n');
      }
    }, {
      scheduled: true,
      timezone: "Asia/Shanghai" // 使用北京时间
    });

    this.tasks.push({ name: 'paperUpdate', task });
  }

  /**
   * 定时更新博客
   */
  scheduleBlogUpdate() {
    console.log(`📝 博客更新任务: ${this.blogUpdateTime}`);
    console.log(`   • cron表达式: ${this.blogUpdateTime}`);
    console.log(`   • 说明: ${this.getCronDescription(this.blogUpdateTime)}`);

    const task = cron.schedule(this.blogUpdateTime, async () => {
      console.log('\n🔄 ========== 定时任务：更新博客 ==========');
      console.log(`⏰ 触发时间: ${new Date().toLocaleString('zh-CN')}`);
      
      try {
        // 获取AI相关博客
        console.log('\n📡 从RSS源获取最新博客...');
        const blogs = await blogService.getBlogs(50, true); // 强制刷新缓存
        
        console.log(`✅ 成功获取 ${blogs.length} 篇博客`);
        console.log('✅ 博客更新任务完成！');
        console.log('========================================\n');
        
      } catch (error) {
        console.error('❌ 博客更新任务失败:', error.message);
        console.error('========================================\n');
      }
    }, {
      scheduled: true,
      timezone: "Asia/Shanghai"
    });

    this.tasks.push({ name: 'blogUpdate', task });
  }

  /**
   * 停止所有定时任务
   */
  stop() {
    console.log('\n⏰ 停止定时任务...');
    this.tasks.forEach(({ name, task }) => {
      task.stop();
      console.log(`✅ 已停止任务: ${name}`);
    });
    this.tasks = [];
    console.log('⏰ 所有定时任务已停止\n');
  }

  /**
   * 手动触发论文更新（用于测试）
   */
  async triggerPaperUpdate() {
    console.log('\n🔄 手动触发论文更新...\n');
    
    try {
      const categories = ['cs.AI', 'cs.LG', 'cs.CV', 'cs.CL', 'cs.NE', 'cs.RO'];
      const papers = await arxivService.fetchMultiCategoryPapers(categories, 50, true);
      
      console.log(`✅ 成功获取 ${papers.length} 篇论文\n`);
      return { success: true, count: papers.length };
    } catch (error) {
      console.error('❌ 论文更新失败:', error.message, '\n');
      return { success: false, error: error.message };
    }
  }

  /**
   * 手动触发博客更新（用于测试）
   */
  async triggerBlogUpdate() {
    console.log('\n🔄 手动触发博客更新...\n');
    
    try {
      const blogs = await blogService.getBlogs(50, true);
      
      console.log(`✅ 成功获取 ${blogs.length} 篇博客\n`);
      return { success: true, count: blogs.length };
    } catch (error) {
      console.error('❌ 博客更新失败:', error.message, '\n');
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取cron表达式的中文描述
   */
  getCronDescription(cronExp) {
    const patterns = {
      '0 9 * * *': '每天上午9:00',
      '0 0 * * *': '每天午夜0:00',
      '0 */6 * * *': '每6小时一次',
      '0 8,20 * * *': '每天上午8:00和晚上20:00',
      '0 9 * * 1-5': '工作日上午9:00',
      '*/30 * * * *': '每30分钟一次',
      '0 9,21 * * *': '每天上午9:00和晚上21:00'
    };
    
    return patterns[cronExp] || cronExp;
  }

  /**
   * 获取任务状态
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      tasks: this.tasks.map(({ name, task }) => ({
        name,
        running: task ? true : false
      })),
      schedule: {
        paper: this.paperUpdateTime,
        blog: this.blogUpdateTime
      },
      timezone: 'Asia/Shanghai'
    };
  }
}

// 创建单例
const schedulerService = new SchedulerService();

module.exports = schedulerService;

