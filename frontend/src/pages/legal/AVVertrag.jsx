import React, { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { getCurrentUser } from '../../lib/supabase'
import toast from 'react-hot-toast'

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

    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    if (loadingSignature) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Lade Vertragsstatus...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <header className="bg-white dark:bg-gray-800 shadow z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">AVV Vertrag</h1>
                        {isSigned && (
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-bold rounded-full uppercase">
                                Aktiv
                            </span>
                        )}
                    </div>
                    {isSigned && (
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            PDF Herunterladen
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 mb-6 prose dark:prose-invert max-w-none h-96 overflow-y-auto border border-gray-200 dark:border-gray-700">
                    <h2>Auftragsverarbeitungsvertrag (AVV)</h2>

                    <h3>1. Parteien</h3>
                    <p><strong>Auftraggeber:</strong> Nutzer der Voyanero-Plattform (gewerbliche Firmen)</p>
                    <p><strong>Auftragsverarbeiter:</strong> Voyanero.com, Kielstraße 28, 44145 Dortmund</p>

                    <h3>2. Gegenstand</h3>
                    <p>
                        Voyanero verarbeitet personenbezogene Daten im Rahmen der Kontaktvermittlung, des technischen E-Mail-Versands und der KI-gestützten Textassistenz.
                    </p>

                    <h3>3. Art der Daten</h3>
                    <ul>
                        <li>geschäftliche Kontaktdaten</li>
                        <li>Kommunikationsinhalte zwischen Firmen</li>
                        <li>technische Metadaten</li>
                    </ul>

                    <h3>4. Dauer der Verarbeitung</h3>
                    <p>
                        Für die Dauer der Nutzung des Dienstes; danach Löschung gemäß Regelungen der Datenschutzerklärung.
                    </p>

                    <p className="text-sm text-gray-500 mt-8">
                        * Dies ist ein rechtsverbindlicher Vertrag. Bitte lesen Sie ihn sorgfältig durch.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Digitale Signatur
                        </h3>
                        {isSigned && (
                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>

                    {isSigned ? (
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Dieser Vertrag wurde digital unterzeichnet.
                            </p>

                            <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg mb-4 bg-gray-50 dark:bg-gray-900 p-4">
                                <img
                                    src={signatureData}
                                    alt="Digital Unterschrieben"
                                    className="w-full h-48 object-contain"
                                />
                            </div>

                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Unterschrieben am {formatDate(signedAt)}</span>
                            </div>
                        </div>
                    ) : (
                        <div>
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
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? 'Speichere...' : 'Vertrag abschließen'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
