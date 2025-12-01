import React from 'react'
import { ArrowLeft } from 'lucide-react'
import DarkModeToggle from '../../components/DarkModeToggle'

export default function AGB({ onNavigate }) {
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
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Allgemeine Geschäftsbedingungen</h1>
                        <DarkModeToggle />
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 prose dark:prose-invert max-w-none">
                    <h2>§ 1 Geltungsbereich</h2>
                    <p>
                        (1) Die nachstehenden Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen Voyanero (nachfolgend "Anbieter") und dem Kunden (nachfolgend "Kunde"),
                        die über die Webseite des Anbieters geschlossen werden.
                    </p>
                    <p>
                        (2) Abweichende, entgegenstehende oder ergänzende Allgemeine Geschäftsbedingungen des Kunden werden, selbst bei Kenntnis, nicht Vertragsbestandteil,
                        es sei denn, ihrer Geltung wird ausdrücklich schriftlich zugestimmt.
                    </p>

                    <h2>§ 2 Leistungsgegenstand</h2>
                    <p>
                        (1) Der Anbieter stellt dem Kunden eine Software-as-a-Service (SaaS) Plattform zur Verfügung, die es ermöglicht, Geschäftskontakte (Leads) zu suchen,
                        zu verwalten und zu kontaktieren.
                    </p>
                    <p>
                        (2) Der genaue Funktionsumfang ergibt sich aus der aktuellen Leistungsbeschreibung auf der Webseite.
                    </p>

                    <h2>§ 3 Vertragsschluss</h2>
                    <p>
                        (1) Die Präsentation der Dienstleistungen auf der Webseite stellt kein rechtlich bindendes Angebot dar, sondern eine Aufforderung zur Bestellung.
                    </p>
                    <p>
                        (2) Durch Anklicken des Buttons "Kostenpflichtig bestellen" gibt der Kunde ein verbindliches Angebot ab.
                    </p>

                    <h2>§ 4 Preise und Zahlung</h2>
                    <p>
                        (1) Es gelten die zum Zeitpunkt der Bestellung angegebenen Preise. Alle Preise verstehen sich zuzüglich der gesetzlichen Umsatzsteuer.
                    </p>
                    <p>
                        (2) Die Zahlung erfolgt über die angebotenen Zahlungsmethoden (z.B. Kreditkarte, Stripe).
                    </p>

                    <h2>§ 5 Laufzeit und Kündigung</h2>
                    <p>
                        (1) Der Vertrag wird auf unbestimmte Zeit geschlossen.
                    </p>
                    <p>
                        (2) Beide Parteien können den Vertrag jederzeit zum Ende des aktuellen Abrechnungszeitraums kündigen.
                    </p>

                    <h2>§ 6 Haftung</h2>
                    <p>
                        (1) Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit.
                    </p>
                    <p>
                        (2) Für leichte Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten).
                    </p>

                    <h2>§ 7 Schlussbestimmungen</h2>
                    <p>
                        (1) Es gilt das Recht der Bundesrepublik Deutschland.
                    </p>
                    <p>
                        (2) Gerichtsstand ist der Sitz des Anbieters.
                    </p>
                </div>
            </main>
        </div>
    )
}
