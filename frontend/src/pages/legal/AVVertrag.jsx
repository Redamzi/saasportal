import React, { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { getCurrentUser } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function AVVertrag({ onNavigate }) {
    const sigCanvas = useRef({})
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState(null)
    const [isSigned, setIsSigned] = useState(false)

    useEffect(() => {
        loadUser()
    }, [])

    const loadUser = async () => {
        const { user } = await getCurrentUser()
        setUser(user)
    }

    const clear = () => {
        sigCanvas.current.clear()
    }

    const save = async () => {
        if (sigCanvas.current.isEmpty()) {
            toast.error('Bitte unterschreiben Sie zuerst.')
            return
        }

        setLoading(true)
        const signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
            const response = await fetch(`${API_URL}/api/legal/avv/sign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    signature_data: signatureData
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || 'Fehler beim Speichern')
            }

            toast.success('AV-Vertrag erfolgreich unterschrieben!')
            setIsSigned(true)

            // Reload page or redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = '/dashboard'
            }, 1500)

        } catch (error) {
            console.error('Sign error:', error)
            toast.error('Fehler beim Speichern der Unterschrift.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <header className="bg-white dark:bg-gray-800 shadow z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">AV-Vertrag unterzeichnen</h1>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 mb-6 prose dark:prose-invert max-w-none h-96 overflow-y-auto border border-gray-200 dark:border-gray-700">
                    <h2>Auftragsverarbeitungsvertrag (AVV)</h2>
                    <p><strong>Zwischen</strong></p>
                    <p>dem Kunden (nachfolgend "Auftraggeber")</p>
                    <p><strong>und</strong></p>
                    <p>Voyanero GmbH (i.G.) (nachfolgend "Auftragnehmer")</p>

                    <h3>1. Gegenstand und Dauer des Auftrags</h3>
                    <p>
                        (1) Der Auftragnehmer verarbeitet personenbezogene Daten im Auftrag des Auftraggebers.
                        Gegenstand des Auftrags ist die Nutzung der Voyanero SaaS-Plattform zur Lead-Generierung und Kontaktverwaltung.
                    </p>
                    <p>
                        (2) Die Dauer dieses Auftrags (Laufzeit) entspricht der Laufzeit der Leistungsvereinbarung (Hauptvertrag).
                    </p>

                    <h3>2. Art und Zweck der Verarbeitung</h3>
                    <p>
                        Art der Verarbeitung: Erhebung, Erfassung, Organisation, Speicherung, Anpassung oder Veränderung, Auslesen, Abfragen, Verwendung.
                        Zweck der Verarbeitung: Bereitstellung der Software-Funktionalitäten.
                    </p>

                    <h3>3. Art der Daten und Kreis der Betroffenen</h3>
                    <p>
                        Art der Daten: Kontaktdaten (Name, Email, Telefon), Firmendaten.
                        Kreis der Betroffenen: Kunden, Interessenten, Beschäftigte des Auftraggebers.
                    </p>

                    <h3>4. Pflichten des Auftragnehmers</h3>
                    <p>
                        Der Auftragnehmer verpflichtet sich, Daten nur im Rahmen der Weisungen des Auftraggebers zu verarbeiten und die gesetzlichen Bestimmungen der DSGVO einzuhalten.
                    </p>

                    {/* ... More legal text placeholders ... */}
                    <p className="text-sm text-gray-500 mt-8">
                        * Dies ist ein rechtsverbindlicher Vertrag. Bitte lesen Sie ihn sorgfältig durch.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Digitale Unterschrift</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Bitte unterschreiben Sie in dem Feld unten.
                    </p>

                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white touch-none">
                        <SignatureCanvas
                            ref={sigCanvas}
                            penColor="black"
                            canvasProps={{
                                className: 'w-full h-48 rounded-lg cursor-crosshair'
                            }}
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <button
                            onClick={clear}
                            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            Löschen & Neu
                        </button>
                        <button
                            onClick={save}
                            disabled={loading || isSigned}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? 'Speichere...' : isSigned ? 'Unterschrieben ✅' : 'Vertrag abschließen'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}
