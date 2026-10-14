import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { statusLabel } from '@/lib/requests/statuses'
import SolicitudAcciones from './SolicitudAcciones'

export default async function SolicitudDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: r } = await supabase.from('requests').select('*').eq('id', id).single()
  if (!r || r.user_id !== user.id) redirect('/mis-solicitudes')

  const { data: history } = await supabase.from('request_status_history').select('*').eq('request_id', id).order('created_at')
  const { data: messages } = await supabase.from('request_messages').select('*').eq('request_id', id).order('created_at')
  const s = statusLabel(r.status)

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100">
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-bold">#{r.request_code}</h1>
        <p className="mt-1 text-zinc-500">{r.product_name} · {r.type}</p>
        <p className="mt-3 text-xl font-semibold text-cyan-300">{s?.icon} {s?.label}</p>
        {r.rejection_reason && <p className="mt-2 rounded-2xl bg-red-500/10 p-3 text-sm text-red-300">Motivo: {r.rejection_reason}</p>}
        {r.confirmed_price && <p className="mt-4">Precio confirmado: <b className="text-emerald-300">RD${Number(r.confirmed_price).toLocaleString()}</b></p>}
        {r.total_price && <p>Total: <b className="text-cyan-300">RD${Number(r.total_price).toLocaleString()}</b></p>}

        <SolicitudAcciones id={r.id} code={r.request_code} phone={r.customer_phone} canAccept={r.status === 'precio_confirmado' && !r.price_accepted} />

        <h2 className="mt-8 font-semibold">Historial</h2>
        <div className="mt-2 space-y-1 text-sm text-zinc-400">
          {(history ?? []).map((h) => (
            <p key={h.id}>{new Date(h.created_at).toLocaleString('es-DO')} — {h.previous_status ? `${h.previous_status} → ` : ''}{h.new_status}</p>
          ))}
        </div>

        <h2 className="mt-8 font-semibold">Mensajes</h2>
        <div className="mt-2 space-y-2">
          {(messages ?? []).map((m) => (
            <div key={m.id} className={`rounded-2xl p-3 text-sm ${m.sender_role === 'admin' ? 'bg-cyan-500/10' : 'bg-white/5 ring-1 ring-white/10'}`}>
              <p className="text-xs text-zinc-500">{m.sender_role === 'admin' ? 'MantelsioRDshop' : 'Tú'} · {new Date(m.created_at).toLocaleString('es-DO')}</p>
              <p className="mt-1">{m.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
