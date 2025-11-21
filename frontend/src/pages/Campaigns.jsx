import { useState, useEffect } from 'react'
import { getCurrentUser } from '../lib/supabase'

function Campaigns({ onNavigate }) {
  const [user, setUser] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    description: '',
    type: 'Lead Generation',
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

      // TODO: Fetch campaigns from API when endpoint is ready
      // For now, show empty state
      setCampaigns([])
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
      type: 'Lead Generation',
    })
  }

  const handleCampaignChange = (e) => {
    const { name, value } = e.target
    setCampaignFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateCampaign = async (e) => {
    e.preventDefault()

    // TODO: POST to /api/campaigns/create
    console.log('Creating campaign:', campaignFormData)

    // For now, show success and close
    alert('Campaign created successfully!\n\nAPI endpoint: POST /api/campaigns/create\nStatus: Draft\n\nNext: Click "Search Leads" to start crawling.')
    handleCloseCreateModal()

    // TODO: Add to campaigns list with status="draft"
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

  const handleStartSearch = async (e) => {
    e.preventDefault()

    // TODO: POST to /api/campaigns/crawl/start
    console.log('Starting lead search:', {
      campaign_id: selectedCampaign?.id,
      ...searchFormData
    })

    alert('Lead search started!\n\nAPI endpoint: POST /api/campaigns/crawl/start\nStatus: Crawling\n\nThe campaign will update with results as leads are found.')
    handleCloseSearchModal()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Voyanero</h1>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Campaigns
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">My Campaigns</h2>
            <p className="text-gray-600">Create and manage your lead generation campaigns</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            + New Campaign
          </button>
        </div>

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first campaign to start capturing leads
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              Create Your First Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{campaign.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{campaign.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{campaign.leads_count} leads</span>
                  <button className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded transition">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Campaign Modal (Step 1) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Create New Campaign</h2>
                <button
                  onClick={handleCloseCreateModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={campaignFormData.name}
                  onChange={handleCampaignChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Munich Restaurant Outreach Q1"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={campaignFormData.description}
                  onChange={handleCampaignChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your campaign goals and target audience..."
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Type *
                </label>
                <select
                  id="type"
                  name="type"
                  value={campaignFormData.type}
                  onChange={handleCampaignChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Lead Generation">Lead Generation</option>
                  <option value="Email Outreach">Email Outreach</option>
                  <option value="Cold Calling">Cold Calling</option>
                </select>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Search Leads</h2>
                  <p className="text-sm text-gray-600 mt-1">Configure search parameters for lead generation</p>
                </div>
                <button
                  onClick={handleCloseSearchModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleStartSearch} className="p-6 space-y-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={searchFormData.location}
                  onChange={handleSearchChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Munich, Germany"
                />
                <p className="mt-1 text-sm text-gray-500">City name or coordinates</p>
              </div>

              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
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
                <div className="flex justify-between text-xs text-gray-500">
                  <span>5 km</span>
                  <span>50 km</span>
                </div>
              </div>

              <div>
                <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords *
                </label>
                <input
                  type="text"
                  id="keywords"
                  name="keywords"
                  value={searchFormData.keywords}
                  onChange={handleSearchChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="restaurant, cafe, hotel"
                />
                <p className="mt-1 text-sm text-gray-500">Comma-separated search terms</p>
              </div>

              <div>
                <label htmlFor="targetLeadCount" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minRating" className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label htmlFor="minReviews" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="minLeadScore" className="block text-sm font-medium text-gray-700 mb-2">
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
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseSearchModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Start Search
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Campaigns
