import { useState, useEffect } from 'react'
import { BookOpen, PlayCircle, FileText, Zap, Users } from 'lucide-react'
import Layout from '../components/Layout'
import { getCurrentUser } from '../lib/supabase'

export default function Academy({ onNavigate }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const { user: currentUser } = await getCurrentUser()
      if (!currentUser) {
        onNavigate('login')
        return
      }
      setUser(currentUser)
    } catch (error) {
      console.error('Error loading user:', error)
      onNavigate('login')
    } finally {
      setLoading(false)
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
    <Layout
      onNavigate={onNavigate}
      currentPage="academy"
      user={user}
      title="Voyanero Academy"
      subtitle="Lernen Sie alles über erfolgreiche Lead-Generierung"
    >
      <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
        {/* Hero Banner - Adjusted Colors & Mobile Sizing */}
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-gradient-to-br from-[#172554] via-[#1e1b4b] to-[#020408] text-white p-5 md:p-10 border border-blue-900/30 shadow-xl">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
          <div className="absolute top-0 right-0 w-40 md:w-64 h-40 md:h-64 bg-blue-500 opacity-10 rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-40 md:w-64 h-40 md:h-64 bg-indigo-500 opacity-10 rounded-full blur-[60px] -translate-x-1/3 translate-y-1/3"></div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-200 font-bold tracking-wider text-[10px] uppercase mb-4">
              <Zap className="w-3 h-3" /> Bald verfügbar
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 leading-tight">Meistern Sie die Kunst der Kaltakquise.</h2>
            <p className="text-blue-100/80 text-sm md:text-lg mb-6 md:mb-8 leading-relaxed max-w-lg">
              Wir arbeiten an umfassenden Lernmaterialien, Video-Tutorials und Best Practices für Ihre erfolgreiche Lead-Generierung mit Voyanero.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 p-3 md:p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                <span className="text-blue-950 font-bold text-sm md:text-base">✉️</span>
              </div>
              <p className="text-xs md:text-sm font-medium text-blue-50">Sie werden per Email benachrichtigt, sobald die Academy online geht.</p>
            </div>
          </div>
        </div>

        {/* Content Grid Placeholder */}
        <div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">Was Sie erwartet</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0F1A]/60 border border-gray-200 dark:border-white/5 hover:border-blue-500/50 transition-all group">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                <PlayCircle className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h4 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-1 md:mb-2">Video Tutorials</h4>
              <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mb-3 md:mb-4">Schritt-für-Schritt Anleitungen für Voyanero Features und Strategien.</p>
              <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">12 Videos</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0F1A]/60 border border-gray-200 dark:border-white/5 hover:border-blue-500/50 transition-all group">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h4 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-1 md:mb-2">Dokumentation</h4>
              <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mb-3 md:mb-4">Vollständige technische Dokumentation und API Referenzen.</p>
              <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">25 Artikel</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0F1A]/60 border border-gray-200 dark:border-white/5 hover:border-blue-500/50 transition-all group">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h4 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-1 md:mb-2">Best Practices</h4>
              <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mb-3 md:mb-4">Tipps für erfolgreiche Lead-Generierung und E-Mail Marketing.</p>
              <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">8 Guides</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0F1A]/60 border border-gray-200 dark:border-white/5 hover:border-blue-500/50 transition-all group">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h4 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-1 md:mb-2">Community</h4>
              <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mb-3 md:mb-4">Austausch mit anderen Nutzern und Experten.</p>
              <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Bald verfügbar</span>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 rounded-2xl bg-gray-100 dark:bg-[#0F1623] border border-gray-200 dark:border-white/5">
          <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-3 md:mb-4">Häufig gesucht</h3>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {['Erste Schritte', 'Campaign erstellen', 'Leads suchen', 'Email-Kampagnen', 'DSGVO-Compliance', 'Account Einstellungen'].map(tag => (
              <span key={tag} className="px-3 py-1.5 md:px-4 md:py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs md:text-sm text-gray-600 dark:text-gray-300 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
