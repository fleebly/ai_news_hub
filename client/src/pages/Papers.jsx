import { useState, useEffect } from 'react'
import { 
  FileText, 
  Calendar, 
  Users, 
  ExternalLink,
  Search,
  Filter,
  Star,
  Download,
  Eye,
  Clock,
  Tag,
  TrendingUp,
  BookOpen,
  Brain,
  Code,
  RefreshCw,
  Sparkles,
  X,
  Loader,
  Heart,
  Edit,
  Save,
  Send,
  XCircle
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import api from '../services/api'

const Papers = () => {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedConference, setSelectedConference] = useState('all')
  const [showTrendingOnly, setShowTrendingOnly] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  
  // 收藏功能
  const [favorites, setFavorites] = useState([])
  
  // AI解读相关状态
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [analysisMode] = useState('deep') // 只保留深度解读
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisError, setAnalysisError] = useState('')
  
  // 编辑相关状态
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const categories = [
    { id: 'all', name: '全部', icon: FileText },
    { id: 'nlp', name: '自然语言处理', icon: Brain },
    { id: 'cv', name: '计算机视觉', icon: Eye },
    { id: 'ml', name: '机器学习', icon: Code },
    { id: 'robotics', name: '机器人学', icon: Users }
  ]

  const conferences = [
    { id: 'all', name: '全部会议' },
    { id: 'neurips', name: 'NeurIPS' },
    { id: 'icml', name: 'ICML' },
    { id: 'iclr', name: 'ICLR' },
    { id: 'acl', name: 'ACL' },
    { id: 'cvpr', name: 'CVPR' },
    { id: 'iccv', name: 'ICCV' },
    { id: 'arxiv', name: 'arXiv' }
  ]

  // 模拟论文数据（使用真实的arXiv链接）
  const mockPapers = [
    {
      id: 1,
      title: "GPT-4 Technical Report",
      authors: ["OpenAI Team"],
      conference: "arXiv",
      category: "nlp",
      publishedAt: "2023-03-15",
      abstract: "We report the development of GPT-4, a large-scale, multimodal model which can accept image and text inputs and produce text outputs. While less capable than humans in many real-world scenarios, GPT-4 exhibits human-level performance on various professional and academic benchmarks.",
      tags: ["GPT-4", "Multimodal", "Large Language Model"],
      citations: 1250,
      views: 15000,
      pdfUrl: "https://arxiv.org/pdf/2303.08774.pdf",
      arxivUrl: "https://arxiv.org/abs/2303.08774",
      trending: true
    },
    {
      id: 2,
      title: "Attention Is All You Need",
      authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar"],
      conference: "NeurIPS",
      category: "nlp",
      publishedAt: "2017-06-12",
      abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.",
      tags: ["Transformer", "Attention", "Neural Machine Translation"],
      citations: 45000,
      views: 120000,
      pdfUrl: "https://arxiv.org/pdf/1706.03762.pdf",
      arxivUrl: "https://arxiv.org/abs/1706.03762",
      codeUrl: "https://github.com/tensorflow/tensor2tensor",
      trending: true
    },
    {
      id: 3,
      title: "Deep Residual Learning for Image Recognition",
      authors: ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren", "Jian Sun"],
      conference: "CVPR",
      category: "cv",
      publishedAt: "2015-12-10",
      abstract: "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs.",
      tags: ["ResNet", "Deep Learning", "Image Recognition"],
      citations: 80000,
      views: 200000,
      pdfUrl: "https://arxiv.org/pdf/1512.03385.pdf",
      arxivUrl: "https://arxiv.org/abs/1512.03385",
      codeUrl: "https://github.com/KaimingHe/deep-residual-networks",
      trending: false
    },
    {
      id: 4,
      title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
      authors: ["Jacob Devlin", "Ming-Wei Chang", "Kenton Lee", "Kristina Toutanova"],
      conference: "NAACL",
      category: "nlp",
      publishedAt: "2018-10-11",
      abstract: "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text.",
      tags: ["BERT", "Pre-training", "Language Understanding"],
      citations: 60000,
      views: 180000,
      pdfUrl: "https://arxiv.org/pdf/1810.04805.pdf",
      arxivUrl: "https://arxiv.org/abs/1810.04805",
      codeUrl: "https://github.com/google-research/bert",
      trending: true
    },
    {
      id: 5,
      title: "Highly accurate protein structure prediction with AlphaFold",
      authors: ["John Jumper", "Richard Evans", "Alexander Pritzel"],
      conference: "Nature",
      category: "ml",
      publishedAt: "2021-07-15",
      abstract: "Proteins are essential to life, and understanding their structure can facilitate a mechanistic understanding of their function. Through an enormous experimental effort, the structures of around 100,000 unique proteins have been determined, but this represents a small fraction of the billions of known protein sequences.",
      tags: ["AlphaFold", "Protein Structure", "Deep Learning"],
      citations: 15000,
      views: 50000,
      pdfUrl: "https://www.nature.com/articles/s41586-021-03819-2.pdf",
      arxivUrl: "https://www.nature.com/articles/s41586-021-03819-2",
      codeUrl: "https://github.com/deepmind/alphafold",
      trending: false
    },
    {
      id: 6,
      title: "LLaMA: Open and Efficient Foundation Language Models",
      authors: ["Hugo Touvron", "Thibaut Lavril", "Gautier Izacard"],
      conference: "arXiv",
      category: "nlp",
      publishedAt: "2023-02-27",
      abstract: "We introduce LLaMA, a collection of foundation language models ranging from 7B to 65B parameters. We train our models on trillions of tokens, and show that it is possible to train state-of-the-art models using publicly available datasets exclusively.",
      tags: ["LLaMA", "Language Model", "Open Source"],
      citations: 2500,
      views: 35000,
      pdfUrl: "https://arxiv.org/pdf/2302.13971.pdf",
      arxivUrl: "https://arxiv.org/abs/2302.13971",
      codeUrl: "https://github.com/facebookresearch/llama",
      trending: true
    },
    {
      id: 7,
      title: "Stable Diffusion: High-Resolution Image Synthesis with Latent Diffusion Models",
      authors: ["Robin Rombach", "Andreas Blattmann", "Dominik Lorenz"],
      conference: "CVPR",
      category: "cv",
      publishedAt: "2021-12-20",
      abstract: "By decomposing the image formation process into a sequential application of denoising autoencoders, diffusion models (DMs) achieve state-of-the-art synthesis results on image data and beyond.",
      tags: ["Stable Diffusion", "Image Generation", "Latent Diffusion"],
      citations: 3500,
      views: 45000,
      pdfUrl: "https://arxiv.org/pdf/2112.10752.pdf",
      arxivUrl: "https://arxiv.org/abs/2112.10752",
      codeUrl: "https://github.com/CompVis/stable-diffusion",
      trending: true
    },
    {
      id: 8,
      title: "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models",
      authors: ["Jason Wei", "Xuezhi Wang", "Dale Schuurmans"],
      conference: "NeurIPS",
      category: "nlp",
      publishedAt: "2022-01-28",
      abstract: "We explore how generating a chain of thought -- a series of intermediate reasoning steps -- significantly improves the ability of large language models to perform complex reasoning.",
      tags: ["Chain-of-Thought", "Reasoning", "Prompting"],
      citations: 4200,
      views: 38000,
      pdfUrl: "https://arxiv.org/pdf/2201.11903.pdf",
      arxivUrl: "https://arxiv.org/abs/2201.11903",
      trending: true
    }
  ]

  // 加载收藏列表
  useEffect(() => {
    const savedFavorites = localStorage.getItem('paper-favorites')
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites))
      } catch (e) {
        console.error('加载收藏列表失败:', e)
        setFavorites([])
      }
    }
  }, [])

  useEffect(() => {
    fetchPapers()
  }, [])

  const fetchPapers = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/papers?limit=100')
      
      if (!response.ok) {
        throw new Error('Failed to fetch papers')
      }
      
      const data = await response.json()
      
      if (data.success && data.papers) {
        setPapers(data.papers)
      } else {
        // 如果API失败，使用模拟数据
        setPapers(mockPapers)
      }
    } catch (error) {
      console.error('获取论文失败:', error)
      // 降级到模拟数据
      setPapers(mockPapers)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      // 清除缓存
      await fetch('http://localhost:5000/api/papers/refresh', {
        method: 'POST'
      })
      // 重新获取数据
      await fetchPapers()
    } catch (error) {
      console.error('刷新失败:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // 切换收藏
  const toggleFavorite = (paperId) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(paperId)
        ? prev.filter(id => id !== paperId)
        : [...prev, paperId]
      
      // 保存到localStorage
      localStorage.setItem('paper-favorites', JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  // 检查是否已收藏
  const isFavorite = (paperId) => {
    return favorites.includes(paperId)
  }

  const filteredPapers = papers.filter(paper => {
    const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         paper.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || paper.category === selectedCategory
    const matchesConference = selectedConference === 'all' || paper.conference.toLowerCase().includes(selectedConference.toLowerCase())
    const matchesTrending = !showTrendingOnly || paper.trending
    const matchesFavorites = !showFavoritesOnly || isFavorite(paper.id)

    return matchesSearch && matchesCategory && matchesConference && matchesTrending && matchesFavorites
  })

  const getConferenceColor = (conference) => {
    const colors = {
      'NeurIPS': 'bg-red-100 text-red-800',
      'ICML': 'bg-blue-100 text-blue-800',
      'ICLR': 'bg-green-100 text-green-800',
      'ACL': 'bg-purple-100 text-purple-800',
      'CVPR': 'bg-orange-100 text-orange-800',
      'ICCV': 'bg-pink-100 text-pink-800',
      'arXiv': 'bg-gray-100 text-gray-800',
      'Nature': 'bg-indigo-100 text-indigo-800'
    }
    return colors[conference] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'nlp': return <Brain className="h-4 w-4" />
      case 'cv': return <Eye className="h-4 w-4" />
      case 'ml': return <Code className="h-4 w-4" />
      case 'robotics': return <Users className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  // 获取缓存的key
  const getCacheKey = (paperId, mode) => {
    return `paper-analysis-${paperId}-${mode}`
  }

  // 从缓存获取解读内容
  const getAnalysisFromCache = (paperId, mode) => {
    try {
      const cacheKey = getCacheKey(paperId, mode)
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const data = JSON.parse(cached)
        // 检查缓存是否过期（7天）
        const cacheTime = new Date(data.cachedAt)
        const now = new Date()
        const diffDays = (now - cacheTime) / (1000 * 60 * 60 * 24)
        if (diffDays < 7) {
          return data.result
        }
      }
    } catch (e) {
      console.error('读取缓存失败:', e)
    }
    return null
  }

  // 保存解读内容到缓存
  const saveAnalysisToCache = (paperId, mode, result) => {
    try {
      const cacheKey = getCacheKey(paperId, mode)
      const data = {
        result: result,
        cachedAt: new Date().toISOString()
      }
      localStorage.setItem(cacheKey, JSON.stringify(data))
    } catch (e) {
      console.error('保存缓存失败:', e)
    }
  }

  // AI解读功能
  const handleAnalyze = async (paper) => {
    setSelectedPaper(paper)
    setShowAnalysisModal(true)
    setAnalysisError('')
    
    // 检查缓存
    const cachedResult = getAnalysisFromCache(paper.id, analysisMode)
    if (cachedResult) {
      console.log('✅ 使用缓存的解读内容')
      setAnalysisResult(cachedResult)
      setAnalyzing(false)
      return
    }

    // 没有缓存，发起请求
    setAnalysisResult(null)
    setAnalyzing(true)

    try {
      const response = await api.post('/paper-analysis/analyze', {
        paper: {
          title: paper.title,
          abstract: paper.abstract,
          authors: paper.authors,
          publishedAt: paper.publishedAt
        },
        mode: analysisMode
      })

      if (response.data.success) {
        const result = response.data.data
        setAnalysisResult(result)
        // 保存到缓存
        saveAnalysisToCache(paper.id, analysisMode, result)
      } else {
        setAnalysisError(response.data.message || '解读失败')
      }
    } catch (err) {
      console.error('解读失败:', err)
      setAnalysisError(err.response?.data?.message || '服务器错误，请稍后重试')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDownloadAnalysis = () => {
    if (!analysisResult) return

    const content = isEditing ? editedContent : analysisResult.content
    const fullContent = `# ${analysisResult.title}\n\n` +
      `**生成时间**: ${new Date(analysisResult.generatedAt).toLocaleString()}\n` +
      `**原论文**: ${analysisResult.sourcePaper.title}\n` +
      `**作者**: ${analysisResult.sourcePaper.authors?.join(', ') || '未知'}\n\n` +
      `---\n\n${content}`

    const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedPaper.title.substring(0, 30)}_深度解读_${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 开始编辑
  const handleStartEdit = () => {
    setIsEditing(true)
    setEditedContent(analysisResult.content)
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedContent('')
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editedContent.trim()) {
      setAnalysisError('内容不能为空')
      return
    }

    setSaving(true)
    try {
      // 更新本地状态
      const updatedResult = {
        ...analysisResult,
        content: editedContent,
        generatedAt: new Date().toISOString()
      }
      setAnalysisResult(updatedResult)
      
      // 更新缓存
      saveAnalysisToCache(selectedPaper.id, analysisMode, updatedResult)
      
      setIsEditing(false)
      setAnalysisError('')
    } catch (err) {
      console.error('保存失败:', err)
      setAnalysisError('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  // 推送到公众号
  const handlePublishToWechat = async () => {
    if (!analysisResult) return

    setPublishing(true)
    setAnalysisError('')

    try {
      const content = isEditing ? editedContent : analysisResult.content
      const response = await api.post('/wechat/publish-analysis', {
        paper: {
          title: selectedPaper.title,
          authors: selectedPaper.authors,
          publishedAt: selectedPaper.publishedAt
        },
        analysis: {
          title: analysisResult.title,
          content: content
        }
      })

      if (response.data.success) {
        alert('成功推送到微信公众号！')
      } else {
        setAnalysisError(response.data.message || '推送失败')
      }
    } catch (err) {
      console.error('推送失败:', err)
      setAnalysisError(err.response?.data?.message || '推送到公众号失败，请检查配置')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid gap-6">
              {[1, 2, 3, 4, 5].map(i => (
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
            <div className="flex items-center justify-center space-x-3 mb-4">
              <h1 className="text-4xl font-bold text-gray-900">
                AI论文库
              </h1>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-purple-600 transition-colors"
                title="刷新论文"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              实时聚合arXiv和CCF-A顶会最新论文，深度理解前沿AI研究进展
            </p>
            <p className="text-sm text-gray-500 mt-2">
              当前共 {papers.length} 篇论文，其中 {papers.filter(p => p.trending).length} 篇热门
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索论文标题或作者..."
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

              {/* Conference Filter */}
              <select
                value={selectedConference}
                onChange={(e) => setSelectedConference(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {conferences.map(conference => (
                  <option key={conference.id} value={conference.id}>
                    {conference.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTrendingOnly}
                  onChange={(e) => setShowTrendingOnly(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1 text-red-500" />
                  只显示热门论文
                </span>
              </label>
              
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-pink-600 rounded focus:ring-pink-500"
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                  <Heart className="h-4 w-4 mr-1 text-pink-500 fill-current" />
                  只显示收藏 ({favorites.length})
                </span>
              </label>
              
              <span className="text-xs text-gray-500">
                ({filteredPapers.length} 篇论文)
              </span>
            </div>
          </div>
        </div>

        {/* Papers List */}
        <div className="space-y-6">
          {filteredPapers.map((paper) => (
            <div key={paper.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConferenceColor(paper.conference)}`}>
                        {paper.conference}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getCategoryIcon(paper.category)}
                        <span className="ml-1">{categories.find(c => c.id === paper.category)?.name}</span>
                      </span>
                      {paper.ccfRank && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          CCF-{paper.ccfRank}
                        </span>
                      )}
                      {paper.trending && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          热门
                        </span>
                      )}
                      {paper.hotScore && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          🔥 {paper.hotScore}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-purple-600 cursor-pointer">
                      {paper.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-3">
                      {paper.authors.join(', ')}
                    </p>
                    
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {paper.abstract}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {paper.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {paper.publishedAt}
                    </span>
                    <span className="flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      {paper.citations} 引用
                    </span>
                    <span className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {paper.views} 阅读
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleFavorite(paper.id)}
                      className={`flex items-center px-3 py-1 text-sm border rounded-lg transition-all ${
                        isFavorite(paper.id)
                          ? 'text-pink-600 border-pink-300 bg-pink-50 hover:bg-pink-100'
                          : 'text-gray-600 border-gray-300 hover:text-pink-600 hover:border-pink-300 hover:bg-pink-50'
                      }`}
                      title={isFavorite(paper.id) ? '取消收藏' : '收藏论文'}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${isFavorite(paper.id) ? 'fill-current' : ''}`} />
                      {isFavorite(paper.id) ? '已收藏' : '收藏'}
                    </button>
                    <button
                      onClick={() => handleAnalyze(paper)}
                      className="flex items-center px-3 py-1 text-sm text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      AI解读
                    </button>
                    {paper.pdfUrl && paper.pdfUrl !== '#' && (
                      <a 
                        href={paper.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-1 text-sm text-purple-600 hover:text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </a>
                    )}
                    {paper.codeUrl && paper.codeUrl !== '#' && (
                      <a 
                        href={paper.codeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-1 text-sm text-green-600 hover:text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <Code className="h-4 w-4 mr-1" />
                        代码
                      </a>
                    )}
                    {paper.arxivUrl && (
                      <a 
                        href={paper.arxivUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        详情
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPapers.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到相关论文</h3>
            <p className="text-gray-600">尝试调整搜索条件或筛选器</p>
          </div>
        )}
      </div>

      {/* AI解读模态框 */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-6 w-6" />
                <h2 className="text-2xl font-bold">AI论文解读</h2>
              </div>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Paper Info */}
            {selectedPaper && (
              <div className="bg-gray-50 p-4 border-b">
                <h3 className="font-semibold text-gray-900 mb-1">{selectedPaper.title}</h3>
                <p className="text-sm text-gray-600">
                  {selectedPaper.authors.join(', ')} · {selectedPaper.publishedAt}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {analysisResult && !analyzing && (
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">
                    <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-md">
                      <Brain className="h-4 w-4 mr-1" />
                      深度解读
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={handleStartEdit}
                          className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          编辑
                        </button>
                        <button
                          onClick={handleDownloadAnalysis}
                          className="flex items-center px-3 py-1.5 text-sm text-green-600 hover:text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          下载
                        </button>
                        <button
                          onClick={handlePublishToWechat}
                          disabled={publishing}
                          className="flex items-center px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {publishing ? (
                            <>
                              <Loader className="h-4 w-4 mr-1 animate-spin" />
                              推送中...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-1" />
                              推送公众号
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          取消
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={saving}
                          className="flex items-center px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? (
                            <>
                              <Loader className="h-4 w-4 mr-1 animate-spin" />
                              保存中...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              保存
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {analyzing && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader className="h-12 w-12 text-purple-600 animate-spin mb-4" />
                  <p className="text-gray-600 text-lg">AI正在解读论文...</p>
                  <p className="text-gray-400 text-sm mt-2">这可能需要 1-3 分钟，请耐心等待...</p>
                </div>
              )}

              {analysisError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  <p className="font-medium">解读失败</p>
                  <p className="text-sm mt-1">{analysisError}</p>
                </div>
              )}

              {analysisResult && !analyzing && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{analysisResult.title}</h3>
                  
                  {isEditing ? (
                    /* 编辑模式 */
                    <div>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full h-[600px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                        placeholder="在此编辑Markdown内容..."
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        💡 提示：使用Markdown格式编辑，支持标题、列表、代码块、表格等
                      </p>
                    </div>
                  ) : (
                    /* 预览模式 */
                  <div className="prose prose-lg max-w-none 
                    prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
                    prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-10 prose-h1:pb-4 prose-h1:border-b-2 prose-h1:border-purple-500 prose-h1:leading-tight
                    prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:text-purple-700 prose-h2:leading-tight
                    prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6 prose-h3:text-purple-600 prose-h3:leading-snug
                    prose-h4:text-xl prose-h4:mb-2 prose-h4:mt-4 prose-h4:text-gray-800
                    prose-p:text-gray-800 prose-p:leading-loose prose-p:mb-4 prose-p:text-[17px]
                    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-blue-700
                    prose-strong:text-gray-900 prose-strong:font-semibold
                    prose-em:text-gray-700 prose-em:italic
                    prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                    prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-5 prose-pre:rounded-xl prose-pre:overflow-x-auto prose-pre:shadow-lg prose-pre:my-6
                    prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:bg-purple-50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:my-6 prose-blockquote:italic prose-blockquote:text-gray-700
                    prose-ul:list-disc prose-ul:ml-6 prose-ul:mb-4 prose-ul:space-y-2
                    prose-ol:list-decimal prose-ol:ml-6 prose-ol:mb-4 prose-ol:space-y-2
                    prose-li:text-gray-800 prose-li:leading-relaxed prose-li:text-[17px]
                    prose-img:rounded-xl prose-img:shadow-xl prose-img:my-8 prose-img:mx-auto
                    prose-hr:border-gray-300 prose-hr:my-10
                    font-serif
                  " style={{fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'}}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        // 自定义图片渲染 - 添加错误处理和占位符
                        img: ({node, ...props}) => {
                          const [imgError, setImgError] = useState(false)
                          const [imgLoading, setImgLoading] = useState(true)
                          
                          return (
                            <div className="my-8">
                              {!imgError ? (
                                <div className="relative">
                                  {imgLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
                                      <Loader className="h-8 w-8 text-purple-600 animate-spin" />
                                    </div>
                                  )}
                                  <img 
                                    {...props} 
                                    className={`rounded-xl shadow-xl w-full transition-opacity duration-300 ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
                                    alt={props.alt || '配图'} 
                                    onLoad={() => setImgLoading(false)}
                                    onError={() => {
                                      setImgError(true)
                                      setImgLoading(false)
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 text-center border-2 border-dashed border-purple-300">
                                  <div className="text-4xl mb-3">🖼️</div>
                                  <p className="text-gray-600 font-medium">{props.alt || '插图'}</p>
                                  <p className="text-gray-400 text-sm mt-2">（配图加载失败）</p>
                                </div>
                              )}
                              {props.alt && props.alt !== '配图' && !imgError && (
                                <p className="text-center text-sm text-gray-500 mt-3 italic leading-normal">{props.alt}</p>
                              )}
                            </div>
                          )
                        },
                        // 自定义表格渲染 - 优化显示
                        table: ({node, children, ...props}) => (
                          <div className="my-8 overflow-x-auto rounded-xl shadow-lg border border-gray-200">
                            <table className="w-full border-collapse" {...props}>
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({node, children, ...props}) => (
                          <thead className="bg-gradient-to-r from-purple-100 to-blue-100" {...props}>
                            {children}
                          </thead>
                        ),
                        th: ({node, children, ...props}) => (
                          <th className="border border-gray-300 px-6 py-4 text-left font-bold text-gray-900 text-base" {...props}>
                            {children}
                          </th>
                        ),
                        td: ({node, children, ...props}) => (
                          <td className="border border-gray-300 px-6 py-4 text-gray-800 text-[17px] leading-relaxed" {...props}>
                            {children}
                          </td>
                        ),
                        tbody: ({node, children, ...props}) => (
                          <tbody className="bg-white" {...props}>
                            {children}
                          </tbody>
                        ),
                        // 自定义链接渲染
                        a: ({node, ...props}) => (
                          <a {...props} className="text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-2 font-medium transition-colors" target="_blank" rel="noopener noreferrer" />
                        ),
                        // 自定义代码块渲染
                        code: ({node, inline, className, children, ...props}) => {
                          const match = /language-(\w+)/.exec(className || '')
                          const language = match ? match[1] : ''
                          
                          return inline ? (
                            <code className="text-pink-600 bg-pink-50 px-2 py-1 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          ) : (
                            <div className="my-6 rounded-xl overflow-hidden shadow-lg">
                              {language && (
                                <div className="bg-gray-800 text-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-wider">
                                  {language}
                                </div>
                              )}
                              <pre className="bg-gray-900 text-gray-100 p-5 overflow-x-auto">
                                <code className="text-sm font-mono leading-relaxed" {...props}>{children}</code>
                              </pre>
                            </div>
                          )
                        },
                        // 自定义引用块渲染
                        blockquote: ({node, children, ...props}) => (
                          <blockquote className="border-l-4 border-purple-500 bg-purple-50 py-4 px-6 my-6 italic rounded-r-lg shadow-sm" {...props}>
                            <div className="text-gray-700 text-[17px] leading-loose">
                              {children}
                            </div>
                          </blockquote>
                        ),
                        // 自定义列表项
                        li: ({node, children, ...props}) => (
                          <li className="text-gray-800 leading-loose text-[17px] mb-2" {...props}>
                            {children}
                          </li>
                        )
                      }}
                    >
                      {analysisResult.content}
                    </ReactMarkdown>
                  </div>
                  )}
                  
                  <div className="mt-6 pt-4 border-t text-sm text-gray-500">
                    <p>
                      生成时间：{new Date(analysisResult.generatedAt).toLocaleString()} | 
                      模式：深度解读 |
                      由阿里云百炼提供支持
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Papers
