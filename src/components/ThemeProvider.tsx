'use client'

import { useEffect, useState, ReactNode } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system')
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark')

  const applyTheme = (t: 'light' | 'dark' | 'system') => {
    let resolved: 'light' | 'dark'
    if (t === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
      resolved = t
    }
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
    return resolved
  }

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('mantels-theme') as 'light' | 'dark' | 'system' | null
    const initial = (stored && ['light', 'dark', 'system'].includes(stored)) ? stored : 'system'
    const resolved = applyTheme(initial)
    setThemeState(initial)
    setResolved(resolved)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const current = localStorage.getItem('mantels-theme')
      if (current === 'system' || current === null) {
        const resolved = e.matches ? 'dark' : 'light'
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(resolved)
        document.documentElement.setAttribute('data-theme', resolved)
        setResolved(resolved)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mounted])

  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}

export function useTheme() {
  if (typeof window === 'undefined') {
    return { theme: 'system' as const, resolved: 'dark' as const, setTheme: () => {} }
  }

  const stored = localStorage.getItem('mantels-theme') as 'light' | 'dark' | 'system' | null
  const theme = (stored && ['light', 'dark', 'system'].includes(stored)) ? stored : 'system'
  const resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    localStorage.setItem('mantels-theme', newTheme)
    let resolved: 'light' | 'dark'
    if (newTheme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
      resolved = newTheme
    }
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
  }

  return {
    theme,
    resolved,
    setTheme
  }
}