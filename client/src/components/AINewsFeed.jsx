import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  TrendingUp, 
  Clock, 
  Tag, 
  ExternalLink,
  RefreshCw,
  Zap,
  Users,
  Code,
  Brain,
  Sparkles,
  Eye,
  Loader2,
  MessageCircle,
  Share2,
  ThumbsUp,
  Filter
} from 'lucide-react'
import api from '../services/api'

const AINewsFeed = () => {
  const navigate = useNavigate()
  const [news, setNews] = useState([])
  const [displayedNews, setDisplayedNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [platform, setPlatform] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const observer = useRef()
  const ITEMS_PER_PAGE = 10

  const platforms = [
    { value: 'all', label: '全部', icon: TrendingUp },
    { value: 'reddit', label: 'Reddit', icon: MessageCircle },
    { value: 'twitter', label: 'Twitter', icon: Share2 },
    { value: 'weibo', label: '微博', icon: Users }
  ]

  const fetchNews = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 构建API URL，根据选择的平台
      let apiUrl = 'http://localhost:5000/api/ai-news'
      if (platform && platform !== 'all') {
        apiUrl += `?platform=${platform}`
      }
      
      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setNews(data.news)
        setLastUpdated(data.lastUpdated)
      } else {
        setError(data.message || '获取AI新闻失败')
      }
    } catch (err) {
      console.error('获取AI新闻失败:', err)
      setError('获取新闻失败: ' + err.message)
      
      // 如果API失败，使用模拟数据
      const mockNews = [
        {
          id: 1,
          title: "OpenAI发布GPT-4 Turbo，性能提升显著",
          summary: "GPT-4 Turbo在推理能力和代码生成方面有了重大突破，编程效率提升40%",
          category: "AI技术",
          source: "OpenAI官方",
          publishedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          readTime: "3分钟",
          tags: ["GPT-4", "AI", "编程助手"],
          imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop",
          trending: true,
          views: 4892,
          likes: 321,
          comments: 99
        },
        {
          id: 2,
          title: "Google发布Gemini 2.0，多模态能力再升级",
          summary: "Gemini 2.0在图像理解、视频分析和多语言处理方面取得重大突破",
          category: "AI技术",
          source: "Google DeepMind",
          publishedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          readTime: "5分钟",
          tags: ["Gemini", "Google", "多模态"],
          imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop",
          trending: true,
          views: 3690,
          likes: 153,
          comments: 116
        },
        {
          id: 3,
          title: "GitHub Copilot X新增代码审查功能",
          summary: "AI驱动的代码审查工具能够自动检测潜在bug和安全漏洞，提升代码质量",
          category: "开发工具",
          source: "GitHub",
          publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          readTime: "5分钟",
          tags: ["GitHub", "Copilot", "代码审查"],
          imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop",
          trending: true,
          views: 3213,
          likes: 223,
          comments: 79
        },
        {
          id: 4,
          title: "Anthropic发布Claude 3.5 Sonnet，推理能力大幅提升",
          summary: "Claude 3.5 Sonnet在数学、编程和创意写作方面表现卓越，接近人类专家水平",
          category: "AI技术",
          source: "Anthropic",
          publishedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          readTime: "6分钟",
          tags: ["Claude", "Anthropic", "推理"],
          imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=200&fit=crop",
          trending: false,
          views: 3074,
          likes: 132,
          comments: 104
        },
        {
          id: 5,
          title: "Meta发布Code Llama 2，开源代码生成模型",
          summary: "Code Llama 2在多个编程语言上表现优异，支持Python、JavaScript、C++等",
          category: "开源项目",
          source: "Meta AI",
          publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          readTime: "4分钟",
          tags: ["Code Llama", "开源", "代码生成"],
          imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop",
          trending: false,
          views: 610,
          likes: 225,
          comments: 7
        },
        {
          id: 6,
          title: "Hugging Face发布Transformers 4.40，新增多种预训练模型",
          summary: "新版本包含20+个预训练模型，支持更多语言和任务类型",
          category: "开源项目",
          source: "Hugging Face",
          publishedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          readTime: "4分钟",
          tags: ["Transformers", "Hugging Face", "预训练"],
          imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop",
          trending: false,
          views: 741,
          likes: 161,
          comments: 36
        }
      ]
      setNews(mockNews)
      setLastUpdated(new Date().toISOString())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
    // 更频繁的刷新 - 每2分钟刷新一次
    const interval = setInterval(fetchNews, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [platform]) // 当平台改变时重新获取

  // 当新闻数据更新时，重置显示
  useEffect(() => {
    if (news.length > 0) {
      const initialNews = news.slice(0, ITEMS_PER_PAGE)
      setDisplayedNews(initialNews)
      setPage(1)
      setHasMore(news.length > ITEMS_PER_PAGE)
    }
  }, [news])

  // 加载更多新闻
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    setTimeout(() => {
      const nextPage = page + 1
      const startIndex = page * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      const moreNews = news.slice(startIndex, endIndex)
      
      if (moreNews.length > 0) {
        setDisplayedNews(prev => [...prev, ...moreNews])
        setPage(nextPage)
        setHasMore(endIndex < news.length)
      } else {
        setHasMore(false)
      }
      setLoadingMore(false)
    }, 500)
  }, [news, page, loadingMore, hasMore])

  // 无限滚动观察器
  const lastNewsRef = useCallback(node => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMore()
      }
    })
    
    if (node) observer.current.observe(node)
  }, [loading, hasMore, loadingMore, loadMore])

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'AI技术': return <Brain className="h-4 w-4" />
      case '开发工具': return <Code className="h-4 w-4" />
      case '开源项目': return <Users className="h-4 w-4" />
      case 'AI应用': return <Sparkles className="h-4 w-4" />
      case '企业AI': return <Zap className="h-4 w-4" />
      default: return <Tag className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'AI技术': return 'bg-purple-100 text-purple-800'
      case '开发工具': return 'bg-blue-100 text-blue-800'
      case '开源项目': return 'bg-green-100 text-green-800'
      case 'AI应用': return 'bg-pink-100 text-pink-800'
      case '企业AI': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimeAgo = (dateString) => {
    const now = new Date()
    const published = new Date(dateString)
    const diffInSeconds = Math.floor((now - published) / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInSeconds < 60) return '刚刚'
    if (diffInMinutes < 60) return `${diffInMinutes} 分钟前`
    if (diffInHours < 24) return `${diffInHours} 小时前`
    if (diffInDays < 7) return `${diffInDays} 天前`
    return published.toLocaleDateString('zh-CN')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
              AI实时热点
            </h2>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">实时更新</span>
            </div>
          </div>
          <button 
            onClick={fetchNews} 
            className="btn btn-ghost btn-sm hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> 
            {loading ? '刷新中...' : '刷新'}
          </button>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
            AI实时热点
          </h2>
          <button
            onClick={fetchNews}
            className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchNews}
            className="btn btn-primary btn-sm"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  const getPlatformBadge = (itemPlatform) => {
    switch (itemPlatform) {
      case 'Reddit':
        return { color: 'bg-orange-100 text-orange-800', icon: MessageCircle }
      case 'Twitter':
        return { color: 'bg-blue-100 text-blue-800', icon: Share2 }
      case '微博':
        return { color: 'bg-red-100 text-red-800', icon: Users }
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
              AI实时热点
            </h2>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">实时更新</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                更新于 {formatTimeAgo(lastUpdated)}
              </span>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-primary-600'}`}
              title="过滤"
            >
              <Filter className="h-4 w-4" />
            </button>
            <button
              onClick={fetchNews}
              className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
              title="刷新"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 平台过滤器 */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">平台:</span>
              {platforms.map((p) => {
                const Icon = p.icon
                return (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      platform === p.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div>
        {displayedNews.map((article, index) => (
          <div
            key={article.id}
            ref={index === displayedNews.length - 1 ? lastNewsRef : null}
            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
              index === 0 ? 'bg-gradient-to-r from-primary-50 to-transparent' : ''
            }`}
            onClick={() => navigate(`/news/${article.id}`)}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-16 h-16 rounded-lg object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=64&h=64&fit=crop'
                  }}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                    {getCategoryIcon(article.category)}
                    <span className="ml-1">{article.category}</span>
                  </span>
                  {article.platform && (() => {
                    const badge = getPlatformBadge(article.platform)
                    if (badge) {
                      const PlatformIcon = badge.icon
                      return (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                          <PlatformIcon className="h-3 w-3 mr-1" />
                          {article.platform}
                        </span>
                      )
                    }
                    return null
                  })()}
                  {article.trending && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      热门
                    </span>
                  )}
                </div>
                
                <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                  {article.title}
                </h3>
                
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {article.summary}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimeAgo(article.publishedAt)}
                    </span>
                    <span>{article.readTime}</span>
                    <span>{article.source}</span>
                    {article.views && (
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {article.views.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {article.tags.slice(0, 2).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                      >
                        <Tag className="h-2 w-2 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* 加载更多指示器 */}
        {loadingMore && (
          <div className="p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary-600" />
            <p className="text-sm text-gray-500 mt-2">加载更多...</p>
          </div>
        )}
        
        {/* 已加载全部 */}
        {!hasMore && displayedNews.length > 0 && (
          <div className="p-6 text-center border-t border-gray-200">
            <p className="text-sm text-gray-500">
              已显示全部 {displayedNews.length} 条资讯
            </p>
            <button
              onClick={fetchNews}
              className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              刷新获取最新资讯 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AINewsFeed
