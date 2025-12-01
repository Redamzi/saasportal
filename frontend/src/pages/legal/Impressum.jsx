import React from 'react'
import { ArrowLeft } from 'lucide-react'
import DarkModeToggle from '../../components/DarkModeToggle'

export default function Impressum({ onNavigate }) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Zurück
                    </button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Impressum</h1>
                        <DarkModeToggle />
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 prose dark:prose-invert max-w-none">
                    <h2>Angaben gemäß § 5 TMG</h2>
                    <p>
                        <strong>Voyanero GmbH (i.G.)</strong><br />
                        Musterstraße 123<br />
                        12345 Musterstadt<br />
                        Deutschland
                    </p>

                    <h3>Vertreten durch:</h3>
                    <p>Max Mustermann</p>

                    <h3>Kontakt:</h3>
                    <p>
                        Telefon: +49 (0) 123 456789<br />
                        E-Mail: support@voyanero.com
                    </p>

                    <h3>Registereintrag:</h3>
                    <p>
                        Eintragung im Handelsregister.<br />
                        Registergericht: Amtsgericht Musterstadt<br />
                        Registernummer: HRB 12345
                    </p>

                    <h3>Umsatzsteuer:</h3>
                    <p>
                        Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:<br />
                        DE 123 456 789
                    </p>

                    <h3>Streitschlichtung</h3>
                    <p>
                        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a>.<br />
                        Unsere E-Mail-Adresse finden Sie oben im Impressum.
                    </p>

                    <p>
                        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                    </p>

                    <h3>Haftung für Inhalte</h3>
                    <p>
                        Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
                        Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen
                        oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                    </p>
                </div>
            </main>
        </div>
    )
}
