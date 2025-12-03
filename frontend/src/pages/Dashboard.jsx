import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  DollarSign, Users, FolderKanban, CreditCard,
  UserPlus, Settings, CheckCircle2, ArrowRight, TrendingUp, BookOpen, Plus, Database, Download, Activity, Zap, Coins
} from "lucide-react"
import { getCurrentUser } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// Mock Data for Charts
const chartData1 = [
  { value: 30 }, { value: 40 }, { value: 35 }, { value: 50 }, { value: 45 }, { value: 60 }, { value: 75 }
]
const chartData2 = [
  { value: 20 }, { value: 25 }, { value: 40 }, { value: 30 }, { value: 45 }, { value: 35 }, { value: 55 }
]
const chartData3 = [
  { value: 85 }, { value: 88 }, { value: 82 }, { value: 90 }, { value: 92 }, { value: 88 }, { value: 95 }
]

const StatsCard = ({ title, value, subtext, data, color, icon: Icon, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300 h-48 flex flex-col justify-between ${onClick ? 'cursor-pointer hover:bg-white/5' : ''}`}
  >
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</h3>
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <p className="text-xs text-gray-500 mt-1">{subtext}</p>
      </div>
      <div className={`p-3 rounded-2xl ${color.bg} ${color.text} border border-white/5`}>
        <Icon size={20} />
      </div>
    </div>

    {/* Chart Background */}
    <div className="absolute bottom-0 left-0 right-0 h-24 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none flex items-end">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color.hex} stopOpacity={0.8} />
              <stop offset="95%" stopColor={color.hex} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color.hex}
            fill={`url(#gradient-${title})`}
            strokeWidth={2}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
)

const QuickAction = ({ title, subtitle, icon: Icon, onClick, color }) => (
  <button
    onClick={onClick}
    className="group relative bg-[#0B1121]/40 hover:bg-[#0B1121]/60 border border-white/5 rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-voyanero-500/10 flex flex-col justify-between h-full"
  >
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <h4 className="text-white font-bold text-sm">{title}</h4>
      <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
    </div>
  </button>
)

const LiveFeedItem = ({ title, time, type }) => {
  let dotColor = 'bg-gray-500'
  if (type === 'success') dotColor = 'bg-emerald-500'
  if (type === 'info') dotColor = 'bg-blue-500'
  if (type === 'warning') dotColor = 'bg-amber-500'

  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0 group hover:bg-white/5 px-2 rounded-lg transition-colors">
      <div className={`w-2 h-2 rounded-full ${dotColor} shadow-[0_0_8px] shadow-${dotColor}/50`}></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 truncate group-hover:text-white transition-colors">{title}</p>
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{time}</span>
    </div>
  )
}

export default function Dashboard({ onNavigate }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ credits: 0, totalLeads: 0, totalCampaigns: 0 })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { user: currentUser } = await getCurrentUser()
      if (!currentUser) {
        onNavigate('login')
        return
      }
      setUser(currentUser)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      setProfile(profileData)

      // Fetch leads count
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)

      // Fetch campaigns count
      const { count: campaignsCount } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)

      setStats({
        credits: profileData?.credits_balance || 0,
        totalLeads: leadsCount || 0,
        totalCampaigns: campaignsCount || 0
      })

      // Fetch recent activity (leads and campaigns)
      const { data: recentLeads } = await supabase
        .from('leads')
        .select('company_name, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: recentCampaigns } = await supabase
        .from('campaigns')
        .select('name, created_at, status')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Combine and sort activities
      const activities = [
        ...(recentLeads?.map(l => ({
          type: 'lead',
          title: `Neuer Lead: ${l.company_name}`,
          time: new Date(l.created_at),
          status: 'info'
        })) || []),
        ...(recentCampaigns?.map(c => ({
          type: 'campaign',
          title: `Kampagne "${c.name}" ${c.status === 'completed' ? 'abgeschlossen' : 'gestartet'}`,
          time: new Date(c.created_at),
          status: c.status === 'completed' ? 'success' : 'warning'
        })) || [])
      ].sort((a, b) => b.time - a.time).slice(0, 5)

      setRecentActivity(activities)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      if (!leads || leads.length === 0) {
        alert('Keine Leads zum Exportieren gefunden.')
        return
      }

      // Convert to CSV
      const headers = Object.keys(leads[0]).join(',')
      const csv = [
        headers,
        ...leads.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n')

      // Download
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Fehler beim Exportieren der Daten.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-voyanero-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-voyanero-500"></div>
      </div>
    )
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'User'

  return (
    <Layout
      onNavigate={onNavigate}
      currentPage="dashboard"
      user={user}
    >
      {/* Hero Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-voyanero-500/10 border border-voyanero-500/20 text-voyanero-500 text-xs font-bold uppercase tracking-wider mb-4">
            Live System
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-2">
            Guten Abend, <span className="text-transparent bg-clip-text bg-gradient-to-r from-voyanero-400 to-voyanero-600">{firstName}.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl">
            Deine Lead-Maschine läuft auf Hochtouren. Hier ist dein aktueller Statusbericht.
          </p>
        </div>
        <button
          onClick={() => onNavigate('campaigns')}
          className="bg-voyanero-500 hover:bg-voyanero-400 text-white font-bold py-3 px-6 rounded-xl shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.7)] transition-all hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Plus size={20} />
          Kampagne starten
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Verfügbares Guthaben"
          value={`${stats.credits}`}
          subtext="Automatische Aufladung deaktiviert"
          data={chartData1}
          color={{ bg: "bg-indigo-500/20", text: "text-indigo-400", hex: "#818cf8" }}
          icon={Coins}
          onClick={() => onNavigate('credits')}
        />
        <StatsCard
          title="Generierte Leads (7 Tage)"
          value={stats.totalLeads}
          subtext="+24 Leads seit gestern"
          data={chartData2}
          color={{ bg: "bg-emerald-500/20", text: "text-emerald-400", hex: "#34d399" }}
          icon={Users}
          onClick={() => onNavigate('campaigns')}
        />
        <StatsCard
          title="System Auslastung"
          value="98%"
          subtext="Alle Systeme operational"
          data={chartData3}
          icon={Activity}
          color={{ hex: '#3B82F6', bg: 'bg-blue-500/10', text: 'text-blue-400' }}
        />
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Actions (2x2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="text-yellow-500" size={20} />
            <h3 className="text-xl font-bold text-white">Schnellzugriff</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAction
              title="Kampagne"
              subtitle="Neu erstellen"
              icon={Plus}
              onClick={() => onNavigate('campaigns')}
              color="bg-voyanero-500/20"
            />
            <QuickAction
              title="Aufladen"
              subtitle="Credits kaufen"
              icon={CreditCard}
              onClick={() => onNavigate('credits')}
              color="bg-purple-500/20"
            />
            <QuickAction
              title="Datenbank"
              subtitle="Meine Kontakte"
              icon={Database}
              onClick={() => onNavigate('contacts')}
              color="bg-emerald-500/20"
            />
            <QuickAction
              title="Export"
              subtitle="CSV herunterladen"
              icon={Download}
              onClick={handleExport}
              color="bg-amber-500/20"
            />
          </div>

          {/* Live Feed */}
          <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 mt-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Live Feed</h3>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <span className="text-xs text-gray-500">Echtzeit</span>
            </div>

            <div className="space-y-1">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="cursor-pointer">
                    <LiveFeedItem
                      title={activity.title}
                      time={activity.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      type={activity.status}
                    />
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Keine aktuellen Aktivitäten
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('history')}
              className="w-full mt-4 py-2 text-sm text-voyanero-400 hover:text-voyanero-300 font-medium transition-colors flex items-center justify-center gap-1 group"
            >
              Vollständigen Verlauf ansehen
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Column: Top Performance */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 mb-4 lg:mb-0 lg:h-7">
            {/* Spacer to align with Quick Actions header */}
          </div>

          <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Top Performance</h3>
              <TrendingUp className="text-yellow-500" size={20} />
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Conversion Rate</span>
                  <span className="text-sm text-emerald-400 font-bold">+2.4%</span>
                </div>
                <div className="text-2xl font-bold text-white mb-2">12.8%</div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '12.8%' }}></div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Credits Usage</span>
                  <span className="text-sm text-gray-400 font-bold">850/2000</span>
                </div>
                <div className="text-2xl font-bold text-white mb-2">42%</div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-voyanero-500 h-1.5 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-voyanero-900 to-voyanero-800 border border-voyanero-500/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-voyanero-500/20 rounded-lg text-voyanero-400">
                    <Zap size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Pro Tipp</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Kampagnen am Dienstagmorgen haben eine 15% höhere Öffnungsrate.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
