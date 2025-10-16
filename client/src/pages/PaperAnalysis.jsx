import { useState } from 'react'
import { FileText, Brain, Sparkles, Download, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import api from '../services/api'

const PaperAnalysis = () => {
  const [arxivId, setArxivId] = useState('')
  const [mode, setMode] = useState('summary')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const modes = [
    { value: 'summary', label: '快速摘要', icon: FileText, description: '800-1000字技术摘要' },
    { value: 'deep', label: '深度解读', icon: Brain, description: '1500-2000字专业分析' },
    { value: 'commentary', label: '观点评论', icon: Sparkles, description: '1000-1200字观点文章' }
  ]

  const handleAnalyze = async () => {
    if (!arxivId.trim()) {
      setError('请输入arXiv ID，例如: 2301.00234')
      return
    }

    setError('')
    setLoading(true)
    setResult(null)

    try {
      const response = await api.post('/paper-analysis/from-arxiv', {
        arxivId: arxivId.trim(),
        mode
      })

      if (response.data.success) {
        setResult(response.data.data)
      } else {
        setError(response.data.message || '解读失败')
      }
    } catch (err) {
      console.error('解读失败:', err)
      setError(err.response?.data?.message || '服务器错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result) return

    const content = `# ${result.title}\n\n` +
      `**生成时间**: ${new Date(result.generatedAt).toLocaleString()}\n` +
      `**原论文**: ${result.sourcePaper.title}\n` +
      `**作者**: ${result.sourcePaper.authors?.join(', ') || '未知'}\n` +
      `**链接**: ${result.sourcePaper.link}\n\n` +
      `---\n\n${result.content}`

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${arxivId}_${mode}_${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🤖 AI论文智能解读
          </h1>
          <p className="text-lg text-gray-600">
            基于阿里云百炼平台，一键生成高质量技术博客
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              arXiv ID
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={arxivId}
                onChange={(e) => setArxivId(e.target.value)}
                placeholder="例如: 2301.00234"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                onClick={handleAnalyze}
                disabled={loading || !arxivId.trim()}
                className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  loading || !arxivId.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    解读中...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    开始解读
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              生成模式
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {modes.map((m) => {
                const Icon = m.icon
                return (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    disabled={loading}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      mode === m.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-5 h-5 ${mode === m.value ? 'text-purple-600' : 'text-gray-400'}`} />
                      <span className="font-medium text-gray-900">{m.label}</span>
                    </div>
                    <p className="text-sm text-gray-500">{m.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Result Section */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">解读结果</h2>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                下载 Markdown
              </button>
            </div>

            {/* Source Paper Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">原论文信息</h3>
              <p className="text-gray-700 mb-1">
                <strong>标题：</strong>{result.sourcePaper.title}
              </p>
              {result.sourcePaper.authors && (
                <p className="text-gray-700 mb-1">
                  <strong>作者：</strong>{result.sourcePaper.authors.join(', ')}
                </p>
              )}
              {result.sourcePaper.link && (
                <p className="text-gray-700">
                  <strong>链接：</strong>
                  <a
                    href={result.sourcePaper.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-2"
                  >
                    查看原文
                  </a>
                </p>
              )}
            </div>

            {/* Generated Content */}
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown>{result.content}</ReactMarkdown>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
              <p>
                生成时间：{new Date(result.generatedAt).toLocaleString()} | 
                模式：{modes.find(m => m.value === result.mode)?.label} |
                由阿里云百炼提供支持
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaperAnalysis

