import { useState, useEffect } from 'react'
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star,
  TrendingUp,
  Users,
  Target,
  Zap
} from 'lucide-react'
import api from '../services/api'

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([])
  const [type, setType] = useState('level')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [type])

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(`/users/leaderboard?type=${type}&limit=50`)
      setLeaderboard(response.data)
    } catch (error) {
      console.error('获取排行榜失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 2:
        return <Medal className="h-6 w-6 text-orange-500" />
      default:
        return <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
    }
  }

  const getRankColor = (index) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
      case 1:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
      case 2:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'level':
        return <Trophy className="h-5 w-5" />
      case 'experience':
        return <Zap className="h-5 w-5" />
      case 'solved':
        return <Target className="h-5 w-5" />
      case 'streak':
        return <TrendingUp className="h-5 w-5" />
      default:
        return <Trophy className="h-5 w-5" />
    }
  }

  const getTypeText = (type) => {
    switch (type) {
      case 'level':
        return '等级排行'
      case 'experience':
        return '经验排行'
      case 'solved':
        return '解题排行'
      case 'streak':
        return '连续排行'
      default:
        return '等级排行'
    }
  }

  const getValue = (user, type) => {
    switch (type) {
      case 'level':
        return user.level
      case 'experience':
        return user.experience
      case 'solved':
        return user.totalSolved
      case 'streak':
        return user.streak
      default:
        return user.level
    }
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
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
          <Trophy className="h-8 w-8 mr-3 text-yellow-500" />
          排行榜
        </h1>
        <p className="text-gray-600">看看你在编程学习中的排名</p>
      </div>

      {/* Type Selector */}
      <div className="card p-6">
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { type: 'level', label: '等级排行', icon: Trophy },
            { type: 'experience', label: '经验排行', icon: Zap },
            { type: 'solved', label: '解题排行', icon: Target },
            { type: 'streak', label: '连续排行', icon: TrendingUp }
          ].map(({ type: typeValue, label, icon: Icon }) => (
            <button
              key={typeValue}
              onClick={() => setType(typeValue)}
              className={`btn btn-md flex items-center ${
                type === typeValue ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            {getTypeIcon(type)}
            <span className="ml-2">{getTypeText(type)}</span>
          </h2>
          <div className="text-sm text-gray-600">
            共 {leaderboard.length} 位用户
          </div>
        </div>

        {leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((user, index) => (
              <div
                key={user.id || index}
                className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                  index < 3 ? 'shadow-md' : 'hover:shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getRankColor(index)}`}>
                    {getRankIcon(index)}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`level-badge level-${user.level}`}>
                      {user.level}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.username}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Zap className="h-4 w-4 mr-1" />
                          {user.experience} XP
                        </span>
                        <span className="flex items-center">
                          <Target className="h-4 w-4 mr-1" />
                          {user.totalSolved} 题
                        </span>
                        <span className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {user.streak} 天
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">
                    {getValue(user, type)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {type === 'level' ? '级' : 
                     type === 'experience' ? 'XP' : 
                     type === 'solved' ? '题' : '天'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无数据</h3>
            <p className="text-gray-600">还没有用户数据</p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {leaderboard.length}
          </h3>
          <p className="text-gray-600">活跃用户</p>
        </div>

        <div className="card p-6 text-center">
          <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Target className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {leaderboard.reduce((sum, user) => sum + (user.totalSolved || 0), 0)}
          </h3>
          <p className="text-gray-600">总解题数</p>
        </div>

        <div className="card p-6 text-center">
          <div className="p-3 bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {Math.max(...leaderboard.map(user => user.level || 0), 0)}
          </h3>
          <p className="text-gray-600">最高等级</p>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard

