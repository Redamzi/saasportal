import { useEffect, useState } from 'react'
import {
  DollarSign, Users, FolderKanban, CreditCard,
  UserPlus, Settings, CheckCircle2, ArrowRight, TrendingUp
} from "lucide-react"
import { getCurrentUser, signOut } from '../lib/supabase'
import { supabase } from '../lib/supabase'

const StatsCard = ({ title, value, description, icon: Icon, iconBgColor, iconColor }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 text-left">{title}</p>
        <h3 className="text-2xl font-bold mt-2 text-slate-900 text-left">{value}</h3>
        <p className="text-xs text-slate-500 mt-1 text-left">{description}</p>
      </div>
      <div className={`p-3 rounded-lg ${iconBgColor}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
    </div>
  </div>
)

const ActionCard = ({ title, description, icon: Icon, onClick, colorClass }) => (
  <button
    onClick={onClick}
    className="group relative overflow-hidden bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-left w-full"
  >
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${colorClass}`} />
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-lg bg-slate-50 group-hover:bg-white flex items-center justify-center mb-4 transition-colors">
        <Icon className="w-6 h-6 text-slate-700 group-hover:text-blue-600" />
      </div>
      <h3 className="font-bold text-lg text-slate-900 mb-1 text-left">{title}</h3>
      <p className="text-sm text-slate-500 text-left">{description}</p>
    </div>
  </button>
)

const ProfileSection = ({ profile, user, onNavigate }) => (
  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 md:p-8">
    <div className="flex flex-col md:flex-row justify-between gap-6 mb-6 border-b pb-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 text-left">Account Übersicht</h2>
        <p className="text-slate-500 text-left">Ihre persönlichen Daten und Einstellungen</p>
      </div>
      <button
        onClick={() => onNavigate('settings')}
        className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
      >
        Bearbeiten <ArrowRight className="w-4 h-4" />
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div>
        <label className="text-xs uppercase text-slate-400 font-semibold text-left">Name</label>
        <p className="font-medium text-slate-900 mt-1 text-left">{profile?.full_name || '-'}</p>
      </div>
      <div>
        <label className="text-xs uppercase text-slate-400 font-semibold text-left">Email</label>
        <div className="flex items-center gap-2 mt-1">
          <p className="font-medium text-slate-900 text-left">{user?.email}</p>
          {user?.email_confirmed_at && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
        </div>
      </div>
      <div>
        <label className="text-xs uppercase text-slate-400 font-semibold text-left">Unternehmen</label>
        <p className="font-medium text-slate-900 mt-1 text-left">{profile?.company_name || '-'}</p>
      </div>
      <div>
        <label className="text-xs uppercase text-slate-400 font-semibold text-left">Credits</label>
        <p className="font-medium text-slate-900 mt-1 text-left">{profile?.credits_balance || 0} Credits</p>
      </div>
      <div>
        <label className="text-xs uppercase text-slate-400 font-semibold text-left">Mitglied seit</label>
        <p className="font-medium text-slate-900 mt-1 text-left">
          {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('de-DE') : '-'}
        </p>
      </div>
      <div>
        <label className="text-xs uppercase text-slate-400 font-semibold text-left">Subdomain</label>
        <p className="font-medium text-slate-900 mt-1 text-left">{profile?.subdomain || '-'}</p>
      </div>
    </div>
  </div>
)

export default function Dashboard({ onNavigate }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ credits: 0, totalLeads: 0, totalCampaigns: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    checkPaymentStatus()
  }, [])

  const checkPaymentStatus = () => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')

    if (paymentStatus === 'success') {
      setTimeout(() => {
        alert('✅ Payment successful!\n\nYour credits have been added to your account.\n\nThank you for your purchase!')
        loadData()
      }, 500)
      window.history.replaceState({}, '', '/dashboard')
    } else if (paymentStatus === 'cancelled') {
      alert('Payment was cancelled.\n\nNo charges were made to your account.')
      window.history.replaceState({}, '', '/dashboard')
    }
  }

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
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-slate-600">Lädt...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-left">
          Willkommen zurück{profile?.full_name ? `, ${profile.full_name}` : ''}
        </h1>
        <p className="text-lg text-slate-500 text-left">
          Hier ist eine Übersicht Ihres Voyanero Accounts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatsCard
          title="Verfügbare Credits"
          value={stats.credits.toLocaleString()}
          description="Aktuelles Guthaben"
          icon={DollarSign}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatsCard
          title="Erfasste Leads"
          value={stats.totalLeads}
          description="Gesamtanzahl Leads"
          icon={Users}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatsCard
          title="Kampagnen"
          value={stats.totalCampaigns}
          description="Aktive Kampagnen"
          icon={FolderKanban}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      {/* Profile */}
      {profile && (
        <div className="mb-10">
          <ProfileSection profile={profile} user={user} onNavigate={onNavigate} />
        </div>
      )}

      {/* Actions */}
      <div>
        <h2 className="text-xl font-bold mb-6 text-left">Schnellzugriff</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard
            title="Kampagnen"
            description="Erstellen & verwalten"
            icon={FolderKanban}
            onClick={() => onNavigate('campaigns')}
            colorClass="from-indigo-50 to-indigo-100"
          />
          <ActionCard
            title="Credits kaufen"
            description="Guthaben aufladen"
            icon={CreditCard}
            onClick={() => onNavigate('credits')}
            colorClass="from-blue-50 to-blue-100"
          />
          <ActionCard
            title="Leads"
            description="Alle Leads verwalten"
            icon={UserPlus}
            onClick={() => onNavigate('campaigns')}
            colorClass="from-emerald-50 to-emerald-100"
          />
          <ActionCard
            title="Einstellungen"
            description="Account bearbeiten"
            icon={Settings}
            onClick={() => onNavigate('settings')}
            colorClass="from-amber-50 to-amber-100"
          />
        </div>
      </div>
    </div>
  )
}
