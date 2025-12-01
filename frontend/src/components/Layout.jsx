import React from 'react'
import { BookOpen, LogOut, LayoutDashboard, FolderKanban, CreditCard, Settings as SettingsIcon, Users } from 'lucide-react'
import DarkModeToggle from './DarkModeToggle'
import { signOut } from '../lib/supabase'

export default function Layout({ children, onNavigate, currentPage, user, title, subtitle, actions }) {

    const handleLogout = async () => {
        await signOut()
        onNavigate('login')
    }

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'campaigns', label: 'Kampagnen', icon: FolderKanban },
        { id: 'contacts', label: 'Kontakte', icon: Users },
        { id: 'credits', label: 'Credits', icon: CreditCard },
        { id: 'academy', label: 'Academy', icon: BookOpen },
        { id: 'settings', label: 'Einstellungen', icon: SettingsIcon },
    ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm z-10 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo & Title */}
                        <div className="flex items-center gap-8">
                            <div
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={() => onNavigate('dashboard')}
                            >
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                    V
                                </div>
                                <span className="text-xl font-bold text-gray-900 dark:text-white hidden md:block">Voyanero</span>
                            </div>

                            {/* Desktop Navigation */}
                            <nav className="hidden md:flex items-center gap-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon
                                    const isActive = currentPage === item.id || (currentPage === 'campaignDetail' && item.id === 'campaigns')

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => onNavigate(item.id)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isActive
                                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {item.label}
                                        </button>
                                    )
                                })}
                            </nav>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-4">
                            <DarkModeToggle />

                            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Abmelden"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header (Optional) */}
                {(title || actions) && (
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            {title && <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 text-left">{title}</h1>}
                            {subtitle && <p className="text-gray-600 dark:text-gray-400 text-left">{subtitle}</p>}
                        </div>
                        {actions && (
                            <div className="flex items-center gap-3">
                                {actions}
                            </div>
                        )}
                    </div>
                )}

                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            © {new Date().getFullYear()} Voyanero. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm">
                            <button onClick={() => onNavigate('impressum')} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">Impressum</button>
                            <button onClick={() => onNavigate('agb')} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">AGB</button>
                            <button onClick={() => onNavigate('datenschutz')} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">Datenschutz</button>
                            <button onClick={() => onNavigate('av-vertrag')} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">AV-Vertrag</button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
