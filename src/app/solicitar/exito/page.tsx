import Link from 'next/link'
import { Glow } from '@/components/Glow'
import { SiteNav } from '@/components/SiteNav'
import { Footer } from '@/components/Footer'

export default async function Exito({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100"><Glow /><SiteNav />
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="text-4xl">✅</p>
        <h1 className="mt-4 text-3xl font-bold">Solicitud enviada correctamente</h1>
        {code && <p className="mt-4 text-xl font-mono text-cyan-300">#{code}</p>}
        <p className="mt-2 text-sm text-zinc-400">Estado: 🟡 En revisión</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/mis-solicitudes" className="rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white">Ver mis solicitudes</Link>
          <Link href="/solicitar" className="rounded-full border border-white/10 px-6 py-2.5 text-sm text-zinc-300">Crear otra</Link>
        </div>
      </main><Footer />
    </div>
  )
}
