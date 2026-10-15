'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  currency: string
  date_format: string
  time_format: string
}

export interface UserEmailNotifications {
  order_updates: boolean
  payment_reminders: boolean
  delivery_updates: boolean
  promotions: boolean
  newsletter: boolean
  security_alerts: boolean
}

export interface UserPrivacySettings {
  profile_visibility: 'public' | 'private' | 'friends'
  show_order_history: boolean
  analytics_consent: boolean
  marketing_consent: boolean
}

export interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  preferences: UserPreferences
  email_notifications: UserEmailNotifications
  privacy_settings: UserPrivacySettings
}

interface PreferencesContextType {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>
  updateNotifications: (notifs: Partial<UserEmailNotifications>) => Promise<void>
  updatePrivacy: (privacy: Partial<UserPrivacySettings>) => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
}

const PreferencesContext = createContext<PreferencesContextType | null>(null)

// Default preferences for immediate theme application
const THEME_KEY = 'mantels-theme'

function getInitialTheme(): 'light' | 'dark' | 'system' {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem(THEME_KEY)
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    return stored as 'light' | 'dark' | 'system'
  }
  return 'system'
}

function applyTheme(theme: 'light' | 'dark' | 'system') {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.add(prefersDark ? 'dark' : 'light')
  } else {
    root.classList.add(theme)
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initializedRef = useRef(false)

  const supabase = createClient()

  // Apply theme immediately on mount (before profile loads)
  useEffect(() => {
    console.log('[Theme] Mounting provider, applying initial theme')
    const initialTheme = getInitialTheme()
    console.log('[Theme] Initial theme from storage:', initialTheme)
    applyTheme(initialTheme)
    localStorage.setItem(THEME_KEY, initialTheme)
    if (!initializedRef.current) {
      initializedRef.current = true
    }
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      console.log('[Theme] Profile loaded:', data?.preferences?.theme)
      setProfile(data)
      
      // Apply theme from profile after it loads
      if (data?.preferences?.theme) {
        console.log('[Theme] Applying theme from profile:', data.preferences.theme)
        applyTheme(data.preferences.theme)
        localStorage.setItem(THEME_KEY, data.preferences.theme)
      }
    } catch (err) {
      console.error('[Theme] Error loading profile:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar perfil')
    } finally {
      setLoading(false)
    }
  }

  const applyThemeAndSave = (theme: UserPreferences['theme']) => {
    console.log('[Theme] Applying and saving theme:', theme)
    applyTheme(theme)
    localStorage.setItem(THEME_KEY, theme)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const currentTheme = localStorage.getItem(THEME_KEY)
      if (currentTheme === 'system') {
        applyTheme('system')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    if (!profile) return
    const { error } = await supabase
      .from('profiles')
      .update({ preferences: { ...profile.preferences, ...prefs } })
      .eq('id', profile.id)
    
    if (error) throw error
    setProfile(prev => prev ? { ...prev, preferences: { ...prev.preferences, ...prefs } } : null)
    
    // Apply theme immediately if changed
    if (prefs.theme) {
      applyThemeAndSave(prefs.theme)
    }
  }

  const updateNotifications = async (notifs: Partial<UserEmailNotifications>) => {
    if (!profile) return
    const { error } = await supabase
      .from('profiles')
      .update({ email_notifications: { ...profile.email_notifications, ...notifs } })
      .eq('id', profile.id)
    
    if (error) throw error
    setProfile(prev => prev ? { ...prev, email_notifications: { ...prev.email_notifications, ...notifs } } : null)
  }

  const updatePrivacy = async (privacy: Partial<UserPrivacySettings>) => {
    if (!profile) return
    const { error } = await supabase
      .from('profiles')
      .update({ privacy_settings: { ...profile.privacy_settings, ...privacy } })
      .eq('id', profile.id)
    
    if (error) throw error
    setProfile(prev => prev ? { ...prev, privacy_settings: { ...prev.privacy_settings, ...privacy } } : null)
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', profile.id)
    
    if (error) throw error
    setProfile(prev => prev ? { ...prev, ...data } : null)
  }

  const refresh = async () => {
    await fetchProfile()
  }

  return (
    <PreferencesContext.Provider value={{
      profile,
      loading,
      error,
      refresh,
      updatePreferences,
      updateNotifications,
      updatePrivacy,
      updateProfile,
    }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}