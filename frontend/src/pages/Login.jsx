import { useState } from 'react'
import { signIn, signUp } from '../lib/supabase'
import toast from 'react-hot-toast'
import DarkModeToggle from '../components/DarkModeToggle'

function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [fullName, setFullName] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isLogin) {
        // Login
        const { user, session, error: loginError } = await signIn(email, password)

        if (loginError) {
          const msg = loginError.message || 'Login failed. Please check your credentials.'
          setError(msg)
          toast.error(msg)
          return
        }

        if (user && session) {
          const msg = 'Login successful! Redirecting...'
          setSuccess(msg)
          toast.success(msg)
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 1000)
        }
      } else {
        // Signup
        if (!companyName) {
          const msg = 'Company name is required'
          setError(msg)
          toast.error(msg)
          return
        }

        const { user, error: signupError } = await signUp(
          email,
          password,
          companyName,
          fullName
        )

        if (signupError) {
          const msg = signupError.message || 'Signup failed. Please try again.'
          setError(msg)
          toast.error(msg)
          return
        }

        if (user) {
          const msg = 'Account created successfully! Please check your email to verify your account.'
          setSuccess(msg)
          toast.success(msg, { duration: 6000 })
          // Clear form
          setEmail('')
          setPassword('')
          setCompanyName('')
          setFullName('')
        }
      }
    } catch (err) {
      const msg = 'An unexpected error occurred. Please try again.'
      setError(msg)
      toast.error(msg)
      console.error('Auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setSuccess('')
  }

  return (
    <div className="min-h-screen bg-voyanero-900 flex items-center justify-center px-4 relative overflow-hidden font-sans">
      {/* Background Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-voyanero-500/10 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
      </div>

      <div className="absolute top-4 right-4 z-50">
        <DarkModeToggle />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-voyanero-500 to-blue-600 mb-4 shadow-lg shadow-voyanero-500/30">
            <span className="text-3xl font-bold text-white">V</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Voyanero</h1>
          <p className="text-gray-400 text-lg">
            Your SaaS Platform for Lead Generation
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#0B1121]/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-emerald-400 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-voyanero-500 focus:border-transparent transition text-white placeholder-gray-500 outline-none"
                placeholder="your@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-voyanero-500 focus:border-transparent transition text-white placeholder-gray-500 outline-none"
                placeholder="••••••••"
              />
              {!isLogin && (
                <p className="mt-1 text-xs text-gray-500">
                  Minimum 6 characters
                </p>
              )}
            </div>

            {/* Signup Only Fields */}
            {!isLogin && (
              <>
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required={!isLogin}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-voyanero-500 focus:border-transparent transition text-white placeholder-gray-500 outline-none"
                    placeholder="Acme Corp"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-voyanero-500 focus:border-transparent transition text-white placeholder-gray-500 outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-voyanero-500 text-white py-3 rounded-xl font-bold hover:bg-voyanero-400 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-voyanero-500/20 hover:shadow-voyanero-500/30 hover:-translate-y-0.5"
            >
              {loading
                ? isLogin
                  ? 'Logging in...'
                  : 'Creating account...'
                : isLogin
                  ? 'Log In'
                  : 'Create Account'}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              {isLogin ? (
                <>
                  Don't have an account?{' '}
                  <span className="text-voyanero-400 font-bold">Sign Up</span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span className="text-voyanero-400 font-bold">Log In</span>
                </>
              )}
            </button>
          </div>

          {/* Forgot Password */}
          {isLogin && (
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-300 transition"
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p className="mb-2">© 2024 Voyanero. All rights reserved.</p>
          <div className="flex justify-center gap-4">
            <a href="/impressum" className="hover:text-white transition underline">Impressum</a>
            <a href="/agb" className="hover:text-white transition underline">AGB</a>
            <a href="/datenschutz" className="hover:text-white transition underline">Datenschutz</a>
            <a href="/av-vertrag" className="hover:text-white transition underline">AV-Vertrag</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
