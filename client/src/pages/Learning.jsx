import { useState, useEffect } from 'react'
import { Brain, BookOpen, Clock, Users, TrendingUp, ChevronRight } from 'lucide-react'

const Learning = () => {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const categories = [
    { id: 'all', name: '全部', icon: BookOpen },
    { id: 'computer_vision', name: '计算机视觉', icon: Brain },
    { id: 'nlp', name: '自然语言处理', icon: Brain },
    { id: 'reinforcement_learning', name: '强化学习', icon: Brain },
    { id: 'deep_learning', name: '深度学习', icon: Brain }
  ]

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700'
  }

  const difficultyLabels = {
    beginner: '入门',
    intermediate: '中级',
    advanced: '高级'
  }

  useEffect(() => {
    fetchTopics()
  }, [filter])

  const fetchTopics = async () => {
    try {
      setLoading(true)
      const url = filter === 'all' 
        ? 'http://localhost:5000/api/learning/topics'
        : `http://localhost:5000/api/learning/topics?category=${filter}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setTopics(data.topics)
      }
    } catch (error) {
      console.error('获取主题失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartLearning = async (topicId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/learning/topics/${topicId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: 'guest' })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('✅ 开始学习！\n\n注意：完整的学习界面正在开发中\n当前版本已实现核心API和数据模型')
      }
    } catch (error) {
      console.error('开始学习失败:', error)
      alert('开始学习失败')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center">
            <Brain className="h-10 w-10 mr-3" />
            费曼学习法 · AI技术学习
          </h1>
          <p className="text-xl text-blue-100">
            7-14天系统性掌握AI技术 · 深度理解 · 实践应用
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-4 overflow-x-auto">
            {categories.map(category => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setFilter(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    filter === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map(topic => (
              <div
                key={topic.topicId}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {topic.name}
                    </h3>
                    <p className="text-sm text-gray-500">{topic.nameEn}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[topic.difficulty]}`}>
                    {difficultyLabels[topic.difficulty]}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {topic.duration}天完成
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {topic.stats?.totalLearners || 0}人学习
                  </div>
                  {topic.stats?.completionRate > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      完成率 {topic.stats.completionRate}%
                    </div>
                  )}
                </div>

                {topic.objectives && topic.objectives.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">学习目标：</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {topic.objectives.slice(0, 3).map((obj, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span className="line-clamp-1">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => handleStartLearning(topic.topicId)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  开始学习
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && topics.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">暂无相关主题</p>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 费曼学习法四步骤
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-blue-800">
            <div>
              <div className="font-medium mb-1">第1步：理解概念</div>
              <div className="text-blue-700">深入学习核心知识</div>
            </div>
            <div>
              <div className="font-medium mb-1">第2步：简单讲解</div>
              <div className="text-blue-700">用自己的话解释</div>
            </div>
            <div>
              <div className="font-medium mb-1">第3步：识别缺口</div>
              <div className="text-blue-700">找出不理解的地方</div>
            </div>
            <div>
              <div className="font-medium mb-1">第4步：回顾简化</div>
              <div className="text-blue-700">总结提炼重点</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Learning

