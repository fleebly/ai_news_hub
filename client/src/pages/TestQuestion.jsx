import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

const TestQuestion = () => {
  const { id } = useParams()
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        console.log('开始获取题目，ID:', id)
        setLoading(true)
        const response = await api.get(`/questions/${id}`)
        console.log('API响应:', response)
        console.log('响应数据:', response.data)
        
        if (response.data) {
          setQuestion(response.data)
          setError(null)
        } else {
          setError('题目数据为空')
        }
      } catch (err) {
        console.error('获取题目失败:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchQuestion()
    }
  }, [id])

  if (loading) {
    return <div>加载中...</div>
  }

  if (error) {
    return <div>错误: {error}</div>
  }

  if (!question) {
    return <div>题目不存在</div>
  }

  return (
    <div>
      <h1>测试题目页面</h1>
      <h2>{question.title}</h2>
      <p>{question.description}</p>
      <pre>{question.starterCode}</pre>
    </div>
  )
}

export default TestQuestion
