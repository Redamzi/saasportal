import { ArrowLeft, BookOpen, Video, FileText, Zap, Users, Award } from 'lucide-react'

export default function Academy({ onNavigate }) {
  const resources = [
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Schritt-für-Schritt Anleitungen für Voyanero',
      count: '12 Videos',
      color: 'bg-red-50 text-red-600'
    },
    {
      icon: FileText,
      title: 'Dokumentation',
      description: 'Vollständige technische Dokumentation',
      count: '25 Artikel',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: Zap,
      title: 'Best Practices',
      description: 'Tipps für erfolgreiche Lead-Generierung',
      count: '8 Guides',
      color: 'bg-yellow-50 text-yellow-600'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Austausch mit anderen Nutzern',
      count: 'Bald verfügbar',
      color: 'bg-purple-50 text-purple-600'
    }
  ]

  const quickLinks = [
    { title: 'Erste Schritte', href: '#' },
    { title: 'Campaign erstellen', href: '#' },
    { title: 'Leads suchen', href: '#' },
    { title: 'Email-Kampagnen', href: '#' },
    { title: 'DSGVO-Compliance', href: '#' },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => onNavigate('dashboard')}
          className="text-blue-600 hover:underline flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Dashboard
        </button>
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-10 h-10 text-blue-600" />
          <div className="text-left">
            <h1 className="text-3xl font-bold text-slate-900 text-left">Voyanero Academy</h1>
            <p className="text-slate-500 text-left">Lernen Sie alles über erfolgreiche Lead-Generierung</p>
          </div>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 mb-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-8 h-8" />
          <h2 className="text-2xl font-bold text-left">Bald verfügbar!</h2>
        </div>
        <p className="text-blue-100 mb-4 text-left">
          Wir arbeiten an umfassenden Lernmaterialien, Video-Tutorials und Best Practices
          für Ihre erfolgreiche Lead-Generierung mit Voyanero.
        </p>
        <p className="text-sm text-blue-200 text-left">
          📧 Sie werden per Email benachrichtigt, sobald die Academy online geht.
        </p>
      </div>

      {/* Resource Cards */}
      <div>
        <h2 className="text-xl font-bold mb-6 text-left">Was Sie erwartet</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {resources.map((resource, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${resource.color}`}>
                  <resource.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg text-slate-900 mb-1 text-left">{resource.title}</h3>
                  <p className="text-sm text-slate-500 mb-2 text-left">{resource.description}</p>
                  <span className="text-xs font-medium text-slate-400 text-left">{resource.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-lg mb-4 text-left">Häufig gesucht</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <span className="text-sm font-medium text-slate-700 text-left">{link.title}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Support CTA */}
      <div className="mt-8 bg-slate-50 rounded-xl p-6">
        <p className="text-slate-600 mb-4 text-left">
          Haben Sie Fragen? Unser Support-Team hilft Ihnen gerne weiter.
        </p>
        <button
          onClick={() => onNavigate('support')}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Zum Support
        </button>
      </div>
    </div>
  )
}
