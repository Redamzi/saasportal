import { useState, useEffect } from 'react'
import { X, Globe, Mail, Bot, Check, Search, AlertCircle } from 'lucide-react'
import MagicButton from '../MagicButton'

/**
 * Unified Campaign Modal (V6)
 * Combines search settings and package selection in one streamlined view.
 */
export default function UnifiedCampaignModal({ isOpen, onClose, onCreate }) {
    const [formData, setFormData] = useState({
        location: '',
        keywords: '',
        radius: 5000,
        targetLeadCount: 10,
        package: 'leads_only', // 'leads_only', 'enrichment', 'ai_autopilot'
    })

    const [creditsBalance, setCreditsBalance] = useState(0) // Should be passed as prop ideally

    // Auto-generate title for preview
    const campaignTitle = formData.keywords && formData.location
        ? `${formData.keywords} in ${formData.location}`
        : 'Neue Kampagne'

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handlePackageSelect = (pkg) => {
        setFormData(prev => ({ ...prev, package: pkg }))
    }

    // Cost calculation based on V5 Pricing
    const calculateMaxCost = () => {
        const leads = parseInt(formData.targetLeadCount) || 10
        const baseCost = leads * 1.0 // 1 Credit per Lead

        // Additional costs (estimated max)
        let maxAdditional = 0
        if (formData.package === 'enrichment') {
            maxAdditional = leads * 0.5 // +0.5 Enrichment
        } else if (formData.package === 'ai_autopilot') {
            maxAdditional = leads * 1.0 // +0.5 Enrichment + 0.5 AI
        }

        return baseCost + maxAdditional
    }

    const handleSubmit = () => {
        onCreate({
            ...formData,
            name: campaignTitle, // Auto-generated name
            type: formData.package === 'ai_autopilot' ? 'ai_email_campaign' : 'lead_generation',
            config: {
                enrichment_enabled: formData.package !== 'leads_only',
                ai_enabled: formData.package === 'ai_autopilot'
            }
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0B1121] border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">

                {/* LEFT COLUMN: Search Settings */}
                <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-white/10 bg-white/5">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">Sucheinstellungen</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Was suchen Sie?
                            </label>
                            <input
                                type="text"
                                name="keywords"
                                value={formData.keywords}
                                onChange={handleInputChange}
                                placeholder="z.B. Pizzeria, Zahnarzt, Marketing"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-voyanero-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Wo suchen Sie?
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                placeholder="z.B. Berlin, München"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-voyanero-500 transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Radius (Meter)
                                </label>
                                <input
                                    type="number"
                                    name="radius"
                                    value={formData.radius}
                                    onChange={handleInputChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-voyanero-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Anzahl Leads
                                </label>
                                <input
                                    type="number"
                                    name="targetLeadCount"
                                    value={formData.targetLeadCount}
                                    onChange={handleInputChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-voyanero-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-voyanero-500/10 border border-voyanero-500/20 rounded-xl">
                        <h3 className="text-sm font-bold text-voyanero-400 mb-1">Vorschau Titel</h3>
                        <p className="text-white text-lg font-bold truncate">{campaignTitle}</p>
                    </div>
                </div>

                {/* RIGHT COLUMN: Package Selection */}
                <div className="w-full md:w-2/3 p-6 bg-[#0B1121] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">Paket wählen</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-auto">

                        {/* Package 1: Leads Only */}
                        <div
                            onClick={() => handlePackageSelect('leads_only')}
                            className={`cursor-pointer rounded-xl p-5 border-2 transition-all relative group
                ${formData.package === 'leads_only'
                                    ? 'border-voyanero-500 bg-voyanero-500/5'
                                    : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                                <Globe size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Nur Leads</h3>
                            <p className="text-xs text-gray-400 mb-4 h-10">Basis-Daten für manuellen Export. Ideal für eigene Akquise.</p>
                            <ul className="space-y-2 mb-4">
                                <li className="flex items-center text-xs text-gray-300">
                                    <Check size={12} className="text-green-400 mr-2" /> Firmendaten
                                </li>
                                <li className="flex items-center text-xs text-gray-300">
                                    <Check size={12} className="text-green-400 mr-2" /> Webseite & Tel
                                </li>
                            </ul>
                            <div className="mt-auto pt-4 border-t border-white/5">
                                <div className="text-xl font-bold text-white">1.0 <span className="text-xs font-normal text-gray-500">Credits/Lead</span></div>
                            </div>
                        </div>

                        {/* Package 2: Enrichment */}
                        <div
                            onClick={() => handlePackageSelect('enrichment')}
                            className={`cursor-pointer rounded-xl p-5 border-2 transition-all relative group
                ${formData.package === 'enrichment'
                                    ? 'border-purple-500 bg-purple-500/5'
                                    : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                                <Mail size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Enrichment</h3>
                            <p className="text-xs text-gray-400 mb-4 h-10">Findet zusätzlich E-Mail Adressen und Ansprechpartner.</p>
                            <ul className="space-y-2 mb-4">
                                <li className="flex items-center text-xs text-gray-300">
                                    <Check size={12} className="text-green-400 mr-2" /> Alles aus "Nur Leads"
                                </li>
                                <li className="flex items-center text-xs text-gray-300">
                                    <Check size={12} className="text-green-400 mr-2" /> E-Mail Suche
                                </li>
                            </ul>
                            <div className="mt-auto pt-4 border-t border-white/5">
                                <div className="text-xl font-bold text-white">1.5 <span className="text-xs font-normal text-gray-500">Credits (Max)</span></div>
                                <div className="text-[10px] text-gray-500 mt-1">Nur bei Erfolg (+0.5)</div>
                            </div>
                        </div>

                        {/* Package 3: AI Autopilot */}
                        <div
                            onClick={() => handlePackageSelect('ai_autopilot')}
                            className={`cursor-pointer rounded-xl p-5 border-2 transition-all relative group
                ${formData.package === 'ai_autopilot'
                                    ? 'border-pink-500 bg-pink-500/5 shadow-[0_0_20px_rgba(236,72,153,0.15)]'
                                    : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                        >
                            {formData.package === 'ai_autopilot' && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Empfohlen
                                </div>
                            )}
                            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 mb-4">
                                <Bot size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">AI Autopilot</h3>
                            <p className="text-xs text-gray-400 mb-4 h-10">Vollautomatisch: Findet Leads und schreibt/sendet E-Mails.</p>
                            <ul className="space-y-2 mb-4">
                                <li className="flex items-center text-xs text-gray-300">
                                    <Check size={12} className="text-green-400 mr-2" /> Alles aus "Enrichment"
                                </li>
                                <li className="flex items-center text-xs text-gray-300">
                                    <Check size={12} className="text-green-400 mr-2" /> AI E-Mail Gen & Versand
                                </li>
                            </ul>
                            <div className="mt-auto pt-4 border-t border-white/5">
                                <div className="text-xl font-bold text-white">2.0 <span className="text-xs font-normal text-gray-500">Credits (Max)</span></div>
                                <div className="text-[10px] text-gray-500 mt-1">Nur bei Erfolg (+0.5 +0.5)</div>
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-end gap-6">
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Geschätzte Kosten</p>
                            <p className="text-2xl font-bold text-white">
                                Max. {calculateMaxCost().toFixed(1)} <span className="text-sm font-normal text-voyanero-400">Credits</span>
                            </p>
                        </div>

                        <MagicButton
                            onClick={handleSubmit}
                            disabled={!formData.location || !formData.keywords}
                            icon={Search}
                            className="py-4 px-8 text-lg"
                        >
                            Kampagne starten
                        </MagicButton>
                    </div>

                </div>
            </div>
        </div>
    )
}
