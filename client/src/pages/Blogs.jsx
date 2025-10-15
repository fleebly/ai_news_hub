import { useState, useEffect, useMemo } from 'react'
import { 
  Newspaper,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Eye,
  ExternalLink,
  Star,
  User,
  Tag,
  Building2,
  Layers
} from 'lucide-react'

const Blogs = () => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedAuthor, setSelectedAuthor] = useState('all')
  const [selectedCompany, setSelectedCompany] = useState('all')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const categories = [
    { id: 'all', name: '全部分类' },
    { id: 'AI技术', name: 'AI技术' },
    { id: '论文解读', name: '论文解读' },
    { id: '创新创业', name: '创新创业' }
  ]

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/blogs?limit=150')
      
      if (!response.ok) {
        throw new Error('Failed to fetch blogs')
      }
      
      const data = await response.json()
      
      if (data.success && data.articles) {
        setArticles(data.articles)
      }
    } catch (error) {
      console.error('获取博客失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetch('http://localhost:5000/api/blogs/refresh', {
        method: 'POST'
      })
      await fetchBlogs()
    } catch (error) {
      console.error('刷新失败:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // 提取唯一的作者、公司和主题
  const { authors, companies, topics } = useMemo(() => {
    const authorSet = new Set()
    const companySet = new Set()
    const topicSet = new Set()

    articles.forEach(article => {
      // 添加作者
      if (article.author && typeof article.author === 'string') {
        authorSet.add(article.author)
      }
      
      // 添加公司
      if (article.company && typeof article.company === 'string') {
        companySet.add(article.company)
      }
      
      // 添加主题
      if (article.topics && Array.isArray(article.topics)) {
        article.topics.forEach(topic => {
          if (topic && typeof topic === 'string') {
            topicSet.add(topic)
          }
        })
      }
    })

    return {
      authors: Array.from(authorSet).sort(),
      companies: Array.from(companySet).sort(),
      topics: Array.from(topicSet).sort()
    }
  }, [articles])

  // 过滤文章
  const filteredArticles = useMemo(() => {
    console.log('🔍 筛选条件:', { 
      searchTerm, 
      selectedCategory, 
      selectedAuthor, 
      selectedCompany, 
      selectedTopic,
      totalArticles: articles.length 
    })
    
    const filtered = articles.filter(article => {
      // 安全的搜索匹配（检查字段是否存在）
      const matchesSearch = searchTerm === '' ||
        (article.title && article.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (article.author && article.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (article.summary && article.summary.toLowerCase().includes(searchTerm.toLowerCase()))
      
      // 分类筛选
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory
      
      // 作者筛选
      const matchesAuthor = selectedAuthor === 'all' || article.author === selectedAuthor
      
      // 公司筛选
      const matchesCompany = selectedCompany === 'all' || article.company === selectedCompany
      
      // 主题筛选
      const matchesTopic = selectedTopic === 'all' || 
        (article.topics && Array.isArray(article.topics) && article.topics.includes(selectedTopic))

      return matchesSearch && matchesCategory && matchesAuthor && matchesCompany && matchesTopic
    })
    
    console.log('✅ 筛选结果:', filtered.length, '篇文章')
    return filtered
  }, [articles, searchTerm, selectedCategory, selectedAuthor, selectedCompany, selectedTopic])

  const getCategoryColor = (category) => {
    const colors = {
      'AI技术': 'bg-purple-100 text-purple-800',
      '论文解读': 'bg-blue-100 text-blue-800',
      '创新创业': 'bg-green-100 text-green-800',
      '前沿科技': 'bg-orange-100 text-orange-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getCompanyBadge = (company) => {
    const badges = {
      'OpenAI': 'bg-black text-white',
      'Google': 'bg-blue-600 text-white',
      'Google DeepMind': 'bg-blue-700 text-white',
      'Meta': 'bg-blue-800 text-white',
      'Anthropic': 'bg-orange-600 text-white',
      'Microsoft': 'bg-blue-500 text-white',
      'Hugging Face': 'bg-yellow-400 text-black'
    }
    return badges[company] || 'bg-gray-600 text-white'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 1) return '今天'
    if (diffDays <= 7) return `${diffDays}天前`
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}周前`
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)}个月前`
    return date.toLocaleDateString('zh-CN')
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedAuthor('all')
    setSelectedCompany('all')
    setSelectedTopic('all')
  }

  const activeFiltersCount = [
    selectedCategory !== 'all',
    selectedAuthor !== 'all',
    selectedCompany !== 'all',
    selectedTopic !== 'all',
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
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <Newspaper className="h-10 w-10 mr-3 text-indigo-600" />
                大牛博客
              </h1>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
                title="刷新文章"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              聚合全球顶级AI大V，包括Andrej Karpathy、Lilian Weng、OpenAI、DeepMind等
            </p>
            <p className="text-sm text-gray-500 mt-2">
              当前共 {articles.length} 篇高质量文章，来自 {companies.length} 家顶级机构
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
                placeholder="搜索文章标题、作者或内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-indigo-600 mb-4"
            >
              <Filter className="h-4 w-4" />
              <span>高级筛选</span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Layers className="h-4 w-4 inline mr-1" />
                    分类
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Author Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    作者
                  </label>
                  <select
                    value={selectedAuthor}
                    onChange={(e) => setSelectedAuthor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">全部作者</option>
                    {authors.map(author => (
                      <option key={author} value={author}>
                        {author}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="h-4 w-4 inline mr-1" />
                    公司/机构
                  </label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">全部公司</option>
                    {companies.map(company => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="h-4 w-4 inline mr-1" />
                    主题
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">全部主题</option>
                    {topics.map(topic => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Filter Summary */}
            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="text-gray-600">
                找到 <span className="font-semibold text-indigo-600">{filteredArticles.length}</span> 篇文章
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  清除所有筛选
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" key={`grid-${filteredArticles.length}`}>
          {filteredArticles.length > 0 && console.log('📋 正在渲染文章数:', filteredArticles.length)}
          {filteredArticles.map((article) => (
            <div key={article.id} className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-all overflow-hidden group">
              {/* Article Image */}
              <div className="relative h-56 bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    // 防止无限循环，只处理一次
                    if (!e.target.dataset.fallback) {
                      e.target.dataset.fallback = 'true';
                      // 使用基于文章ID的稳定fallback图片
                      const hash = article.id.split('').reduce((acc, char) => 
                        char.charCodeAt(0) + ((acc << 5) - acc), 0
                      );
                      const fallbackImages = [
                        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=600&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=800&h=600&fit=crop&q=80'
                      ];
                      e.target.src = fallbackImages[Math.abs(hash) % fallbackImages.length];
                    } else {
                      // 如果fallback也失败，隐藏图片显示渐变背景
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

                {/* Company Badge */}
                {article.company && (
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getCompanyBadge(article.company)} shadow-lg`}>
                      <Building2 className="h-3 w-3 mr-1" />
                      {article.company}
                    </span>
                  </div>
                )}
              </div>

              {/* Article Content */}
              <div className="p-6">
                {/* Author Info */}
                <div className="flex items-center space-x-3 mb-4">
                  {article.authorAvatar ? (
                    <img
                      src={article.authorAvatar}
                      alt={article.author}
                      className="w-12 h-12 rounded-full border-2 border-indigo-100"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {article.author[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{article.author}</p>
                    <p className="text-xs text-gray-500 truncate">{article.blogName}</p>
                  </div>
                  {article.language && (
                    <span className="text-xs text-gray-400 uppercase font-medium">{article.language}</span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 hover:text-indigo-600 cursor-pointer leading-tight">
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
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-100"
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
                    className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 font-semibold text-sm group"
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
            <Newspaper className="h-20 w-20 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">没有找到相关文章</h3>
            <p className="text-gray-600 mb-4">尝试调整搜索条件或筛选器</p>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              清除所有筛选
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Blogs
