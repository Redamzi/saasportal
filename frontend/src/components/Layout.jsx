import { useState, useEffect } from 'react'
import {
  Plus, Coins, Menu, X, LogOut, LayoutDashboard,
  FolderKanban, CreditCard, User, Settings, GraduationCap
} from "lucide-react"
import { getCurrentUser, signOut } from '../lib/supabase'
import { supabase } from '../lib/supabase'

export default function Layout({ children, onNavigate, currentPage }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [credits, setCredits] = useState(0)
  const [user, setUser] = useState(null)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { user: currentUser } = await getCurrentUser()
      if (!currentUser) return

      setUser(currentUser)

      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', currentUser.id)
        .single()

      setCredits(profile?.credits_balance || 0)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const navLinks = [
    { name: 'Dashboard', page: 'dashboard', icon: LayoutDashboard },
    { name: 'Kampagnen', page: 'campaigns', icon: FolderKanban },
    { name: 'Academy', page: 'academy', icon: GraduationCap },
    { name: 'Credits', page: 'credits', icon: CreditCard },
  ]

  const isActive = (page) => currentPage === page

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/login'
  }

  const handleNavClick = (page) => {
    setIsMobileMenuOpen(false)
    onNavigate(page)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-8">
            <button onClick={() => handleNavClick('dashboard')} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                V
              </div>
              <span className="text-xl font-bold">Voyanero</span>
            </button>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.page}
                  onClick={() => handleNavClick(link.page)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-blue-600 ${
                    isActive(link.page) ? "text-blue-600" : "text-slate-600"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-4">
            {/* Credits */}
            <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Coins className="w-4 h-4 text-yellow-600" />
                <span>{credits.toLocaleString()}</span>
              </div>
              <button onClick={() => handleNavClick('credits')} className="text-xs font-medium text-blue-600 border-l pl-3 border-slate-300 hover:text-blue-700">
                + Kaufen
              </button>
            </div>

            {/* Create Button */}
            <button
              onClick={() => handleNavClick('campaigns')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Kampagne
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300 hover:bg-slate-300 transition"
              >
                <User className="w-4 h-4 text-slate-600" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false)
                      handleNavClick('settings')
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-50 text-sm text-left"
                  >
                    <Settings className="w-4 h-4" />
                    Einstellungen
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-50 text-sm text-red-600 text-left border-t"
                  >
                    <LogOut className="w-4 h-4" />
                    Abmelden
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white p-4 space-y-4">
            {navLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => handleNavClick(link.page)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive(link.page) ? "bg-blue-50 text-blue-600" : "hover:bg-slate-100"
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.name}
              </button>
            ))}
            <div className="border-t pt-4">
              <div className="flex justify-between px-2 mb-3">
                <span className="text-sm text-slate-500">Credits:</span>
                <span className="font-bold flex items-center gap-1">
                  <Coins className="w-4 h-4 text-yellow-600" />
                  {credits.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => handleNavClick('settings')}
                className="w-full bg-slate-100 py-2.5 rounded-lg mb-2 text-sm font-medium hover:bg-slate-200"
              >
                Einstellungen
              </button>
              <button
                onClick={handleLogout}
                className="w-full bg-red-50 text-red-600 py-2.5 rounded-lg text-sm font-medium hover:bg-red-100"
              >
                Abmelden
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t py-8 mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-slate-500">© 2025 Voyanero. All rights reserved.</div>
          <div className="flex gap-6 text-sm text-slate-500">
            <button onClick={() => handleNavClick('terms')} className="hover:text-slate-700">AGB</button>
            <button onClick={() => handleNavClick('privacy')} className="hover:text-slate-700">Datenschutz</button>
            <button onClick={() => handleNavClick('support')} className="hover:text-slate-700">Support</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
