'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { type: 'product' | 'digital' | 'external' | 'other' }

const TITLES: Record<Props['type'], string> = {
  product: 'Solicitar producto',
  digital: 'Productos digitales',
  external: 'Comprar desde otra tienda',
  other: 'Solicitud personalizada',
}

export function RequestForm({ type }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const body: Record<string, unknown> = {
      type,
      customer_name: fd.get('customer_name'),
      customer_phone: fd.get('customer_phone'),
      description: fd.get('description'),
      quantity: fd.get('quantity'),
      estimated_price: fd.get('estimated_price'),
      maximum_price: fd.get('maximum_price'),
      payment_method: fd.get('payment_method'),
      customer_notes: fd.get('customer_notes'),
    }
    if (type === 'product') {
      Object.assign(body, { product_name: fd.get('product_name'), category: fd.get('category'), description: fd.get('description') })
    } else if (type === 'digital') {
      Object.assign(body, { product_name: fd.get('product_name'), game: fd.get('game'), digital_product: fd.get('digital_product'), player_id: fd.get('player_id'), username: fd.get('username') })
    } else if (type === 'external') {
      Object.assign(body, { product_name: fd.get('product_name'), external_store: fd.get('external_store'), external_url: fd.get('external_url'), original_currency: fd.get('original_currency'), original_price: fd.get('original_price'), delivery_information: fd.get('delivery_information') })
    } else {
      Object.assign(body, { product_name: fd.get('product_name'), category: fd.get('category'), description: fd.get('description'), delivery_information: fd.get('delivery_information') })
    }

    setLoading(true)
    try {
      const res = await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al enviar'); setLoading(false); return }
      router.push(`/solicitar/exito?code=${data.request.request_code}`)
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  const input = 'w-full rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-cyan-400/50 focus:outline-none'

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">{TITLES[type]}</h2>
      {error && <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-300 ring-1 ring-red-500/30">{error}</p>}

      {type === 'digital' && <p className="rounded-xl bg-amber-500/10 px-4 py-2 text-sm text-amber-300 ring-1 ring-amber-500/30">Nunca compartas tu contraseña. Usa Player ID, User ID o username cuando sea necesario.</p>}

      {type === 'digital' ? (
        <>
          <input name="game" placeholder="Plataforma / juego (ej. Roblox, Free Fire)" className={input} />
          <input name="product_name" placeholder="Nombre del producto (ej. 2000 Robux)" required className={input} />
          <input name="digital_product" placeholder="Tipo de producto (Robux, Diamantes, V-Bucks, Gift Card…)" className={input} />
          <input name="player_id" placeholder="Player ID / User ID / UID" className={input} />
          <input name="username" placeholder="Nombre de usuario del juego" className={input} />
        </>
      ) : (
        <>
          <input name="product_name" placeholder="Nombre del artículo" required className={input} />
          <input name="category" placeholder="Categoría" className={input} />
        </>
      )}

      {type === 'external' && (
        <>
          <input name="external_url" type="url" placeholder="URL del producto" required className={input} />
          <input name="external_store" placeholder="Nombre de la tienda" className={input} />
          <input name="original_price" type="number" step="0.01" placeholder="Precio publicado" className={input} />
          <input name="original_currency" placeholder="Moneda del precio (USD, RD$...)" className={input} />
          <input name="delivery_information" placeholder="Dirección / info para la entrega" className={input} />
        </>
      )}

      <textarea name="description" placeholder="Descripción" rows={3} className="w-full rounded-2xl bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:outline-none focus:ring-cyan-400/50" />
      <div className="grid grid-cols-2 gap-3">
        <input name="quantity" type="number" min={1} defaultValue={1} placeholder="Cantidad" className={input} />
        <input name="estimated_price" type="number" step="0.01" placeholder="Precio estimado" className={input} />
      </div>
      <input name="maximum_price" type="number" step="0.01" placeholder="Precio máximo que aceptas pagar" className={input} />
      <input name="customer_name" placeholder="Tu nombre" required className={input} />
      <input name="customer_phone" placeholder="WhatsApp / teléfono" required className={input} />
      <input name="payment_method" placeholder="Método de pago preferido" className={input} />
      <textarea name="customer_notes" placeholder="Información adicional" rows={2} className="w-full rounded-2xl bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:outline-none focus:ring-cyan-400/50" />

      <button disabled={loading} className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 py-3 text-sm font-semibold text-white transition disabled:opacity-50">
        {loading ? 'Enviando…' : 'Enviar solicitud'}
      </button>
    </form>
  )
}
