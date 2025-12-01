import React from 'react'
import { ArrowLeft } from 'lucide-react'
import DarkModeToggle from '../../components/DarkModeToggle'

export default function Datenschutz({ onNavigate }) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Datenschutzerklärung</h1>
                        <DarkModeToggle />
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 prose dark:prose-invert max-w-none">
                    <h2>1. Datenschutz auf einen Blick</h2>
                    <h3>Allgemeine Hinweise</h3>
                    <p>
                        Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen.
                        Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
                    </p>

                    <h3>Datenerfassung auf dieser Website</h3>
                    <p>
                        <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
                        Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
                    </p>

                    <h2>2. Hosting</h2>
                    <p>
                        Wir hosten die Inhalte unserer Website bei folgendem Anbieter:<br />
                        [Name des Hosters]<br />
                        [Adresse]<br />
                    </p>

                    <h2>3. Allgemeine Hinweise und Pflichtinformationen</h2>
                    <h3>Datenschutz</h3>
                    <p>
                        Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und
                        entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
                    </p>

                    <h3>Hinweis zur verantwortlichen Stelle</h3>
                    <p>
                        Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br />
                        Voyanero GmbH (i.G.)<br />
                        Musterstraße 123<br />
                        12345 Musterstadt<br />
                        E-Mail: support@voyanero.com
                    </p>

                    <h2>4. Datenerfassung auf dieser Website</h2>
                    <h3>Cookies</h3>
                    <p>
                        Unsere Internetseiten verwenden so genannte „Cookies“. Cookies sind kleine Textdateien und richten auf Ihrem Endgerät keinen Schaden an.
                        Sie werden entweder vorübergehend für die Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem Endgerät gespeichert.
                    </p>

                    <h3>Server-Log-Dateien</h3>
                    <p>
                        Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt.
                    </p>

                    <h2>5. Analyse-Tools und Werbung</h2>
                    <p>
                        [Hier ggf. Google Analytics, etc. einfügen]
                    </p>

                    <h2>6. Newsletter</h2>
                    <p>
                        Wenn Sie den auf der Website angebotenen Newsletter beziehen möchten, benötigen wir von Ihnen eine E-Mail-Adresse sowie Informationen,
                        welche uns die Überprüfung gestatten, dass Sie der Inhaber der angegebenen E-Mail-Adresse sind und mit dem Empfang des Newsletters einverstanden sind.
                    </p>
                </div>
            </main>
        </div>
    )
}
