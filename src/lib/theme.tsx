'use client'

import { createContext, useEffect, useState, useRef } from 'react'

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system'
  resolved: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

function applyTheme(theme: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  
  let resolved: 'light' | 'dark'
  
  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } else {
    resolved = theme
  }
  
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
  root.setAttribute('data-theme', resolved)
  
  return resolved
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system')
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark')
  const initializedRef = useRef(false)

  // Initialize on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      const stored = localStorage.getItem('mantels-theme')
      const initialTheme = (stored && ['light', 'dark', 'system'].includes(stored)) ? stored as 'light' | 'dark' | 'system' : 'system'
      
      setThemeState(initialTheme)
      const resolvedTheme = applyTheme(initialTheme)
      setResolved(resolvedTheme)
    }
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const currentTheme = localStorage.getItem('mantels-theme')
      if (currentTheme === 'system' || currentTheme === null) {
        const resolved = applyTheme('system')
        setResolved(resolved)
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    localStorage.setItem('mantels-theme', newTheme)
    setThemeState(newTheme)
    const resolved = applyTheme(newTheme)
    setResolved(resolved)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Simple hook
export function useTheme() {
  if (typeof window === 'undefined') {
    return { theme: 'system' as const, resolved: 'dark' as const, setTheme: () => {} }
  }
  
  const stored = localStorage.getItem('mantels-theme')
  const theme = (stored && ['light', 'dark', 'system'].includes(stored)) ? stored as 'light' | 'dark' | 'system' : 'system'
  
  return {
    theme,
    resolved: (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light',
    setTheme: (newTheme: 'light' | 'dark' | 'system') => {
      localStorage.setItem('mantels-theme', newTheme)
      const resolved = newTheme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : newTheme
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(resolved)
      document.documentElement.setAttribute('data-theme', resolved)
    }
  }
}

// Server-side helper
export function getInitialTheme(): 'light' | 'dark' | 'system' {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem('mantels-theme')
  if (stored && ['light', 'dark', 'system'].includes(stored)) return stored as 'light' | 'dark' | 'system'
  return 'system'
}