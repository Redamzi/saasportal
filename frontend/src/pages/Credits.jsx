import { useState, useEffect } from 'react'
import {
  Zap, Check, CreditCard, History, ShieldCheck,
  ArrowLeft, Download, AlertCircle
} from 'lucide-react'
import { getCurrentUser } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import DarkModeToggle from '../components/DarkModeToggle'

export default function Credits({ onNavigate }) {
  const [currentCredits, setCurrentCredits] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState('visa')

  const creditPackages = [
    {
      id: 'starter',
      credits: 500,
      price: 49,
      priceStr: '49€',
      popular: false
    },
    {
      id: 'pro',
      credits: 1500,
      price: 129,
      priceStr: '129€',
      popular: true
    },
    {
      id: 'business',
      credits: 5000,
      price: 399,
      priceStr: '399€',
      popular: false
    },
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
      const { user } = await getCurrentUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', user.id)
        .single()

      setCurrentCredits(profile?.credits_balance || 0)

      const { data: txData } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
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
      const response = await fetch(`${API_URL}/api/credits/checkout`, {
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-slate-600 dark:text-gray-300">Lädt...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Dashboard
          </button>
          <DarkModeToggle />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white text-left">Billing & Credits</h1>
        <p className="text-slate-500 dark:text-gray-400 mt-2 text-left">
          Manage your credits, payment methods, and invoices. No subscription required.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Current Balance */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-left w-full sm:w-auto">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 text-left">Aktuelles Guthaben</h2>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{currentCredits.toLocaleString()}</span>
                <span className="text-lg text-slate-600 dark:text-gray-300">Credits</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-2 flex items-center gap-2 text-left">
                <Zap className="w-4 h-4 text-yellow-500 fill-current" />
                Kein monatliches Abo aktiv. Pay-as-you-go.
              </p>
            </div>
            <button
              onClick={() => document.getElementById('credit-packages')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 whitespace-nowrap"
            >
              Credits aufladen
            </button>
          </div>

          {/* Credit Packages */}
          <section id="credit-packages">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-left">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Credit Pakete
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {creditPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative bg-white dark:bg-gray-800 p-6 rounded-xl border-2 transition-all hover:shadow-lg flex flex-col items-center text-center cursor-pointer
                    ${pkg.popular ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 dark:border-gray-700 hover:border-blue-300'}
                  `}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 bg-blue-600 dark:bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      Bestseller
                    </div>
                  )}
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{pkg.credits}</span>
                    <span className="block text-sm text-slate-500 dark:text-gray-400 font-medium">Credits</span>
                  </div>
                  <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-4">{pkg.priceStr}</div>
                  <button
                    onClick={() => handlePurchase(pkg)}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${pkg.popular ? 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-700 dark:text-gray-200 hover:bg-slate-200'}
                    `}
                  >
                    Auswählen
                  </button>
                  <ul className="mt-4 space-y-2 text-xs text-slate-500 dark:text-gray-400 text-left w-full">
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Kein Verfallsdatum
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Sofort verfügbar
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Invoice History */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2 text-left">
                <History className="w-5 h-5 text-slate-500 dark:text-gray-400" /> Rechnungshistorie
              </h3>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Alle anzeigen</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-gray-800 text-slate-500 dark:text-gray-400 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-3 text-left">Rechnungs-Nr.</th>
                    <th className="px-6 py-3 text-left">Datum</th>
                    <th className="px-6 py-3 text-left">Beschreibung</th>
                    <th className="px-6 py-3 text-left">Betrag</th>
                    <th className="px-6 py-3 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white text-left">{inv.id}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-gray-400 text-left">{inv.date}</td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white text-left">{inv.description}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white text-left">{inv.amount}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <Download className="w-4 h-4 inline-block" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">

          {/* Payment Methods */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-left">Zahlungsmethode</h3>

            <div className="space-y-3">
              <div
                onClick={() => setSelectedMethod('visa')}
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedMethod === 'visa' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 dark:border-gray-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded">
                    <CreditCard className="w-5 h-5 text-slate-700 dark:text-gray-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white text-left">Visa •••• 4242</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 text-left">Expires 12/28</p>
                  </div>
                </div>
                {selectedMethod === 'visa' && (
                  <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              <div
                onClick={() => setSelectedMethod('mastercard')}
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedMethod === 'mastercard' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 dark:border-gray-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded">
                    <CreditCard className="w-5 h-5 text-slate-700 dark:text-gray-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white text-left">Mastercard •••• 8899</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 text-left">Expires 09/26</p>
                  </div>
                </div>
                {selectedMethod === 'mastercard' && (
                  <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              <button className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-lg text-sm font-medium text-slate-500 dark:text-gray-400 hover:border-blue-600 hover:text-blue-600 dark:text-blue-400 transition-colors flex items-center justify-center gap-2">
                + Neue Methode hinzufügen
              </button>
            </div>
          </div>

          {/* Security Info */}
          <div className="bg-blue-900 p-6 rounded-xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <ShieldCheck className="w-8 h-8 mb-4 text-blue-300" />
              <h4 className="font-bold text-lg mb-2 text-left">Sichere Zahlung</h4>
              <p className="text-blue-200 text-sm text-left">
                Alle Transaktionen sind SSL-verschlüsselt und sicher verarbeitet.
                Wir speichern keine sensiblen Kreditkartendaten.
              </p>
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-800 rounded-full opacity-50 blur-2xl"></div>
          </div>

          {/* Billing Address Notice */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-left">
              <h4 className="text-sm font-bold text-amber-800 text-left">Rechnungsadresse</h4>
              <p className="text-xs text-amber-700 mt-1 text-left">
                Bitte stellen Sie sicher, dass Ihre Rechnungsadresse für steuerliche Zwecke korrekt ist.
              </p>
              <button
                onClick={() => onNavigate('settings')}
                className="text-xs font-bold text-amber-800 mt-2 underline"
              >
                Adresse bearbeiten
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
