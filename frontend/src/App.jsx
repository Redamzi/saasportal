import { useState, useEffect } from 'react'
import './App.css'
import Layout from './components/Layout'
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
        } else if (path === '/terms') {
          setCurrentPage('terms')
        } else if (path === '/privacy') {
          setCurrentPage('privacy')
        } else if (path === '/support') {
          setCurrentPage('support')
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
        case 'terms':
          path = '/terms'
          break
        case 'privacy':
          path = '/privacy'
          break
        case 'support':
          path = '/support'
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
          case '/terms':
            setCurrentPage('terms')
            break
          case '/privacy':
            setCurrentPage('privacy')
            break
          case '/support':
            setCurrentPage('support')
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
    let pageContent
    switch (currentPage) {
      case 'dashboard':
        pageContent = <Dashboard onNavigate={navigate} />
        break
      case 'campaigns':
        pageContent = <Campaigns onNavigate={navigate} />
        break
      case 'campaignDetail':
        pageContent = <CampaignDetail campaignId={campaignId} onNavigate={navigate} />
        break
      case 'credits':
        pageContent = <Credits onNavigate={navigate} />
        break
      case 'settings':
        pageContent = <Settings onNavigate={navigate} />
        break
      case 'terms':
        pageContent = <div className="container mx-auto px-4 py-8 prose max-w-4xl">
          <h1>Allgemeine Geschäftsbedingungen (AGB)</h1>
          <p>Coming soon...</p>
        </div>
        break
      case 'privacy':
        pageContent = <div className="container mx-auto px-4 py-8 prose max-w-4xl">
          <h1>Datenschutzerklärung</h1>
          <p>Coming soon...</p>
        </div>
        break
      case 'support':
        pageContent = <div className="container mx-auto px-4 py-8 prose max-w-4xl">
          <h1>Support & Hilfe</h1>
          <p>Coming soon...</p>
        </div>
        break
      default:
        pageContent = <Dashboard onNavigate={navigate} />
    }

    return (
      <Layout onNavigate={navigate} currentPage={currentPage}>
        {pageContent}
      </Layout>
    )
  }

  // Fallback
  return <Login />
}

export default App
