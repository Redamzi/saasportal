import { useState, useEffect } from 'react'
import { Zap, Check, CreditCard, History, ShieldCheck, Download, AlertCircle } from 'lucide-react'
import { getCurrentUser } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import Footer from '../components/Footer'

export default function Credits({ onNavigate }) {
  const [user, setUser] = useState(null)
  const [currentCredits, setCurrentCredits] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const creditPackages = [
    { id: 'starter', credits: 500, price: 49, priceStr: '49€', popular: false },
    { id: 'pro', credits: 1500, price: 129, priceStr: '129€', popular: true },
    { id: 'business', credits: 5000, price: 399, priceStr: '399€', popular: false },
  ]

  const invoices = [
    { id: 'INV-2024-001', date: '22.05.2025', amount: '129.00€', description: '1500 Credits Package' },
    { id: 'INV-2024-002', date: '15.04.2025', amount: '49.00€', description: '500 Credits Package' },
    { id: 'INV-2024-003', date: '01.02.2025', amount: '399.00€', description: '5000 Credits Package' },
  ]

  useEffect(() => {
    loadCreditsData()
  }, [])

  const loadCreditsData = async () => {
    try {
      const { user: currentUser } = await getCurrentUser()
      if (!currentUser) {
        onNavigate('login')
        return
      }
      setUser(currentUser)

      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', currentUser.id)
        .single()

      setCurrentCredits(profile?.credits_balance || 0)

      const { data: txData } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setTransactions(txData || [])
    } catch (error) {
      console.error('Error loading credits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (pkg) => {
    try {
      const { user } = await getCurrentUser()
      if (!user) {
        alert('❌ Bitte zuerst einloggen')
        return
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          package: pkg.credits,
          amount: pkg.price * 100,
          package_name: `${pkg.credits} Credits`
        })
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert('❌ Fehler beim Erstellen der Checkout-Session')
      }
    } catch (error) {
      alert('❌ Fehler: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-voyanero-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-voyanero-500"></div>
      </div>
    )
  }

  return (
    <Layout onNavigate={onNavigate} currentPage="credits" user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Billing & Credits</h1>
          <p className="text-gray-400 text-lg">Verwalten Sie Ihre Credits, Zahlungsmethoden und Rechnungen. Kein Abo erforderlich.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Balance */}
            <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 p-8 rounded-3xl shadow-2xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Verfügbares Guthaben</h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">{currentCredits.toLocaleString()}</span>
                    <span className="text-xl text-gray-400">Credits</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500 fill-current" />
                    Automatische Aufladung deaktiviert
                  </p>
                </div>
                <button
                  onClick={() => document.getElementById('credit-packages')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-voyanero-500 hover:bg-voyanero-400 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-voyanero-500/20"
                >
                  Credits aufladen
                </button>
              </div>
            </div>

            {/* Credit Packages */}
            <section id="credit-packages">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                <Zap className="w-6 h-6 text-voyanero-500" /> Credit Pakete
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {creditPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`relative bg-[#0B1121]/60 backdrop-blur-md border-2 p-6 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-1 ${pkg.popular ? 'border-voyanero-500 shadow-voyanero-500/20' : 'border-white/10 hover:border-white/20'
                      }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-voyanero-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">
                        Bestseller
                      </div>
                    )}
                    <div className="text-center mb-4">
                      <span className="text-4xl font-bold text-white">{pkg.credits}</span>
                      <span className="block text-sm text-gray-400 font-medium mt-1">Credits</span>
                    </div>
                    <div className="text-3xl font-bold text-voyanero-400 mb-6 text-center">{pkg.priceStr}</div>
                    <button
                      onClick={() => handlePurchase(pkg)}
                      className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${pkg.popular
                          ? 'bg-voyanero-500 text-white hover:bg-voyanero-400 shadow-lg shadow-voyanero-500/20'
                          : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                      Auswählen
                    </button>
                    <ul className="mt-6 space-y-2 text-sm text-gray-400">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Keine monatlichen Gebühren
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Credits verfallen nie
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Sofort einsatzbereit
                      </li>
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Transaction History */}
            <section>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                <History className="w-6 h-6 text-voyanero-500" /> Transaktionsverlauf
              </h3>
              <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
                {transactions.length === 0 ? (
                  <div className="p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Noch keine Transaktionen</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="p-4 hover:bg-white/5 transition">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-white">{tx.description}</p>
                            <p className="text-sm text-gray-500">{new Date(tx.created_at).toLocaleDateString('de-DE')}</p>
                          </div>
                          <span className={`font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount} Credits
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column - Invoices */}
          <div className="space-y-8">
            <section>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                <CreditCard className="w-6 h-6 text-voyanero-500" /> Rechnungen
              </h3>
              <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex justify-between items-start pb-4 border-b border-white/5 last:border-0">
                    <div>
                      <p className="font-medium text-white text-sm">{invoice.id}</p>
                      <p className="text-xs text-gray-500 mt-1">{invoice.date}</p>
                      <p className="text-xs text-gray-400 mt-1">{invoice.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{invoice.amount}</p>
                      <button className="text-voyanero-400 hover:text-voyanero-300 text-xs mt-2 flex items-center gap-1">
                        <Download className="w-3 h-3" /> PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Security Info */}
            <div className="bg-[#0B1121]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">Sichere Zahlung</h4>
                  <p className="text-xs text-gray-400">
                    Alle Zahlungen werden über Stripe verschlüsselt und sicher verarbeitet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  )
}
