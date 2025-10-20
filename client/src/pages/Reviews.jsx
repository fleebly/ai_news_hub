import { useState, useEffect } from 'react'
import {
  BookOpen,
  Search,
  Loader,
  TrendingUp,
  Calendar,
  Eye,
  Heart,
  ExternalLink,
  Plus,
  X,
  FileText,
  Tag,
  Database
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

const Reviews = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  // 生成综述相关状态
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [keywords, setKeywords] = useState([])
  const [keywordInput, setKeywordInput] = useState('')
  const [generateProgress, setGenerateProgress] = useState(0)
  const [generateMessage, setGenerateMessage] = useState('')
  
  // 查看综述相关状态
  const [selectedReview, setSelectedReview] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/reviews?limit=50')
      const data = await response.json()
      
      if (data.success) {
        setReviews(data.reviews)
      }
    } catch (error) {
      console.error('获取综述列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const handleRemoveKeyword = (keyword) => {
    setKeywords(keywords.filter(k => k !== keyword))
  }

  const handleGenerateReview = async () => {
    if (keywords.length === 0) {
      alert('请至少添加一个关键词')
      return
    }

    try {
      setGenerating(true)
      setGenerateProgress(0)
      setGenerateMessage('准备生成综述...')

      const response = await fetch('http://localhost:5000/api/reviews/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keywords })
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              setGenerateProgress(data.progress)
              setGenerateMessage(data.message)

              if (data.success && data.review) {
                // 生成成功
                setGenerating(false)
                setShowGenerateModal(false)
                setKeywords([])
                
                alert('✅ 综述生成成功！')
                
                // 刷新列表
                await fetchReviews()
              } else if (data.success === false) {
                // 生成失败
                setGenerating(false)
                alert('❌ 综述生成失败: ' + (data.error || '未知错误'))
              }
            } catch (e) {
              console.error('解析进度数据失败:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('生成综述失败:', error)
      alert('生成综述失败: ' + error.message)
      setGenerating(false)
    }
  }

  const handleViewReview = async (reviewId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reviews/${reviewId}`)
      const data = await response.json()
      
      if (data.success) {
        setSelectedReview(data.review)
        setShowReviewModal(true)
      }
    } catch (error) {
      console.error('获取综述详情失败:', error)
      alert('获取综述详情失败')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4 flex items-center">
                <BookOpen className="h-10 w-10 mr-3" />
                AI论文综述
              </h1>
              <p className="text-xl text-purple-100">
                多源搜索 · AI生成 · 专业综述
              </p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              生成新综述
            </button>
          </div>
        </div>
      </div>

      {/* 综述列表 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="h-8 w-8 text-purple-600 animate-spin" />
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">还没有综述</p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              生成第一篇综述
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reviews.map((review) => (
              <div
                key={review.reviewId}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6 cursor-pointer"
                onClick={() => handleViewReview(review.reviewId)}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {review.title}
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {review.abstract}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    {review.keywords.join(', ')}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Database className="h-4 w-4" />
                    {Object.values(review.sourcesCount || {}).reduce((a, b) => a + b, 0)} 篇参考文献
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {Math.round((review.metadata?.wordCount || 0) / 1000)}K 字
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {review.views} 次浏览
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {review.sourcesCount?.arxiv > 0 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      arXiv: {review.sourcesCount.arxiv}
                    </span>
                  )}
                  {review.sourcesCount?.zhihu > 0 && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                      知乎: {review.sourcesCount.zhihu}
                    </span>
                  )}
                  {review.sourcesCount?.blog > 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      博客: {review.sourcesCount.blog}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 生成综述模态框 */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">生成综述</h2>
                {!generating && (
                  <button
                    onClick={() => {
                      setShowGenerateModal(false)
                      setKeywords([])
                      setKeywordInput('')
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                )}
              </div>

              {!generating ? (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      输入关键词（按Enter添加）
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                        placeholder="例如：transformer, attention mechanism"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAddKeyword}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        添加
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full flex items-center gap-2"
                        >
                          {keyword}
                          <button
                            onClick={() => handleRemoveKeyword(keyword)}
                            className="text-purple-500 hover:text-purple-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                      💡 综述功能说明
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• 从 arXiv、知乎、博客、论坛等多个来源搜索相关内容</li>
                      <li>• AI自动生成专业的技术综述文章</li>
                      <li>• 包含完整的参考文献列表</li>
                      <li>• 预计耗时 2-5 分钟</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleGenerateReview}
                    disabled={keywords.length === 0}
                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    开始生成综述
                  </button>
                </>
              ) : (
                <div className="py-8">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {generateMessage}
                      </span>
                      <span className="text-sm font-medium text-purple-600">
                        {generateProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${generateProgress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center py-8">
                    <Loader className="h-8 w-8 text-purple-600 animate-spin" />
                  </div>
                  
                  <p className="text-center text-gray-600 text-sm">
                    正在生成综述，请稍候...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 查看综述模态框 */}
      {showReviewModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedReview.title}
              </h2>
              <button
                onClick={() => {
                  setShowReviewModal(false)
                  setSelectedReview(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-8">
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        className="text-purple-600 hover:text-purple-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    )
                  }}
                >
                  {selectedReview.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reviews

