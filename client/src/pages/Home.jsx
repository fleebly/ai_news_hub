import { Clock } from 'lucide-react'
import AINewsFeed from '../components/AINewsFeed'
import TechBanner from '../components/TechBanner'

const Home = () => {

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tech Banner with Sliding Images */}
      <TechBanner />

      {/* AI News Section - Infinite Scroll */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">技术动态</h2>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              实时更新
            </div>
          </div>
          <AINewsFeed />
        </div>
      </div>
    </div>
  )
}

export default Home