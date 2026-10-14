import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { STATE_META } from '@/lib/requests/states'
import { Glow } from '@/components/Glow'
import { SiteNav } from '@/components/SiteNav'
import { Footer } from '@/components/Footer'

export default async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?error=1')
  const { data: r } = await supabase.from('requests').select('*').eq('id', id).eq('user_id', user.id).single()
  if (!r) return <div className="flex min-h-screen items-center justify-center bg-[#050508] text-zinc-400">No encontrada.</div>
  const { data: history } = await supabase.from('request_status_history').select('*').eq('request_id', id).order('created_at', { ascending: true })
  const { data: messages } = await supabase.from('request_messages').select('*').eq('request_id', id).order('created_at', { ascending: true })
  const meta = STATE_META[r.status as keyof typeof STATE_META]

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100"><Glow /><SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Link href="/mis-solicitudes" className="text-sm text-zinc-500 hover:text-zinc-300">← Volver</Link>
        <div className="mt-6 rounded-[2rem] bg-white/5 p-8 ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <p className="font-mono text-lg text-cyan-300">#{r.request_code}</p>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs ring-1 ring-white/10">{meta?.icon} {meta?.label}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold">{r.product_name}</h1>
          <p className="mt-2 text-sm text-zinc-400">{r.description}</p>
          {r.rejection_reason && <p className="mt-3 rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-300">Motivo: {r.rejection_reason}</p>}

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-zinc-500">Tipo</dt><dd>{r.type}</dd></div>
            <div><dt className="text-zinc-500">Cantidad</dt><dd>{r.quantity}</dd></div>
            <div><dt className="text-zinc-500">Precio estimado</dt><dd>RD${Number(r.estimated_price ?? 0).toLocaleString()}</dd></div>
            <div><dt className="text-zinc-500">Precio máximo</dt><dd>RD${Number(r.maximum_price ?? 0).toLocaleString()}</dd></div>
            {r.total_price != null && <div className="col-span-2"><dt className="text-zinc-500">Total confirmado</dt><dd className="text-xl font-bold text-cyan-300">RD${Number(r.total_price).toLocaleString()}</dd></div>}
          </dl>

          <h3 className="mt-8 text-lg font-semibold">Historial</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            {(history ?? []).map((h: Record<string, string> & { id: string; new_status: string; created_at: string; note?: string | null }) => <li key={h.id}>{new Date(h.created_at).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })} — {STATE_META[h.new_status as keyof typeof STATE_META]?.label}</li>)}
            {(history ?? []).length === 0 && <li>Sin cambios aún.</li>}
          </ul>

          <h3 className="mt-8 text-lg font-semibold">Mensajes</h3>
          <div className="mt-3 space-y-2">
            {(messages ?? []).map((m: Record<string, unknown> & { id: string; body: string; sender_role: string }) => (
              <div key={m.id} className={`rounded-xl px-4 py-2 text-sm ${m.sender_role === 'admin' ? 'bg-cyan-500/10 text-cyan-200' : 'bg-white/5 text-zinc-300'}`}>{m.body}</div>
            ))}
            {(messages ?? []).length === 0 && <p className="text-sm text-zinc-500">Aún no hay mensajes.</p>}
          </div>
        </div>
      </main><Footer />
    </div>
  )
}
