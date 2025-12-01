import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/supabase'
import { FileText } from 'lucide-react'
import Layout from '../../components/Layout'

export default function AGB({ onNavigate }) {
    const [user, setUser] = useState(null)

    useEffect(() => {
        loadUser()
    }, [])

    const loadUser = async () => {
        const { user } = await getCurrentUser()
        setUser(user)
    }

    return (
        <Layout onNavigate={onNavigate} currentPage="agb" user={user}>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Allgemeine Geschäftsbedingungen</h1>
                    <p className="text-gray-400 text-lg">Gültig ab 01.01.2025</p>
                </div>

                {/* Content */}
                <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl">
                    <div className="prose prose-invert max-w-none space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-voyanero-500" />
                                § 1 Geltungsbereich
                            </h2>
                            <p className="text-gray-300">
                                Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen Voyanero und seinen Kunden über die Nutzung der Plattform zur Lead-Generierung und E-Mail-Kommunikation.
                            </p>
                        </div>

                        <div className="border-t border-white/10 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">§ 2 Vertragsgegenstand</h2>
                            <p className="text-gray-300 mb-3">
                                Voyanero stellt eine Plattform zur Verfügung, die es Unternehmen ermöglicht:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                                <li>Leads zu generieren und zu verwalten</li>
                                <li>E-Mail-Kampagnen durchzuführen</li>
                                <li>KI-gestützte Textvorschläge zu nutzen</li>
                                <li>Kontakte zu organisieren und zu exportieren</li>
                            </ul>
                        </div>

                        <div className="border-t border-white/10 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">§ 3 Vertragsschluss</h2>
                            <p className="text-gray-300">
                                Der Vertrag kommt durch die Registrierung und Bestätigung der E-Mail-Adresse zustande. Mit der Registrierung akzeptiert der Kunde diese AGB.
                            </p>
                        </div>

                        <div className="border-t border-white/10 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">§ 4 Leistungen und Preise</h2>
                            <p className="text-gray-300 mb-3">
                                Voyanero arbeitet mit einem Credit-System. Credits können in verschiedenen Paketen erworben werden:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                                <li>500 Credits: 49€</li>
                                <li>1500 Credits: 129€</li>
                                <li>5000 Credits: 399€</li>
                            </ul>
                            <p className="text-gray-300 mt-3">
                                Credits verfallen nicht und können jederzeit verwendet werden.
                            </p>
                        </div>

                        <div className="border-t border-white/10 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">§ 5 Zahlungsbedingungen</h2>
                            <p className="text-gray-300">
                                Die Zahlung erfolgt über Stripe. Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.
                            </p>
                        </div>

                        <div className="border-t border-white/10 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">§ 6 Pflichten des Kunden</h2>
                            <p className="text-gray-300 mb-3">Der Kunde verpflichtet sich:</p>
                            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                                <li>Die Plattform nur für geschäftliche Zwecke zu nutzen</li>
                                <li>Keine rechtswidrigen Inhalte zu versenden</li>
                                <li>Die DSGVO und andere Datenschutzbestimmungen einzuhalten</li>
                                <li>Keine Spam-E-Mails zu versenden</li>
                            </ul>
                        </div>

                        <div className="border-t border-white/10 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">§ 7 Haftung</h2>
                            <p className="text-gray-300">
                                Voyanero haftet nicht für Schäden, die durch unsachgemäße Nutzung der Plattform entstehen. Der Kunde ist selbst verantwortlich für die Rechtmäßigkeit seiner E-Mail-Kampagnen.
                            </p>
                        </div>

                        <div className="border-t border-white/10 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">§ 8 Kündigung</h2>
                            <p className="text-gray-300">
                                Der Kunde kann seinen Account jederzeit löschen. Erworbene Credits verfallen bei Kündigung. Eine Rückerstattung ist nicht möglich.
                            </p>
                        </div>

                        <div className="border-t border-white/10 pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">§ 9 Schlussbestimmungen</h2>
                            <p className="text-gray-300">
                                Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist Dortmund.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
