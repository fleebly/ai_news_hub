import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Clock, 
  BookOpen,
  Brain,
  Star,
  Zap,
  BarChart3,
  Calendar
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'

const Dashboard = () => {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, progressResponse] = await Promise.all([
        api.get('/users/stats'),
        api.get('/users/progress?days=7')
      ])
      
      setStats(statsResponse.data)
      setRecentActivity(progressResponse.data)
    } catch (error) {
      console.error('获取仪表板数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const getLevelProgress = () => {
    const currentLevelExp = (user?.level - 1) * 100
    const nextLevelExp = user?.level * 100
    const currentExp = user?.experience - currentLevelExp
    const neededExp = nextLevelExp - currentLevelExp
    return Math.min((currentExp / neededExp) * 100, 100)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100'
      case 'intermediate': return 'text-yellow-600 bg-yellow-100'
      case 'advanced': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              欢迎回来，{user?.username}！
            </h1>
            <p className="text-primary-100">
              继续你的编程学习之旅，解锁更多成就
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{user?.level || 1}</div>
            <div className="text-primary-100">等级</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">已解决题目</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalSolved || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">经验值</p>
              <p className="text-2xl font-bold text-gray-900">
                {user?.experience || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">连续天数</p>
              <p className="text-2xl font-bold text-gray-900">
                {user?.streak || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Trophy className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">成就数量</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.achievements?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Level Progress */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
            等级进度
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">当前等级</span>
              <span className="text-lg font-bold text-primary-600">
                {user?.level || 1}
              </span>
            </div>
            
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${getLevelProgress()}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{user?.experience || 0} XP</span>
              <span>{(user?.level || 1) * 100} XP</span>
            </div>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary-600" />
            难度分布
          </h3>
          
          <div className="space-y-3">
            {Object.entries(stats?.difficultyBreakdown || {}).map(([difficulty, count]) => (
              <div key={difficulty} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`badge badge-${difficulty} mr-3`}>
                    {difficulty === 'beginner' ? '初级' : 
                     difficulty === 'intermediate' ? '中级' : '高级'}
                  </div>
                  <span className="text-sm text-gray-600">{count} 题</span>
                </div>
                <div className="text-sm font-medium text-gray-900">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-primary-600" />
          最近活动
        </h3>
        
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-full mr-3">
                    <BookOpen className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.questions[0]?.title || '未知题目'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.date).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    +{activity.experience} XP
                  </div>
                  <div className="text-xs text-gray-500">
                    {activity.solved} 题
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>还没有活动记录</p>
            <Link to="/questions" className="btn btn-primary btn-sm mt-4">
              开始练习
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/questions"
          className="card p-6 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">开始练习</h3>
              <p className="text-sm text-gray-600">选择题目开始编程练习</p>
            </div>
          </div>
        </Link>

        <Link
          to="/leaderboard"
          className="card p-6 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
              <Trophy className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">排行榜</h3>
              <p className="text-sm text-gray-600">查看你的排名和成就</p>
            </div>
          </div>
        </Link>

        <Link
          to="/profile"
          className="card p-6 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">个人资料</h3>
              <p className="text-sm text-gray-600">查看详细统计和设置</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard

