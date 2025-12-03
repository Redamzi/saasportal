import { useState, useEffect } from 'react'
import { getCurrentUser, supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { History, ArrowLeft, Calendar, CheckCircle2, AlertCircle, Info } from 'lucide-react'

export default function HistoryPage({ onNavigate }) {
    const [user, setUser] = useState(null)
    const [activities, setActivities] = useState([])
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

            // Fetch all leads (limit to 50 for now)
            const { data: leads } = await supabase
                .from('leads')
                .select('company_name, created_at')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(50)

            // Fetch all campaigns (limit to 50 for now)
            const { data: campaigns } = await supabase
                .from('campaigns')
                .select('name, created_at, status')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(50)

            // Combine and sort
            const allActivities = [
                ...(leads?.map(l => ({
                    type: 'lead',
                    title: `Neuer Lead: ${l.company_name}`,
                    time: new Date(l.created_at),
                    status: 'info',
                    details: 'Wurde zur Datenbank hinzugefügt'
                })) || []),
                ...(campaigns?.map(c => ({
                    type: 'campaign',
                    title: `Kampagne "${c.name}" ${c.status === 'completed' ? 'abgeschlossen' : 'gestartet'}`,
                    time: new Date(c.created_at),
                    status: c.status === 'completed' ? 'success' : 'warning',
                    details: `Status: ${c.status}`
                })) || [])
            ].sort((a, b) => b.time - a.time)

            setActivities(allActivities)
        } catch (error) {
            console.error('Error loading history:', error)
        } finally {
            setLoading(false)
        }
    }

    const getIcon = (type, status) => {
        if (status === 'success') return <CheckCircle2 className="text-emerald-400" size={20} />
        if (status === 'warning') return <AlertCircle className="text-amber-400" size={20} />
        return <Info className="text-blue-400" size={20} />
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
            currentPage="dashboard" // Keep dashboard active in sidebar
            user={user}
            title="Verlauf"
            subtitle="Alle Aktivitäten und Ereignisse im Überblick"
            actions={
                <button
                    onClick={() => onNavigate('dashboard')}
                    className="bg-white/5 hover:bg-white/10 text-white font-medium py-2 px-4 rounded-xl border border-white/10 transition-all flex items-center gap-2"
                >
                    <ArrowLeft size={18} />
                    Zurück zum Dashboard
                </button>
            }
        >
            <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8">
                {activities.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <History className="text-gray-500" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Keine Aktivitäten</h3>
                        <p className="text-gray-400">Es wurden noch keine Ereignisse aufgezeichnet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity, index) => (
                            <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                <div className={`p-2 rounded-lg bg-black/20 mt-1`}>
                                    {getIcon(activity.type, activity.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-4">
                                        <h4 className="text-white font-bold text-lg">{activity.title}</h4>
                                        <span className="text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap bg-black/20 px-2 py-1 rounded-lg">
                                            <Calendar size={12} />
                                            {activity.time.toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 mt-1">{activity.details}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    )
}
