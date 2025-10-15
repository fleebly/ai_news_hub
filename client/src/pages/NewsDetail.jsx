import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Clock, 
  Tag, 
  ExternalLink,
  TrendingUp,
  Calendar,
  User,
  Share2,
  BookOpen,
  Brain,
  Code,
  Users,
  Sparkles,
  Zap
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const NewsDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchArticle()
  }, [id])

  const fetchArticle = async () => {
    try {
      setLoading(true)
      console.log('正在获取新闻ID:', id)
      
      // 直接使用fetch而不是axios
      const response = await fetch(`/api/ai-news/${id}`)
      const data = await response.json()
      console.log('API响应:', data)
      
      if (data.success) {
        setArticle(data.news)
        console.log('新闻数据:', data.news)
      } else {
        console.log('API返回失败:', data.message)
        setError('新闻不存在')
      }
    } catch (err) {
      console.error('获取新闻详情失败:', err)
      setError('获取新闻失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'AI技术': return <Brain className="h-5 w-5" />
      case '开发工具': return <Code className="h-5 w-5" />
      case '开源项目': return <Users className="h-5 w-5" />
      case 'AI应用': return <Sparkles className="h-5 w-5" />
      case '企业AI': return <Zap className="h-5 w-5" />
      default: return <Tag className="h-5 w-5" />
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
    const diffInHours = Math.floor((now - published) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return '刚刚'
    if (diffInHours < 24) return `${diffInHours}小时前`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}天前`
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: window.location.href
        })
      } catch (err) {
        console.log('分享取消')
      }
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href)
      toast.success('链接已复制到剪贴板')
    }
  }

  const renderMarkdown = (content) => {
    // 简单的Markdown渲染
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-900 mb-6">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold text-gray-900 mb-4 mt-8">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-gray-900 mb-3 mt-6">$1</h3>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
      .replace(/^(?!<[h|l])/gm, '<p class="mb-4 text-gray-700 leading-relaxed">')
      .replace(/(<li.*<\/li>)/g, '<ul class="list-disc list-inside mb-4 space-y-1">$1</ul>')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📰</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">新闻不存在</h1>
            <p className="text-gray-600 mb-8">抱歉，您访问的新闻不存在或已被删除</p>
            <button
              onClick={() => navigate('/')}
              className="btn btn-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              返回
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleShare}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Share2 className="h-5 w-5 mr-2" />
                分享
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Article Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(article.category)}`}>
                {getCategoryIcon(article.category)}
                <span className="ml-2">{article.category}</span>
              </span>
              {article.trending && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  热门
                </span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {article.title}
            </h1>
            
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {article.summary}
            </p>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-6">
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  {article.source}
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {formatTimeAgo(article.publishedAt)}
                </span>
                <span className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  {article.readTime}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Article Image */}
          <div className="aspect-video bg-gray-100">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop'
              }}
            />
          </div>

          {/* Article Body */}
          <div className="p-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: renderMarkdown(article.content) 
              }}
            />
          </div>

          {/* Article Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                发布时间: {new Date(article.publishedAt).toLocaleString('zh-CN')}
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleShare}
                  className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  分享文章
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">相关推荐</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Code className="h-3 w-3 mr-1" />
                  开发工具
                </span>
                <span className="text-xs text-gray-500">2小时前</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">VS Code AI插件推荐</h4>
              <p className="text-sm text-gray-600">精选10个最实用的AI编程插件，提升开发效率</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Users className="h-3 w-3 mr-1" />
                  开源项目
                </span>
                <span className="text-xs text-gray-500">4小时前</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">开源AI工具集合</h4>
              <p className="text-sm text-gray-600">盘点2024年最值得关注的开源AI项目</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewsDetail
