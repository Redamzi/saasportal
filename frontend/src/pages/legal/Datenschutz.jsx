import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/supabase'
import { Shield, Lock, Eye, Database } from 'lucide-react'
import Layout from '../../components/Layout'

export default function Datenschutz({ onNavigate }) {
    const [user, setUser] = useState(null)

    useEffect(() => {
        loadUser()
    }, [])

    const loadUser = async () => {
        const { user } = await getCurrentUser()
        setUser(user)
    }

    return (
        <Layout onNavigate={onNavigate} currentPage="datenschutz" user={user}>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Datenschutzerklärung</h1>
                    <p className="text-gray-400 text-lg">Ihre Privatsphäre ist uns wichtig</p>
                </div>

                {/* Content */}
                <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl">
                    <div className="prose prose-invert max-w-none space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <Shield className="w-6 h-6 text-voyanero-500" />
                                1. Verantwortliche Stelle
                            </h2>
                            <p className="text-gray-300">
                                Verantwortlich für die Datenverarbeitung auf dieser Website ist:
                            </p>
                            <div className="bg-black/30 border border-white/10 rounded-xl p-4 mt-3">
                                <p className="text-white font-medium">Voyanero</p>
                                <p className="text-gray-400">Kielstraße 28, 44145 Dortmund</p>
                                <p className="text-gray-400">E-Mail: datenschutz@voyanero.com</p>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <Database className="w-6 h-6 text-voyanero-500" />
                                2. Erhebung und Speicherung personenbezogener Daten
                            </h2>
                            <p className="text-gray-300 mb-3">Wir erheben folgende Daten:</p>
                            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                                <li>E-Mail-Adresse (bei Registrierung)</li>
                                <li>Firmenname und Kontaktdaten (optional)</li>
                                <li>IP-Adresse und Browser-Informationen (automatisch)</li>
                                <li>Nutzungsdaten (Kampagnen, Leads, Credits)</li>
                            </ul>
                        </div>

                        <div className="border-t border-white/10 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <Eye className="w-6 h-6 text-voyanero-500" />
                                3. Zweck der Datenverarbeitung
                            </h2>
                            <p className="text-gray-300 mb-3">Ihre Daten werden verwendet für:</p>
                            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                                <li>Bereitstellung und Verwaltung Ihres Accounts</li>
                                <li>Durchführung von E-Mail-Kampagnen</li>
                                <li>Abrechnung und Zahlungsabwicklung</li>
                                <li>Verbesserung unserer Dienstleistungen</li>
                                <li>Kommunikation mit Ihnen</li>
                            </ul>
                        </div>

                        <div className="border-t border-white/10 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">4. Rechtsgrundlage</h2>
                            <p className="text-gray-300">
                                Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
                            </p>
                        </div>

                        <div className="border-t border-white/10 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <Lock className="w-6 h-6 text-voyanero-500" />
                                5. Datensicherheit
                            </h2>
                            <p className="text-gray-300 mb-3">Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein:</p>
                            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                                <li>SSL/TLS-Verschlüsselung für alle Datenübertragungen</li>
                                <li>Regelmäßige Sicherheits-Updates</li>
                                <li>Zugriffskontrolle und Authentifizierung</li>
                                <li>Regelmäßige Backups</li>
                            </ul>
                        </div>

                        <div className="border-t border-white/10 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">6. Weitergabe von Daten</h2>
                            <p className="text-gray-300 mb-3">
                                Wir geben Ihre Daten nur an Dritte weiter, wenn:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                                <li>Sie ausdrücklich eingewilligt haben</li>
                                <li>Dies für die Vertragserfüllung erforderlich ist (z.B. Zahlungsdienstleister)</li>
                                <li>Eine gesetzliche Verpflichtung besteht</li>
                            </ul>
                        </div>

                        <div className="border-t border-white/10 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">7. Ihre Rechte</h2>
                            <p className="text-gray-300 mb-3">Sie haben folgende Rechte:</p>
                            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                                <li>Auskunft über Ihre gespeicherten Daten</li>
                                <li>Berichtigung unrichtiger Daten</li>
                                <li>Löschung Ihrer Daten</li>
                                <li>Einschränkung der Verarbeitung</li>
                                <li>Datenübertragbarkeit</li>
                                <li>Widerspruch gegen die Verarbeitung</li>
                            </ul>
                        </div>

                        <div className="border-t border-white/10 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">8. Cookies</h2>
                            <p className="text-gray-300">
                                Wir verwenden Cookies, um die Funktionalität unserer Website zu gewährleisten. Sie können Cookies in Ihren Browser-Einstellungen deaktivieren.
                            </p>
                        </div>

                        <div className="border-t border-white/10 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">9. Kontakt</h2>
                            <p className="text-gray-300">
                                Bei Fragen zum Datenschutz kontaktieren Sie uns unter: <a href="mailto:datenschutz@voyanero.com" className="text-voyanero-400 hover:text-voyanero-300 transition">datenschutz@voyanero.com</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
