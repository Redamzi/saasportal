import { useState, useEffect } from 'react'
import './App.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { getCurrentUser } from './lib/supabase'

function App() {
  const [currentPage, setCurrentPage] = useState('loading')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { user } = await getCurrentUser()

      if (user) {
        setIsAuthenticated(true)
        // If on login page and authenticated, go to dashboard
        if (window.location.pathname === '/login' || window.location.pathname === '/') {
          setCurrentPage('dashboard')
        } else {
          setCurrentPage('dashboard')
        }
      } else {
        setIsAuthenticated(false)
        setCurrentPage('login')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthenticated(false)
      setCurrentPage('login')
    }
  }

  // Simple client-side routing based on currentPage state
  useEffect(() => {
    // Update URL without reload
    const path = currentPage === 'dashboard' ? '/dashboard' : '/login'
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
  }, [currentPage])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path === '/dashboard' && isAuthenticated) {
        setCurrentPage('dashboard')
      } else if (path === '/login' || path === '/') {
        setCurrentPage('login')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isAuthenticated])

  // Navigation handler
  const handleNavigate = (page) => {
    setCurrentPage(page)
  }

  if (currentPage === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading Voyanero...</p>
        </div>
      </div>
    )
  }

  if (currentPage === 'login') {
    return <Login />
  }

  if (currentPage === 'dashboard' && isAuthenticated) {
    return <Dashboard onNavigate={handleNavigate} />
  }

  // Fallback
  return <Login />
}

export default App
