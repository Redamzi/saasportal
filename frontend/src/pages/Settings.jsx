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
    websiteUrl: '',
    // LLM Profile - Company Master Data
    companyDescription: '',
    companyIndustry: '',
    companyServices: '',
    companyUsp: '',
    valueProposition: '',
    problemSolution: '',
    successMetrics: '',
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
        websiteUrl: userProfile?.company_website || '',
        companyDescription: userProfile?.company_description || '',
        companyIndustry: userProfile?.company_industry || '',
        companyServices: userProfile?.company_services || '',
        companyUsp: userProfile?.company_usp || '',
        valueProposition: userProfile?.value_proposition || '',
        problemSolution: userProfile?.problem_solution || '',
        successMetrics: userProfile?.success_metrics || '',
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
      if (formData.websiteUrl) updates.company_website = formData.websiteUrl
      if (formData.companyDescription) updates.company_description = formData.companyDescription
      if (formData.companyIndustry) updates.company_industry = formData.companyIndustry
      if (formData.companyServices) updates.company_services = formData.companyServices
      if (formData.companyUsp) updates.company_usp = formData.companyUsp
      if (formData.valueProposition) updates.value_proposition = formData.valueProposition
      if (formData.problemSolution) updates.problem_solution = formData.problemSolution
      if (formData.successMetrics) updates.success_metrics = formData.successMetrics

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

                {/* Divider */}
                <div className="border-t border-white/10 my-6"></div>

                {/* LLM Profile - Company Master Data */}
                <h3 className="text-lg font-bold text-white mb-4">Firmendaten für Email-Generierung</h3>
                <p className="text-sm text-gray-400 mb-6">Diese Informationen werden von der AI verwendet, um personalisierte Emails zu erstellen.</p>

                {/* Auto-Fill from Website */}
                <div className="bg-voyanero-500/10 border border-voyanero-500/20 rounded-xl p-4 mb-6">
                  <h4 className="text-sm font-bold text-voyanero-400 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Automatisch ausfüllen
                  </h4>
                  <p className="text-xs text-gray-400 mb-3">Gib deine Website-URL ein und wir füllen die Felder automatisch aus.</p>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      name="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={handleChange}
                      className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-voyanero-500 outline-none"
                      placeholder="https://deine-website.de"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!formData.websiteUrl) {
                          return
                        }

                        setSaving(true)
                        setMessage({ type: '', text: '' })

                        try {
                          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/auto-fill`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              website_url: formData.websiteUrl
                            })
                          })

                          if (!response.ok) {
                            const error = await response.json()
                            throw new Error(error.detail || 'Fehler beim Analysieren der Website')
                          }

                          const data = await response.json()

                          // Auto-fill form fields
                          setFormData(prev => ({
                            ...prev,
                            companyDescription: data.company_description || prev.companyDescription,
                            companyIndustry: data.company_industry || prev.companyIndustry,
                            companyServices: data.company_services || prev.companyServices,
                            companyUsp: data.company_usp || prev.companyUsp,
                            valueProposition: data.value_proposition || prev.valueProposition,
                            problemSolution: data.problem_solution || prev.problemSolution,
                            successMetrics: data.success_metrics || prev.successMetrics,
                          }))

                          setMessage({
                            type: 'success',
                            text: '✅ Felder wurden automatisch ausgefüllt! Bitte überprüfen und anpassen.'
                          })
                        } catch (error) {
                          console.error('Auto-fill error:', error)
                          setMessage({
                            type: 'error',
                            text: error.message || 'Fehler beim Analysieren der Website. Bitte versuchen Sie es erneut.'
                          })
                        } finally {
                          setSaving(false)
                        }
                      }}
                      disabled={!formData.websiteUrl || saving}
                      className="px-6 py-2 bg-voyanero-500 hover:bg-voyanero-400 text-white rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {saving ? '⏳ Analysiere...' : '✨ Ausfüllen'}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-4 text-center">--- ODER manuell eingeben ---</p>

                {/* Company Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Was macht dein Unternehmen?
                  </label>
                  <textarea
                    name="companyDescription"
                    value={formData.companyDescription}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-voyanero-500 focus:border-transparent outline-none transition resize-none"
                    placeholder="z.B. Wir sind eine Full-Service Digitalagentur spezialisiert auf Webentwicklung und SEO..."
                  />
                </div>

                {/* Company Industry */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Branche
                  </label>
                  <input
                    type="text"
                    name="companyIndustry"
                    value={formData.companyIndustry}
                    onChange={handleChange}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-voyanero-500 focus:border-transparent outline-none transition"
                    placeholder="z.B. IT-Dienstleistungen, Marketing, Handwerk"
                  />
                </div>

                {/* Company Services */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deine Dienstleistungen / Produkte
                  </label>
                  <textarea
                    name="companyServices"
                    value={formData.companyServices}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-voyanero-500 focus:border-transparent outline-none transition resize-none"
                    placeholder="z.B. Webdesign, SEO-Optimierung, Social Media Marketing, Google Ads..."
                  />
                </div>

                {/* Company USP */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dein Alleinstellungsmerkmal (USP)
                  </label>
                  <textarea
                    name="companyUsp"
                    value={formData.companyUsp}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-voyanero-500 focus:border-transparent outline-none transition resize-none"
                    placeholder="z.B. 15 Jahre Erfahrung, 500+ zufriedene Kunden, garantierte Ergebnisse..."
                  />
                </div>

                {/* Value Proposition */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Wertversprechen
                  </label>
                  <textarea
                    name="valueProposition"
                    value={formData.valueProposition}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-voyanero-500 focus:border-transparent outline-none transition resize-none"
                    placeholder="z.B. Wir steigern Ihre Online-Sichtbarkeit und generieren messbare Leads..."
                  />
                </div>

                {/* Problem → Solution */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Problem → Lösung
                  </label>
                  <textarea
                    name="problemSolution"
                    value={formData.problemSolution}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-voyanero-500 focus:border-transparent outline-none transition resize-none"
                    placeholder="z.B. Viele Unternehmen haben keine Zeit für Marketing → Wir übernehmen das komplett..."
                  />
                </div>

                {/* Success Metrics */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Messbare Erfolge / Zahlen
                  </label>
                  <textarea
                    name="successMetrics"
                    value={formData.successMetrics}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-voyanero-500 focus:border-transparent outline-none transition resize-none"
                    placeholder="z.B. 30% mehr Leads, 50% bessere Conversion-Rate, durchschnittlich 10.000€ Umsatzsteigerung..."
                  />
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
