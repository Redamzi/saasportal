import { useState, useEffect } from 'react'

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check localStorage for saved preference
    const savedTheme = localStorage.getItem('theme')

    // Check system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    // Determine if dark mode should be enabled
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark)

    setIsDark(shouldBeDark)

    // Apply dark class to html element
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleDark = () => {
    const newDarkState = !isDark
    setIsDark(newDarkState)

    // Save to localStorage
    localStorage.setItem('theme', newDarkState ? 'dark' : 'light')

    // Update html class
    if (newDarkState) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <button
      onClick={toggleDark}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      aria-label="Toggle dark mode"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <span className="text-2xl">☀️</span>
      ) : (
        <span className="text-2xl">🌙</span>
      )}
    </button>
  )
}
