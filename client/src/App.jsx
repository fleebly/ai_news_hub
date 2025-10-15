import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useEffect } from 'react'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import QuestionList from './pages/QuestionList'
import QuestionDetail from './pages/QuestionDetail'
import TestQuestion from './pages/TestQuestion'
import NewsDetail from './pages/NewsDetail'
import Papers from './pages/Papers'
import Blogs from './pages/Blogs'
import OpenSource from './pages/OpenSource'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/questions" 
            element={<QuestionList />} 
          />
          <Route 
            path="/questions/:id" 
            element={<QuestionDetail />} 
          />
          <Route 
            path="/test/:id" 
            element={<TestQuestion />} 
          />
          <Route 
            path="/news/:id" 
            element={<NewsDetail />} 
          />
          <Route 
            path="/papers" 
            element={<Papers />} 
          />
          <Route 
            path="/blogs" 
            element={<Blogs />} 
          />
          <Route 
            path="/opensource" 
            element={<OpenSource />} 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leaderboard" 
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
    </ErrorBoundary>
  )
}

export default App

