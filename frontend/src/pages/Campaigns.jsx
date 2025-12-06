import { useState, useEffect } from 'react'
import { Eye, Search, Trash2, FolderKanban, Plus, X, RefreshCw, Check, Globe, Mail, Bot } from 'lucide-react'
import { getCurrentUser } from '../lib/supabase'
import Layout from '../components/Layout'
import MagicButton from '../components/MagicButton'
import UnifiedCampaignModal from '../components/campaigns/UnifiedCampaignModal'

function Campaigns({ onNavigate }) {
  const [user, setUser] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

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
  const handleCloseCreateModal = () => setShowCreateModal(false)

  const handleUnifiedCreate = async (data) => {
    setIsCreating(true)
    handleCloseCreateModal()

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

      // 1. Create Campaign
      const createResponse = await fetch(`${API_URL}/api/campaigns/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          name: data.name,
          description: `Suche: ${data.keywords} in ${data.location}`,
          type: data.type,
          email_config: data.config // Save config for later logic
        }),
      })

      if (!createResponse.ok) throw new Error('Failed to create campaign')
      const createResult = await createResponse.json()
      const newCampaign = createResult.campaign

      // Update local state immediately with 'crawling' status
      const campaignWithStatus = {
        ...newCampaign,
        status: 'crawling',
        leads_count: 0
      }
      setCampaigns((prev) => [campaignWithStatus, ...prev])

      // 2. Start Search & Processing (Background Task)
      const crawlResponse = await fetch(`${API_URL}/api/campaigns/crawl/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: newCampaign.id,
          user_id: user.id,
          location: data.location,
          keywords: data.keywords,
          radius: data.radius,
          target_lead_count: data.targetLeadCount,
          // Add extra params if needed for package logic
        }),
      })

      if (!crawlResponse.ok) {
        // Revert or mark failed
        setCampaigns(prev => prev.map(c =>
          c.id === newCampaign.id ? { ...c, status: 'failed' } : c
        ))
        throw new Error('Failed to start process')
      }

      // 3. Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_URL}/api/campaigns/${newCampaign.id}`)
          if (statusRes.ok) {
            const statusData = await statusRes.json()
            const updatedCampaign = statusData.campaign

            if (updatedCampaign.status === 'completed' || updatedCampaign.status === 'failed') {
              clearInterval(pollInterval)
              loadData()
            } else {
              setCampaigns(prev => prev.map(c =>
                c.id === newCampaign.id ? {
                  ...c,
                  status: updatedCampaign.status,
                  leads_count: statusData.leads?.length || 0
                } : c
              ))
            }
          }
        } catch (err) { console.error(err) }
      }, 3000)

      // Stop polling after 2 minutes
      setTimeout(() => clearInterval(pollInterval), 120000)

    } catch (error) {
      console.error('Error in unified create flow:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteCampaign = async (campaignId, campaignName) => {
    if (!confirm(`Kampagne "${campaignName}" wirklich löschen?`)) return

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

  // Helper to determine active features based on campaign type/config
  const getActiveFeatures = (campaign) => {
    // Default features
    const features = { leads: true, enrichment: false, ai: false }

    // Check type
    if (campaign.type === 'ai_email_campaign') {
      features.enrichment = true
      features.ai = true
    }

    // Check config
    if (campaign.email_config?.enrichment_enabled) {
      features.enrichment = true
    }
    if (campaign.email_config?.ai_enabled) {
      features.ai = true
      features.enrichment = true
    }

    return features
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
      {/* Unified Create Modal */}
      <UnifiedCampaignModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onCreate={handleUnifiedCreate}
      />

      {campaigns.length === 0 ? (
        <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <FolderKanban className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Keine Kampagnen vorhanden</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Starten Sie Ihre erste Kampagne mit dem neuen Fast-Track Modal.
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
          {campaigns.map((campaign) => {
            const features = getActiveFeatures(campaign)

            return (
              <div key={campaign.id} className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1 group flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-white/5 relative">
                  {/* Status Badge Absolute Top Right */}
                  <div className="absolute top-6 right-6 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(campaign.id, campaign.name) }}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${campaign.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      campaign.status === 'crawling' ? 'bg-voyanero-500/10 text-voyanero-400 border-voyanero-500/20' :
                        campaign.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                      {campaign.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 truncate pr-8" title={campaign.name}>
                    {campaign.name}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-1 h-5">{campaign.description || 'Keine Beschreibung'}</p>
                </div>

                {/* Stats Grid */}
                <div className="p-6 bg-black/20 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Leads</p>
                    {campaign.status === 'crawling' ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw size={20} className="text-voyanero-400 animate-spin" />
                        <p className="text-sm text-voyanero-400 font-medium">Lädt...</p>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-white">{campaign.leads_count || 0}</p>
                    )}
                  </div>

                  {/* Cost or Type */}
                  <div className="flex flex-col items-end">
                    {campaign.status === 'completed' && campaign.credits_used ? (
                      <>
                        <p className="text-xs text-voyanero-500 uppercase font-bold mb-1">Kosten</p>
                        <p className="text-xl font-bold text-white">{campaign.credits_used} <span className="text-xs font-normal text-gray-500">Credits</span></p>
                      </>
                    ) : (
                      <>
                        <div className="flex gap-2 items-center justify-end h-full">
                          <div className={`p-2 rounded-lg ${features.leads ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-600'}`} title="Leads">
                            <Globe size={16} />
                          </div>
                          <div className={`p-2 rounded-lg ${features.enrichment ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-600'}`} title="Enrichment">
                            <Mail size={16} />
                          </div>
                          <div className={`p-2 rounded-lg ${features.ai ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-gray-600'}`} title="AI Autopilot">
                            <Bot size={16} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Feature Checklist (Short) */}
                <div className="px-6 py-4 space-y-2">
                  <div className="flex items-center text-xs text-gray-400">
                    <Check size={12} className="text-green-500 mr-2" />
                    <span>Lead Generierung</span>
                  </div>
                  {features.enrichment && (
                    <div className="flex items-center text-xs text-gray-400">
                      <Check size={12} className="text-purple-500 mr-2" />
                      <span>Email Enrichment</span>
                    </div>
                  )}
                  {features.ai && (
                    <div className="flex items-center text-xs text-gray-400">
                      <Check size={12} className="text-pink-500 mr-2" />
                      <span>AI Autopilot</span>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="p-4 mt-auto border-t border-white/5">
                  <button
                    onClick={() => onNavigate('campaignDetail', { campaignId: campaign.id })}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group-hover:bg-voyanero-500 group-hover:border-voyanero-500 group-hover:shadow-lg group-hover:shadow-voyanero-500/20"
                  >
                    <Eye size={18} />
                    Details ansehen
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}

export default Campaigns
