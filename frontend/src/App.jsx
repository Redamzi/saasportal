import { useState, useEffect } from 'react'
import './App.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'
import CampaignDetail from './pages/CampaignDetail'
import Credits from './pages/Credits'
import Settings from './pages/Settings'
import { getCurrentUser } from './lib/supabase'

function App() {
  const [currentPage, setCurrentPage] = useState('loading')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [campaignId, setCampaignId] = useState(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { user } = await getCurrentUser()

      if (user) {
        setIsAuthenticated(true)
        // Check current path and set page accordingly
        const path = window.location.pathname
        if (path === '/login' || path === '/') {
          setCurrentPage('dashboard')
        } else if (path === '/campaigns') {
          setCurrentPage('campaigns')
        } else if (path.startsWith('/campaigns/')) {
          const id = path.split('/campaigns/')[1]
          setCampaignId(id)
          setCurrentPage('campaignDetail')
        } else if (path === '/credits') {
          setCurrentPage('credits')
        } else if (path === '/settings') {
          setCurrentPage('settings')
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

  // Navigation handler
  const navigate = (page, params = {}) => {
    if (page === 'campaignDetail' && params.campaignId) {
      setCampaignId(params.campaignId)
    }
    setCurrentPage(page)
  }

  // Update URL when page changes
  useEffect(() => {
    // Don't update URL while still checking authentication
    if (currentPage === 'loading') return

    let path = '/login'

    if (isAuthenticated) {
      switch (currentPage) {
        case 'dashboard':
          path = '/dashboard'
          break
        case 'campaigns':
          path = '/campaigns'
          break
        case 'campaignDetail':
          path = `/campaigns/${campaignId}`
          break
        case 'credits':
          path = '/credits'
          break
        case 'settings':
          path = '/settings'
          break
        default:
          path = '/dashboard'
      }
    }

    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
  }, [currentPage, isAuthenticated])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname

      if (!isAuthenticated) {
        setCurrentPage('login')
        return
      }

      if (path.startsWith('/campaigns/')) {
        const id = path.split('/campaigns/')[1]
        setCampaignId(id)
        setCurrentPage('campaignDetail')
      } else {
        switch (path) {
          case '/dashboard':
            setCurrentPage('dashboard')
            break
          case '/campaigns':
            setCurrentPage('campaigns')
            break
          case '/credits':
            setCurrentPage('credits')
            break
          case '/settings':
            setCurrentPage('settings')
            break
          case '/login':
          case '/':
            setCurrentPage('dashboard')
            break
          default:
            setCurrentPage('dashboard')
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isAuthenticated])

  if (currentPage === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Voyanero...</p>
        </div>
      </div>
    )
  }

  if (currentPage === 'login') {
    return <Login />
  }

  if (isAuthenticated) {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={navigate} />
      case 'campaigns':
        return <Campaigns onNavigate={navigate} />
      case 'campaignDetail':
        return <CampaignDetail campaignId={campaignId} onNavigate={navigate} />
      case 'credits':
        return <Credits onNavigate={navigate} />
      case 'settings':
        return <Settings onNavigate={navigate} />
      default:
        return <Dashboard onNavigate={navigate} />
    }
  }

  // Fallback
  return <Login />
}

export default App
