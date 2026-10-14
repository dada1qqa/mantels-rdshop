import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { allowedTransitions } from '@/lib/orders/states'
import { updateOrderStatus } from './actions'

const STATUS_LABELS: Record<string, string> = {
  nuevo: '🟡 Nuevo',
  confirmado: '🔵 Confirmado',
  preparando: '🟠 Preparando',
  listo_para_envio: '📦 Listo para envío',
  enviado: '🚚 Enviado',
  entregado: '✅ Entregado',
  cancelado: '❌ Cancelado',
  reembolsado: '💸 Reembolsado',
}

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) redirect('/admin/login?error=permisos')

  const { status, q } = await searchParams
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100)
  if (status) query = query.eq('status', status)
  if (q) {
    const safe = q.replace(/[,%()]/g, ' ').trim()
    if (safe) query = query.or(`order_number.ilike.%${safe}%,customer_name.ilike.%${safe}%,customer_phone.ilike.%${safe}%`)
  }
  const { data: orders } = await query

  const filters = ['', 'nuevo', 'confirmado', 'preparando', 'listo_para_envio', 'enviado', 'entregado', 'cancelado']

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100">
      <main className="mx-auto max-w-5xl px-4 py-12">
        <a href="/admin" className="text-sm text-zinc-500 hover:text-zinc-300">← Admin</a>
        <h1 className="mt-4 text-3xl font-bold">Pedidos</h1>

        <form className="mt-6 flex gap-2">
          <input name="q" defaultValue={q} placeholder="Buscar #, cliente, teléfono" className="flex-1 rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:outline-none focus:ring-cyan-400/50" />
          {status && <input type="hidden" name="status" value={status} />}
          <button className="rounded-full bg-white/10 px-4 py-2 text-sm">Buscar</button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((f) => (
            <a key={f || 'todos'} href={`/admin/orders${f ? `?status=${f}` : ''}${q ? `${f ? '&' : '?'}q=${q}` : ''}`} className={`rounded-full px-3 py-1 text-xs ring-1 transition ${status === f || (!status && f === '') ? 'bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white ring-transparent' : 'bg-white/5 text-zinc-300 ring-white/10'}`}>
              {f === '' ? 'Todos' : STATUS_LABELS[f]}
            </a>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {(orders ?? []).map((o) => (
            <div key={o.id} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <p className="font-bold">{o.order_number}</p>
                <span className="text-sm">{STATUS_LABELS[o.status] ?? o.status}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-400">{o.customer_name} · {o.customer_phone} · {o.shipping_city}</p>
              <p className="mt-1 text-sm text-zinc-500">{new Date(o.created_at).toLocaleString('es-DO')}</p>
              <p className="mt-2 text-lg font-bold text-cyan-300">RD${Number(o.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
              <form action={updateOrderStatus} className="mt-3 flex items-center gap-2">
                <input type="hidden" name="id" value={o.id} />
                <select name="status" className="rounded-full bg-white/5 px-3 py-1.5 text-xs ring-1 ring-white/10">
                  {allowedTransitions(o.status).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <button className="rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-4 py-1.5 text-xs font-medium text-white">Cambiar</button>
              </form>
            </div>
          ))}
          {(orders ?? []).length === 0 && <p className="text-zinc-500">No hay pedidos.</p>}
        </div>
      </main>
    </div>
  )
}
