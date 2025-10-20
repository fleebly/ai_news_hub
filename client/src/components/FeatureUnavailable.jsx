import { AlertCircle, ExternalLink, Book } from 'lucide-react';

/**
 * 功能不可用提示组件
 * 当后端未配置时显示友好的提示信息
 */
export default function FeatureUnavailable({ feature, customMessage }) {
  const message = customMessage || {
    title: '功能暂不可用',
    message: '此功能需要后端支持，但当前后端未配置。',
    solution: '请查看部署文档了解如何配置后端服务。'
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-start space-x-4">
        <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            {message.title}
          </h3>
          
          <p className="text-yellow-800 dark:text-yellow-200 mb-3">
            {message.message}
          </p>
          
          <div className="bg-white dark:bg-gray-800 rounded-md p-4 mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
              <Book className="w-4 h-4 mr-2" />
              解决方案
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {message.solution}
            </p>
            
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                推荐部署方案：
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                <li>
                  <strong>Netlify + Railway</strong> - 免费，5分钟部署
                </li>
                <li>
                  <strong>Netlify + Render</strong> - 稳定可靠
                </li>
                <li>
                  <strong>阿里云</strong> - 国内访问最快
                </li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://github.com/your-repo/blob/main/NETLIFY_BACKEND_SOLUTION.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              查看部署指南
            </a>
            
            <a
              href="https://railway.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-700 border border-yellow-600 dark:border-yellow-500 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              前往Railway部署
            </a>
          </div>
          
          <details className="mt-4">
            <summary className="text-sm text-yellow-700 dark:text-yellow-300 cursor-pointer hover:text-yellow-900 dark:hover:text-yellow-100">
              为什么会出现这个提示？
            </summary>
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 space-y-2 pl-4">
              <p>
                <strong>Netlify</strong> 是静态网站托管平台，只能部署前端文件（HTML/CSS/JS）。
              </p>
              <p>
                <strong>{feature || '此功能'}</strong> 需要：
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Node.js 后端服务</li>
                <li>Python 脚本执行</li>
                <li>MongoDB 数据库</li>
                <li>PDF 转换功能</li>
                <li>OSS 云存储</li>
              </ul>
              <p>
                因此需要将<strong>后端部署到其他平台</strong>（如Railway、Render或阿里云），然后配置前端连接到后端API。
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

