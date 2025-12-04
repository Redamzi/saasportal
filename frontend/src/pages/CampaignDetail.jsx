import { useState, useEffect } from 'react'
import { getCurrentUser } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import MagicButton from '../components/MagicButton'
import {
  Trash2, Search, Download, Globe, Mail, Phone, Check, AlertTriangle,
  Plus, X, ChevronDown, ChevronRight, RefreshCw, Database, Settings, Users, TrendingUp, Sparkles
} from 'lucide-react'
import EmailPreviewModal from '../components/EmailPreviewModal'

function CampaignDetail({ campaignId, onNavigate }) {
  const [user, setUser] = useState(null)
  const [campaign, setCampaign] = useState(null)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCrawling, setIsCrawling] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [expandedLead, setExpandedLead] = useState(null)
  const [searchFormData, setSearchFormData] = useState({
    location: '', radius: 5000, keywords: '', targetLeadCount: 10, minRating: 0, minReviews: 0,
  })
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedLeadForEmail, setSelectedLeadForEmail] = useState(null)
  const [manualEmail, setManualEmail] = useState('')
  const [showEmailConfigModal, setShowEmailConfigModal] = useState(false)
  const [emailConfigData, setEmailConfigData] = useState({
    targetIndustries: '',
    targetCompanySize: 'medium',
    targetPainPoints: '',
    targetOpportunities: '',
    acquisitionGoal: 'appointment',
    acquisitionCta: '',
    emailTone: 'professional',
    emailFormality: 'sie',
    emailLanguage: 'de',
    emailMaxLength: 200,
    emailStyleRules: '',
  })
  const [generatedEmails, setGeneratedEmails] = useState([])
  const [isGeneratingEmails, setIsGeneratingEmails] = useState(false)
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [selectedEmailLead, setSelectedEmailLead] = useState(null)

  useEffect(() => {
    loadData()
    loadGeneratedEmails()
  }, [campaignId])

  const loadData = async () => {
    try {
      if (!campaignId || campaignId === 'null') {
        setCampaign(null); setLoading(false); return
      }
      const { user: currentUser } = await getCurrentUser()
      if (!currentUser) { onNavigate('login'); return }
      setUser(currentUser)

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/campaigns/${campaignId}`)

      if (response.ok) {
        const data = await response.json()
        setCampaign(data.campaign)
        setLeads(data.leads || [])
      } else setCampaign(null)
    } catch (error) {
      console.error('Error loading campaign:', error)
      setCampaign(null)
    } finally {
      setLoading(false)
    }
  }

  const loadGeneratedEmails = async () => {
    if (!campaignId || campaignId === 'null') return
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/campaigns/${campaignId}/emails`)

      if (response.ok) {
        const emails = await response.json()
        setGeneratedEmails(emails)
      }
    } catch (error) {
      console.error('Error loading generated emails:', error)
    }
  }

  const handleGenerateAIEmails = async () => {
    // Open Email Config Modal first
    setShowEmailConfigModal(true)
  }

  const handleConfirmGenerateAIEmails = async () => {
    // Only count leads that have an email address
    const leadsWithEmail = leads.filter(lead => lead.email)
    const emailCount = leadsWithEmail.length
    const leadsWithoutEmail = leads.length - emailCount
    const creditCost = emailCount * 0.5

    if (emailCount === 0) {
      alert(`❌ Keine Leads mit Email-Adresse gefunden!\n\n${leadsWithoutEmail} Leads haben keine Email.`)
      return
    }

    const confirmMessage = `AI-Emails für ${emailCount} Leads generieren?\n\nKosten: ${creditCost} Credits${leadsWithoutEmail > 0 ? `\n\n⚠️ ${leadsWithoutEmail} Leads ohne Email werden übersprungen` : ''}`

    if (!confirm(confirmMessage)) return

    setIsGeneratingEmails(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/campaigns/${campaignId}/generate-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ ${result.generated_count} Emails generiert!\n${result.failed_count > 0 ? `⚠️ ${result.failed_count} Fehler` : ''}`)
        await loadGeneratedEmails()
      } else {
        const error = await response.json()
        throw new Error(error.detail || 'Fehler bei der Email-Generierung')
      }
    } catch (error) {
      console.error('Error generating emails:', error)
      alert(`❌ Fehler: ${error.message}`)
    } finally {
      setIsGeneratingEmails(false)
    }
  }

  const handleSaveEmail = async (emailId, updates) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/campaigns/${campaignId}/emails/${emailId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        alert('✅ Email gespeichert!')
        await loadGeneratedEmails()
        setShowEmailPreviewModal(false)
      } else {
        throw new Error('Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error saving email:', error)
      throw error
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
        alert(`✅ Lead als ${status === 'invalid' ? 'ungültig' : 'kontaktiert'} markiert`)
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

  const handleExportCSV = () => {
    if (leads.length === 0) { alert('No leads to export'); return }
    const headers = ['Name', 'Address', 'Phone', 'Email', 'Website', 'City', 'Industry', 'Rating', 'Reviews', 'Lead Score', 'Status']
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        `"${lead.company_name || lead.name || ''}"`, `"${lead.address || ''}"`, `"${lead.phone || ''}"`, `"${lead.email || ''}"`,
        `"${lead.website || ''}"`, `"${lead.city || ''}"`, `"${lead.industry || ''}"`, lead.google_rating || lead.rating || '',
        lead.reviews_count || '', lead.lead_score || '', lead.status || 'new'
      ].join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaign.name}_leads_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleStartSearch = async (e) => {
    e.preventDefault()
    setShowSearchModal(false)
    setIsCrawling(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/campaigns/crawl/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId, user_id: user.id, location: searchFormData.location, radius: searchFormData.radius,
          keywords: searchFormData.keywords, target_lead_count: searchFormData.targetLeadCount,
          min_rating: searchFormData.minRating, min_reviews: searchFormData.minReviews,
        }),
      })
      if (!response.ok) throw new Error('Failed to start crawl')
      const data = await response.json()
      if (data.success) {
        setTimeout(() => {
          setIsCrawling(false)
          loadData()
          alert(`✅ Lead search completed!\n\n${data.message}\n\nLeads found: ${data.leads_found}`)
        }, 2000)
      } else {
        setIsCrawling(false)
        throw new Error('Crawl failed')
      }
    } catch (error) {
      console.error('Error starting search:', error)
      setIsCrawling(false)
      alert('❌ Failed to start lead search.')
    }
  }

  const handleEnrichEmails = async () => {
    const leadsToEnrich = leads.filter(l => l.website && !l.email)
    if (leadsToEnrich.length === 0) { alert('No leads found to enrich'); return }
    if (!confirm(`Found ${leadsToEnrich.length} leads to enrich. Start Impressum Crawler?`)) return
    setIsCrawling(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/impressum/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websites: leadsToEnrich.map(l => l.website), campaign_id: campaignId }),
      })
      if (!response.ok) throw new Error('Failed to start batch crawl')
      const data = await response.json()
      if (data.success) {
        alert(`✅ Started enriching ${data.count} leads!`)
        let checks = 0
        const interval = setInterval(() => {
          loadData(); checks++
          if (checks >= 12) { clearInterval(interval); setIsCrawling(false) }
        }, 5000)
      } else {
        throw new Error(data.message || 'Batch crawl failed')
        setIsCrawling(false)
      }
    } catch (error) {
      console.error('Error enriching emails:', error)
      setIsCrawling(false)
      alert(`❌ Failed to start enrichment: ${error.message}`)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-voyanero-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-voyanero-500"></div>
    </div>
  )

  if (!campaign) return (
    <div className="min-h-screen bg-voyanero-900 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Campaign not found</h2>
        <button onClick={() => onNavigate('campaigns')} className="mt-4 px-6 py-2 bg-voyanero-500 text-white rounded-xl">Back to Campaigns</button>
      </div>
    </div>
  )

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
  }

  return (
    <Layout onNavigate={onNavigate} currentPage="campaigns" user={user}>
      {/* Campaign Info */}
      <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 mb-8 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{campaign.name}</h2>
            <p className="text-gray-400">{campaign.description || 'No description'}</p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider border ${campaign.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            campaign.status === 'crawling' ? 'bg-voyanero-500/10 text-voyanero-400 border-voyanero-500/20' :
              'bg-gray-500/10 text-gray-400 border-gray-500/20'
            }`}>
            {campaign.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm mb-8 bg-white/5 p-6 rounded-2xl border border-white/5">
          <div>
            <span className="text-gray-500 uppercase font-bold text-xs">Type</span>
            <p className="font-medium text-white capitalize mt-1">{campaign.type?.replace('_', ' ')}</p>
          </div>
          <div>
            <span className="text-gray-500 uppercase font-bold text-xs">Created</span>
            <p className="font-medium text-white mt-1">{new Date(campaign.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-gray-500 uppercase font-bold text-xs">Total Leads</span>
            <p className="font-medium text-white mt-1">{stats.total}</p>
          </div>
          <div>
            <span className="text-gray-500 uppercase font-bold text-xs">Cost</span>
            <p className="font-bold text-voyanero-400 mt-1">{campaign.credits_used || campaign.leads_count || 0} Credits</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowSearchModal(true)} className="px-6 py-2.5 bg-voyanero-500 hover:bg-voyanero-400 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-voyanero-500/20">
            <Plus size={18} /> Add Leads
          </button>
          <button
            onClick={handleEnrichEmails}
            disabled={leads.filter(l => l.website && !l.email).length === 0 || isCrawling}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-600/20"
          >
            {isCrawling ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
            Enrich Emails
          </button>
          <button
            onClick={handleExportCSV}
            disabled={leads.length === 0}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Download size={18} /> Export CSV
          </button>
          <button
            onClick={handleGenerateAIEmails}
            disabled={leads.length === 0 || isGeneratingEmails}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-600/20"
          >
            {isGeneratingEmails ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
            AI-Emails generieren
          </button>
          <MagicButton
            onClick={() => setShowEmailConfigModal(true)}
            icon={Settings}
            className="py-2.5 px-6"
          >
            Email-Konfiguration
          </MagicButton>
        </div>
      </div>

      {/* Lead Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Leads', value: stats.total, color: 'text-white', bg: 'bg-white/5' },
          { label: 'New', value: stats.new, color: 'text-voyanero-400', bg: 'bg-voyanero-500/10' },
          { label: 'Contacted', value: stats.contacted, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Converted', value: stats.converted, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} border border-white/5 rounded-2xl p-6`}>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">{stat.label}</h3>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Leads List */}
      <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/5">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-voyanero-500" /> Leads
          </h3>
        </div>

        {leads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Database className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No leads yet</h3>
            <p className="text-gray-400">Start a lead search to populate this campaign</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {leads.map((lead) => {
              const isExpanded = expandedLead === lead.id
              const isManualEmail = lead.email_source === 'manual_user'

              return (
                <div key={lead.id} className={`transition-all hover:bg-white/5 ${isExpanded ? 'bg-white/5' : ''}`}>
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedLead(isExpanded ? null : lead.id)}>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <p className="font-bold text-white flex items-center gap-2">
                          {lead.company_name || lead.name || 'No Name'}
                          {lead.email_source === 'outscraper' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">OUT</span>}
                          {lead.email_source === 'impressum_crawler' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">IMP</span>}
                          {lead.email_source === 'manual_user' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">MAN</span>}
                          {(() => {
                            const email = generatedEmails.find(e => e.lead_id === lead.id)
                            if (!email) return null

                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedEmail(email)
                                  setSelectedEmailLead(lead)
                                  setShowEmailPreviewModal(true)
                                }}
                                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${email.edited_by_user
                                  ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                  : 'bg-voyanero-500/20 text-voyanero-400 hover:bg-voyanero-500/30'
                                  } transition`}
                              >
                                <Mail size={12} />
                                {email.edited_by_user ? 'Edited' : 'AI'}
                              </button>
                            )
                          })()}
                        </p>
                      </div>
                      <div className="text-gray-400 text-sm flex items-center gap-2">
                        {lead.phone ? <><Phone size={14} /> {lead.phone}</> : <span className="text-gray-600">No Phone</span>}
                      </div>
                      <div className="text-gray-400 text-sm flex items-center gap-2">
                        {lead.email ? (
                          <>
                            <Mail size={14} />
                            <span className="truncate max-w-[150px]">{lead.email}</span>
                            {lead.email_verified ? <Check size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-amber-500" />}
                          </>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); handleOpenEmailModal(lead) }} className="text-voyanero-500 hover:text-voyanero-400 font-bold flex items-center gap-1">
                            <Plus size={14} /> Add Email
                          </button>
                        )}
                      </div>
                      <div className="flex justify-end gap-3 items-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border ${lead.status === 'contacted' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                          lead.status === 'converted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            lead.status === 'invalid' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}>
                          {lead.status || 'new'}
                        </span>
                        {isExpanded ? <ChevronDown size={20} className="text-gray-500" /> : <ChevronRight size={20} className="text-gray-500" />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/5 bg-black/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="font-bold text-gray-300 mb-4 text-xs uppercase tracking-wider">Details</h4>
                          <dl className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <dt className="text-gray-500">Address</dt>
                              <dd className="text-gray-300 text-right">{lead.address || '-'}</dd>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <dt className="text-gray-500">Website</dt>
                              <dd className="text-gray-300 text-right">
                                {lead.website ? <a href={lead.website} target="_blank" className="text-voyanero-400 hover:text-voyanero-300 flex items-center gap-1 justify-end"><Globe size={12} /> {lead.website}</a> : '-'}
                              </dd>
                            </div>
                          </dl>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-300 mb-4 text-xs uppercase tracking-wider">Actions</h4>
                          <div className="flex flex-wrap gap-3">
                            <button onClick={() => updateLeadStatus(lead.id, 'contacted')} className="px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 text-sm font-bold">Mark Contacted</button>
                            <button onClick={() => updateLeadStatus(lead.id, 'invalid')} className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 text-sm font-bold">Mark Invalid</button>
                            <button onClick={() => handleDeleteLead(lead.id, lead.company_name)} className="px-4 py-2 bg-white/5 text-gray-400 border border-white/10 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-sm font-bold ml-auto flex items-center gap-2"><Trash2 size={14} /> Delete</button>
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

      {/* Modals */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0B1121] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Add More Leads</h2>
              <button onClick={handleCloseSearchModal} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleStartSearch} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                  <input type="text" name="location" value={searchFormData.location} onChange={(e) => setSearchFormData({ ...searchFormData, location: e.target.value })} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-voyanero-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Keywords</label>
                  <input type="text" name="keywords" value={searchFormData.keywords} onChange={(e) => setSearchFormData({ ...searchFormData, keywords: e.target.value })} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-voyanero-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Leads: {searchFormData.targetLeadCount}</label>
                <input type="range" name="targetLeadCount" value={searchFormData.targetLeadCount} onChange={(e) => setSearchFormData({ ...searchFormData, targetLeadCount: e.target.value })} min="10" max="100" className="w-full accent-voyanero-500" />
              </div>
              <div className="bg-voyanero-500/10 border border-voyanero-500/20 p-4 rounded-xl">
                <p className="text-voyanero-400 font-bold">Cost: {parseInt(searchFormData.targetLeadCount) || 10} Credits</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={handleCloseSearchModal} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold">Cancel</button>
                <MagicButton type="submit" icon={Search} className="py-2 px-6">
                  Start Search
                </MagicButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEmailModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0B1121] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Add Manual Email</h3>
            <input type="email" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} placeholder="name@company.com" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-voyanero-500 outline-none mb-4" autoFocus />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowEmailModal(false)} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold">Cancel</button>
              <MagicButton onClick={handleSaveManualEmail} disabled={!manualEmail} className="py-2 px-6">
                Save
              </MagicButton>
            </div>
          </div>
        </div>
      )}

      {/* Email Configuration Modal */}
      {showEmailConfigModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0B1121] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0B1121] z-10">
              <h2 className="text-xl font-bold text-white">Email-Konfiguration</h2>
              <button onClick={() => setShowEmailConfigModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Section 1: Zielkunden */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-voyanero-500" />
                  Zielkunden-Profil
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Unternehmensgröße
                    </label>
                    <div className="relative">
                      <select
                        value={emailConfigData.targetCompanySize}
                        onChange={(e) => setEmailConfigData({ ...emailConfigData, targetCompanySize: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-voyanero-500 outline-none appearance-none"
                      >
                        <option value="small">Klein (1-10 Mitarbeiter)</option>
                        <option value="medium">Mittel (11-50 Mitarbeiter)</option>
                        <option value="large">Groß (50+ Mitarbeiter)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Akquise-Ziel */}
              <div className="border-t border-white/10 pt-8">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-voyanero-500" />
                  Akquise-Ziel
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Hauptziel der Email
                    </label>
                    <div className="relative">
                      <select
                        value={emailConfigData.acquisitionGoal}
                        onChange={(e) => setEmailConfigData({ ...emailConfigData, acquisitionGoal: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-voyanero-500 outline-none appearance-none"
                      >
                        <option value="first_contact">Erstkontakt herstellen</option>
                        <option value="appointment">Termin vereinbaren</option>
                        <option value="demo">Demo/Call vorschlagen</option>
                        <option value="offer">Angebot anbieten</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Tonfall & Stil */}
              <div className="border-t border-white/10 pt-8">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-voyanero-500" />
                  Tonfall & Stil
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Tonfall
                      </label>
                      <div className="relative">
                        <select
                          value={emailConfigData.emailTone}
                          onChange={(e) => setEmailConfigData({ ...emailConfigData, emailTone: e.target.value })}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-voyanero-500 outline-none appearance-none"
                        >
                          <option value="professional">Professionell</option>
                          <option value="friendly">Freundlich</option>
                          <option value="casual">Locker</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Anrede
                      </label>
                      <div className="relative">
                        <select
                          value={emailConfigData.emailFormality}
                          onChange={(e) => setEmailConfigData({ ...emailConfigData, emailFormality: e.target.value })}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-voyanero-500 outline-none appearance-none"
                        >
                          <option value="sie">Sie (förmlich)</option>
                          <option value="du">Du (informell)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sprache
                      </label>
                      <div className="relative">
                        <select
                          value={emailConfigData.emailLanguage}
                          onChange={(e) => setEmailConfigData({ ...emailConfigData, emailLanguage: e.target.value })}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-voyanero-500 outline-none appearance-none"
                        >
                          <option value="de">Deutsch</option>
                          <option value="en">English</option>
                          <option value="fr">Français</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max. Wortanzahl: {emailConfigData.emailMaxLength}
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="200"
                        step="50"
                        value={emailConfigData.emailMaxLength}
                        onChange={(e) => setEmailConfigData({ ...emailConfigData, emailMaxLength: parseInt(e.target.value) })}
                        className="w-full accent-voyanero-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowEmailConfigModal(false)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold"
                >
                  Abbrechen
                </button>
                <MagicButton
                  onClick={async () => {
                    try {
                      const { supabase } = await import('../lib/supabase')

                      // Save email config as JSON field
                      const emailConfig = {
                        target_industries: emailConfigData.targetIndustries.split(',').map(s => s.trim()),
                        target_company_size: emailConfigData.targetCompanySize,
                        pain_points: emailConfigData.targetPainPoints,
                        opportunities: emailConfigData.targetOpportunities,
                        email_goal: emailConfigData.acquisitionGoal,
                        call_to_action: emailConfigData.acquisitionCta,
                        tone: emailConfigData.emailTone,
                        salutation: emailConfigData.emailFormality,
                        language: emailConfigData.emailLanguage,
                        max_words: emailConfigData.emailMaxLength,
                        style_rules: emailConfigData.emailStyleRules,
                      }

                      const { error } = await supabase
                        .from('campaigns')
                        .update({ email_config: emailConfig, email_config_completed: true })
                        .eq('id', campaignId)

                      if (error) throw error

                      setShowEmailConfigModal(false)

                      // Now trigger email generation
                      await handleConfirmGenerateAIEmails()

                    } catch (error) {
                      console.error('Error saving email config:', error)
                      alert('❌ Fehler beim Speichern')
                    }
                  }}
                  className="py-2 px-6"
                >
                  Emails generieren
                </MagicButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {showEmailPreviewModal && selectedEmail && (
        <EmailPreviewModal
          email={selectedEmail}
          lead={selectedEmailLead}
          onClose={() => {
            setShowEmailPreviewModal(false)
            setSelectedEmail(null)
            setSelectedEmailLead(null)
          }}
          onSave={(updates) => handleSaveEmail(selectedEmail.id, updates)}
        />
      )}
    </Layout>
  )
}

export default CampaignDetail
