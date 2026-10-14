'use client'

import { ThemeProvider } from '@/components/ThemeProvider'
import { PreferencesProvider } from '@/lib/preferences/provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        {children}
      </PreferencesProvider>
    </ThemeProvider>
  )
}