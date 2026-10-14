'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface OrderEvent {
  id: string
  event_type: string
  title: string
  description: string | null
  status: string | null
  event_date: string // YYYY-MM-DD
  start_time: string | null // HH:MM:SS
  end_time: string | null
  end_date: string | null
  is_estimated: boolean
  is_range: boolean
  tolerance_days: number | null
  metadata: Record<string, any>
  created_at: string
}

interface OrderEventTimelineProps {
  events: OrderEvent[]
  currentStatus: string
  className?: string
}

// Mapeo de tipos de evento a iconos y colores
const EVENT_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  request_received: { icon: '📝', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  request_accepted: { icon: '✅', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  price_confirmed: { icon: '💰', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  payment_requested: { icon: '💳', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
  payment_received: { icon: '💳', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  purchase_made: { icon: '🛒', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  preparing: { icon: '📦', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  shipped: { icon: '🚚', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  estimated_arrival: { icon: '📍', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
  delivery_scheduled: { icon: '📅', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  delivered: { icon: '✅', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  date_changed: { icon: '🔄', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  cancelled: { icon: '⚫', color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
  rejected: { icon: '🔴', color: 'text-red-400', bg: 'bg-red-500/10' },
  digital_delivery: { icon: '🎮', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  external_purchase: { icon: '🌐', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  external_shipped: { icon: '🚚', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  arrived_carrier: { icon: '📍', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
  arrived_country: { icon: '🇩🇴', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  custom: { icon: '✨', color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
}

const STATUS_ORDER = [
  'en_revision', 'en_busqueda', 'esperando_confirmacion', 'aceptada',
  'precio_confirmado', 'esperando_pago', 'pagada', 'producto_comprado',
  'procesando', 'en_transito', 'entregada', 'rechazada', 'cancelada'
]

export function OrderEventTimeline({ events, currentStatus, className = '' }: OrderEventTimelineProps) {
  // Separar eventos pasados y futuros
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  const pastEvents = events.filter(e => new Date(e.event_date) < now).reverse()
  const futureEvents = events.filter(e => new Date(e.event_date) >= now)
  
  const allEvents = [...pastEvents, ...futureEvents]

  // Calcular progreso basado en el estado actual
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)
  const totalSteps = STATUS_ORDER.filter(s => !['rechazada', 'cancelada'].includes(s)).length
  const completedSteps = currentIndex >= 0 ? Math.min(currentIndex + 1, totalSteps) : 0
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Barra de progreso general */}
      <div className="double-bezel p-4">
        <div className="double-bezel__inner p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-400">Progreso del pedido</span>
            <span className="text-sm font-semibold text-cyan-300">{Math.round(progress)}%</span>
          </div>
          <div className="relative h-2 bg-base-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
            {/* Marcadores de pasos */}
            <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-between px-1 pointer-events-none">
              {STATUS_ORDER.filter(s => !['rechazada', 'cancelada'].includes(s)).map((status, i) => {
                const isCompleted = i <= currentIndex && currentIndex >= 0
                const isCurrent = i === currentIndex && currentIndex >= 0 && !['entregada', 'rechazada', 'cancelada'].includes(currentStatus)
                return (
                  <div key={status} className="relative flex-1">
                    <div 
                      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 transition-all ${
                        isCompleted ? 'bg-emerald-400 border-emerald-400' : 
                        isCurrent ? 'bg-fuchsia-400 border-fuchsia-400 animate-pulse' : 
                        'bg-base-800 border-base-700'
                      }`}
                    />
                    {isCompleted && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] text-emerald-300">
                        ✓
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-zinc-500">
            {STATUS_ORDER.filter(s => !['rechazada', 'cancelada'].includes(s)).map((status, i) => (
              <span key={status} className={`text-center w-full ${i <= currentIndex && currentIndex >= 0 ? 'text-emerald-400 font-medium' : ''}`}>
                {STATUS_LABELS[status as keyof typeof STATUS_LABELS]?.icon || '•'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Línea vertical */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-base-800" aria-hidden="true" />
        
        <div className="space-y-4">
          {allEvents.map((event, index) => {
            const isPast = new Date(event.event_date) < now
            const isFuture = !isPast
            const eventInfo = EVENT_ICONS[event.event_type] || EVENT_ICONS.custom
            const isLast = index === allEvents.length - 1

            return (
              <div key={event.id} className="relative flex gap-4">
                {/* Punto del timeline */}
                <div className={`relative flex-shrink-0 w-12 h-12 flex items-center justify-center z-10 ${isPast ? '' : 'opacity-50'}`}>
                  <div className={`relative w-3 h-3 rounded-full border-2 ${isPast ? 'bg-emerald-400 border-emerald-400' : 'bg-base-900 border-base-700'}`} />
                  {!isLast && (
                    <div className="absolute left-1/2 top-4 bottom-0 w-0.5 bg-base-800 -translate-x-1/2" aria-hidden="true" />
                  )}
                </div>

                {/* Contenido del evento */}
                <div className={`flex-1 min-w-0 ${isFuture ? 'opacity-70' : ''}`}>
                  <div className={`double-bezel p-4 ${isPast ? '' : 'opacity-60'}`}>
                    <div className="double-bezel__inner p-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-lg ${eventInfo.bg} ${eventInfo.color}`}>
                          {eventInfo.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-base">{event.title}</h4>
                            {event.is_estimated && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Estimado
                              </span>
                            )}
                            {event.is_range && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Rango
                              </span>
                            )}
                          </div>
                          
                          {event.description && (
                            <p className="mt-1 text-sm text-zinc-400">{event.description}</p>
                          )}

                          <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <path d="M16 2v4M16 22v-4M8 2v4M8 22v-4M3 10h4M21 10h-4" />
                              </svg>
                              {formatDateRange(event.event_date, event.end_date, event.is_range, es)}
                            </span>
                            {event.start_time && (
                              <span className="flex items-center gap-1">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M12 6v6l4 2" />
                                </svg>
                                {formatTime(event.start_time)}
                                {event.end_time && ` – ${formatTime(event.end_time)}`}
                              </span>
                            )}
                            {event.tolerance_days && (
                              <span className="flex items-center gap-1 text-amber-400">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                                ±{event.tolerance_days} día{event.tolerance_days > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>

                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300">Detalles técnicos</summary>
                              <pre className="mt-2 p-2 rounded bg-base-800 text-[10px] text-zinc-400 overflow-auto">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {allEvents.length === 0 && (
            <div className="double-bezel p-8 text-center">
              <div className="double-bezel__inner p-8">
                <svg className="mx-auto h-12 w-12 text-zinc-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <p className="text-zinc-500">No hay eventos registrados para este pedido</p>
                <p className="text-xs text-zinc-600 mt-1">Los eventos aparecerán aquí a medida que avance el proceso</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const STATUS_LABELS: Record<string, { label: string; icon: string }> = {
  en_revision: { label: 'En revisión', icon: '🟡' },
  en_busqueda: { label: 'En búsqueda', icon: '🔵' },
  esperando_confirmacion: { label: 'Esperando confirmación', icon: '🟠' },
  aceptada: { label: 'Aceptada', icon: '🟢' },
  precio_confirmado: { label: 'Precio confirmado', icon: '💰' },
  esperando_pago: { label: 'Esperando pago', icon: '💳' },
  pagada: { label: 'Pagada', icon: '🔵' },
  producto_comprado: { label: 'Producto comprado', icon: '🛒' },
  procesando: { label: 'Procesando', icon: '📦' },
  en_transito: { label: 'En tránsito', icon: '🚚' },
  entregada: { label: 'Entregada', icon: '🟣' },
  rechazada: { label: 'Rechazada', icon: '🔴' },
  cancelada: { label: 'Cancelada', icon: '⚫' },
}

function formatDateRange(start: string, end: string | null, isRange: boolean, locale: any): string {
  const startDate = new Date(start + 'T00:00:00')
  if (!isRange || !end) {
    return format(startDate, 'd MMM yyyy', { locale })
  }
  const endDate = new Date(end + 'T00:00:00')
  if (start === end) return format(startDate, 'd MMM yyyy', { locale })
  return `${format(startDate, 'd MMM', { locale })} – ${format(endDate, 'd MMM yyyy', { locale })}`
}

function formatTime(time: string): string {
  // time format: HH:MM:SS
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayHour = h % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}