'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Glow } from '@/components/Glow'

type CartItem = { id: string; qty: number }
type Product = { id: string; name: string; price: number; image_url: string | null }

export default function CartPage() {
  const [items, setItems] = useState<(CartItem & Product)[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const cart = JSON.parse(localStorage.getItem('cart') ?? '[]') as CartItem[]
      if (cart.length === 0) { setLoaded(true); return }
      const supabase = createClient()
      const { data } = await supabase.from('products').select('*').in('id', cart.map((c) => c.id))
      const merged = cart.map((c) => ({ ...c, ...(data ?? []).find((p: Product) => p.id === c.id) })) as (CartItem & Product)[]
      setItems(merged)
      setLoaded(true)
    }
    load()
  }, [])

  const total = items.reduce((s, i) => s + Number(i.price) * i.qty, 0)
  const money = (n: number) => `RD$${Number(n).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`

  function persist(next: (CartItem & Product)[]) {
    setItems(next)
    localStorage.setItem('cart', JSON.stringify(next.map((i) => ({ id: i.id, qty: i.qty }))))
    window.dispatchEvent(new Event('cart:updated'))
  }

  function setQty(id: string, qty: number) {
    persist(items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)))
  }

  function remove(id: string) {
    persist(items.filter((i) => i.id !== id))
  }

  function clear() {
    localStorage.removeItem('cart')
    setItems([])
    window.dispatchEvent(new Event('cart:updated'))
  }

  function checkout() {
    const lines = items.map((i) => `• ${i.name} x${i.qty} — ${money(Number(i.price) * i.qty)}`)
    const msg = encodeURIComponent(`Hola! Quiero comprar:\n${lines.join('\n')}\nTotal: ${money(total)}`)
    window.open(`https://wa.me/18297632009?text=${msg}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100">
      <Glow />
      <main className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">← Seguir comprando</Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Tu carrito</h1>

        {loaded && items.length === 0 && (
          <div className="mt-8 rounded-[2rem] bg-white/5 p-12 text-center ring-1 ring-white/10">
            <p className="text-zinc-400">Tu carrito está vacío.</p>
            <Link href="/" className="mt-4 inline-block text-sm text-cyan-300 hover:underline">Explorar el catálogo</Link>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="min-w-0">
                <p className="truncate font-medium">{i.name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => setQty(i.id, i.qty - 1)} aria-label="Menos" className="flex h-9 w-9 items-center justify-center rounded-full text-base ring-1 ring-white/10 hover:bg-white/10">−</button>
                  <span className="text-sm text-zinc-400">x{i.qty}</span>
                  <button onClick={() => setQty(i.id, i.qty + 1)} aria-label="Más" className="flex h-9 w-9 items-center justify-center rounded-full text-base ring-1 ring-white/10 hover:bg-white/10">+</button>
                  <button onClick={() => remove(i.id)} className="ml-2 text-xs text-red-400 hover:underline">Quitar</button>
                </div>
              </div>
              <p className="whitespace-nowrap font-bold text-cyan-300">{money(Number(i.price) * i.qty)}</p>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="mt-8 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
            <p className="text-xl font-bold">Total: {money(total)}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={checkout} className="rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                Comprar por WhatsApp
              </button>
              <button onClick={clear} className="rounded-full border border-white/10 px-6 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5">
                Vaciar
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
