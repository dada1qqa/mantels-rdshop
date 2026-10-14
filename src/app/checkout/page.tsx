'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type CartItem = { id: string; qty: number }
type Product = { id: string; name: string; price: number }

export default function CheckoutPage() {
  const [items, setItems] = useState<(CartItem & Product)[]>([])
  const [loaded, setLoaded] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [idempotencyKey] = useState(() => crypto.randomUUID())

  useEffect(() => {
    async function load() {
      const cart = JSON.parse(localStorage.getItem('cart') ?? '[]') as CartItem[]
      if (cart.length === 0) { setLoaded(true); return }
      const supabase = createClient()
      const { data } = await supabase.from('products').select('id,name,price').in('id', cart.map((c) => c.id))
      setItems(cart.map((c) => ({ ...c, ...(data ?? []).find((p) => p.id === c.id) })) as (CartItem & Product)[])
      setLoaded(true)
    }
    load()
  }, [])

  const subtotal = items.reduce((s, i) => s + Number(i.price) * i.qty, 0)
  const shippingCost = form.city.toLowerCase().includes('santo domingo') ? 200 : 350
  const total = subtotal + (items.length ? shippingCost : 0)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          customer_phone: form.phone,
          customer_email: form.email || undefined,
          shipping_address: form.address || undefined,
          shipping_city: form.city || undefined,
          shipping_cost: items.length ? shippingCost : 0,
          payment_method: 'cod',
          notes: form.notes || undefined,
          idempotency_key: idempotencyKey,
          items: items.map((i) => ({ product_id: i.id, quantity: i.qty })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'No se pudo crear el pedido'); return }
      setOrderNumber(data.order.order_number)
      localStorage.removeItem('cart')
    } catch {
      setError('No pudimos conectar con el servidor. Inténtalo nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (orderNumber) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050508] text-zinc-100">
        <div className="max-w-md text-center">
          <p className="text-5xl">✅</p>
          <h1 className="mt-4 text-2xl font-bold">¡Pedido recibido!</h1>
          <p className="mt-2 text-zinc-400">Tu pedido <span className="text-cyan-300">{orderNumber}</span> fue creado. Te contactaremos para confirmar.</p>
          <Link href="/" className="mt-6 inline-block rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white">Volver a la tienda</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100">
      <main className="mx-auto max-w-2xl px-4 py-10 md:py-16">
        <Link href="/cart" className="text-sm text-zinc-500 hover:text-zinc-300">← Volver al carrito</Link>
        <h1 className="mt-6 text-3xl font-bold">Finalizar compra</h1>

        {loaded && items.length === 0 && <p className="mt-8 text-zinc-500">El carrito está vacío.</p>}

        {items.length > 0 && (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <input required placeholder="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-full bg-white/5 px-4 py-2.5 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:outline-none focus:ring-cyan-400/50" />
            <input required placeholder="Teléfono (WhatsApp)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-full bg-white/5 px-4 py-2.5 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:outline-none focus:ring-cyan-400/50" />
            <input type="email" placeholder="Email (opcional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-full bg-white/5 px-4 py-2.5 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:outline-none focus:ring-cyan-400/50" />
            <input required placeholder="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-full bg-white/5 px-4 py-2.5 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:outline-none focus:ring-cyan-400/50" />
            <input required placeholder="Ciudad / Sector" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-full bg-white/5 px-4 py-2.5 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:outline-none focus:ring-cyan-400/50" />
            <textarea placeholder="Notas (opcional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-3xl bg-white/5 px-4 py-2.5 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:outline-none focus:ring-cyan-400/50" />

            <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between text-sm text-zinc-300">
                  <span>{i.name} × {i.qty}</span>
                  <span>RD${(Number(i.price) * i.qty).toLocaleString()}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between text-sm text-zinc-500"><span>Envío</span><span>RD${shippingCost.toLocaleString()}</span></div>
              <p className="mt-3 text-xl font-bold">Total: RD${total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            <button disabled={submitting} className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 py-3 font-semibold text-white transition disabled:opacity-50">
              {submitting ? 'Procesando…' : 'Confirmar pedido'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
