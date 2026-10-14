'use client'

import { useState } from 'react'

export default function SolicitudAcciones({ id, canAccept }: { id: string; code: string; phone: string; canAccept: boolean }) {
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [accepted, setAccepted] = useState(false)

  async function enviar() {
    if (!message.trim()) return
    const res = await fetch(`/api/requests/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: message }),
    })
    if (res.ok) { setSent(true); setMessage('') }
  }

  async function aceptar() {
    const res = await fetch(`/api/requests/${id}/accept`, { method: 'POST' })
    if (res.ok) setAccepted(true)
  }

  return (
    <div>
      {canAccept && !accepted && (
        <button onClick={aceptar} className="mt-4 rounded-full bg-gradient-to-r from-emerald-600 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white">Aceptar precio</button>
      )}
      {accepted && <p className="mt-4 text-emerald-300">Precio aceptado ✓</p>}
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Mensaje…" className="mt-6 w-full rounded-3xl bg-white/5 p-4 text-sm ring-1 ring-white/10 focus:outline-none" />
      <button onClick={enviar} className="mt-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white">Enviar mensaje</button>
      {sent && <p className="mt-2 text-sm text-emerald-300">Enviado.</p>}
    </div>
  )
}
