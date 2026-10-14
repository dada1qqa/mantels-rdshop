import Link from 'next/link'
import { Glow } from '@/components/Glow'
import { SiteNav } from '@/components/SiteNav'
import { Footer } from '@/components/Footer'

export default function Contacto() {
  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100">
      <Glow />
      <SiteNav />
      <main className="relative mx-auto max-w-3xl px-4 py-10 md:py-16">
        <p className="mb-4 inline-block rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.25em] text-cyan-300 ring-1 ring-cyan-400/30">Contacto</p>
        <h1 className="text-4xl font-bold tracking-tight">¿Tienes preguntas?</h1>
        <p className="mt-4 text-zinc-400">Escríbenos por WhatsApp o email y te respondemos rápido.</p>

        <div className="mt-10 space-y-4">
          <a href="https://wa.me/18297632009" target="_blank" rel="noreferrer" className="block rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 transition hover:ring-cyan-400/40">
            <p className="text-sm text-zinc-500">WhatsApp</p>
            <p className="mt-1 text-lg font-semibold">829 763 2009</p>
          </a>
          <a href="https://instagram.com/mantelsiordshop" target="_blank" rel="noreferrer" className="block rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 transition hover:ring-cyan-400/40">
            <p className="text-sm text-zinc-500">Instagram</p>
            <p className="mt-1 text-lg font-semibold">@mantelsiordshop</p>
          </a>
          <a href="mailto:ventas@mantels-rdshop.com" className="block rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 transition hover:ring-cyan-400/40">
            <p className="text-sm text-zinc-500">Email</p>
            <p className="mt-1 text-lg font-semibold">ventas@mantels-rdshop.com</p>
          </a>
        </div>

        <p className="mt-10 text-sm text-zinc-500">
          ¿Quieres ver el catálogo primero? <Link href="/" className="text-cyan-300 hover:underline">Ir al catálogo</Link>
        </p>
      </main>
      <Footer />
    </div>
  )
}
