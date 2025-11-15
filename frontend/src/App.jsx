import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
      <div className="text-center text-white px-4">
        <h1 className="text-6xl md:text-8xl font-bold mb-4 animate-pulse">
          Voyanero
        </h1>
        <p className="text-2xl md:text-4xl font-light mb-8">
          Coming Soon
        </p>
        <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
          We're building something amazing. Stay tuned for the launch of your next SaaS platform.
        </p>
        <div className="mt-12">
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
            <p className="text-sm font-medium">
              Powered by FastAPI + React + Supabase
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
