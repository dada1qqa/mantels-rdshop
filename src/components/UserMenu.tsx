'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTheme } from '@/components/ThemeProvider'

interface UserMenuProps {
  signoutAction: () => Promise<void>
}

export function UserMenu({ signoutAction }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { resolved, theme } = useTheme()

  const isDark = resolved === 'dark'

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 transition"
        aria-label="Mi cuenta"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Mi cuenta</span>
        {/* Theme indicator */}
        <span 
          className="w-2 h-2 rounded-full border border-white/20" 
          style={{ backgroundColor: isDark ? '#fbbf24' : '#60a5fa' }} 
          title={`Tema: ${theme} (${isDark ? 'oscuro' : 'claro'})`} 
        />
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-base-900 shadow-[0_16px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-xl overflow-hidden z-50 animate-fade-in"
        >
          <Link href="/mi-cuenta/pedidos" className="block px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-zinc-100 flex items-center gap-2" onClick={() => setOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
            📦 Mis pedidos
          </Link>
          <Link href="/mi-cuenta/calendario" className="block px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-zinc-100 flex items-center gap-2" onClick={() => setOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M16 22v-4M8 2v4M8 22v-4M3 10h4M21 10h-4" />
            </svg>
            📅 Mi calendario
          </Link>
          <Link href="/mi-cuenta/actividad" className="block px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-zinc-100 flex items-center gap-2" onClick={() => setOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            🔔 Actividad
          </Link>
          
          <div className="border-t border-white/10 my-1" />
          <form action={signoutAction}>
            <button type="submit" className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-zinc-100 flex items-center gap-2" onClick={() => setOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Salir
            </button>
          </form>
        </div>
      )}
    </div>
  )
}