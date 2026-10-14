import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 pt-10 text-xs text-zinc-600 safe-bottom">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <p>© {new Date().getFullYear()} MantelsioRDshop — República Dominicana</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/" className="hover:text-zinc-400">Catálogo</Link>
          <Link href="/solicitar" className="hover:text-zinc-400">Solicitar</Link>
          <Link href="/cart" className="hover:text-zinc-400">Carrito</Link>
          <Link href="/contacto" className="hover:text-zinc-400">Contacto</Link>
          <Link href="/mi-cuenta/pedidos" className="hover:text-zinc-400">Mis pedidos</Link>
          <Link href="/mi-cuenta/calendario" className="hover:text-zinc-400">Mi calendario</Link>
        </div>
      </div>
    </footer>
  )
}