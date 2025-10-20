/**
 * 后端配置和可用性检测
 */

// 获取API URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 判断是否是生产环境且后端未配置
export const IS_PRODUCTION = import.meta.env.MODE === 'production';
export const IS_LOCAL_API = API_URL.includes('localhost') || API_URL.includes('127.0.0.1');

// 后端功能可用性（生产环境需要配置后端URL）
export const BACKEND_AVAILABLE = !(IS_PRODUCTION && IS_LOCAL_API);

// 需要后端支持的功能列表
export const BACKEND_FEATURES = {
  AI_ANALYSIS: 'AI深度解读',
  PAPER_CRAWL: '爬取热门论文',
  PAPER_SEARCH: '在线论文搜索',
  USER_AUTH: '用户登录注册',
  LEARNING: '费曼学习系统'
};

// 获取后端状态信息
export const getBackendStatus = () => {
  return {
    available: BACKEND_AVAILABLE,
    apiUrl: API_URL,
    isLocal: IS_LOCAL_API,
    isProduction: IS_PRODUCTION,
    message: BACKEND_AVAILABLE 
      ? '后端服务已连接' 
      : '后端服务未配置，部分功能不可用'
  };
};

// 检查特定功能是否可用
export const isFeatureAvailable = (feature) => {
  // 如果后端不可用，所有功能都不可用
  if (!BACKEND_AVAILABLE) {
    return false;
  }
  
  // 这里可以添加更细粒度的功能检测
  return true;
};

// 获取功能不可用的提示信息
export const getFeatureUnavailableMessage = (feature) => {
  const featureName = BACKEND_FEATURES[feature] || '该功能';
  
  return {
    title: `${featureName}暂不可用`,
    message: IS_PRODUCTION && IS_LOCAL_API
      ? `${featureName}需要后端支持。当前部署在Netlify，但后端尚未配置。`
      : `${featureName}需要后端服务，请确保后端已启动。`,
    solution: IS_PRODUCTION && IS_LOCAL_API
      ? '请查看部署文档了解如何配置后端：NETLIFY_BACKEND_SOLUTION.md'
      : '请确保后端服务正在运行在 ' + API_URL,
    docLink: '/docs/netlify-backend-solution'
  };
};

export default {
  API_URL,
  BACKEND_AVAILABLE,
  IS_PRODUCTION,
  IS_LOCAL_API,
  BACKEND_FEATURES,
  getBackendStatus,
  isFeatureAvailable,
  getFeatureUnavailableMessage
};

