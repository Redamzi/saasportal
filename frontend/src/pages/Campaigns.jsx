import { useState, useEffect } from 'react'
import { Eye, Search, Trash2, FolderKanban } from 'lucide-react'
import { getCurrentUser } from '../lib/supabase'
import DarkModeToggle from '../components/DarkModeToggle'

function Campaigns({ onNavigate }) {
  const [user, setUser] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCrawling, setIsCrawling] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    description: '',
    type: 'lead_generation',
  })

  const [searchFormData, setSearchFormData] = useState({
    location: '',
    radius: 5000,
    keywords: '',
    targetLeadCount: 100,
    minRating: 0,
    minReviews: 0,
    minLeadScore: 0,
  })

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

      // Fetch campaigns from API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/campaigns/list/${currentUser.id}`)

      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      } else {
        console.error('Failed to fetch campaigns')
        setCampaigns([])
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const { signOut } = await import('../lib/supabase')
    await signOut()
    onNavigate('login')
  }

  // Campaign Creation Modal
  const handleOpenCreateModal = () => {
    setShowCreateModal(true)
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
    setCampaignFormData({
      name: '',
      description: '',
      type: 'lead_generation',
    })
  }

  const handleCampaignChange = (e) => {
    const { name, value } = e.target
    setCampaignFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateCampaign = async (e) => {
    e.preventDefault()

    try {
      // Create campaign via API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/campaigns/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          name: campaignFormData.name,
          description: campaignFormData.description,
          type: campaignFormData.type,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create campaign')
      }

      const data = await response.json()

      if (data.success) {
        // Add new campaign to list
        setCampaigns((prev) => [data.campaign, ...prev])

        alert('✅ Campaign created successfully!\n\nStatus: Draft\n\nNext: Click "Search Leads" to start crawling.')
        handleCloseCreateModal()
      } else {
        throw new Error('Campaign creation failed')
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('❌ Failed to create campaign. Please try again.')
    }
  }

  // Search Leads Modal
  const handleOpenSearchModal = (campaign) => {
    setSelectedCampaign(campaign)
    setShowSearchModal(true)
  }

  const handleCloseSearchModal = () => {
    setShowSearchModal(false)
    setSearchFormData({
      location: '',
      radius: 5000,
      keywords: '',
      targetLeadCount: 100,
      minRating: 0,
      minReviews: 0,
      minLeadScore: 0,
    })
    setSelectedCampaign(null)
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

    // Close modal
    handleCloseSearchModal()

    // Show loading state
    setIsCrawling(true)

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

      const response = await fetch(`${API_URL}/api/campaigns/crawl/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_id: selectedCampaign.id,
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
        // Poll campaign status until completed
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`${API_URL}/api/campaigns/${selectedCampaign.id}`)
            if (statusRes.ok) {
              const statusData = await statusRes.json()
              const campaign = statusData.campaign

              // Check if crawl is done
              if (campaign.status === 'completed' || campaign.status === 'failed') {
                clearInterval(pollInterval)
                setIsCrawling(false)
                loadData()

                const leadsCount = statusData.leads?.length || 0
                if (campaign.status === 'completed') {
                  alert(`✅ Lead search completed!\n\nLeads found: ${leadsCount}`)
                } else {
                  alert(`❌ Lead search failed.\n\nError: ${campaign.metadata?.error || 'Unknown error'}`)
                }
              }
            }
          } catch (err) {
            console.error('Error polling status:', err)
          }
        }, 2000) // Check every 2 seconds

        // Timeout after 60 seconds
        setTimeout(() => {
          clearInterval(pollInterval)
          setIsCrawling(false)
          loadData()
          alert('⏱️ Crawl is taking longer than expected. Please check the campaign details.')
        }, 60000)
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

  // Delete Campaign
  const handleDeleteCampaign = async (campaignId, campaignName) => {
    const confirmMsg = `Campaign "${campaignName}" wirklich löschen?\n\nAlle zugehörigen Leads werden ebenfalls gelöscht.\n\nDieser Vorgang kann nicht rückgängig gemacht werden.`

    if (!window.confirm(confirmMsg)) {
      console.log('🚫 Campaign deletion cancelled by user')
      return
    }

    try {
      console.log('🗑️ Attempting to delete campaign:', campaignId)
      console.log('📝 Campaign name:', campaignName)

      const { user: currentUser } = await getCurrentUser()

      if (!currentUser) {
        console.error('❌ Auth error: No user found')
        alert('❌ Nicht eingeloggt. Bitte melden Sie sich erneut an.')
        return
      }

      console.log('👤 User ID:', currentUser.id)
      console.log('📡 Calling DELETE endpoint...')

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const deleteUrl = `${API_URL}/api/campaigns/${campaignId}`

      console.log('🌐 DELETE URL:', deleteUrl)

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'user-id': currentUser.id
        }
      })

      console.log('📊 Response status:', response.status)
      console.log('📊 Response OK:', response.ok)

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        let errorMessage = `HTTP ${response.status}`

        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            console.error('❌ Server error (JSON):', errorData)
            errorMessage = errorData.detail || errorData.message || errorMessage
          } catch (parseError) {
            console.error('❌ Failed to parse error JSON:', parseError)
          }
        } else {
          const errorText = await response.text()
          console.error('❌ Server error (Text):', errorText)
          errorMessage = errorText || errorMessage
        }

        throw new Error(errorMessage)
      }

      console.log('✅ Campaign deleted successfully from backend')

      // Remove from local state immediately
      setCampaigns(campaigns.filter(c => c.id !== campaignId))
      console.log('✅ Campaign removed from local state')

      alert('✅ Campaign erfolgreich gelöscht!')

    } catch (error) {
      console.error('💥 Delete campaign error:', error)
      console.error('💥 Error name:', error.name)
      console.error('💥 Error message:', error.message)
      console.error('💥 Error stack:', error.stack)

      alert(`❌ Fehler beim Löschen der Campaign:\n\n${error.message}\n\nBitte versuchen Sie es erneut oder kontaktieren Sie den Support.`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading campaigns...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
            >
              ← Zurück zum Dashboard
            </button>
            <DarkModeToggle />
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-left">Meine Kampagnen</h1>
              <p className="text-slate-600 dark:text-gray-400 text-left">Erstellen und verwalten Sie Ihre Lead-Generierungs-Kampagnen</p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-6 py-3 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium rounded-lg transition shadow-sm flex items-center gap-2"
            >
              <FolderKanban className="w-4 h-4" />
              Neue Kampagne
            </button>
          </div>
        </div>

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-slate-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <FolderKanban className="w-12 h-12 text-slate-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 text-center">Keine Kampagnen vorhanden</h3>
            <p className="text-slate-600 dark:text-gray-400 mb-6 text-center">
              Erstellen Sie Ihre erste Kampagne, um mit der Lead-Generierung zu beginnen
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-6 py-3 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium rounded-lg transition shadow-sm"
            >
              Erste Kampagne erstellen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${campaign.status === 'ready' ? 'bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' :
                        campaign.status === 'crawling' ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                          campaign.status === 'failed' ? 'bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300' :
                            campaign.status === 'running' ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' :
                              campaign.status === 'paused' ? 'bg-orange-50 dark:bg-orange-900 text-orange-700 dark:text-orange-300' :
                                campaign.status === 'completed' ? 'bg-purple-50 dark:bg-purple-900 text-purple-700 dark:text-purple-300' :
                                  'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300'
                      }`}>
                      {campaign.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCampaign(campaign.id, campaign.name)
                      }}
                      className="text-slate-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition"
                      title="Campaign löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 text-left">{campaign.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400 line-clamp-2 text-left">{campaign.description || 'Keine Beschreibung'}</p>
                </div>

                {/* Stats */}
                <div className="p-6 bg-slate-50 dark:bg-gray-900 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-gray-400 uppercase font-semibold text-left">Leads</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white text-left">{campaign.leads_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-gray-400 uppercase font-semibold text-left">Typ</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-gray-300 capitalize text-left">{campaign.type?.replace('_', ' ')}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 flex gap-2">
                  {campaign.status === 'draft' ? (
                    <button
                      onClick={() => handleOpenSearchModal(campaign)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800 transition text-sm font-medium"
                    >
                      <Search className="w-4 h-4" />
                      Leads suchen
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigate('campaignDetail', { campaignId: campaign.id })}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal (Step 1) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-left">Create New Campaign</h2>
                <button
                  onClick={handleCloseCreateModal}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={campaignFormData.name}
                  onChange={handleCampaignChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Munich Restaurant Outreach Q1"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={campaignFormData.description}
                  onChange={handleCampaignChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe your campaign goals and target audience..."
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Campaign Type *
                </label>
                <select
                  id="type"
                  name="type"
                  value={campaignFormData.type}
                  onChange={handleCampaignChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="lead_generation">Lead Generation</option>
                  <option value="email_outreach">Email Outreach</option>
                  <option value="cold_calling">Cold Calling</option>
                </select>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg transition"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Leads Modal (Step 2) */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-left">Search Leads</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-left">Configure search parameters for lead generation</p>
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

              <div>
                <label htmlFor="minLeadScore" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Lead Score: {searchFormData.minLeadScore}
                </label>
                <input
                  type="range"
                  id="minLeadScore"
                  name="minLeadScore"
                  value={searchFormData.minLeadScore}
                  onChange={handleSearchChange}
                  min="0"
                  max="100"
                  step="5"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>0</span>
                  <span>100</span>
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
    </>
  )
}

export default Campaigns
