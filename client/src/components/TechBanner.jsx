import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ExternalLink, Clock, Eye, MessageCircle } from 'lucide-react'

const TechBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [news, setNews] = useState([])

  // 获取新闻数据
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/ai-news')
        const data = await response.json()
        if (data.success) {
          setNews(data.news.slice(0, 5)) // 只取前5条作为banner
        } else {
          throw new Error('API返回失败')
        }
      } catch (error) {
        console.error('获取新闻失败:', error)
        // 使用模拟数据
        setNews([
          {
            id: 1,
            title: "OpenAI发布GPT-4 Turbo，性能提升显著",
            summary: "GPT-4 Turbo在推理能力和代码生成方面有了重大突破，编程效率提升40%",
            category: "AI技术",
            publishedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            views: 4892,
            likes: 321,
            comments: 99,
            imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop"
          },
          {
            id: 2,
            title: "Google发布Gemini 2.0，多模态能力再升级",
            summary: "Gemini 2.0在图像理解、视频分析和多语言处理方面取得重大突破",
            category: "AI技术",
            publishedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            views: 3690,
            likes: 153,
            comments: 116,
            imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop"
          },
          {
            id: 3,
            title: "GitHub Copilot X新增代码审查功能",
            summary: "AI驱动的代码审查工具能够自动检测潜在bug和安全漏洞，提升代码质量",
            category: "开发工具",
            publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            views: 3213,
            likes: 223,
            comments: 79,
            imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop"
          }
        ])
      }
    }

    fetchNews()
  }, [])

  // 自动轮播
  useEffect(() => {
    if (news.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % news.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [news.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % news.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + news.length) % news.length)
  }

  const formatTimeAgo = (dateString) => {
    const now = new Date()
    const publishedAt = new Date(dateString)
    const diffInMinutes = Math.floor((now - publishedAt) / (1000 * 60))
    
    if (diffInMinutes < 1) return '刚刚'
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}小时前`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}天前`
  }

  if (news.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white overflow-hidden">
      {/* 滑动容器 */}
      <div className="relative h-96 md:h-[500px]">
        {news.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* 背景图片 */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${item.imageUrl})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            </div>
            
            {/* 内容 */}
            <div className="relative z-10 h-full flex items-center">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl">
                  <div className="flex items-center mb-4">
                    <span className="px-3 py-1 bg-blue-600 text-sm font-medium rounded-full">
                      {item.category}
                    </span>
                    <div className="flex items-center ml-4 text-sm text-gray-300">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatTimeAgo(item.publishedAt)}
                    </div>
                  </div>
                  
                  <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                    {item.title}
                  </h1>
                  
                  <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-3xl">
                    {item.summary}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-sm text-gray-300">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {item.views.toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {item.comments}
                      </div>
                    </div>
                    
                    <Link
                      to={`/news/${item.id}`}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      阅读详情
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* 导航按钮 */}
        {news.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
      
      {/* 指示器 */}
      {news.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {news.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide 
                  ? 'bg-white' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TechBanner
