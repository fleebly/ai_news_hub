import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Eye, 
  ThumbsUp, 
  MessageCircle,
  Share2,
  Tag,
  User,
  ExternalLink
} from 'lucide-react'

const WechatDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArticleDetail()
  }, [id])

  const fetchArticleDetail = async () => {
    try {
      setLoading(true)
      // 从文章列表中查找对应文章
      const response = await fetch('http://localhost:5000/api/wechat/articles?limit=100')
      const data = await response.json()
      
      if (data.success && data.articles) {
        const foundArticle = data.articles.find(a => a.id === id)
        setArticle(foundArticle)
      }
    } catch (error) {
      console.error('获取文章详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryColor = (category) => {
    const colors = {
      'AI资讯': 'bg-blue-100 text-blue-800 border-blue-200',
      'AI技术': 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <MessageCircle className="h-20 w-20 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">文章不存在</h3>
            <p className="text-gray-600 mb-6">该文章可能已被删除或不存在</p>
            <button
              onClick={() => navigate('/wechat')}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/wechat')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          返回列表
        </button>

        {/* Article Container */}
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Cover Image */}
          <div className="relative h-96 bg-gradient-to-br from-green-100 to-emerald-100 overflow-hidden">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            
            {/* Category Badge */}
            <div className="absolute top-6 left-6">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getCategoryColor(article.category)} shadow-lg`}>
                {article.category}
              </span>
            </div>

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                {article.title}
              </h1>
            </div>
          </div>

          {/* Article Header */}
          <div className="px-8 py-6 border-b border-gray-100">
            {/* Account Info */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {article.account[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{article.account}</h3>
                <p className="text-sm text-gray-500">微信公众号 · ID: {article.accountId}</p>
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {formatDate(article.publishedAt)}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                {article.readTime}
              </div>
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-2 text-gray-400" />
                {article.views.toLocaleString()} 阅读
              </div>
              <div className="flex items-center">
                <ThumbsUp className="h-4 w-4 mr-2 text-gray-400" />
                {article.likes.toLocaleString()} 点赞
              </div>
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-2 text-gray-400" />
                {article.comments.toLocaleString()} 评论
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="px-8 py-8">
            {/* Summary */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-r-lg mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">文章摘要</h2>
              <p className="text-gray-700 leading-relaxed">{article.summary}</p>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {article.content}
              </div>
            </div>

            {/* Topics */}
            {article.topics && article.topics.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-green-600" />
                  相关标签
                </h3>
                <div className="flex flex-wrap gap-3">
                  {article.topics.map((topic, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 hover:border-green-300 transition-colors cursor-pointer"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Article Footer */}
          <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-green-50 border-t border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-semibold text-gray-900">本文来自微信公众号「{article.account}」</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                  <p className="text-xs text-yellow-800 flex items-center">
                    <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                    <span className="font-medium">演示说明：</span>
                    <span className="ml-1">当前为模拟数据演示，如需查看真实文章，请访问对应微信公众号</span>
                  </p>
                  <p className="text-xs text-gray-600 mt-1 ml-4">
                    公众号ID: <span className="font-mono bg-white px-2 py-0.5 rounded">{article.accountId}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Related Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/wechat')}
            className="flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-green-500 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </button>
          
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-green-500 hover:text-green-600 transition-colors"
          >
            回到顶部
          </button>
          
          <button
            className="flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-green-500 hover:text-green-600 transition-colors"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: article.title,
                  text: article.summary,
                  url: window.location.href,
                })
              } else {
                navigator.clipboard.writeText(window.location.href)
                alert('链接已复制到剪贴板')
              }
            }}
          >
            <Share2 className="h-4 w-4 mr-2" />
            分享文章
          </button>
        </div>
      </div>
    </div>
  )
}

export default WechatDetail

