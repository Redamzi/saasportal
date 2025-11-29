import { useState, useEffect } from 'react'
import './App.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'
import Credits from './pages/Credits'
import Settings from './pages/Settings'
import { getCurrentUser } from './lib/supabase'
import { Toaster } from 'react-hot-toast'

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
        // Handle deep links
        const path = window.location.pathname
        if (path === '/campaigns') setCurrentPage('campaigns')
        else if (path === '/credits') setCurrentPage('credits')
        else if (path === '/settings') setCurrentPage('settings')
        else setCurrentPage('dashboard')
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
    let path = '/login'
    if (currentPage === 'dashboard') path = '/dashboard'
    else if (currentPage === 'campaigns') path = '/campaigns'
    else if (currentPage === 'credits') path = '/credits'
    else if (currentPage === 'settings') path = '/settings'

    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
  }, [currentPage])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (isAuthenticated) {
        if (path === '/dashboard') setCurrentPage('dashboard')
        else if (path === '/campaigns') setCurrentPage('campaigns')
        else if (path === '/credits') setCurrentPage('credits')
        else if (path === '/settings') setCurrentPage('settings')
        else setCurrentPage('dashboard')
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
    return (
      <>
        <Toaster position="top-right" />
        <Login />
      </>
    )
  }

  if (currentPage === 'dashboard' && isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <Dashboard onNavigate={handleNavigate} />
      </>
    )
  }

  if (currentPage === 'campaigns' && isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <Campaigns onNavigate={handleNavigate} />
      </>
    )
  }

  if (currentPage === 'credits' && isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <Credits onNavigate={handleNavigate} />
      </>
    )
  }

  if (currentPage === 'settings' && isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <Settings onNavigate={handleNavigate} />
      </>
    )
  }

  // Fallback
  return (
    <>
      <Toaster position="top-right" />
      <Login />
    </>
  )
}

export default App
