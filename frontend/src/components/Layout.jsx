import React, { useState } from 'react'
import { BookOpen, LogOut, LayoutDashboard, FolderKanban, CreditCard, Settings as SettingsIcon, Users, Menu, X, ChevronLeft, ChevronRight, Search, Bell, Coins } from 'lucide-react'
import DarkModeToggle from './DarkModeToggle'
import { signOut } from '../lib/supabase'

export default function Layout({ children, onNavigate, currentPage, user, title, subtitle, actions }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
        <div className="min-h-screen bg-voyanero-900 text-white relative overflow-hidden font-sans selection:bg-voyanero-500/30">
            {/* Background Blobs */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-voyanero-500/10 rounded-full blur-[120px] animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-voyanero-900/80 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-voyanero-500 rounded-lg flex items-center justify-center font-bold text-white">V</div>
                    <span className="font-bold text-lg text-white">Voyanero</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-400">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-voyanero-900/95 backdrop-blur-xl pt-20 px-4 md:hidden">
                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { onNavigate(item.id); setIsMobileMenuOpen(false) }}
                                className={`p-4 rounded-xl flex items-center gap-3 text-lg font-medium transition-all ${currentPage === item.id
                                    ? 'bg-voyanero-500 text-white shadow-lg shadow-voyanero-500/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon className="w-6 h-6" />
                                {item.label}
                            </button>
                        ))}
                        <button onClick={handleLogout} className="p-4 rounded-xl flex items-center gap-3 text-lg font-medium text-red-400 hover:bg-red-500/10 mt-4">
                            <LogOut className="w-6 h-6" />
                            Abmelden
                        </button>
                    </nav>
                </div>
            )}

            <div className="flex h-screen pt-16 md:pt-0 relative z-10">
                {/* Desktop Sidebar (Floating Glass) */}
                <aside
                    className={`hidden md:flex flex-col fixed left-4 top-4 bottom-4 z-50 transition-all duration-300 ease-in-out
                        bg-[#0A0F1A]/60 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl
                        ${isSidebarOpen ? 'w-72' : 'w-20'}
                    `}
                >
                    {/* Logo Area */}
                    <div className="h-20 flex items-center justify-center border-b border-white/5 relative">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-voyanero-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-voyanero-500/20">
                                V
                            </div>
                            {isSidebarOpen && (
                                <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                    Voyanero
                                </span>
                            )}
                        </div>

                        {/* Toggle Button */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="absolute -right-3 top-8 w-6 h-6 bg-voyanero-800 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition shadow-lg"
                        >
                            {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                        {navItems.map((item) => {
                            const isActive = currentPage === item.id || (currentPage === 'campaignDetail' && item.id === 'campaigns')
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    className={`
                                        flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                                        ${isActive
                                            ? 'bg-voyanero-500 text-white shadow-lg shadow-voyanero-500/25'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }
                                        ${!isSidebarOpen && 'justify-center'}
                                    `}
                                    title={!isSidebarOpen ? item.label : ''}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'} transition-colors`} />
                                    {isSidebarOpen && <span className="font-medium">{item.label}</span>}

                                    {/* Active Indicator for collapsed state */}
                                    {!isSidebarOpen && isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                                    )}
                                </button>
                            )
                        })}
                    </nav>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-white/5 flex flex-col gap-2">
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5 ${!isSidebarOpen && 'justify-center'}`}>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                                {user?.email?.[0].toUpperCase() || 'U'}
                            </div>
                            {isSidebarOpen && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate text-white">{user?.user_metadata?.full_name || 'User'}</p>
                                    <p className="text-xs text-gray-500 truncate">Pro Plan</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ${!isSidebarOpen && 'justify-center'}`}
                        >
                            <LogOut className="w-5 h-5" />
                            {isSidebarOpen && <span className="text-sm font-medium">Abmelden</span>}
                        </button>
                    </div>
                </aside>

                {/* Main Content Wrapper - FULL WIDTH */}
                <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'md:ml-80' : 'md:ml-28'} md:mr-4`}>

                    {/* Top Header (Glass) - WITH SEARCH AND CREDITS */}
                    <header className="h-20 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between bg-voyanero-900/80 backdrop-blur-md border-b border-white/5">
                        {/* Left: Search Bar */}
                        <div className="flex-1 max-w-md hidden md:block">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Suchen..."
                                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-voyanero-500 focus:border-transparent outline-none transition"
                                />
                            </div>
                        </div>

                        {/* Right: Credits, Notifications, User */}
                        <div className="flex items-center gap-3 md:gap-4">
                            {/* Credits Display */}
                            <button
                                onClick={() => onNavigate('credits')}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-voyanero-500 to-blue-600 rounded-xl hover:shadow-lg hover:shadow-voyanero-500/30 transition-all group"
                            >
                                <Coins className="w-4 h-4 text-white" />
                                <span className="font-bold text-white hidden md:block">{user?.credits || 0}</span>
                                <span className="text-xs text-white/80 hidden lg:block">+ Kaufen</span>
                            </button>

                            {/* Notifications */}
                            <button className="relative p-2 text-gray-400 hover:text-white transition rounded-xl hover:bg-white/5">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            {/* Dark Mode Toggle */}
                            <div className="hidden md:block">
                                <DarkModeToggle />
                            </div>

                            {/* User Menu */}
                            <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                                    {user?.email?.[0].toUpperCase() || 'A'}
                                </div>
                                <span className="text-sm font-medium text-white hidden lg:block">
                                    {user?.user_metadata?.full_name?.split(' ')[0] || 'Amzi'}
                                </span>
                            </button>
                        </div>
                    </header>

                    {/* Scrollable Content */}
                    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                        {(title || subtitle) && (
                            <div className="mb-8">
                                {title && <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">{title}</h1>}
                                {subtitle && <p className="text-gray-400 text-lg">{subtitle}</p>}
                            </div>
                        )}
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}
