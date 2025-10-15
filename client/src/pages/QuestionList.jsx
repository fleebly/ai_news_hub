import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Clock, 
  Star, 
  Target,
  BookOpen,
  Trophy,
  Zap
} from 'lucide-react'
import api from '../services/api'

const QuestionList = () => {
  const [questions, setQuestions] = useState([])
  const [filteredQuestions, setFilteredQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    difficulty: '',
    category: '',
    search: ''
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  })

  useEffect(() => {
    fetchQuestions()
  }, [])

  useEffect(() => {
    filterQuestions()
  }, [questions, filters])

  const fetchQuestions = async (page = 1) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      })
      
      if (filters.difficulty) params.append('difficulty', filters.difficulty)
      if (filters.category) params.append('category', filters.category)

      const response = await api.get(`/questions?${params}`)
      
      if (response.data && response.data.questions) {
        setQuestions(response.data.questions)
        setPagination(response.data.pagination)
      } else {
        setQuestions([])
      }
    } catch (error) {
      console.error('获取题目列表失败:', error)
      setQuestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterQuestions = () => {
    let filtered = [...questions]

    if (filters.search) {
      filtered = filtered.filter(question =>
        question.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        question.description.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    setFilteredQuestions(filtered)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    if (key !== 'search') {
      fetchQuestions(1)
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'badge-beginner'
      case 'intermediate': return 'badge-intermediate'
      case 'advanced': return 'badge-advanced'
      default: return 'badge-beginner'
    }
  }

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '初级'
      case 'intermediate': return '中级'
      case 'advanced': return '高级'
      default: return '初级'
    }
  }

  const getCategoryText = (category) => {
    const categoryMap = {
      'algorithm': '算法',
      'data-structure': '数据结构',
      'web-development': 'Web开发',
      'database': '数据库',
      'system-design': '系统设计'
    }
    return categoryMap[category] || category
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">编程题库</h1>
          <p className="text-gray-600 mt-2">选择适合你水平的题目开始练习</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/dashboard"
            className="btn btn-secondary btn-md"
          >
            返回仪表板
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索题目..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Difficulty Filter */}
          <select
            value={filters.difficulty}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            className="input"
          >
            <option value="">所有难度</option>
            <option value="beginner">初级</option>
            <option value="intermediate">中级</option>
            <option value="advanced">高级</option>
          </select>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="input"
          >
            <option value="">所有分类</option>
            <option value="algorithm">算法</option>
            <option value="data-structure">数据结构</option>
            <option value="web-development">Web开发</option>
            <option value="database">数据库</option>
            <option value="system-design">系统设计</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setFilters({ difficulty: '', category: '', search: '' })
              fetchQuestions(1)
            }}
            className="btn btn-secondary btn-md"
          >
            <Filter className="h-4 w-4 mr-2" />
            清除筛选
          </button>
        </div>
      </div>

      {/* Questions Grid */}
      {filteredQuestions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuestions.map((question) => (
            <div key={question.id} className="card p-6 hover:shadow-lg transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className={`badge ${getDifficultyColor(question.difficulty)}`}>
                    {getDifficultyText(question.difficulty)}
                  </span>
                  <span className="badge bg-gray-100 text-gray-800">
                    {getCategoryText(question.category)}
                  </span>
                </div>
                <div className="flex items-center text-yellow-500">
                  <Star className="h-4 w-4" />
                  <span className="ml-1 text-sm font-medium">{question.points}</span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                {question.title}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {question.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{question.timeLimit} 分钟</span>
                </div>
                <div className="flex items-center">
                  <Target className="h-4 w-4 mr-1" />
                  <span>{question.stats?.totalAttempts || 0} 次尝试</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {question.tags?.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Link
                to={`/questions/${question.id}`}
                className="btn btn-primary btn-md w-full group-hover:bg-primary-700 transition-colors"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                开始练习
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到题目</h3>
          <p className="text-gray-600 mb-4">尝试调整筛选条件或搜索关键词</p>
          <button
            onClick={() => {
              setFilters({ difficulty: '', category: '', search: '' })
              fetchQuestions(1)
            }}
            className="btn btn-primary btn-md"
          >
            显示所有题目
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => fetchQuestions(pagination.current - 1)}
            disabled={pagination.current === 1}
            className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const page = i + 1
              return (
                <button
                  key={page}
                  onClick={() => fetchQuestions(page)}
                  className={`btn btn-sm ${
                    page === pagination.current
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  {page}
                </button>
              )
            })}
          </div>
          
          <button
            onClick={() => fetchQuestions(pagination.current + 1)}
            disabled={pagination.current === pagination.pages}
            className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}

export default QuestionList

