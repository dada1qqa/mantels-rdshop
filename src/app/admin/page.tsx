import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createProduct, updateProduct, deleteProduct, logout } from './actions'
type ProductDefaults = { name?: string; category?: string | null; tag?: string | null; price?: number; stock?: number | null; image_url?: string | null; source_url?: string | null; description?: string | null }

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) redirect('/admin/login?error=permisos')
  const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-[140px]" />
        <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-[140px]" />
      </div>
      <header className="sticky top-4 z-40 mx-auto mt-6 w-[calc(100%-2rem)] max-w-6xl rounded-full bg-white/5 px-6 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold">Admin — Mantelsio<span className="bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">RDshop</span></h1>
          <div className="flex items-center gap-2">
          <Link href="/admin/orders" className="rounded-full border border-white/10 px-4 py-1 text-xs text-zinc-300 transition hover:bg-white/10">Pedidos</Link>
          <Link href="/admin/solicitudes" className="rounded-full border border-white/10 px-4 py-1 text-xs text-zinc-300 transition hover:bg-white/10">Solicitudes</Link>
          <Link href="/admin/calendario" className="rounded-full border border-white/10 px-4 py-1 text-xs text-zinc-300 transition hover:bg-white/10">Calendario</Link>
        <form action={logout}>
            <button className="rounded-full border border-white/10 px-4 py-1 text-xs text-zinc-300 transition hover:bg-white/10">Salir</button>
          </form>
        </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-12">
        <p className="mb-4 inline-block rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.25em] text-cyan-300 ring-1 ring-cyan-400/30">Panel</p>
        <h2 className="mb-6 text-3xl font-bold tracking-tight">Agregar producto</h2>
        <ProductForm action={createProduct} />

        <h2 className="mb-6 mt-16 text-3xl font-bold tracking-tight">Productos existentes</h2>
        <div className="space-y-4">
          {(products ?? []).map((p) => (
            <form key={p.id} action={updateProduct} className="rounded-[1.5rem] bg-white/5 p-5 ring-1 ring-white/10">
              <input type="hidden" name="id" value={p.id} />
              <ProductFields defaults={p} />
              <div className="mt-4 flex gap-2">
                <button className="rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-5 py-1.5 text-sm font-medium text-white transition hover:opacity-90">Guardar</button>
                <button formAction={deleteProduct} className="rounded-full bg-red-500/20 px-5 py-1.5 text-sm font-medium text-red-300 ring-1 ring-red-500/30 transition hover:bg-red-500/30">
                  Eliminar
                </button>
              </div>
            </form>
          ))}
          {(products ?? []).length === 0 && <p className="text-zinc-500">No hay productos todavía.</p>}
        </div>
      </main>
    </div>
  )
}

function ProductForm({ action, defaults }: { action: (fd: FormData) => Promise<void>; defaults?: ProductDefaults }) {
  return (
    <form action={action} className="rounded-[1.5rem] bg-white/5 p-5 ring-1 ring-white/10">
      <ProductFields defaults={defaults} />
      <button className="mt-4 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-5 py-1.5 text-sm font-medium text-white transition hover:opacity-90">Agregar</button>
    </form>
  )
}

function ProductFields({ defaults }: { defaults?: ProductDefaults }) {
  const d = defaults ?? {}
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <input name="name" placeholder="Nombre" defaultValue={d.name} required className="rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-cyan-400/50 focus:outline-none" />
      <input name="category" placeholder="Categoría" defaultValue={d.category ?? ''} className="rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-cyan-400/50 focus:outline-none" />
      <input name="tag" placeholder="Etiqueta (Nuevo, Oferta...)" defaultValue={d.tag ?? ''} className="rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-cyan-400/50 focus:outline-none" />
      <input name="price" type="number" step="0.01" placeholder="Precio RD$" defaultValue={d.price} required className="rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-cyan-400/50 focus:outline-none" />
      <input name="stock" type="number" placeholder="Stock" defaultValue={d.stock ?? 0} className="rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-cyan-400/50 focus:outline-none" />
      <input name="image_url" placeholder="URL de imagen" defaultValue={d.image_url ?? ''} className="rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-cyan-400/50 focus:outline-none" />
      <input name="source_url" placeholder="Enlace del producto (donde lo conseguiste)" defaultValue={d.source_url ?? ''} className="rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-cyan-400/50 focus:outline-none" />
      <input name="description" placeholder="Descripción" defaultValue={d.description ?? ''} className="rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-cyan-400/50 focus:outline-none" />
    </div>
  )
}
