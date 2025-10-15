import { useState, useEffect } from 'react'
import { 
  User, 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar,
  Star,
  Zap,
  Award,
  BarChart3
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'

const Profile = () => {
  const { user, updateUser } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [progress, setProgress] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setIsLoading(true)
      const [statsResponse, achievementsResponse, progressResponse] = await Promise.all([
        api.get('/users/stats'),
        api.get('/users/achievements'),
        api.get('/users/progress?days=30')
      ])
      
      setStats(statsResponse.data)
      setAchievements(achievementsResponse.data)
      setProgress(progressResponse.data)
    } catch (error) {
      console.error('获取个人资料数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getLevelProgress = () => {
    const currentLevelExp = (user?.level - 1) * 100
    const nextLevelExp = user?.level * 100
    const currentExp = user?.experience - currentLevelExp
    const neededExp = nextLevelExp - currentLevelExp
    return Math.min((currentExp / neededExp) * 100, 100)
  }

  const getAchievementIcon = (id) => {
    const iconMap = {
      'first_solve': '🎯',
      'streak_7': '🔥',
      'streak_30': '💎',
      'level_5': '⭐',
      'level_10': '👑',
      'perfect_score': '💯'
    }
    return iconMap[id] || '🏆'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="card p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          {/* Avatar and Level */}
          <div className="flex flex-col items-center">
            <div className={`level-badge level-${user?.level || 1} mb-4`}>
              {user?.level || 1}
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">{user?.username}</h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-1">
                {user?.level || 1}
              </div>
              <div className="text-sm text-gray-600">等级</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {user?.experience || 0}
              </div>
              <div className="text-sm text-gray-600">经验值</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {user?.totalSolved || 0}
              </div>
              <div className="text-sm text-gray-600">已解决</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {user?.streak || 0}
              </div>
              <div className="text-sm text-gray-600">连续天数</div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">等级进度</span>
            <span className="text-sm text-gray-600">
              {user?.experience || 0} / {(user?.level || 1) * 100} XP
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${getLevelProgress()}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Achievements */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Award className="h-5 w-5 mr-2 text-yellow-500" />
            成就徽章
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  achievement.unlocked
                    ? 'border-yellow-300 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">
                    {getAchievementIcon(achievement.id)}
                  </div>
                  <h4 className={`font-medium ${
                    achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {achievement.name}
                  </h4>
                  <p className={`text-sm ${
                    achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {achievement.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
            难度分布
          </h3>
          
          <div className="space-y-4">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-green-500" />
          最近30天活动
        </h3>
        
        {progress.length > 0 ? (
          <div className="space-y-4">
            {progress.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-full mr-4">
                    <Target className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString('zh-CN')}
                    </p>
                    <p className="text-sm text-gray-600">
                      解决了 {day.solved} 道题目
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    +{day.experience} XP
                  </div>
                  <div className="text-xs text-gray-500">
                    {day.questions.length} 题
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>最近30天没有活动记录</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile

