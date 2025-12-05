import React, { useState, useEffect } from 'react'
import './App.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'
import CampaignDetail from './pages/CampaignDetail'
import Credits from './pages/Credits'
import Settings from './pages/Settings'
import Contacts from './pages/Contacts'
import HistoryPage from './pages/History'
import { getCurrentUser } from './lib/supabase'
import { Toaster } from 'react-hot-toast'

function App() {
  const [currentPage, setCurrentPage] = useState('loading')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pageData, setPageData] = useState(null) // For passing data like campaignId

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { user, profile } = await getCurrentUser()

      // Check if current path is a PUBLIC legal page (accessible without auth)
      // AV-Vertrag is NOT public anymore
      const path = window.location.pathname
      const isPublicLegalPage = ['/impressum', '/agb', '/datenschutz'].includes(path)

      if (user) {
        setIsAuthenticated(true)

        // Gatekeeper: Check AVV Signature
        // Only enforce if we have profile data and it's not signed
        const isAvvSigned = profile?.is_avv_signed

        if (!isAvvSigned && path !== '/avv' && path !== '/av-vertrag' && path !== '/login' && path !== '/' && !isPublicLegalPage) {
          // Redirect to AVV page if not signed and trying to access protected route
          window.location.href = '/avv'
          return
        }

        // Handle deep links
        if (path === '/campaigns') setCurrentPage('campaigns')
        else if (path.startsWith('/campaigns/')) {
          const campaignId = path.split('/campaigns/')[1]
          if (campaignId) {
            setCurrentPage('campaignDetail')
            setPageData({ campaignId })
          } else {
            setCurrentPage('campaigns')
          }
        }
        else if (path === '/contacts') setCurrentPage('contacts')
        else if (path === '/credits') setCurrentPage('credits')
        else if (path === '/settings') setCurrentPage('settings')
        else if (path === '/academy') setCurrentPage('academy')
        else if (path === '/history') setCurrentPage('history')
        else if (path === '/impressum') setCurrentPage('impressum')
        else if (path === '/agb') setCurrentPage('agb')
        else if (path === '/datenschutz') setCurrentPage('datenschutz')
        else if (path === '/av-vertrag' || path === '/avv') setCurrentPage('av-vertrag')
        else setCurrentPage('dashboard')
      } else {
        // User not authenticated
        setIsAuthenticated(false)

        // Allow access to PUBLIC legal pages without authentication
        if (isPublicLegalPage) {
          if (path === '/impressum') setCurrentPage('impressum')
          else if (path === '/agb') setCurrentPage('agb')
          else if (path === '/datenschutz') setCurrentPage('datenschutz')
        } else {
          setCurrentPage('login')
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthenticated(false)

      // Still allow PUBLIC legal pages on error
      const path = window.location.pathname
      const isPublicLegalPage = ['/impressum', '/agb', '/datenschutz'].includes(path)

      if (isPublicLegalPage) {
        if (path === '/impressum') setCurrentPage('impressum')
        else if (path === '/agb') setCurrentPage('agb')
        else if (path === '/datenschutz') setCurrentPage('datenschutz')
      } else {
        setCurrentPage('login')
      }
    }
  }

  // Simple client-side routing based on currentPage state
  useEffect(() => {
    if (currentPage === 'loading') return

    // Update URL without reload
    let path = '/login'
    if (currentPage === 'dashboard') path = '/dashboard'
    else if (currentPage === 'campaigns') path = '/campaigns'
    else if (currentPage === 'campaignDetail' && pageData?.campaignId) path = `/campaigns/${pageData.campaignId}`
    else if (currentPage === 'contacts') path = '/contacts'
    else if (currentPage === 'credits') path = '/credits'
    else if (currentPage === 'settings') path = '/settings'
    else if (currentPage === 'academy') path = '/academy'
    else if (currentPage === 'history') path = '/history'
    else if (currentPage === 'impressum') path = '/impressum'
    else if (currentPage === 'agb') path = '/agb'
    else if (currentPage === 'datenschutz') path = '/datenschutz'
    else if (currentPage === 'av-vertrag') path = '/av-vertrag'

    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
  }, [currentPage])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      const isPublicLegalPage = ['/impressum', '/agb', '/datenschutz'].includes(path)

      if (isAuthenticated) {
        if (path === '/dashboard') setCurrentPage('dashboard')
        else if (path === '/campaigns') setCurrentPage('campaigns')
        else if (path.startsWith('/campaigns/')) {
          const campaignId = path.split('/campaigns/')[1]
          if (campaignId) {
            setCurrentPage('campaignDetail')
            setPageData({ campaignId })
          } else {
            setCurrentPage('campaigns')
          }
        }
        else if (path === '/contacts') setCurrentPage('contacts')
        else if (path === '/credits') setCurrentPage('credits')
        else if (path === '/settings') setCurrentPage('settings')
        else if (path === '/academy') setCurrentPage('academy')
        else if (path === '/history') setCurrentPage('history')
        else if (path === '/impressum') setCurrentPage('impressum')
        else if (path === '/agb') setCurrentPage('agb')
        else if (path === '/datenschutz') setCurrentPage('datenschutz')
        else if (path === '/av-vertrag' || path === '/avv') setCurrentPage('av-vertrag')
        else setCurrentPage('dashboard')
      } else {
        // Not authenticated - allow ONLY PUBLIC legal pages
        if (isPublicLegalPage) {
          if (path === '/impressum') setCurrentPage('impressum')
          else if (path === '/agb') setCurrentPage('agb')
          else if (path === '/datenschutz') setCurrentPage('datenschutz')
        } else if (path === '/login' || path === '/') {
          setCurrentPage('login')
        } else {
          setCurrentPage('login')
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isAuthenticated])

  // Navigation handler
  const handleNavigate = (page, data = null) => {
    setCurrentPage(page)
    setPageData(data)
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

  if (currentPage === 'contacts' && isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <Contacts onNavigate={handleNavigate} />
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

  if (currentPage === 'academy' && isAuthenticated) {
    const Academy = React.lazy(() => import('./pages/Academy'))
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <Academy onNavigate={handleNavigate} />
      </React.Suspense>
    )
  }

  if (currentPage === 'campaignDetail' && isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <CampaignDetail onNavigate={handleNavigate} campaignId={pageData?.campaignId} />
      </>
    )
  }

  if (currentPage === 'history' && isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <HistoryPage onNavigate={handleNavigate} />
      </>
    )
  }

  // Public Legal Pages (accessible without authentication)
  if (currentPage === 'impressum') {
    const Impressum = React.lazy(() => import('./pages/legal/Impressum'))
    return (
      <>
        <Toaster position="top-right" />
        <React.Suspense fallback={<div>Loading...</div>}>
          <Impressum onNavigate={handleNavigate} />
        </React.Suspense>
      </>
    )
  }

  if (currentPage === 'agb') {
    const AGB = React.lazy(() => import('./pages/legal/AGB'))
    return (
      <>
        <Toaster position="top-right" />
        <React.Suspense fallback={<div>Loading...</div>}>
          <AGB onNavigate={handleNavigate} />
        </React.Suspense>
      </>
    )
  }

  if (currentPage === 'datenschutz') {
    const Datenschutz = React.lazy(() => import('./pages/legal/Datenschutz'))
    return (
      <>
        <Toaster position="top-right" />
        <React.Suspense fallback={<div>Loading...</div>}>
          <Datenschutz onNavigate={handleNavigate} />
        </React.Suspense>
      </>
    )
  }

  // AV-Vertrag (Protected - requires authentication)
  if (currentPage === 'av-vertrag' && isAuthenticated) {
    const AVVertrag = React.lazy(() => import('./pages/legal/AVVertrag'))
    return (
      <>
        <Toaster position="top-right" />
        <React.Suspense fallback={<div>Loading...</div>}>
          <AVVertrag onNavigate={handleNavigate} />
        </React.Suspense>
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
