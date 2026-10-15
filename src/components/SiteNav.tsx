import Link from 'next/link'
import { CartCount } from './CartCount'
import { NavMenu } from './NavMenu'
import { NotificationBell } from './orders/NotificationBell'
import { UserMenu } from './UserMenu'
import { signout } from '@/app/login/actions'
import { createClient } from '@/lib/supabase/server'

export async function SiteNav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-4 z-40 mx-auto mt-6 flex w-[calc(100%-2rem)] max-w-6xl items-center justify-between rounded-full bg-white/5 px-4 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/10 backdrop-blur-xl sm:px-6">
      <Link href="/" className="text-sm font-semibold tracking-wide">
        Mantelsio<span className="bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">RDshop</span>
      </Link>
      <span className="hidden items-center gap-4 text-xs text-zinc-400 md:flex">
        <Link href="/" className="hover:text-zinc-100">Catálogo</Link>
        <Link href="/solicitar" className="hover:text-zinc-100">Solicitar</Link>
        <CartCount />
        <Link href="/contacto" className="hover:text-zinc-100">Contacto</Link>
        {user ? (
          <>
            <NotificationBell />
            <UserMenu signoutAction={signout} />
          </>
        ) : (
          <Link href="/login" className="hover:text-zinc-100">Entrar</Link>
        )}
      </span>
      <NavMenu user={!!user} signoutAction={signout} />
    </nav>
  )
}