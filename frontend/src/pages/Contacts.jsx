import { useState, useEffect } from 'react'
import { getCurrentUser, getUserLeads } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Users } from 'lucide-react'

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
            setLeads(data || [])
        } catch (error) {
            console.error('Error loading contacts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteLead = async (leadId, leadName) => {
        if (!confirm(`Kontakt "${leadName}" wirklich löschen?`)) {
            return
        }

        try {
            const { error } = await supabase
                .from('leads')
                .delete()
                .eq('id', leadId)

            if (error) throw error

            setLeads(leads.filter(l => l.id !== leadId))
            if (expandedLead === leadId) {
                setExpandedLead(null)
            }
            alert('✅ Kontakt erfolgreich gelöscht!')
        } catch (error) {
            console.error('Delete error:', error)
            alert(`❌ Fehler beim Löschen: ${error.message}`)
        }
    }

    const handleMarkAsInvalid = async (leadId) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
            const response = await fetch(`${API_URL}/api/campaigns/leads/${leadId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'invalid' }),
            })

            if (response.ok) {
                await loadData()
                alert('✅ Kontakt als ungültig markiert')
            } else {
                throw new Error('Failed to update status')
            }
        } catch (error) {
            console.error('Error marking as invalid:', error)
            alert('❌ Fehler beim Markieren')
        }
    }

    const handleMarkAsContacted = async (leadId) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
            const response = await fetch(`${API_URL}/api/campaigns/leads/${leadId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'contacted' }),
            })

            if (response.ok) {
                await loadData()
                alert('✅ Kontakt als kontaktiert markiert')
            } else {
                throw new Error('Failed to update status')
            }
        } catch (error) {
            console.error('Error marking as contacted:', error)
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
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Lade Kontakte...</p>
                </div>
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Alle Kontakte ({leads.length})</h3>
                </div>

                {leads.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Keine Kontakte gefunden</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Starten Sie eine Kampagne, um neue Leads zu generieren.
                        </p>
                        <button
                            onClick={() => onNavigate('campaigns')}
                            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                        >
                            Zu den Kampagnen
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2 p-4">
                        {leads.map((lead) => {
                            const isManualEmail = lead.email_source === 'manual_user'
                            const isExpanded = expandedLead === lead.id

                            let badge = null
                            if (lead.email_source === 'outscraper') {
                                badge = <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" title="Source: Outscraper">OUT</span>
                            } else if (lead.email_source === 'impressum_crawler') {
                                badge = <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" title="Source: Impressum Scraper">IMP</span>
                            } else if (lead.email_source === 'manual_user') {
                                badge = <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" title="Source: Manual">MAN</span>
                            }

                            return (
                                <div
                                    key={lead.id}
                                    className={`rounded-lg shadow transition-all ${isManualEmail
                                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700'
                                        : 'bg-white dark:bg-gray-800'
                                        }`}
                                >
                                    {/* COLLAPSED VIEW */}
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition rounded-lg"
                                        onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                                    >
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                    {lead.company_name || lead.name || 'Kein Name'}
                                                    {badge}
                                                </p>
                                            </div>
                                            <div>
                                                {lead.phone ? (
                                                    <a href={`tel:${lead.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                                                        📞 {lead.phone}
                                                    </a>
                                                ) : <span className="text-gray-400">Kein Telefon</span>}
                                            </div>
                                            <div>
                                                {lead.email ? (
                                                    <div className="flex items-center gap-2">
                                                        <a href={`mailto:${lead.email}`} className="text-blue-600 dark:text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                                                            ✉️ {lead.email}
                                                        </a>
                                                        {lead.email_verified ? <span title="Verified">✅</span> : <span title="Unverified">⚠️</span>}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleOpenEmailModal(lead)
                                                        }}
                                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                    >
                                                        ➕ Email hinzufügen
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-end gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                                    lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                                                        lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                                                            lead.status === 'invalid' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {lead.status || 'new'}
                                                </span>
                                                <svg
                                                    className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
                                        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Details</h4>
                                                    <dl className="space-y-1 text-sm">
                                                        <div className="flex justify-between">
                                                            <dt className="text-gray-500">Adresse:</dt>
                                                            <dd className="text-gray-900 dark:text-white text-right">{lead.address || '-'}</dd>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <dt className="text-gray-500">Stadt:</dt>
                                                            <dd className="text-gray-900 dark:text-white text-right">{lead.city || '-'}</dd>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <dt className="text-gray-500">Website:</dt>
                                                            <dd className="text-gray-900 dark:text-white text-right">
                                                                {lead.website ? (
                                                                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                                        {lead.website}
                                                                    </a>
                                                                ) : '-'}
                                                            </dd>
                                                        </div>
                                                    </dl>
                                                </div>

                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Aktionen</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            onClick={() => handleMarkAsContacted(lead.id)}
                                                            className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-sm font-medium"
                                                        >
                                                            Als kontaktiert markieren
                                                        </button>
                                                        <button
                                                            onClick={() => handleMarkAsInvalid(lead.id)}
                                                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                                                        >
                                                            Als ungültig markieren
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteLead(lead.id, lead.company_name)}
                                                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium ml-auto"
                                                        >
                                                            Löschen
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            Email manuell hinzufügen
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Für: <span className="font-semibold">{selectedLeadForEmail?.company_name}</span>
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email Adresse
                            </label>
                            <input
                                type="email"
                                value={manualEmail}
                                onChange={(e) => setManualEmail(e.target.value)}
                                placeholder="kontakt@firma.de"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                autoFocus
                            />
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 mb-6">
                            <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                ⚠️ Bitte stellen Sie sicher, dass diese Email korrekt ist. Manuell hinzugefügte Emails werden nicht automatisch verifiziert.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowEmailModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleSaveManualEmail}
                                disabled={!manualEmail}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
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
