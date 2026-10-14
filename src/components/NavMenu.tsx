'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { CartCount } from './CartCount'

interface MenuItem {
  id: string
  label: string
  href: string
  icon: string | null
  parent_id: string | null
  location: string
  sort_order: number
  is_active: boolean
  visibility_rule: string
  open_in_new_tab: boolean
  description: string | null
  children: MenuItem[]
}

function buildMenuTree(items: MenuItem[]): (MenuItem & { children: MenuItem[] })[] {
  const map = new Map<string, MenuItem & { children: MenuItem[] }>()
  const roots: (MenuItem & { children: MenuItem[] })[] = []

  for (const item of items) {
    map.set(item.id, { ...item, children: [] })
  }

  for (const item of items) {
    const node = map.get(item.id)!
    if (item.parent_id) {
      const parent = map.get(item.parent_id)
      if (parent) parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots.sort((a, b) => a.sort_order - b.sort_order)
}

function MobileMenuItem({ item, isActivePath }: { item: MenuItem & { children: MenuItem[] }; isActivePath: boolean }) {
  const hasChildren = item.children.length > 0
  const href = item.href
  const isExternal = href.startsWith('http') || href.startsWith('//')
  const target = item.open_in_new_tab || isExternal ? '_blank' : undefined
  const rel = isExternal ? 'noopener noreferrer' : undefined

  if (hasChildren) {
    return (
      <div className="relative group">
        <button className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-zinc-100 text-left">
          {item.icon && <span aria-hidden="true">{item.icon}</span>}
          {item.label}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 ml-auto">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div className="pl-4 mt-1 border-l border-white/10">
          {item.children.map(child => (
            <Link
              key={child.id}
              href={child.href}
              target={target}
              rel={rel}
              className="block rounded-xl px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-zinc-100"
            >
              {child.icon && <span aria-hidden="true" className="mr-2">{child.icon}</span>}
              {child.label}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm transition ${
        isActivePath
          ? 'bg-white/10 text-zinc-100'
          : 'text-zinc-300 hover:bg-white/10 hover:text-zinc-100'
      }`}
    >
      {item.icon && <span aria-hidden="true">{item.icon}</span>}
      {item.label}
    </Link>
  )
}

export function NavMenu({ 
  user, 
  signoutAction, 
  userMenuItems 
}: { 
  user: boolean; 
  signoutAction: () => Promise<void>; 
  userMenuItems?: MenuItem[]
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Cierra el menú al cambiar de ruta
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const userTree = userMenuItems ? buildMenuTree(userMenuItems) : []

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="movil-menu"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-white/10 transition hover:bg-white/10"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>
      {open && (
        <div
          id="movil-menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-3xl bg-[#0B0B12] p-2 shadow-[0_16px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-xl"
        >
          {userTree.map(item => (
            <MobileMenuItem key={item.id} item={item} isActivePath={pathname === item.href || pathname.startsWith(item.href + '/')} />
          ))}
          <div className="px-4 py-1.5 text-sm text-zinc-300">
            <CartCount />
          </div>
          <div className="my-1 h-px bg-white/10" />
          {user ? (
            <form action={signoutAction}>
              <button type="submit" className="block w-full rounded-xl px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-zinc-100 text-left">
                Salir
              </button>
            </form>
          ) : (
            <Link href="/login" className="block rounded-xl px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-zinc-100">
              Entrar
            </Link>
          )}
        </div>
      )}
    </div>
  )
}