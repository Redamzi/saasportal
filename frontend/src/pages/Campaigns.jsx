import { useState, useEffect } from 'react'
import { Eye, Search, Trash2, FolderKanban, Plus, X } from 'lucide-react'
import { getCurrentUser } from '../lib/supabase'
import Layout from '../components/Layout'
import MagicButton from '../components/MagicButton'

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
    targetLeadCount: 10,
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

  const handleOpenCreateModal = () => setShowCreateModal(true)
  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
    setCampaignFormData({ name: '', description: '', type: 'lead_generation' })
  }

  const handleCampaignChange = (e) => {
    const { name, value } = e.target
    setCampaignFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateCampaign = async (e) => {
    e.preventDefault()
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/campaigns/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          name: campaignFormData.name,
          description: campaignFormData.description,
          type: campaignFormData.type,
        }),
      })

      if (!response.ok) throw new Error('Failed to create campaign')
      const data = await response.json()

      if (data.success) {
        setCampaigns((prev) => [data.campaign, ...prev])
        handleCloseCreateModal()
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
    }
  }

  const handleOpenSearchModal = (campaign) => {
    setSelectedCampaign(campaign)
    setShowSearchModal(true)
  }

  const handleCloseSearchModal = () => {
    setShowSearchModal(false)
    setSearchFormData({
      location: '', radius: 5000, keywords: '', targetLeadCount: 10,
      minRating: 0, minReviews: 0, minLeadScore: 0,
    })
    setSelectedCampaign(null)
  }

  const handleSearchChange = (e) => {
    const { name, value } = e.target
    setSearchFormData((prev) => ({ ...prev, [name]: value }))
  }

  const calculateCost = () => parseInt(searchFormData.targetLeadCount) || 10

  const handleStartSearch = async (e) => {
    e.preventDefault()
    handleCloseSearchModal()
    setIsCrawling(true)

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/campaigns/crawl/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      if (!response.ok) throw new Error('Failed to start crawl')
      const data = await response.json()

      if (data.success) {
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`${API_URL}/api/campaigns/${selectedCampaign.id}`)
            if (statusRes.ok) {
              const statusData = await statusRes.json()
              const campaign = statusData.campaign
              if (campaign.status === 'completed' || campaign.status === 'failed') {
                clearInterval(pollInterval)
                setIsCrawling(false)
                loadData()
              }
            }
          } catch (err) { console.error(err) }
        }, 2000)

        setTimeout(() => {
          clearInterval(pollInterval)
          setIsCrawling(false)
          loadData()
        }, 60000)
      } else {
        setIsCrawling(false)
        throw new Error('Crawl failed')
      }
    } catch (error) {
      console.error('Error starting search:', error)
      setIsCrawling(false)
    }
  }

  const handleDeleteCampaign = async (campaignId, campaignName) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to delete')
      setCampaigns(campaigns.filter(c => c.id !== campaignId))
    } catch (error) {
      console.error('Delete error:', error)
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
      currentPage="campaigns"
      user={user}
      title="Meine Kampagnen"
      subtitle="Erstellen und verwalten Sie Ihre Lead-Generierungs-Kampagnen"
      actions={
        <MagicButton
          onClick={handleOpenCreateModal}
          icon={Plus}
          className="py-2 px-4"
        >
          Neue Kampagne
        </MagicButton>
      }
    >
      {campaigns.length === 0 ? (
        <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <FolderKanban className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Keine Kampagnen vorhanden</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Starten Sie Ihre erste Kampagne, um automatisch Leads in Ihrer Zielregion zu finden.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="bg-voyanero-500 hover:bg-voyanero-400 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-voyanero-500/20 transition-all hover:-translate-y-0.5"
          >
            Erste Kampagne erstellen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1 group">
              {/* Header */}
              <div className="p-6 border-b border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${campaign.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    campaign.status === 'crawling' ? 'bg-voyanero-500/10 text-voyanero-400 border-voyanero-500/20' :
                      campaign.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>
                    {campaign.status}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(campaign.id, campaign.name) }}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 truncate">{campaign.name}</h3>
                <p className="text-sm text-gray-400 line-clamp-2 h-10">{campaign.description || 'Keine Beschreibung'}</p>
              </div>

              {/* Stats */}
              <div className="p-6 bg-black/20 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Leads</p>
                  <p className="text-2xl font-bold text-white">{campaign.leads_count || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Typ</p>
                  <p className="text-sm font-medium text-gray-300 capitalize">{campaign.type?.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4">
                {campaign.status === 'draft' ? (
                  <button
                    onClick={() => handleOpenSearchModal(campaign)}
                    className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Search size={18} />
                    Leads suchen
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('campaignDetail', { campaignId: campaign.id })}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group-hover:bg-voyanero-500 group-hover:border-voyanero-500 group-hover:shadow-lg group-hover:shadow-voyanero-500/20"
                  >
                    <Eye size={18} />
                    Details ansehen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals would need similar styling updates, keeping them simple for now but dark mode compatible */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0B1121] border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Neue Kampagne</h2>
              <button onClick={handleCloseCreateModal} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={campaignFormData.name}
                  onChange={handleCampaignChange}
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-voyanero-500 focus:border-transparent outline-none"
                  placeholder="z.B. Restaurants München"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Beschreibung</label>
                <textarea
                  name="description"
                  value={campaignFormData.description}
                  onChange={handleCampaignChange}
                  rows="3"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-voyanero-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={handleCloseCreateModal} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold">Abbrechen</button>
                <MagicButton type="submit" className="py-2 px-6">
                  Erstellen
                </MagicButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Modal - Simplified for brevity but dark styled */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0B1121] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Leads suchen</h2>
              <button onClick={handleCloseSearchModal} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleStartSearch} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Ort</label>
                  <input
                    type="text"
                    name="location"
                    value={searchFormData.location}
                    onChange={handleSearchChange}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-voyanero-500 outline-none"
                    placeholder="München"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Radius (km)</label>
                  <input
                    type="number"
                    name="radius"
                    value={searchFormData.radius / 1000}
                    onChange={(e) => setSearchFormData({ ...searchFormData, radius: parseInt(e.target.value) * 1000 })}
                    min="1"
                    max="50"
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-voyanero-500 outline-none"
                    placeholder="5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Keywords</label>
                <input
                  type="text"
                  name="keywords"
                  value={searchFormData.keywords}
                  onChange={handleSearchChange}
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-voyanero-500 outline-none"
                  placeholder="Restaurant, Cafe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Anzahl Leads: {searchFormData.targetLeadCount}</label>
                <input
                  type="range"
                  name="targetLeadCount"
                  value={searchFormData.targetLeadCount}
                  onChange={handleSearchChange}
                  min="10"
                  max="500"
                  className="w-full accent-voyanero-500"
                />
              </div>

              <div className="bg-voyanero-500/10 border border-voyanero-500/20 p-4 rounded-xl">
                <p className="text-voyanero-400 font-bold">Kosten: {calculateCost()} Credits</p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={handleCloseSearchModal} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold">Abbrechen</button>
                <MagicButton type="submit" icon={Search} className="py-2 px-6">
                  Suche starten
                </MagicButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Campaigns
