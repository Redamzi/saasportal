import { useState, useEffect } from 'react'
import { getCurrentUser } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

function CampaignDetail({ campaignId, onNavigate }) {
  const [user, setUser] = useState(null)
  const [campaign, setCampaign] = useState(null)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCrawling, setIsCrawling] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [expandedLead, setExpandedLead] = useState(null)
  const [searchFormData, setSearchFormData] = useState({
    location: '',
    radius: 5000,
    keywords: '',
    targetLeadCount: 10,  // Changed from 100 to 10
    minRating: 0,
    minReviews: 0,
  })
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedLeadForEmail, setSelectedLeadForEmail] = useState(null)
  const [manualEmail, setManualEmail] = useState('')

  useEffect(() => {
    loadData()
  }, [campaignId])

  const loadData = async () => {
    try {
      // Validate campaignId exists
      if (!campaignId || campaignId === 'null' || campaignId === 'undefined') {
        console.error('Invalid campaign ID:', campaignId)
        setCampaign(null)
        setLoading(false)
        return
      }

      const { user: currentUser } = await getCurrentUser()
      if (!currentUser) {
        onNavigate('login')
        return
      }
      setUser(currentUser)

      // Fetch campaign details with leads
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/campaigns/${campaignId}`)

      if (response.ok) {
        const data = await response.json()
        setCampaign(data.campaign)
        setLeads(data.leads || [])
      } else {
        console.error('Failed to fetch campaign details', response.status)
        setCampaign(null)
      }
    } catch (error) {
      console.error('Error loading campaign:', error)
      setCampaign(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const { signOut } = await import('../lib/supabase')
    await signOut()
    onNavigate('login')
  }

  const handleDeleteLead = async (leadId, leadName) => {
    if (!confirm(`Auftraggeber "${leadName}" wirklich löschen?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)

      if (error) throw error

      // Remove from local state
      setLeads(leads.filter(l => l.id !== leadId))

      // Close expanded view if deleting expanded lead
      if (expandedLead === leadId) {
        setExpandedLead(null)
      }

      alert('✅ Auftraggeber erfolgreich gelöscht!')

    } catch (error) {
      console.error('Delete error:', error)
      alert(`❌ Fehler beim Löschen: ${error.message}`)
    }
  }

  // Handler for marking lead as invalid
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
        alert('✅ Lead als ungültig markiert')
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Error marking as invalid:', error)
      alert('❌ Fehler beim Markieren')
    }
  }

  // Handler for marking lead as contacted
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
        alert('✅ Lead als kontaktiert markiert')
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Error marking as contacted:', error)
      alert('❌ Fehler beim Markieren')
    }
  }

  // Handler for opening manual email modal
  const handleOpenEmailModal = (lead) => {
    setSelectedLeadForEmail(lead)
    setManualEmail('')
    setShowEmailModal(true)
  }

  // Handler for saving manual email
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
    if (leads.length === 0) {
      alert('No leads to export')
      return
    }

    // Create CSV content with ALL fields
    const headers = ['Name', 'Address', 'Phone', 'Email', 'Website', 'City', 'Industry', 'Rating', 'Reviews', 'Lead Score', 'Status']
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        `"${lead.company_name || lead.name || ''}"`,
        `"${lead.address || ''}"`,
        `"${lead.phone || ''}"`,
        `"${lead.email || ''}"`,
        `"${lead.website || ''}"`,
        `"${lead.city || ''}"`,
        `"${lead.industry || ''}"`,
        lead.google_rating || lead.rating || '',
        lead.reviews_count || '',
        lead.lead_score || '',
        lead.status || 'new'
      ].join(','))
    ].join('\n')

    // Create download link
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

  // Add More Leads Modal Handlers
  const handleOpenSearchModal = () => {
    setShowSearchModal(true)
  }

  const handleCloseSearchModal = () => {
    setShowSearchModal(false)
    setSearchFormData({
      location: '',
      radius: 5000,
      keywords: '',
      targetLeadCount: 10,  // Changed from 100 to 10
      minRating: 0,
      minReviews: 0,
    })
  }

  const handleSearchChange = (e) => {
    const { name, value } = e.target
    setSearchFormData((prev) => ({ ...prev, [name]: value }))
  }

  const calculateCost = () => {
    const leadCount = parseInt(searchFormData.targetLeadCount) || 10
    return leadCount // 1 credit per lead
  }

  const handleStartSearch = async (e) => {
    e.preventDefault()

    // ✅ STEP 1: Close modal immediately (better UX!)
    handleCloseSearchModal()

    // ✅ STEP 2: Show loading state on page
    setIsCrawling(true)

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

      const response = await fetch(`${API_URL}/api/campaigns/crawl/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          user_id: user.id,
          location: searchFormData.location,
          radius: searchFormData.radius,
          keywords: searchFormData.keywords,
          target_lead_count: searchFormData.targetLeadCount,
          min_rating: searchFormData.minRating,
          min_reviews: searchFormData.minReviews,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start crawl')
      }

      const data = await response.json()

      if (data.success) {
        // ✅ STEP 3: Wait a bit for backend to process, then refresh
        setTimeout(() => {
          setIsCrawling(false)
          loadData() // Refresh campaign data and leads
          alert(`✅ Lead search completed!\n\n${data.message}\n\nLeads found: ${data.leads_found}`)
        }, 2000)
      } else {
        setIsCrawling(false)
        throw new Error('Crawl failed')
      }
    } catch (error) {
      console.error('Error starting search:', error)
      setIsCrawling(false)
      alert('❌ Failed to start lead search. Please try again.')
    }
  }

  const handleEnrichEmails = async () => {
    // Filter leads that have website but no email
    const leadsToEnrich = leads.filter(l => l.website && !l.email)

    if (leadsToEnrich.length === 0) {
      alert('No leads found to enrich (must have website but no email)')
      return
    }

    if (!confirm(`Found ${leadsToEnrich.length} leads to enrich. Start Impressum Crawler?`)) {
      return
    }

    setIsCrawling(true)

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

      // Extract websites
      const websites = leadsToEnrich.map(l => l.website)

      const response = await fetch(`${API_URL}/api/impressum/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websites: websites,
          campaign_id: campaignId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start batch crawl')
      }

      const data = await response.json()

      if (data.success) {
        alert(`✅ Started enriching ${data.count} leads! This runs in the background.`)

        // Poll for updates every 5 seconds for 1 minute
        let checks = 0
        const interval = setInterval(() => {
          loadData() // Refresh leads
          checks++
          if (checks >= 12) { // Stop after 1 minute
            clearInterval(interval)
            setIsCrawling(false)
          }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">Campaign not found</h2>
          <button
            onClick={() => onNavigate('campaigns')}
            className="mt-4 px-6 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg transition"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    )
  }

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
  }

  return (
    <Layout
      onNavigate={onNavigate}
      currentPage="campaigns"
      user={user}
    >
      {/* Campaign Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-left">{campaign.name}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-left">{campaign.description || 'No description'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${campaign.status === 'draft' ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
            campaign.status === 'crawling' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
              campaign.status === 'ready' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                campaign.status === 'running' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                  campaign.status === 'paused' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' :
                    campaign.status === 'completed' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' :
                      campaign.status === 'failed' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
            {campaign.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-500 dark:text-gray-400 text-left">Type:</span>
            <p className="font-medium text-gray-900 dark:text-white capitalize text-left">{campaign.type?.replace('_', ' ')}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 text-left">Created:</span>
            <p className="font-medium text-gray-900 dark:text-white text-left">{new Date(campaign.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 text-left">Total Leads:</span>
            <p className="font-medium text-gray-900 dark:text-white text-left">{stats.total}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 text-left">Total Cost:</span>
            <p className="font-semibold text-blue-600 dark:text-blue-400 text-left">
              {campaign.credits_used || campaign.leads_count || 0} Credits
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
              Crawler: {campaign.leads_count || 0} Credits
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleOpenSearchModal}
            className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition"
          >
            + Add More Leads
          </button>

          <button
            onClick={handleEnrichEmails}
            disabled={leads.filter(l => l.website && !l.email).length === 0 || isCrawling}
            className="px-6 py-2 bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-800 text-white rounded-lg transition disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCrawling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Crawling...
              </>
            ) : (
              <>
                🔍 Enrich Emails ({leads.filter(l => l.website && !l.email).length})
              </>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={leads.length === 0}
            className="px-6 py-2 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white rounded-lg transition disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Lead Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 text-left">Total Leads</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white text-left">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 text-left">New</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 text-left">{stats.new}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 text-left">Contacted</h3>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 text-left">{stats.contacted}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 text-left">Converted</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 text-left">{stats.converted}</p>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white text-left">Leads</h3>
        </div>

        {leads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-gray-400 dark:text-gray-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">No leads yet</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Start a lead search to populate this campaign with leads
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {leads.map((lead) => {
              const isManualEmail = lead.email_source === 'manual_user'
              const isExpanded = expandedLead === lead.id

              // Badge Logic
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
                  {/* COLLAPSED VIEW - Always Visible */}
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition rounded-lg"
                    onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Company Name */}
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {lead.company_name || lead.name || 'Kein Name'}
                          {badge}
                        </p>
                      </div>

                      {/* Phone */}
                      <div>
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📞 {lead.phone}
                          </a>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Kein Telefon</span>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        {lead.email ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              ✉️ {lead.email}
                            </a>
                            {lead.email_verified ? (
                              <span title="Verified Email">✅</span>
                            ) : (
                              <span title="Unverified Email">⚠️</span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEmailModal(lead)
                            }}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            ➕ Email hinzufügen
                          </button>
                        )}
                      </div>

                      {/* Website */}
                      <div>
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🌐 Website
                          </a>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Keine Website</span>
                        )}
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <div className="ml-4 text-gray-400 dark:text-gray-500">
                      {isExpanded ? (
                        <span className="text-xl">▼</span>
                      ) : (
                        <span className="text-xl">▶</span>
                      )}
                    </div>
                  </div>

                  {/* EXPANDED VIEW - Shows on Click */}
                  {isExpanded && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 space-y-3">
                      {/* Address */}
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Adresse:</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {lead.address || 'Keine Adresse'}
                        </p>
                      </div>

                      {/* Rating Removed */}

                      {/* Status */}
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status:</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${lead.status === 'new' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                          lead.status === 'contacted' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                            lead.status === 'converted' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                          {lead.status || 'new'}
                        </span>
                      </div>

                      {/* Email Source Info */}
                      {lead.email && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email-Quelle:</p>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${isManualEmail
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            }`}>
                            {isManualEmail ? '👤 Manuell eingegeben' : '🤖 Automatisch gefunden'}
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteLead(lead.id, lead.company_name || lead.name)
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
                        >
                          🗑️ Löschen
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsInvalid(lead.id)
                          }}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition text-sm font-medium"
                        >
                          ⚠️ Als ungültig markieren
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsContacted(lead.id)
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
                        >
                          ✅ Als kontaktiert markieren
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      {/* Search Leads Modal (Add More Leads) */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-left">Add More Leads</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-left">Configure search parameters to find additional leads</p>
                </div>
                <button
                  onClick={handleCloseSearchModal}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleStartSearch} className="p-6 space-y-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={searchFormData.location}
                  onChange={handleSearchChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Munich, Germany"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">City name or coordinates</p>
              </div>

              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Radius: {(searchFormData.radius / 1000).toFixed(1)} km
                </label>
                <input
                  type="range"
                  id="radius"
                  name="radius"
                  value={searchFormData.radius}
                  onChange={handleSearchChange}
                  min="5000"
                  max="50000"
                  step="1000"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>5 km</span>
                  <span>50 km</span>
                </div>
              </div>

              <div>
                <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Keywords *
                </label>
                <input
                  type="text"
                  id="keywords"
                  name="keywords"
                  value={searchFormData.keywords}
                  onChange={handleSearchChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="restaurant, cafe, hotel"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Comma-separated search terms</p>
              </div>

              <div>
                <label htmlFor="targetLeadCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Lead Count
                </label>
                <input
                  type="number"
                  id="targetLeadCount"
                  name="targetLeadCount"
                  value={searchFormData.targetLeadCount}
                  onChange={handleSearchChange}
                  min="10"
                  max="1000"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minRating" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Min Rating: {searchFormData.minRating}
                  </label>
                  <input
                    type="range"
                    id="minRating"
                    name="minRating"
                    value={searchFormData.minRating}
                    onChange={handleSearchChange}
                    min="0"
                    max="5"
                    step="0.5"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="minReviews" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Min Reviews
                  </label>
                  <input
                    type="number"
                    id="minReviews"
                    name="minReviews"
                    value={searchFormData.minReviews}
                    onChange={handleSearchChange}
                    min="0"
                    max="1000"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Credit Cost Display */}
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 text-left">
                  Estimated Cost: <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{calculateCost()} Credits</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-left">
                  1 Credit per Lead
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseSearchModal}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg transition"
                >
                  Start Search
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crawling Loading Overlay */}
      {isCrawling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-sm">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-center text-gray-900 dark:text-white">Crawling leads...</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center mt-2">This may take a minute</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">Please wait while we search for leads</p>
          </div>
        </div>
      )}

      {/* Manual Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Email manuell hinzufügen</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Fügen Sie eine Email-Adresse für <strong>{selectedLeadForEmail?.company_name || 'diesen Lead'}</strong> hinzu.
            </p>

            <div className="mb-4">
              <label htmlFor="manualEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Adresse
              </label>
              <input
                type="email"
                id="manualEmail"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="name@firma.de"
                autoFocus
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-6 border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Hinweis:</strong> Sie tragen diese Email auf eigene Verantwortung ein. Stellen Sie sicher, dass Sie die Berechtigung haben, diese Person zu kontaktieren.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveManualEmail}
                disabled={!manualEmail}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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

export default CampaignDetail
