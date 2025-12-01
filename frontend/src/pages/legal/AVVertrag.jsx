import React, { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { getCurrentUser } from '../../lib/supabase'
import { Download, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout'

export default function AVVertrag({ onNavigate }) {
    const sigCanvas = useRef({})
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState(null)
    const [isSigned, setIsSigned] = useState(false)
    const [signatureData, setSignatureData] = useState(null)
    const [signedAt, setSignedAt] = useState(null)
    const [loadingSignature, setLoadingSignature] = useState(true)

    useEffect(() => {
        loadUser()
    }, [])

    const loadUser = async () => {
        const { user } = await getCurrentUser()
        setUser(user)

        if (user) {
            await checkSignatureStatus(user.id)
        }
    }

    const checkSignatureStatus = async (userId) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
            const response = await fetch(`${API_URL}/api/legal/avv/signature/${userId}`)
            const data = await response.json()

            if (data.is_signed) {
                setIsSigned(true)
                setSignatureData(data.signature_data)
                setSignedAt(data.signed_at)
            }
        } catch (error) {
            console.error('Error checking signature:', error)
        } finally {
            setLoadingSignature(false)
        }
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
        const signatureDataToSave = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
            const response = await fetch(`${API_URL}/api/legal/avv/sign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    signature_data: signatureDataToSave
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || 'Fehler beim Speichern')
            }

            toast.success('AV-Vertrag erfolgreich unterschrieben!')
            setIsSigned(true)
            setSignatureData(signatureDataToSave)
            setSignedAt(new Date().toISOString())

            // Redirect to dashboard after short delay
            setTimeout(() => {
                onNavigate('dashboard')
            }, 1500)

        } catch (error) {
            console.error('Sign error:', error)
            toast.error('Fehler beim Speichern der Unterschrift.')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    if (loadingSignature) {
        return (
            <div className="min-h-screen bg-voyanero-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-voyanero-500"></div>
            </div>
        )
    }

    return (
        <Layout onNavigate={onNavigate} currentPage="av-vertrag" user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white">AVV Vertrag</h1>
                        {isSigned && (
                            <span className="px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full uppercase">
                                Aktiv
                            </span>
                        )}
                    </div>
                    {isSigned && (
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 text-sm text-voyanero-400 hover:text-voyanero-300 font-medium flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/10"
                        >
                            <Download className="w-4 h-4" />
                            PDF Herunterladen
                        </button>
                    )}
                </div>

                {/* Contract Content */}
                <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl">
                    <div className="prose prose-invert max-w-none h-96 overflow-y-auto custom-scrollbar">
                        <h2 className="text-2xl font-bold text-white mb-4">Auftragsverarbeitungsvertrag (AVV)</h2>

                        <h3 className="text-xl font-bold text-white mt-6 mb-3">1. Parteien</h3>
                        <p className="text-gray-300"><strong className="text-white">Auftraggeber:</strong> Nutzer der Voyanero-Plattform (gewerbliche Firmen)</p>
                        <p className="text-gray-300"><strong className="text-white">Auftragsverarbeiter:</strong> Voyanero.com, Kielstraße 28, 44145 Dortmund</p>

                        <h3 className="text-xl font-bold text-white mt-6 mb-3">2. Gegenstand</h3>
                        <p className="text-gray-300">
                            Voyanero verarbeitet personenbezogene Daten im Rahmen der Kontaktvermittlung, des technischen E-Mail-Versands und der KI-gestützten Textassistenz.
                        </p>

                        <h3 className="text-xl font-bold text-white mt-6 mb-3">3. Art der Daten</h3>
                        <ul className="text-gray-300 space-y-1">
                            <li>geschäftliche Kontaktdaten</li>
                            <li>Kommunikationsinhalte zwischen Firmen</li>
                            <li>technische Metadaten</li>
                        </ul>

                        <h3 className="text-xl font-bold text-white mt-6 mb-3">4. Dauer der Verarbeitung</h3>
                        <p className="text-gray-300">
                            Für die Dauer der Nutzung des Dienstes; danach Löschung gemäß Regelungen der Datenschutzerklärung.
                        </p>

                        <h3 className="text-xl font-bold text-white mt-6 mb-3">5. Technische und organisatorische Maßnahmen (TOM)</h3>
                        <ul className="text-gray-300 space-y-1">
                            <li>Verschlüsselung der Datenübertragung (TLS)</li>
                            <li>Zugriffskontrolle durch Authentifizierung</li>
                            <li>Regelmäßige Backups</li>
                            <li>Logging und Monitoring</li>
                        </ul>

                        <h3 className="text-xl font-bold text-white mt-6 mb-3">6. Pflichten des Auftraggebers</h3>
                        <p className="text-gray-300">
                            Der Auftraggeber ist verantwortlich für die Rechtmäßigkeit der Datenverarbeitung und muss sicherstellen, dass er die erforderlichen Einwilligungen eingeholt hat.
                        </p>

                        <h3 className="text-xl font-bold text-white mt-6 mb-3">7. Unterauftragsverhältnisse</h3>
                        <p className="text-gray-300">
                            Voyanero darf Unterauftragsverarbeiter (z.B. Hosting-Provider, E-Mail-Dienste) einsetzen. Eine Liste wird auf Anfrage bereitgestellt.
                        </p>
                    </div>
                </div>

                {/* Signature Section */}
                <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <svg className="w-6 h-6 text-voyanero-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <h3 className="text-2xl font-bold text-white">Digitale Signatur</h3>
                    </div>

                    {isSigned ? (
                        <div className="space-y-4">
                            <div className="bg-black/30 border-2 border-dashed border-emerald-500/30 rounded-2xl p-8 flex flex-col items-center justify-center">
                                <img src={signatureData} alt="Signature" className="max-h-32 mb-4" />
                                <p className="text-emerald-400 font-medium">Dieser Vertrag wurde digital unterzeichnet.</p>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-400">
                                <Check className="w-5 h-5" />
                                <span className="text-sm">Unterschrieben am {formatDate(signedAt)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-black/30 border-2 border-dashed border-white/10 rounded-2xl overflow-hidden">
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    canvasProps={{
                                        className: 'w-full h-48 cursor-crosshair',
                                        style: { background: 'transparent' }
                                    }}
                                    penColor="#60A5FA"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={clear}
                                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition border border-white/10"
                                >
                                    Löschen
                                </button>
                                <button
                                    onClick={save}
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 bg-voyanero-500 hover:bg-voyanero-400 text-white rounded-xl font-bold transition shadow-lg shadow-voyanero-500/20 disabled:opacity-50"
                                >
                                    {loading ? 'Speichern...' : 'Unterschreiben & Speichern'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}
