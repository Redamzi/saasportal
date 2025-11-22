import { useState, useEffect } from 'react'
import { getCurrentUser, getUserProfile } from '../lib/supabase'

function Settings({ onNavigate }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    subdomain: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { user: currentUser, profile: userProfile } = await getCurrentUser()
      if (!currentUser) {
        onNavigate('login')
        return
      }
      setUser(currentUser)
      setProfile(userProfile)

      // Set form data
      setFormData({
        fullName: userProfile?.full_name || '',
        companyName: userProfile?.company_name || '',
        subdomain: userProfile?.subdomain || '',
      })
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const { signOut } = await import('../lib/supabase')
    await signOut()
    onNavigate('login')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      // Update profile via Supabase
      const { updateUserProfile } = await import('../lib/supabase')

      const updates = {}
      if (formData.fullName) updates.full_name = formData.fullName
      if (formData.companyName) updates.company_name = formData.companyName

      const { data, error } = await updateUserProfile(user.id, updates)

      if (error) throw error

      // Update local profile state
      setProfile(data)

      setMessage({
        type: 'success',
        text: 'Settings updated successfully!',
      })
    } catch (error) {
      console.error('Settings update error:', error)
      setMessage({
        type: 'error',
        text: 'Failed to update settings. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Voyanero</h1>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Settings
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-left">Account Settings</h2>
          <p className="text-gray-600 text-left">Manage your account preferences and profile information</p>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 text-left">Account Information</h3>
            <p className="text-sm text-gray-600 mt-1 text-left">View your account details</p>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 text-left">Email Address</dt>
                <dd className="mt-1 text-sm text-gray-900 text-left">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 text-left">Account Created</dt>
                <dd className="mt-1 text-sm text-gray-900 text-left">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : 'Unknown'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 text-left">Email Verification</dt>
                <dd className="mt-1">
                  {user?.email_confirmed_at ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Not Verified
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Profile Settings Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 text-left">Profile Settings</h3>
            <p className="text-sm text-gray-600 mt-1 text-left">Update your profile information</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your company name"
              />
            </div>

            <div>
              <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Email Sending Domain
                <span className="ml-2 text-xs text-gray-500" title="Auto-generated domain for Amazon SES email reputation isolation">
                  ⓘ Auto-generated
                </span>
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="subdomain"
                  name="subdomain"
                  value={formData.subdomain || 'Not configured'}
                  readOnly
                  disabled
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  placeholder="Not configured"
                />
                <span className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-100 text-gray-500 text-sm">
                  .mail.voyanero.com
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Your dedicated email sending domain for reputation management
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Password Section */}
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 text-left">Password</h3>
            <p className="text-sm text-gray-600 mt-1 text-left">Change your account password</p>
          </div>
          <div className="p-6">
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition">
              Change Password
            </button>
            <p className="text-sm text-gray-500 mt-2 text-left">
              You will receive an email with instructions to reset your password
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-6 bg-white rounded-lg shadow border border-red-200">
          <div className="p-6 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-900 text-left">Danger Zone</h3>
            <p className="text-sm text-red-600 mt-1 text-left">Irreversible actions</p>
          </div>
          <div className="p-6">
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition">
              Delete Account
            </button>
            <p className="text-sm text-gray-500 mt-2 text-left">
              Once you delete your account, there is no going back. Please be certain.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Settings
