'use client'

import { useState } from 'react'
import Link from 'next/link'

interface RequestDetail {
  id: string
  request_code: string
  product_name: string
  type: string
  status: string
  rejection_reason?: string | null
  confirmed_price?: number | null
  total_price?: number | null
  price_accepted?: boolean
}

interface HistoryItem {
  created_at: string
  previous_status: string | null
  new_status: string
}

interface MessageItem {
  id: string
  sender_role: string
  body: string
  created_at: string
}

interface RequestDetails {
  request: RequestDetail
  history: HistoryItem[]
  messages: MessageItem[]
}

export default function ConsultarClient({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode)
  const [phone, setPhone] = useState('')
  const [details, setDetails] = useState<RequestDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [accepted, setAccepted] = useState(false)

  async function buscar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch(`/api/requests/x?code=${encodeURIComponent(code)}&phone=${encodeURIComponent(phone)}`)
    const data = await res.json()
    if (!res.ok) { setError('No encontramos esa solicitud con esos datos.'); return }
    setDetails(data)
  }

  async function enviarMensaje() {
    if (!message.trim()) return
    const res = await fetch(`/api/requests/${details!.request.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: message, phone }),
    })
    if (res.ok) { setSent(true); setMessage('') }
  }

  async function aceptarPrecio() {
    const res = await fetch(`/api/requests/x/accept?code=${encodeURIComponent(code)}&phone=${encodeURIComponent(phone)}`, { method: 'POST' })
    if (res.ok) setAccepted(true)
  }

  if (details) {
    const r = details.request
    return (
      <div className="min-h-screen bg-[#050508] text-zinc-100">
        <main className="mx-auto max-w-2xl px-4 py-16">
          <h1 className="text-3xl font-bold">#{r.request_code}</h1>
          <p className="mt-1 text-zinc-500">{r.product_name} · {r.type}</p>
          <p className="mt-3 text-xl font-semibold text-cyan-300">Estado: {r.status}</p>
          {r.rejection_reason && <p className="mt-2 rounded-2xl bg-red-500/10 p-3 text-sm text-red-300 ring-1 ring-red-500/30">Motivo: {r.rejection_reason}</p>}

          {r.confirmed_price && (
            <p className="mt-4 text-lg">Precio confirmado: <span className="font-bold text-emerald-300">RD${Number(r.confirmed_price).toLocaleString()}</span></p>
          )}
          {r.total_price && (
            <p className="text-lg">Total: <span className="font-bold text-cyan-300">RD${Number(r.total_price).toLocaleString()}</span></p>
          )}

          {r.status === 'precio_confirmado' && !r.price_accepted && !accepted && (
            <button onClick={aceptarPrecio} className="mt-4 rounded-full bg-gradient-to-r from-emerald-600 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white">Aceptar precio</button>
          )}
          {(r.price_accepted || accepted) && r.status === 'esperando_pago' && <p className="mt-4 text-emerald-300">Precio aceptado ✓</p>}

          <h2 className="mt-8 font-semibold">Historial</h2>
          <div className="mt-2 space-y-1 text-sm text-zinc-400">
            {(details.history ?? []).map((h, i) => (
              <p key={i}>{new Date(h.created_at).toLocaleString('es-DO')} — {h.previous_status ? `${h.previous_status} → ` : ''}{h.new_status}</p>
            ))}
          </div>

          <h2 className="mt-8 font-semibold">Mensajes</h2>
          <div className="mt-2 space-y-2">
            {(details.messages ?? []).map((m, i) => (
              <div key={i} className={`rounded-2xl p-3 text-sm ${m.sender_role === 'admin' ? 'bg-cyan-500/10 ring-1 ring-cyan-500/20' : 'bg-white/5 ring-1 ring-white/10'}`}>
                <p className="text-xs text-zinc-500">{m.sender_role === 'admin' ? 'MantelsioRDshop' : 'Tú'} · {new Date(m.created_at).toLocaleString('es-DO')}</p>
                <p className="mt-1">{m.body}</p>
              </div>
            ))}
          </div>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escribe un mensaje…" className="mt-4 w-full rounded-3xl bg-white/5 p-4 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50" />
          <button onClick={enviarMensaje} className="mt-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white">Enviar mensaje</button>
          {sent && <p className="mt-2 text-sm text-emerald-300">Mensaje enviado.</p>}
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050508] text-zinc-100">
      <form onSubmit={buscar} className="w-full max-w-sm rounded-[2rem] bg-white/5 p-8 ring-1 ring-white/10">
        <h1 className="mb-6 text-xl font-bold">Consultar solicitud</h1>
        <input required placeholder="Código (REQ-10482)" value={code} onChange={(e) => setCode(e.target.value)} className="mb-3 w-full rounded-full bg-white/5 px-4 py-2.5 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50" />
        <input required placeholder="Tu WhatsApp/teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} className="mb-3 w-full rounded-full bg-white/5 px-4 py-2.5 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50" />
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <button className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 py-2.5 font-semibold text-white">Buscar</button>
        <Link href="/solicitar" className="mt-4 block text-center text-sm text-zinc-500">← Volver</Link>
      </form>
    </div>
  )
}