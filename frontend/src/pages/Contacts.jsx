import { useState, useEffect } from 'react'
import { getCurrentUser, getUserLeads } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Users, Trash2, Mail, Phone, Globe, Check, AlertTriangle, Plus, X } from 'lucide-react'

export default function Contacts({ onNavigate }) {
    const [user, setUser] = useState(null)
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedLead, setExpandedLead] = useState(null)
    const [showEmailModal, setShowEmailModal] = useState(false)
    const [selectedLeadForEmail, setSelectedLeadForEmail] = useState(null)
    const [manualEmail, setManualEmail] = useState('')

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

            const { data, error } = await getUserLeads(currentUser.id)
            if (error) throw error
            const contactsOnly = (data || []).filter(l => l.status === 'contacted' || l.status === 'converted')
            setLeads(contactsOnly)
        } catch (error) {
            console.error('Error loading contacts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteLead = async (leadId, leadName) => {
        if (!confirm(`Kontakt "${leadName}" wirklich löschen?`)) return

        try {
            const { error } = await supabase.from('leads').delete().eq('id', leadId)
            if (error) throw error
            setLeads(leads.filter(l => l.id !== leadId))
            if (expandedLead === leadId) setExpandedLead(null)
            alert('✅ Kontakt erfolgreich gelöscht!')
        } catch (error) {
            console.error('Delete error:', error)
            alert(`❌ Fehler beim Löschen: ${error.message}`)
        }
    }

    const updateLeadStatus = async (leadId, status) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
            const response = await fetch(`${API_URL}/api/campaigns/leads/${leadId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            })
            if (response.ok) {
                await loadData()
                alert(`✅ Kontakt als ${status === 'invalid' ? 'ungültig' : 'kontaktiert'} markiert`)
            } else throw new Error('Failed to update status')
        } catch (error) {
            console.error('Error updating status:', error)
            alert('❌ Fehler beim Markieren')
        }
    }

    const handleOpenEmailModal = (lead) => {
        setSelectedLeadForEmail(lead)
        setManualEmail('')
        setShowEmailModal(true)
    }

    const handleSaveManualEmail = async () => {
        if (!manualEmail || !selectedLeadForEmail) return
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
            const response = await fetch(`${API_URL}/api/campaigns/leads/${selectedLeadForEmail.id}/email`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: manualEmail }),
            })
            if (response.ok) {
                setShowEmailModal(false)
                setSelectedLeadForEmail(null)
                setManualEmail('')
                await loadData()
                alert('✅ Email erfolgreich hinzugefügt')
            } else {
                const error = await response.json()
                throw new Error(error.detail || 'Failed to add email')
            }
        } catch (error) {
            console.error('Error adding manual email:', error)
            alert(`❌ Fehler: ${error.message}`)
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
            currentPage="contacts"
            user={user}
            title="Meine Kontakte"
            subtitle="Verwalten Sie alle Ihre gesammelten Leads und Kontakte an einem Ort."
        >
            <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="text-voyanero-500" />
                        Alle Kontakte ({leads.length})
                    </h3>
                </div>

                {leads.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Keine Kontakte gefunden</h3>
                        <p className="text-gray-400 mb-8">
                            Starten Sie eine Kampagne, um neue Leads zu generieren.
                        </p>
                        <button
                            onClick={() => onNavigate('campaigns')}
                            className="bg-voyanero-500 hover:bg-voyanero-400 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-voyanero-500/20 transition-all hover:-translate-y-0.5"
                        >
                            Zu den Kampagnen
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {leads.map((lead) => {
                            const isManualEmail = lead.email_source === 'manual_user'
                            const isExpanded = expandedLead === lead.id

                            let badge = null
                            if (lead.email_source === 'outscraper') {
                                badge = <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20" title="Source: Outscraper">OUT</span>
                            } else if (lead.email_source === 'impressum_crawler') {
                                badge = <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20" title="Source: Impressum Scraper">IMP</span>
                            } else if (lead.email_source === 'manual_user') {
                                badge = <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" title="Source: Manual">MAN</span>
                            }

                            return (
                                <div
                                    key={lead.id}
                                    className={`transition-all hover:bg-white/5 ${isExpanded ? 'bg-white/5' : ''}`}
                                >
                                    {/* COLLAPSED VIEW */}
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer"
                                        onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                                    >
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                            <div>
                                                <p className="font-bold text-white flex items-center gap-2">
                                                    {lead.company_name || lead.name || 'Kein Name'}
                                                    {badge}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400">
                                                {lead.phone ? (
                                                    <>
                                                        <Phone size={14} />
                                                        <a href={`tel:${lead.phone}`} className="hover:text-voyanero-400 transition-colors" onClick={(e) => e.stopPropagation()}>
                                                            {lead.phone}
                                                        </a>
                                                    </>
                                                ) : <span className="text-gray-600 text-sm">Kein Telefon</span>}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400">
                                                {lead.email ? (
                                                    <>
                                                        <Mail size={14} />
                                                        <a href={`mailto:${lead.email}`} className="hover:text-voyanero-400 transition-colors truncate max-w-[150px]" onClick={(e) => e.stopPropagation()}>
                                                            {lead.email}
                                                        </a>
                                                        {lead.email_verified ? <Check size={14} className="text-emerald-500" title="Verified" /> : <AlertTriangle size={14} className="text-amber-500" title="Unverified" />}
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleOpenEmailModal(lead)
                                                        }}
                                                        className="text-sm text-voyanero-500 hover:text-voyanero-400 font-medium flex items-center gap-1"
                                                    >
                                                        <Plus size={14} /> Email
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-end gap-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border ${lead.status === 'contacted' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                        lead.status === 'converted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                            lead.status === 'invalid' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                    }`}>
                                                    {lead.status || 'new'}
                                                </span>
                                                <svg
                                                    className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* EXPANDED VIEW */}
                                    {isExpanded && (
                                        <div className="px-6 pb-6 pt-2 border-t border-white/5 bg-black/20">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <h4 className="font-bold text-gray-300 mb-4 text-sm uppercase tracking-wider">Details</h4>
                                                    <dl className="space-y-3 text-sm">
                                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                                            <dt className="text-gray-500">Adresse:</dt>
                                                            <dd className="text-gray-300 text-right">{lead.address || '-'}</dd>
                                                        </div>
                                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                                            <dt className="text-gray-500">Stadt:</dt>
                                                            <dd className="text-gray-300 text-right">{lead.city || '-'}</dd>
                                                        </div>
                                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                                            <dt className="text-gray-500">Website:</dt>
                                                            <dd className="text-gray-300 text-right">
                                                                {lead.website ? (
                                                                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-voyanero-400 hover:text-voyanero-300 flex items-center gap-1 justify-end">
                                                                        <Globe size={12} /> {lead.website}
                                                                    </a>
                                                                ) : '-'}
                                                            </dd>
                                                        </div>
                                                    </dl>
                                                </div>

                                                <div>
                                                    <h4 className="font-bold text-gray-300 mb-4 text-sm uppercase tracking-wider">Aktionen</h4>
                                                    <div className="flex flex-wrap gap-3">
                                                        <button
                                                            onClick={() => updateLeadStatus(lead.id, 'contacted')}
                                                            className="px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 text-sm font-bold transition-colors"
                                                        >
                                                            Als kontaktiert markieren
                                                        </button>
                                                        <button
                                                            onClick={() => updateLeadStatus(lead.id, 'invalid')}
                                                            className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 text-sm font-bold transition-colors"
                                                        >
                                                            Als ungültig markieren
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteLead(lead.id, lead.company_name)}
                                                            className="px-4 py-2 bg-white/5 text-gray-400 border border-white/10 rounded-lg hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-sm font-bold transition-colors ml-auto flex items-center gap-2"
                                                        >
                                                            <Trash2 size={14} /> Löschen
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Manual Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0B1121] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Email manuell hinzufügen</h3>
                            <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>

                        <p className="text-sm text-gray-400 mb-4">
                            Für: <span className="font-bold text-white">{selectedLeadForEmail?.company_name}</span>
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email Adresse</label>
                            <input
                                type="email"
                                value={manualEmail}
                                onChange={(e) => setManualEmail(e.target.value)}
                                placeholder="kontakt@firma.de"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-voyanero-500 outline-none"
                                autoFocus
                            />
                        </div>

                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
                            <p className="text-xs text-yellow-400 flex gap-2">
                                <AlertTriangle size={16} className="shrink-0" />
                                Bitte stellen Sie sicher, dass diese Email korrekt ist. Manuell hinzugefügte Emails werden nicht automatisch verifiziert.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowEmailModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleSaveManualEmail}
                                disabled={!manualEmail}
                                className="px-6 py-2 bg-voyanero-500 hover:bg-voyanero-400 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}
