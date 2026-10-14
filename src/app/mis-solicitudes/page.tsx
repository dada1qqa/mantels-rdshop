import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { statusLabel } from '@/lib/requests/statuses'

export default async function MisSolicitudes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: requests } = await supabase.from('requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100">
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold">Mis solicitudes</h1>
        <div className="mt-8 space-y-4">
          {(requests ?? []).map((r) => {
            const s = statusLabel(r.status)
            return (
              <Link key={r.id} href={`/solicitudes/${r.id}`} className="block rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 hover:ring-cyan-400/30">
                <div className="flex justify-between">
                  <p className="font-bold">#{r.request_code}</p>
                  <span className="text-sm">{s?.icon} {s?.label ?? r.status}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-400">{r.product_name} · {r.type}</p>
                {r.total_price && <p className="mt-1 text-cyan-300">RD${Number(r.total_price).toLocaleString()}</p>}
                <p className="mt-1 text-xs text-zinc-600">{new Date(r.created_at).toLocaleDateString('es-DO')}</p>
              </Link>
            )
          })}
          {(requests ?? []).length === 0 && <p className="text-zinc-500">Aún no tienes solicitudes. <Link href="/solicitar" className="text-cyan-300">Crear una</Link></p>}
        </div>
      </main>
    </div>
  )
}
