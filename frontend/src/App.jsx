import React, { useState, useEffect } from 'react'
import './App.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'
import CampaignDetail from './pages/CampaignDetail'
import Credits from './pages/Credits'
import Settings from './pages/Settings'
import Contacts from './pages/Contacts'
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

      if (user) {
        setIsAuthenticated(true)

        // Gatekeeper: Check AVV Signature
        // Only enforce if we have profile data and it's not signed
        const isAvvSigned = profile?.is_avv_signed
        const path = window.location.pathname

        if (!isAvvSigned && path !== '/avv' && path !== '/login' && path !== '/') {
          // Redirect to AVV page if not signed and trying to access protected route
          window.location.href = '/avv'
          return
        }

        // Handle deep links
        if (path === '/campaigns') setCurrentPage('campaigns')
        else if (path === '/contacts') setCurrentPage('contacts')
        else if (path === '/credits') setCurrentPage('credits')
        else if (path === '/settings') setCurrentPage('settings')
        else if (path === '/academy') setCurrentPage('academy')
        else if (path === '/impressum') setCurrentPage('impressum')
        else if (path === '/agb') setCurrentPage('agb')
        else if (path === '/datenschutz') setCurrentPage('datenschutz')
        else if (path === '/av-vertrag' || path === '/avv') setCurrentPage('av-vertrag')
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
    else if (currentPage === 'contacts') path = '/contacts'
    else if (currentPage === 'credits') path = '/credits'
    else if (currentPage === 'settings') path = '/settings'
    else if (currentPage === 'academy') path = '/academy'
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
      if (isAuthenticated) {
        if (path === '/dashboard') setCurrentPage('dashboard')
        else if (path === '/campaigns') setCurrentPage('campaigns')
        else if (path === '/contacts') setCurrentPage('contacts')
        else if (path === '/credits') setCurrentPage('credits')
        else if (path === '/settings') setCurrentPage('settings')
        else if (path === '/academy') setCurrentPage('academy')
        else if (path === '/impressum') setCurrentPage('impressum')
        else if (path === '/agb') setCurrentPage('agb')
        else if (path === '/datenschutz') setCurrentPage('datenschutz')
        else if (path === '/av-vertrag' || path === '/avv') setCurrentPage('av-vertrag')
        else setCurrentPage('dashboard')
      } else if (path === '/login' || path === '/') {
        setCurrentPage('login')
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

  // Legal Pages
  if (currentPage === 'impressum') {
    const Impressum = React.lazy(() => import('./pages/legal/Impressum'))
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <Impressum onNavigate={handleNavigate} />
      </React.Suspense>
    )
  }

  if (currentPage === 'agb') {
    const AGB = React.lazy(() => import('./pages/legal/AGB'))
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <AGB onNavigate={handleNavigate} />
      </React.Suspense>
    )
  }

  if (currentPage === 'datenschutz') {
    const Datenschutz = React.lazy(() => import('./pages/legal/Datenschutz'))
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <Datenschutz onNavigate={handleNavigate} />
      </React.Suspense>
    )
  }

  if (currentPage === 'av-vertrag') {
    const AVVertrag = React.lazy(() => import('./pages/legal/AVVertrag'))
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <AVVertrag onNavigate={handleNavigate} />
      </React.Suspense>
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
