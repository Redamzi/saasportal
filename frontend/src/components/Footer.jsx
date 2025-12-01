import React from 'react'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="mt-auto border-t border-white/5 bg-voyanero-900/50 backdrop-blur-sm">
            <div className="px-8 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Copyright */}
                    <p className="text-sm text-gray-500">
                        © {currentYear} Voyanero. Alle Rechte vorbehalten.
                    </p>

                    {/* Links */}
                    <div className="flex flex-wrap justify-center gap-6 text-sm">
                        <a
                            href="/impressum"
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            Impressum
                        </a>
                        <a
                            href="/agb"
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            AGB
                        </a>
                        <a
                            href="/datenschutz"
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            Datenschutz
                        </a>
                        <a
                            href="/av-vertrag"
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            AV-Vertrag
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
