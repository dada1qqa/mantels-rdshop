'use client'

import { useState } from 'react'

const EVENT_TYPES = [
  { value: 'request_received', label: '📝 Solicitud recibida' },
  { value: 'request_accepted', label: '✅ Solicitud aceptada' },
  { value: 'price_confirmed', label: '💰 Precio confirmado' },
  { value: 'payment_requested', label: '💳 Pago solicitado' },
  { value: 'payment_received', label: '💳 Pago recibido' },
  { value: 'purchase_made', label: '🛒 Compra realizada' },
  { value: 'preparing', label: '📦 Preparando' },
  { value: 'shipped', label: '🚚 Enviado' },
  { value: 'estimated_arrival', label: '📍 Llegada estimada' },
  { value: 'delivery_scheduled', label: '📅 Entrega programada' },
  { value: 'delivered', label: '✅ Entregado' },
  { value: 'date_changed', label: '🔄 Fecha modificada' },
  { value: 'cancelled', label: '⚫ Cancelado' },
  { value: 'rejected', label: '🔴 Rechazado' },
  { value: 'digital_delivery', label: '🎮 Entrega digital' },
  { value: 'external_purchase', label: '🌐 Compra externa' },
  { value: 'external_shipped', label: '🚚 Envío externo' },
  { value: 'arrived_carrier', label: '📍 Llegada transportista' },
  { value: 'arrived_country', label: '🇩🇴 Llegada al país' },
  { value: 'custom', label: '✨ Personalizado' },
] as const

export default function AdminAcciones({ requestId, statuses, currentStatus, initialPricing }: {
  requestId: string
  statuses: string[]
  currentStatus: string
  initialPricing: Record<string, unknown>
}) {
  const [status, setStatus] = useState(currentStatus)
  const [rejection, setRejection] = useState('')
  const [pricing, setPricing] = useState<Record<string, string>>(Object.fromEntries(Object.entries(initialPricing).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)])))
  const [message, setMessage] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  // Event management state
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventType, setEventType] = useState('custom')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [eventIsEstimated, setEventIsEstimated] = useState(false)
  const [eventIsRange, setEventIsRange] = useState(false)
  const [eventToleranceDays, setEventToleranceDays] = useState('')
  const [eventVisibleToCustomer, setEventVisibleToCustomer] = useState(true)
  const [creatingEvent, setCreatingEvent] = useState(false)

  async function cambiarEstado() {
    setMsg(null)
    const res = await fetch(`/api/requests/${requestId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejection_reason: rejection || undefined }),
    })
    const data = await res.json()
    setMsg(res.ok ? 'Estado actualizado ✓' : data.error)
  }

  async function guardarPrecio() {
    setMsg(null)
    const res = await fetch(`/api/requests/${requestId}/pricing`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pricing, set_status: status === 'precio_confirmado' ? 'precio_confirmado' : undefined }),
    })
    const data = await res.json()
    setMsg(res.ok ? 'Precios guardados ✓' : data.error)
  }

  async function enviarMensaje() {
    if (!message.trim()) return
    const res = await fetch(`/api/requests/${requestId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: message }),
    })
    if (res.ok) { setMsg('Mensaje enviado ✓'); setMessage('') }
  }

  async function crearEvento() {
    if (!eventTitle.trim() || !eventDate) return
    setCreatingEvent(true)
    setMsg(null)
    
    const res = await fetch('/api/order-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: requestId,
        event_type: eventType,
        title: eventTitle,
        description: eventDescription,
        event_date: eventDate,
        start_time: eventStartTime || null,
        end_time: eventEndTime || null,
        end_date: eventEndDate || (eventIsRange ? eventDate : null),
        is_estimated: eventIsEstimated,
        is_range: eventIsRange,
        tolerance_days: eventToleranceDays ? parseInt(eventToleranceDays) : null,
        is_visible_to_customer: eventVisibleToCustomer,
      }),
    })
    
    const data = await res.json()
    setCreatingEvent(false)
    
    if (res.ok) {
      setMsg('Evento creado ✓')
      setShowEventForm(false)
      setEventTitle('')
      setEventDescription('')
      setEventDate(new Date().toISOString().split('T')[0])
      setEventEndDate('')
      setEventStartTime('')
      setEventEndTime('')
      setEventIsEstimated(false)
      setEventIsRange(false)
      setEventToleranceDays('')
      // Recargar la página para ver el evento en el historial
      window.location.reload()
    } else {
      setMsg(data.error || 'Error al crear evento')
    }
  }

  return (
    <>
      <section className="mt-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <h2 className="font-semibold">Cambiar estado</h2>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-2 rounded-full bg-white/5 px-3 py-2 text-sm ring-1 ring-white/10">
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {status === 'rechazada' && (
          <input placeholder="Motivo de rechazo (requerido)" value={rejection} onChange={(e) => setRejection(e.target.value)} className="mt-2 w-full rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10" />
        )}
        <button onClick={cambiarEstado} className="mt-3 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-5 py-2 text-sm font-semibold text-white">Guardar estado</button>
      </section>

      <section className="mt-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <h2 className="font-semibold">Precios</h2>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {['product_price', 'shipping_cost', 'taxes', 'commission', 'confirmed_price', 'total_price'].map((f) => (
            <input key={f} placeholder={f} type="number" value={pricing[f] ?? ''} onChange={(e) => setPricing({ ...pricing, [f]: e.target.value })} className="rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10" />
          ))}
        </div>
        <textarea placeholder="Notas internas (solo admin)" value={pricing.admin_notes ?? ''} onChange={(e) => setPricing({ ...pricing, admin_notes: e.target.value })} className="mt-2 w-full rounded-3xl bg-white/5 p-4 text-sm ring-1 ring-white/10" />
        <button onClick={guardarPrecio} className="mt-3 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-5 py-2 text-sm font-semibold text-white">Guardar precios</button>
      </section>

      <section className="mt-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <h2 className="font-semibold">Mensaje al cliente</h2>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="mt-2 w-full rounded-3xl bg-white/5 p-4 text-sm ring-1 ring-white/10" />
        <button onClick={enviarMensaje} className="mt-2 rounded-full bg-white/10 px-5 py-2 text-sm">Enviar</button>
      </section>

      {/* Gestión de eventos */}
      <section className="mt-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Eventos del timeline</h2>
          <button 
            onClick={() => setShowEventForm(!showEventForm)}
            className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-zinc-300 hover:bg-white/20 transition"
          >
            {showEventForm ? 'Ocultar formulario' : '➕ Agregar evento'}
          </button>
        </div>

        {showEventForm && (
          <form onSubmit={(e) => { e.preventDefault(); crearEvento() }} className="mt-4 space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Tipo de evento</label>
                <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full rounded-full bg-white/5 px-3 py-2 text-sm ring-1 ring-white/10">
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Título</label>
                <input 
                  type="text" 
                  value={eventTitle} 
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Título del evento"
                  className="w-full rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Descripción</label>
              <textarea 
                value={eventDescription} 
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Descripción detallada"
                rows={2}
                className="w-full rounded-2xl bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Fecha inicio</label>
                <input 
                  type="date" 
                  value={eventDate} 
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Fecha fin (opcional)</label>
                <input 
                  type="date" 
                  value={eventEndDate} 
                  onChange={(e) => setEventEndDate(e.target.value)}
                  className="w-full rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Hora inicio (opcional)</label>
                <input 
                  type="time" 
                  value={eventStartTime} 
                  onChange={(e) => setEventStartTime(e.target.value)}
                  className="w-full rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Hora fin (opcional)</label>
                <input 
                  type="time" 
                  value={eventEndTime} 
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="w-full rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={eventIsEstimated} 
                  onChange={(e) => setEventIsEstimated(e.target.checked)}
                  className="rounded border-white/20 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-zinc-300">Fecha estimada</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={eventIsRange} 
                  onChange={(e) => setEventIsRange(e.target.checked)}
                  className="rounded border-white/20 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-zinc-300">Rango de fechas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={eventVisibleToCustomer} 
                  onChange={(e) => setEventVisibleToCustomer(e.target.checked)}
                  className="rounded border-white/20 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-zinc-300">Visible para cliente</span>
              </label>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Tolerancia (días ±)</label>
              <input 
                type="number" 
                min="0" 
                max="30"
                value={eventToleranceDays} 
                onChange={(e) => setEventToleranceDays(e.target.value)}
                placeholder="0"
                className="w-full rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10"
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={creatingEvent}
                className="rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {creatingEvent ? 'Creando…' : 'Crear evento'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowEventForm(false)}
                className="rounded-full bg-white/10 px-5 py-2 text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </section>

      {msg && <p className="mt-4 text-sm text-cyan-300">{msg}</p>}
    </>
  )
}