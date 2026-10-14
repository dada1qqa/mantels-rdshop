'use client'

import { useState } from 'react'
import Link from 'next/link'

const TYPES = [
  { id: 'product', icon: '🛍️', title: 'Producto', desc: 'Productos físicos que no están en el catálogo' },
  { id: 'digital', icon: '🎮', title: 'Digital', desc: 'Robux, diamantes, V-Bucks, gift cards…' },
  { id: 'external', icon: '🌐', title: 'Otra tienda', desc: 'Enlace de un producto en otra tienda' },
  { id: 'other', icon: '✨', title: 'Otro', desc: 'Cualquier otra cosa que busques' },
] as const

export default function SolicitarPage() {
  const [type, setType] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ code: string; status: string } | null>(null)

  function set(k: string, v: string) { setForm({ ...form, [k]: v }) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const payload: Record<string, unknown> = { type, ...form }
    for (const k of ['estimated_price', 'maximum_price', 'external_price', 'quantity']) {
      if (payload[k] === '' || payload[k] === undefined) delete payload[k]
    }
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al enviar'); return }
      setCreated({ code: data.request.request_code, status: data.request.status })
    } catch {
      setError('No pudimos conectar con el servidor.')
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050508] text-zinc-100">
        <div className="max-w-md text-center">
          <p className="text-5xl">✅</p>
          <h1 className="mt-4 text-2xl font-bold">Solicitud enviada correctamente</h1>
          <p className="mt-3 text-3xl font-bold text-cyan-300">#{created.code}</p>
          <p className="mt-2 text-zinc-400">Estado: 🟡 En revisión</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href={`/consultar?code=${created.code}`} className="rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white">Ver mi solicitud</Link>
            <button onClick={() => { setCreated(null); setType(null); setForm({}) }} className="rounded-full border border-white/10 px-6 py-2.5 text-sm text-zinc-300">Crear otra</button>
          </div>
        </div>
      </div>
    )
  }

  if (!type) {
    return (
      <div className="min-h-screen bg-[#050508] text-zinc-100">
        <main className="mx-auto max-w-3xl px-4 py-10 md:py-16">
          <h1 className="text-4xl font-bold">¿Qué quieres conseguir?</h1>
          <p className="mt-3 text-zinc-400">Solicita productos, monedas virtuales, artículos de otras tiendas o cualquier cosa que estés buscando.</p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TYPES.map((t) => (
              <button key={t.id} onClick={() => setType(t.id)} className="rounded-3xl bg-white/5 p-6 text-left ring-1 ring-white/10 transition hover:ring-cyan-400/40">
                <p className="text-3xl">{t.icon}</p>
                <h3 className="mt-3 text-lg font-semibold">{t.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{t.desc}</p>
              </button>
            ))}
          </div>
          <p className="mt-8 text-sm text-zinc-500">¿Ya enviaste una? <Link href="/consultar" className="text-cyan-300">Consultar solicitud</Link></p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100">
      <main className="mx-auto max-w-2xl px-4 py-10 md:py-16">
        <button onClick={() => setType(null)} className="text-sm text-zinc-500 hover:text-zinc-300">← Cambiar tipo</button>
        <h1 className="mt-4 text-3xl font-bold">{TYPES.find((t) => t.id === type)?.icon} {TYPES.find((t) => t.id === type)?.title}</h1>

        <form onSubmit={submit} className="mt-8 space-y-3">
          {type === 'product' && (
            <>
              <Input label="Nombre del artículo" value={form.product_name} onChange={(v) => set('product_name', v)} required />
              <Input label="Categoría" value={form.category} onChange={(v) => set('category', v)} />
              <Input label="Marca (opcional)" value={form.brand} onChange={(v) => set('brand', v)} />
              <Input label="Modelo (opcional)" value={form.model} onChange={(v) => set('model', v)} />
              <Input label="Cantidad" type="number" value={form.quantity} onChange={(v) => set('quantity', v)} />
              <TextArea label="Descripción" value={form.description} onChange={(v) => set('description', v)} />
            </>
          )}

          {type === 'digital' && (
            <>
              <Input label="Plataforma / juego" value={form.game} onChange={(v) => set('game', v)} required />
              <Input label="Tipo de producto (Robux, diamantes…)" value={form.digital_product} onChange={(v) => set('digital_product', v)} required />
              <Input label="Cantidad" type="number" value={form.quantity} onChange={(v) => set('quantity', v)} />
              <Input label="Player ID / User ID / UID" value={form.player_id} onChange={(v) => set('player_id', v)} />
              <Input label="Username del juego" value={form.username} onChange={(v) => set('username', v)} />
              <p className="rounded-2xl bg-amber-500/10 p-3 text-xs text-amber-300 ring-1 ring-amber-500/30">⚠️ Nunca compartas tu contraseña.</p>
            </>
          )}

          {type === 'external' && (
            <>
              <Input label="URL del producto" value={form.external_url} onChange={(v) => set('external_url', v)} required />
              <Input label="Nombre de la tienda" value={form.external_store} onChange={(v) => set('external_store', v)} />
              <Input label="Nombre del producto" value={form.product_name} onChange={(v) => set('product_name', v)} required />
              <Input label="Cantidad" type="number" value={form.quantity} onChange={(v) => set('quantity', v)} />
              <Input label="Precio publicado" type="number" value={form.external_price} onChange={(v) => set('external_price', v)} />
              <Input label="Moneda" value={form.original_currency} onChange={(v) => set('original_currency', v)} placeholder="RD$ / USD…" />
            </>
          )}

          {type === 'other' && (
            <>
              <Input label="¿Qué estás buscando?" value={form.product_name} onChange={(v) => set('product_name', v)} />
              <Input label="Categoría" value={form.category} onChange={(v) => set('category', v)} />
              <TextArea label="Descripción detallada" value={form.description} onChange={(v) => set('description', v)} required />
              <Input label="Cantidad" type="number" value={form.quantity} onChange={(v) => set('quantity', v)} />
            </>
          )}

          <Input label="Precio que esperas pagar" type="number" value={form.estimated_price} onChange={(v) => set('estimated_price', v)} />
          <Input label="Precio máximo que aceptas pagar" type="number" value={form.maximum_price} onChange={(v) => set('maximum_price', v)} />
          <Input label="Tu nombre" value={form.customer_name} onChange={(v) => set('customer_name', v)} required />
          <Input label="WhatsApp / teléfono" value={form.customer_phone} onChange={(v) => set('customer_phone', v)} required />
          <Input label="Dirección o info de entrega" value={form.delivery_information} onChange={(v) => set('delivery_information', v)} />
          <Input label="Método de pago (Transferencia, etc.)" value={form.payment_method} onChange={(v) => set('payment_method', v)} />
          <TextArea label="Información adicional" value={form.customer_notes} onChange={(v) => set('customer_notes', v)} />

          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={submitting} className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 py-3 font-semibold text-white disabled:opacity-50">
            {submitting ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </form>
      </main>
    </div>
  )
}

function Input({ label, value, onChange, type, required, placeholder }: { label: string; value: string | undefined; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-500">{label}</label>
      <input type={type ?? 'text'} required={required} placeholder={placeholder} value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full bg-white/5 px-4 py-2.5 text-sm ring-1 ring-white/10 placeholder:text-zinc-600 focus:outline-none focus:ring-cyan-400/50" />
    </div>
  )
}

function TextArea({ label, value, onChange, required }: { label: string; value: string | undefined; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-500">{label}</label>
      <textarea required={required} value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-3xl bg-white/5 px-4 py-2.5 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50" />
    </div>
  )
}
