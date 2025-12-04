import { useState } from 'react'
import { X, Mail, Edit2, RotateCcw } from 'lucide-react'

export default function EmailPreviewModal({ email, lead, onClose, onSave }) {
    const [isEditing, setIsEditing] = useState(false)
    const [editedSubject, setEditedSubject] = useState(email?.subject || '')
    const [editedBody, setEditedBody] = useState(email?.body || '')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        try {
            await onSave({
                subject: editedSubject,
                body: editedBody
            })
            setIsEditing(false)
        } catch (error) {
            alert(`❌ Fehler beim Speichern: ${error.message}`)
        } finally {
            setSaving(false)
        }
    }

    const handleReset = () => {
        setEditedSubject(email.subject)
        setEditedBody(email.body)
        setIsEditing(false)
    }

    if (!email) return null

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0B1121] border border-white/10 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-voyanero-500/20 rounded-xl flex items-center justify-center">
                            <Mail className="w-5 h-5 text-voyanero-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Email-Vorschau</h2>
                            <p className="text-sm text-gray-400">{lead?.company_name || 'Unknown Company'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Status Badge */}
                    <div className="mb-4 flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${email.edited_by_user
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-voyanero-500/20 text-voyanero-400'
                            }`}>
                            {email.edited_by_user ? '✏️ Bearbeitet' : '🤖 AI-Generiert'}
                        </span>
                        {email.status && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 text-gray-400">
                                Status: {email.status}
                            </span>
                        )}
                    </div>

                    {/* Subject */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-400 mb-2">Betreff</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedSubject}
                                onChange={(e) => setEditedSubject(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-voyanero-500 outline-none"
                                placeholder="Email-Betreff"
                            />
                        ) : (
                            <div className="bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-white">
                                {editedSubject}
                            </div>
                        )}
                    </div>

                    {/* Body */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-400 mb-2">Nachricht</label>
                        {isEditing ? (
                            <textarea
                                value={editedBody}
                                onChange={(e) => setEditedBody(e.target.value)}
                                rows={12}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-voyanero-500 outline-none resize-none"
                                placeholder="Email-Text"
                            />
                        ) : (
                            <div className="bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-white whitespace-pre-wrap">
                                {editedBody}
                            </div>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                        <p className="text-xs text-yellow-400 font-bold mb-1">ℹ️ Automatischer Footer</p>
                        <p className="text-xs text-gray-400">
                            Beim Versand wird automatisch ein Footer mit Impressum, Abmeldelink und Datenschutz-Hinweis hinzugefügt.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-bold transition flex items-center gap-2"
                                >
                                    <RotateCcw size={16} />
                                    Zurücksetzen
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition flex items-center gap-2"
                            >
                                <Edit2 size={16} />
                                Bearbeiten
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-bold transition"
                        >
                            Schließen
                        </button>
                        {isEditing && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 bg-voyanero-600 hover:bg-voyanero-500 text-white rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Speichern...' : 'Speichern'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
