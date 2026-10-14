import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { statusLabel } from '@/lib/requests/statuses'

export default async function AdminSolicitudes({ searchParams }: { searchParams: Promise<{ status?: string; type?: string; q?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) redirect('/admin/login?error=permisos')

  const { status, type, q } = await searchParams
  let query = supabase.from('requests').select('*').order('created_at', { ascending: false }).limit(200)
  if (status) query = query.eq('status', status)
  if (type) query = query.eq('type', type)
  if (q) {
    const safe = q.replace(/[,%()]/g, ' ').trim()
    if (safe) query = query.or(`request_code.ilike.%${safe}%,product_name.ilike.%${safe}%,customer_name.ilike.%${safe}%,customer_phone.ilike.%${safe}%`)
  }
  const { data: requests } = await query
  const all = requests ?? []
  const counts = all.reduce<Record<string, number>>((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc }, {})

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100">
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex items-center justify-between mb-4">
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-300">← Admin</Link>
          <Link href="/admin/calendario" className="rounded-full border border-white/10 px-4 py-1 text-xs text-zinc-300 transition hover:bg-white/10">Calendario</Link>
        </div>
        <h1 className="mt-4 text-3xl font-bold">Solicitudes</h1>

        <div className="mt-6 flex flex-wrap gap-2 text-xs">
          {Object.entries(counts).map(([k, v]) => {
            const s = statusLabel(k)
            return <span key={k} className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">{s?.icon} {s?.label}: {v}</span>
          })}
        </div>

        <form className="mt-6 flex gap-2">
          <input name="q" defaultValue={q} placeholder="Buscar…" className="flex-1 rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 focus:outline-none" />
          <button className="rounded-full bg-white/10 px-4 py-2 text-sm">Buscar</button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Link href="/admin/solicitudes" className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">Todos</Link>
          {['product', 'digital', 'external', 'other'].map((t) => (
            <Link key={t} href={`/admin/solicitudes?type=${t}`} className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">{t}</Link>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          {all.map((r) => {
            const s = statusLabel(r.status)
            return (
              <Link key={r.id} href={`/admin/solicitudes/${r.id}`} className="block rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 hover:ring-cyan-400/30">
                <div className="flex justify-between">
                  <p className="font-bold">#{r.request_code}</p>
                  <span className="text-sm">{s?.icon} {s?.label}</span>
                </div>
                <p className="text-sm text-zinc-400">{r.product_name} · {r.type} · {r.customer_name}</p>
                <p className="text-xs text-zinc-600">{new Date(r.created_at).toLocaleString('es-DO')}{r.maximum_price ? ` · Máx RD$${Number(r.maximum_price).toLocaleString()}` : ''}</p>
              </Link>
            )
          })}
          {all.length === 0 && <p className="text-zinc-500">No hay solicitudes.</p>}
        </div>
      </main>
    </div>
  )
}
