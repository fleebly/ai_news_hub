import { useState, useEffect, useMemo } from 'react'
import { 
  MessageCircle,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Eye,
  ExternalLink,
  Star,
  User,
  Tag,
  Building2
} from 'lucide-react'

const Wechat = () => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [accounts, setAccounts] = useState([])

  const categories = [
    { id: 'all', name: '全部分类' },
    { id: 'AI资讯', name: 'AI资讯' },
    { id: 'AI技术', name: 'AI技术' }
  ]

  useEffect(() => {
    fetchAccounts()
    fetchArticles()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/wechat/accounts')
      const data = await response.json()
      if (data.success) {
        setAccounts(data.accounts)
      }
    } catch (error) {
      console.error('获取公众号列表失败:', error)
    }
  }

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/wechat/articles?limit=100')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.articles) {
        setArticles(data.articles)
        console.log(`✅ 成功加载 ${data.articles.length} 篇微信文章`)
      } else {
        console.error('❌ API返回数据格式错误:', data)
      }
    } catch (error) {
      console.error('❌ 获取文章失败:', error)
      // 显示友好的错误提示
      alert(`加载文章失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetch('http://localhost:5000/api/wechat/refresh', {
        method: 'POST'
      })
      await fetchArticles()
    } catch (error) {
      console.error('刷新失败:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // 过滤文章
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = searchTerm === '' ||
        (article.title && article.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (article.account && article.account.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (article.summary && article.summary.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesAccount = selectedAccount === 'all' || article.accountId === selectedAccount
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory

      return matchesSearch && matchesAccount && matchesCategory
    })
  }, [articles, searchTerm, selectedAccount, selectedCategory])

  const getCategoryColor = (category) => {
    const colors = {
      'AI资讯': 'bg-blue-100 text-blue-800',
      'AI技术': 'bg-purple-100 text-purple-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 1) return '今天'
    if (diffDays <= 7) return `${diffDays}天前`
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}周前`
    return date.toLocaleDateString('zh-CN')
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedAccount('all')
    setSelectedCategory('all')
  }

  const activeFiltersCount = [
    selectedAccount !== 'all',
    selectedCategory !== 'all',
    searchTerm !== ''
  ].filter(Boolean).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-b shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <h1 className="text-4xl font-bold flex items-center">
                <MessageCircle className="h-10 w-10 mr-3" />
                微信公众号
              </h1>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                title="刷新文章"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              聚合国内顶级AI公众号，包括机器之心、量子位、新智元、AI前线等
            </p>
            <p className="text-sm text-white/80 mt-2">
              当前共 {articles.length} 篇文章，来自 {accounts.length} 个公众号
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6">
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索文章标题、公众号或内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-green-600 mb-4"
            >
              <Filter className="h-4 w-4" />
              <span>高级筛选</span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                {/* Account Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="h-4 w-4 inline mr-1" />
                    公众号
                  </label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="all">全部公众号</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.account}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="h-4 w-4 inline mr-1" />
                    分类
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Filter Summary */}
            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="text-gray-600">
                找到 <span className="font-semibold text-green-600">{filteredArticles.length}</span> 篇文章
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  清除所有筛选
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredArticles.map((article) => (
            <div key={article.id} className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-all overflow-hidden group">
              {/* Article Image */}
              <div className="relative h-56 bg-gradient-to-br from-green-100 to-emerald-100 overflow-hidden">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    if (!e.target.dataset.fallback) {
                      e.target.dataset.fallback = 'true';
                      e.target.src = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&q=80';
                    } else {
                      e.target.style.display = 'none';
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  {article.featured && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900 shadow-lg">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      精选
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)} shadow-lg`}>
                    {article.category}
                  </span>
                </div>
              </div>

              {/* Article Content */}
              <div className="p-6">
                {/* Account Info */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {article.account[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{article.account}</p>
                    <p className="text-xs text-gray-500 truncate">微信公众号</p>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 hover:text-green-600 cursor-pointer leading-tight">
                  {article.title}
                </h3>

                {/* Summary */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {article.summary}
                </p>

                {/* Topics */}
                {article.topics && article.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.topics.slice(0, 4).map((topic, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-100"
                      >
                        <Tag className="h-2.5 w-2.5 mr-1" />
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {formatDate(article.publishedAt)}
                    </span>
                    <span className="flex items-center">
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      {(article.views / 1000).toFixed(1)}K
                    </span>
                    <span className="font-medium">{article.readTime}</span>
                  </div>
                  
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-green-600 hover:text-green-700 font-semibold text-sm group"
                  >
                    <span>阅读</span>
                    <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-16">
            <MessageCircle className="h-20 w-20 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">没有找到相关文章</h3>
            <p className="text-gray-600 mb-4">尝试调整搜索条件或筛选器</p>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              清除所有筛选
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Wechat

