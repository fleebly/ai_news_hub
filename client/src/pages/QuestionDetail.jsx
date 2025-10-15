import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Star, 
  Lightbulb,
  Brain,
  Code2,
  Trophy,
  Zap
} from 'lucide-react'
import Editor from '@monaco-editor/react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'

const QuestionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [question, setQuestion] = useState(null)
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [testResults, setTestResults] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [hints, setHints] = useState([])
  const [showHints, setShowHints] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    fetchQuestion()
  }, [id])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000 / 60)) // 分钟
    }, 60000) // 每分钟更新一次

    return () => clearInterval(timer)
  }, [startTime])

  const fetchQuestion = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(`/questions/${id}`)
      
      if (response.data && response.data.title) {
        setQuestion(response.data)
        setCode(response.data.starterCode || '')
      } else {
        toast.error('题目数据格式错误')
      }
    } catch (error) {
      console.error('获取题目详情失败:', error)
      toast.error('获取题目失败')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHints = async () => {
    try {
      const response = await api.get(`/questions/${id}/hints`)
      setHints(response.data.hints)
      setShowHints(true)
    } catch (error) {
      console.error('获取提示失败:', error)
      toast.error('获取提示失败')
    }
  }

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('请先编写代码')
      return
    }

    // 检查是否已登录
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      toast.error('请先登录后再提交答案')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await api.post(`/questions/${id}/submit`, {
        code,
        language: 'javascript'
      })

      setResult(response.data)
      
      if (response.data.success) {
        setResult(response.data)
        setTestResults(response.data.results)
        toast.success('恭喜！答案正确')
        // 如果升级了，显示升级提示
        if (response.data.leveledUp) {
          toast.success(`恭喜升级到 ${response.data.newLevel} 级！`, {
            duration: 5000
          })
        }
      } else {
        setResult(response.data)
        setTestResults(response.data.results)
        toast.error(`答案不正确，通过率: ${response.data.passRate?.toFixed(1)}%`)
      }
    } catch (error) {
      console.error('提交答案失败:', error)
      toast.error('提交失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAiAnalysis = async () => {
    if (!code.trim()) {
      toast.error('请先编写代码')
      return
    }

    // 检查是否已登录
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      toast.error('请先登录后再使用AI分析功能')
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await api.post('/ai/analyze-code', {
        code,
        questionTitle: question?.title,
        language: 'javascript'
      })

      setAiAnalysis(response.data.analysis)
      toast.success('AI分析完成')
    } catch (error) {
      console.error('AI分析失败:', error)
      toast.error('AI分析失败，请重试')
    } finally {
      setIsAnalyzing(false)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">题目不存在</h3>
        <button
          onClick={() => navigate('/questions')}
          className="btn btn-primary btn-md"
        >
          返回题目列表
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/questions')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          返回题目列表
        </button>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-1" />
            <span>{timeSpent} 分钟</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Star className="h-4 w-4 mr-1 text-yellow-500" />
            <span>{question.points} 分</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Question Panel */}
        <div className="space-y-6">
          {/* Question Info */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className={`badge ${getDifficultyColor(question.difficulty)}`}>
                  {getDifficultyText(question.difficulty)}
                </span>
                <span className="badge bg-gray-100 text-gray-800">
                  {question.category}
                </span>
              </div>
              <div className="flex items-center text-yellow-500">
                <Star className="h-4 w-4 mr-1" />
                <span className="font-medium">{question.points} 分</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {question.title}
            </h1>

            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700">
                {question.description}
              </div>
            </div>

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hints */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                提示
              </h3>
              <button
                onClick={fetchHints}
                className="btn btn-secondary btn-sm"
              >
                获取提示
              </button>
            </div>

            {showHints && hints.length > 0 && (
              <div className="space-y-2">
                {hints.map((hint, index) => (
                  <div key={index} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <p className="text-sm text-gray-700">{hint}</p>
                  </div>
                ))}
              </div>
            )}

            {showHints && hints.length === 0 && (
              <p className="text-gray-500 text-sm">暂无提示</p>
            )}
          </div>

          {/* AI Analysis */}
          {aiAnalysis && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-500" />
                AI代码分析
              </h3>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {aiAnalysis}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Code Editor Panel */}
        <div className="space-y-6">
          {/* Code Editor */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Code2 className="h-5 w-5 mr-2 text-blue-500" />
                代码编辑器
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAiAnalysis}
                  disabled={isAnalyzing || !code.trim()}
                  className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  AI分析
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !code.trim()}
                  className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  提交答案
                </button>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Editor
                height="400px"
                defaultLanguage="javascript"
                value={code}
                onChange={setCode}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          {/* Result Panel */}
          {result && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 mr-2 text-red-500" />
                )}
                提交结果
              </h3>

              <div className={`p-4 rounded-lg ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message}
                </p>

                {result.success && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">得分:</span>
                      <span className="font-medium text-green-800">{result.score} 分</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">获得经验:</span>
                      <span className="font-medium text-green-800">+{result.experienceGained} XP</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">用时:</span>
                      <span className="font-medium text-green-800">{result.timeSpent} 分钟</span>
                    </div>
                    {result.leveledUp && (
                      <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                        <div className="flex items-center">
                          <Trophy className="h-5 w-5 text-yellow-600 mr-2" />
                          <span className="font-medium text-yellow-800">
                            恭喜升级到 {result.newLevel} 级！
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 测试结果 */}
                {testResults && testResults.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">测试结果:</h4>
                    <div className="space-y-2">
                      {testResults.map((test, index) => (
                        <div key={index} className={`p-3 rounded-lg border ${
                          test.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              测试用例 {test.testCase}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              test.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {test.passed ? '通过' : '失败'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div><strong>输入:</strong> {JSON.stringify(test.input)}</div>
                            <div><strong>期望:</strong> {JSON.stringify(test.expected)}</div>
                            <div><strong>实际:</strong> {JSON.stringify(test.actual)}</div>
                            {test.error && (
                              <div className="text-red-600"><strong>错误:</strong> {test.error}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!result.success && result.hints && result.hints.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-red-700 mb-2">提示:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.hints.map((hint, index) => (
                        <li key={index} className="text-sm text-red-700">{hint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuestionDetail

