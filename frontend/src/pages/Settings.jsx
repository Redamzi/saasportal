import { useState, useEffect } from 'react'
import { User, Building2, Mail, Lock, Bell, Globe } from 'lucide-react'
import { getCurrentUser, getUserProfile } from '../lib/supabase'
import Layout from '../components/Layout'

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { updateUserProfile } = await import('../lib/supabase')

      const updates = {}
      if (formData.fullName) updates.full_name = formData.fullName
      if (formData.companyName) updates.company_name = formData.companyName

      const { data, error } = await updateUserProfile(user.id, updates)

      if (error) throw error

      setProfile(data)

      setMessage({
        type: 'success',
        text: 'Einstellungen erfolgreich aktualisiert!',
      })
    } catch (error) {
      console.error('Settings update error:', error)
      setMessage({
        type: 'error',
        text: 'Fehler beim Aktualisieren. Bitte versuchen Sie es erneut.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-voyanero-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-voyanero-500"></div>
      </div>
    )
  }

  return (
    <Layout onNavigate={onNavigate} currentPage="settings" user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Einstellungen</h1>
          <p className="text-gray-400 text-lg">Verwalten Sie Ihr Konto und Ihre Präferenzen</p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`p-4 rounded-xl border ${message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-voyanero-500" />
                Profil Informationen
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Vollständiger Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-voyanero-500 focus:border-transparent outline-none transition"
                    placeholder="Max Mustermann"
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Firmenname
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-voyanero-500 focus:border-transparent outline-none transition"
                    placeholder="Meine Firma GmbH"
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    E-Mail Adresse
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-black/30 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">E-Mail kann nicht geändert werden</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-voyanero-500 hover:bg-voyanero-400 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-voyanero-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Speichern...' : 'Änderungen speichern'}
                </button>
              </form>
            </div>

            {/* Security Section */}
            <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl mt-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Lock className="w-6 h-6 text-voyanero-500" />
                Sicherheit
              </h2>

              <div className="space-y-4">
                <button className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/10">
                  <p className="font-medium text-white">Passwort ändern</p>
                  <p className="text-sm text-gray-400 mt-1">Aktualisieren Sie Ihr Passwort</p>
                </button>

                <button className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/10">
                  <p className="font-medium text-white">Zwei-Faktor-Authentifizierung</p>
                  <p className="text-sm text-gray-400 mt-1">Zusätzliche Sicherheitsebene aktivieren</p>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-voyanero-500" />
                Konto Details
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <dt className="text-gray-500">Plan</dt>
                  <dd className="text-white font-medium">Pro</dd>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <dt className="text-gray-500">Mitglied seit</dt>
                  <dd className="text-white font-medium">
                    {new Date(user?.created_at).toLocaleDateString('de-DE')}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Status</dt>
                  <dd className="text-emerald-400 font-medium">Aktiv</dd>
                </div>
              </dl>
            </div>

            {/* Notifications */}
            <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-voyanero-500" />
                Benachrichtigungen
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300">E-Mail Benachrichtigungen</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-voyanero-500" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300">Marketing E-Mails</span>
                  <input type="checkbox" className="w-4 h-4 rounded accent-voyanero-500" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300">Wöchentliche Berichte</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-voyanero-500" />
                </label>
              </div>
            </div>

            {/* Language */}
            <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-voyanero-500" />
                Sprache & Region
              </h3>
              <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-voyanero-500 outline-none">
                <option>Deutsch</option>
                <option>English</option>
                <option>Français</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Settings
