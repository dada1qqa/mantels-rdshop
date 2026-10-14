import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { statusLabel, REQUEST_STATUSES } from '@/lib/requests/statuses'
import AdminAcciones from './AdminAcciones'

export default async function AdminSolicitudDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) redirect('/admin/login?error=permisos')

  const { data: r } = await supabase.from('requests').select('*').eq('id', id).single()
  if (!r) redirect('/admin/solicitudes')
  const { data: history } = await supabase.from('request_status_history').select('*').eq('request_id', id).order('created_at')
  const { data: messages } = await supabase.from('request_messages').select('*').eq('request_id', id).order('created_at')
  const s = statusLabel(r.status)

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100">
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-center justify-between mb-4">
          <Link href="/admin/solicitudes" className="text-sm text-zinc-500 hover:text-zinc-300">← Solicitudes</Link>
          <Link href="/admin/calendario" className="rounded-full border border-white/10 px-4 py-1 text-xs text-zinc-300 transition hover:bg-white/10">Calendario</Link>
        </div>
        <h1 className="mt-4 text-3xl font-bold">#{r.request_code}</h1>
        <p className="text-zinc-500">{r.type} · {s?.icon} {s?.label} · {new Date(r.created_at).toLocaleString('es-DO')}</p>

        <section className="mt-8 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <h2 className="font-semibold">Producto</h2>
          <p className="mt-1">{r.product_name}</p>
          <p className="text-sm text-zinc-400">{r.description}</p>
          {r.quantity && <p className="text-sm text-zinc-500">Cantidad: {r.quantity}</p>}
          {r.game && <p className="text-sm text-zinc-500">Juego: {r.game} · {r.digital_product} · ID: {r.player_id ?? '—'} · @{r.username ?? '—'}</p>}
          {r.external_url && <a href={r.external_url} target="_blank" className="text-sm text-cyan-300 underline">{r.external_url}</a>}
        </section>

        <section className="mt-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <h2 className="font-semibold">Cliente</h2>
          <p>{r.customer_name} · {r.customer_phone}</p>
          <p className="text-sm text-zinc-500">{r.delivery_information}</p>
          <p className="text-sm text-zinc-500">Pago: {r.payment_method ?? '—'}</p>
          {r.customer_notes && <p className="mt-1 text-sm text-zinc-400">{r.customer_notes}</p>}
        </section>

        <section className="mt-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <h2 className="font-semibold">Precios</h2>
          <p className="text-sm text-zinc-400">Estimado: {r.estimated_price ? `RD$${Number(r.estimated_price).toLocaleString()}` : '—'} · Máximo: {r.maximum_price ? `RD$${Number(r.maximum_price).toLocaleString()}` : '—'}</p>
          <p className="text-sm text-zinc-400">Confirmado: {r.confirmed_price ? `RD$${Number(r.confirmed_price).toLocaleString()}` : '—'} · Total: {r.total_price ? `RD$${Number(r.total_price).toLocaleString()}` : '—'}</p>
        </section>

        <AdminAcciones requestId={r.id} statuses={REQUEST_STATUSES.map((x) => x.value)} currentStatus={r.status} initialPricing={{ confirmed_price: r.confirmed_price, product_price: r.product_price, shipping_cost: r.shipping_cost, taxes: r.taxes, commission: r.commission, total_price: r.total_price, admin_notes: r.admin_notes }} />

        <h2 className="mt-8 font-semibold">Historial</h2>
        <div className="mt-2 space-y-1 text-sm text-zinc-400">
          {(history ?? []).map((h) => (
            <p key={h.id}>{new Date(h.created_at).toLocaleString('es-DO')} — {h.previous_status ? `${h.previous_status} → ` : ''}{h.new_status} {h.note ? `· ${h.note}` : ''}</p>
          ))}
        </div>

        <h2 className="mt-8 font-semibold">Mensajes</h2>
        <div className="mt-2 space-y-2">
          {(messages ?? []).map((m) => (
            <div key={m.id} className={`rounded-2xl p-3 text-sm ${m.sender_role === 'admin' ? 'bg-cyan-500/10' : 'bg-white/5 ring-1 ring-white/10'}`}>
              <p className="text-xs text-zinc-500">{m.sender_role} · {new Date(m.created_at).toLocaleString('es-DO')}</p>
              <p className="mt-1">{m.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
