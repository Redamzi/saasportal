import { useState, useEffect } from 'react'
import { getCurrentUser, signOut, getUserProfile } from '../lib/supabase'
import DarkModeToggle from '../components/DarkModeToggle'

function Dashboard() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const { user: currentUser, profile: userProfile } = await getCurrentUser()

      if (!currentUser) {
        window.location.href = '/login'
        return
      }

      setUser(currentUser)
      setProfile(userProfile)
    } catch (error) {
      console.error('Error loading user:', error)
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Voyanero</h1>
              <span className="ml-4 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                Dashboard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DarkModeToggle />
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Here's an overview of your Voyanero account
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Credits Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Credits Balance
              </h3>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-300"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {profile?.credits_balance || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Available credits</p>
          </div>

          {/* Total Leads */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Leads</h3>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-300"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Captured leads</p>
          </div>

          {/* Company */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</h3>
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <svg
                  className="w-5 h-5 text-purple-600 dark:text-purple-300"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {profile?.company_name || 'Not set'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Your organization</p>
          </div>
        </div>

        {/* Profile Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Profile Information
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">
                {profile?.full_name || 'Not provided'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Company Name</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">
                {profile?.company_name || 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Subdomain</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">
                {profile?.subdomain || 'Not configured'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Account Created
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Email Verified
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">
                {user?.email_confirmed_at ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">✓ Verified</span>
                ) : (
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                    ⚠ Not verified
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition text-left">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Add Credits</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Purchase more credits for lead generation
            </p>
          </button>
          <button className="p-4 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition text-left">
            <h4 className="font-semibold text-green-900 dark:text-green-300 mb-1">Capture Leads</h4>
            <p className="text-sm text-green-700 dark:text-green-400">
              Start capturing and managing leads
            </p>
          </button>
          <button className="p-4 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition text-left">
            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-1">
              Settings
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-400">
              Configure your account preferences
            </p>
          </button>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
