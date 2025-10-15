import { useState, useEffect } from 'react'
import { 
  Github, 
  Star, 
  GitFork, 
  Eye,
  Code,
  Play,
  Download,
  ExternalLink,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Tag,
  Users,
  Zap,
  Brain,
  FileText,
  Globe
} from 'lucide-react'

const OpenSource = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLanguage, setSelectedLanguage] = useState('all')

  const categories = [
    { id: 'all', name: '全部', icon: Code },
    { id: 'llm', name: '大语言模型', icon: Brain },
    { id: 'cv', name: '计算机视觉', icon: Eye },
    { id: 'nlp', name: '自然语言处理', icon: FileText },
    { id: 'ml', name: '机器学习', icon: Zap },
    { id: 'tools', name: '开发工具', icon: Globe }
  ]

  const languages = [
    { id: 'all', name: '全部语言' },
    { id: 'python', name: 'Python' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'typescript', name: 'TypeScript' },
    { id: 'rust', name: 'Rust' },
    { id: 'go', name: 'Go' },
    { id: 'cpp', name: 'C++' }
  ]

  // 模拟开源项目数据
  const mockProjects = [
    {
      id: 1,
      name: "transformers",
      fullName: "huggingface/transformers",
      description: "🤗 Transformers: State-of-the-art Machine Learning for Pytorch, TensorFlow, and JAX.",
      language: "python",
      category: "llm",
      stars: 120000,
      forks: 25000,
      watchers: 5000,
      lastUpdated: "2024-03-15",
      topics: ["transformers", "pytorch", "tensorflow", "nlp", "machine-learning"],
      homepage: "https://huggingface.co/transformers",
      trending: true,
      featured: true
    },
    {
      id: 2,
      name: "pytorch",
      fullName: "pytorch/pytorch",
      description: "Tensors and Dynamic neural networks in Python with strong GPU acceleration",
      language: "cpp",
      category: "ml",
      stars: 75000,
      forks: 20000,
      watchers: 3000,
      lastUpdated: "2024-03-14",
      topics: ["pytorch", "machine-learning", "deep-learning", "gpu"],
      homepage: "https://pytorch.org",
      trending: true,
      featured: true
    },
    {
      id: 3,
      name: "tensorflow",
      fullName: "tensorflow/tensorflow",
      description: "An Open Source Machine Learning Framework for Everyone",
      language: "python",
      category: "ml",
      stars: 180000,
      forks: 88000,
      watchers: 8000,
      lastUpdated: "2024-03-13",
      topics: ["tensorflow", "machine-learning", "deep-learning", "neural-networks"],
      homepage: "https://tensorflow.org",
      trending: false,
      featured: true
    },
    {
      id: 4,
      name: "langchain",
      fullName: "langchain-ai/langchain",
      description: "Building applications with LLMs through composability",
      language: "python",
      category: "llm",
      stars: 85000,
      forks: 12000,
      watchers: 2000,
      lastUpdated: "2024-03-12",
      topics: ["langchain", "llm", "ai", "agents", "chains"],
      homepage: "https://python.langchain.com",
      trending: true,
      featured: false
    },
    {
      id: 5,
      name: "stable-diffusion-webui",
      fullName: "AUTOMATIC1111/stable-diffusion-webui",
      description: "Stable Diffusion web UI",
      language: "python",
      category: "cv",
      stars: 95000,
      forks: 19000,
      watchers: 4000,
      lastUpdated: "2024-03-11",
      topics: ["stable-diffusion", "ai", "image-generation", "webui"],
      homepage: "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
      trending: true,
      featured: false
    },
    {
      id: 6,
      name: "openai-python",
      fullName: "openai/openai-python",
      description: "The official Python library for the OpenAI API",
      language: "python",
      category: "llm",
      stars: 45000,
      forks: 8000,
      watchers: 1500,
      lastUpdated: "2024-03-10",
      topics: ["openai", "api", "gpt", "dall-e", "whisper"],
      homepage: "https://platform.openai.com",
      trending: false,
      featured: false
    },
    {
      id: 7,
      name: "llama.cpp",
      fullName: "ggerganov/llama.cpp",
      description: "Port of Facebook's LLaMA model in C/C++",
      language: "cpp",
      category: "llm",
      stars: 55000,
      forks: 7000,
      watchers: 2500,
      lastUpdated: "2024-03-09",
      topics: ["llama", "cpp", "llm", "inference", "quantization"],
      homepage: "https://github.com/ggerganov/llama.cpp",
      trending: true,
      featured: false
    },
    {
      id: 8,
      name: "vllm",
      fullName: "vllm-project/vllm",
      description: "A high-throughput and memory-efficient inference and serving engine for LLMs",
      language: "python",
      category: "llm",
      stars: 25000,
      forks: 3000,
      watchers: 800,
      lastUpdated: "2024-03-08",
      topics: ["vllm", "inference", "serving", "llm", "gpu"],
      homepage: "https://vllm.ai",
      trending: true,
      featured: false
    }
  ]

  useEffect(() => {
    // 模拟API调用
    const timer = setTimeout(() => {
      setProjects(mockProjects)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory
    const matchesLanguage = selectedLanguage === 'all' || project.language === selectedLanguage

    return matchesSearch && matchesCategory && matchesLanguage
  })

  const getLanguageColor = (language) => {
    const colors = {
      'python': 'bg-blue-100 text-blue-800',
      'javascript': 'bg-yellow-100 text-yellow-800',
      'typescript': 'bg-blue-100 text-blue-800',
      'rust': 'bg-orange-100 text-orange-800',
      'go': 'bg-cyan-100 text-cyan-800',
      'cpp': 'bg-purple-100 text-purple-800'
    }
    return colors[language] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'llm': return <Brain className="h-4 w-4" />
      case 'cv': return <Eye className="h-4 w-4" />
      case 'nlp': return <FileText className="h-4 w-4" />
      case 'ml': return <Zap className="h-4 w-4" />
      case 'tools': return <Globe className="h-4 w-4" />
      default: return <Code className="h-4 w-4" />
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              开源AI项目
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              探索和参与开源AI项目，阅读代码，调试模型，提升实践能力
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索项目名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Language Filter */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {languages.map(language => (
                <option key={language.id} value={language.id}>
                  {language.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Featured Projects */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">精选项目</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.filter(p => p.featured).map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Github className="h-5 w-5 text-gray-600" />
                        <span className="font-mono text-sm text-gray-600">{project.fullName}</span>
                        {project.trending && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            热门
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {project.name}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.topics.slice(0, 3).map((topic, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {topic}
                          </span>
                        ))}
                        {project.topics.length > 3 && (
                          <span className="text-xs text-gray-500">+{project.topics.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {formatNumber(project.stars)}
                      </span>
                      <span className="flex items-center">
                        <GitFork className="h-4 w-4 mr-1" />
                        {formatNumber(project.forks)}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getLanguageColor(project.language)}`}>
                        {project.language}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Projects */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">所有项目</h2>
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Github className="h-5 w-5 text-gray-600" />
                        <span className="font-mono text-sm text-gray-600">{project.fullName}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLanguageColor(project.language)}`}>
                          {project.language}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {getCategoryIcon(project.category)}
                          <span className="ml-1">{categories.find(c => c.id === project.category)?.name}</span>
                        </span>
                        {project.trending && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            热门
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-purple-600 cursor-pointer">
                        {project.name}
                      </h3>
                      
                      <p className="text-gray-600 mb-3">
                        {project.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.topics.map((topic, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {formatNumber(project.stars)} stars
                      </span>
                      <span className="flex items-center">
                        <GitFork className="h-4 w-4 mr-1" />
                        {formatNumber(project.forks)} forks
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {formatNumber(project.watchers)} watching
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {project.lastUpdated}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center px-3 py-1 text-sm text-purple-600 hover:text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                        <Code className="h-4 w-4 mr-1" />
                        代码
                      </button>
                      <button className="flex items-center px-3 py-1 text-sm text-green-600 hover:text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                        <Play className="h-4 w-4 mr-1" />
                        运行
                      </button>
                      <button className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        访问
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Github className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到相关项目</h3>
            <p className="text-gray-600">尝试调整搜索条件或筛选器</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default OpenSource
