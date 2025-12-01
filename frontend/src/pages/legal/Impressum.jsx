import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/supabase'
import { Building2, Mail, Phone, MapPin } from 'lucide-react'
import Layout from '../../components/Layout'

export default function Impressum({ onNavigate }) {
    const [user, setUser] = useState(null)

    useEffect(() => {
        loadUser()
    }, [])

    const loadUser = async () => {
        const { user } = await getCurrentUser()
        setUser(user)
    }

    return (
        <Layout onNavigate={onNavigate} currentPage="impressum" user={user}>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Impressum</h1>
                    <p className="text-gray-400 text-lg">Angaben gemäß § 5 TMG</p>
                </div>

                {/* Content */}
                <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl">
                    <div className="space-y-8">
                        {/* Company Info */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Building2 className="w-6 h-6 text-voyanero-500" />
                                <h2 className="text-2xl font-bold text-white">Firmeninformationen</h2>
                            </div>
                            <div className="space-y-2 text-gray-300">
                                <p className="text-lg font-semibold text-white">Voyanero</p>
                                <p>Inhaber: [Name]</p>
                                <div className="flex items-start gap-2 mt-4">
                                    <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                                    <div>
                                        <p>Kielstraße 28</p>
                                        <p>44145 Dortmund</p>
                                        <p>Deutschland</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="border-t border-white/10 pt-8">
                            <h3 className="text-xl font-bold text-white mb-4">Kontakt</h3>
                            <div className="space-y-3 text-gray-300">
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-gray-500" />
                                    <span>+49 (0) XXX XXXXXXX</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-gray-500" />
                                    <a href="mailto:kontakt@voyanero.com" className="text-voyanero-400 hover:text-voyanero-300 transition">
                                        kontakt@voyanero.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Legal */}
                        <div className="border-t border-white/10 pt-8">
                            <h3 className="text-xl font-bold text-white mb-4">Rechtliche Angaben</h3>
                            <div className="space-y-2 text-gray-300">
                                <p><strong className="text-white">Umsatzsteuer-ID:</strong> DE XXXXXXXXX</p>
                                <p><strong className="text-white">Registergericht:</strong> Amtsgericht Dortmund</p>
                                <p><strong className="text-white">Registernummer:</strong> HRB XXXXX</p>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="border-t border-white/10 pt-8">
                            <h3 className="text-xl font-bold text-white mb-4">Haftungsausschluss</h3>
                            <div className="space-y-4 text-gray-300 text-sm">
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Haftung für Inhalte</h4>
                                    <p>
                                        Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Haftung für Links</h4>
                                    <p>
                                        Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
