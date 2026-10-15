'use client'

import { useState, useMemo, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, isSameMonth, isSameDay, isToday, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

interface CalendarEvent {
  id: string
  request_id: string
  request_code: string
  product_name: string
  type: string
  event_type: string
  title: string
  description: string | null
  event_date: string
  start_time: string | null
  end_time: string | null
  end_date: string | null
  is_estimated: boolean
  is_range: boolean
  tolerance_days: number | null
  status: string
  is_range_day?: boolean
}

interface CalendarProps {
  events: CalendarEvent[]
  view?: 'month' | 'week' | 'agenda'
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  className?: string
  eventBasePath?: string
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  request_received: 'bg-amber-500',
  request_accepted: 'bg-emerald-500',
  price_confirmed: 'bg-cyan-500',
  payment_requested: 'bg-fuchsia-500',
  payment_received: 'bg-emerald-500',
  purchase_made: 'bg-cyan-500',
  preparing: 'bg-amber-500',
  shipped: 'bg-cyan-500',
  estimated_arrival: 'bg-fuchsia-500',
  delivery_scheduled: 'bg-cyan-500',
  delivered: 'bg-emerald-500',
  date_changed: 'bg-amber-500',
  cancelled: 'bg-zinc-500',
  rejected: 'bg-red-500',
  digital_delivery: 'bg-emerald-500',
  external_purchase: 'bg-cyan-500',
  external_shipped: 'bg-cyan-500',
  arrived_carrier: 'bg-fuchsia-500',
  arrived_country: 'bg-emerald-500',
  custom: 'bg-zinc-500',
}

const TYPE_ICONS: Record<string, string> = {
  product: '🛍️',
  digital: '🎮',
  external: '🌐',
  other: '✨',
}

export function Calendar({ 
  events, 
  view = 'month', 
  onEventClick, 
  onDateClick,
  className = '',
  eventBasePath = '/mi-cuenta/pedidos'
}: CalendarProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const handleEventClick = useCallback((event: CalendarEvent) => {
    if (onEventClick) {
      onEventClick(event)
    } else if (eventBasePath && event.request_id) {
      router.push(`${eventBasePath}/${event.request_id}`)
    }
  }, [onEventClick, eventBasePath, router])

  // Agrupar eventos por fecha
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const event of events) {
      const start = new Date(event.event_date + 'T00:00:00')
      const end = event.end_date ? new Date(event.end_date + 'T00:00:00') : start
      
      for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
        const key = format(d, 'yyyy-MM-dd')
        if (!map[key]) map[key] = []
        if (!map[key].find(e => e.id === event.id)) {
          map[key].push({ ...event, is_range_day: d > start })
        }
      }
    }
    return map
  }, [events])

  const navigateMonth = (delta: number) => {
    setCurrentDate(d => addMonths(d, delta))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(null)
  }

  // Renderizado según vista
  if (view === 'week') return renderWeekView()
  if (view === 'agenda') return renderAgendaView()
  return renderMonthView()

  function renderMonthView() {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    return (
      <div className={className}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-full hover:bg-white/10 transition"
            aria-label="Mes anterior"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy', { locale: es })}</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={goToToday}
              className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
            >
              Hoy
            </button>
            <button 
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-full hover:bg-white/10 transition"
              aria-label="Mes siguiente"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-zinc-500 py-2">{day}</div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map(day => {
            const dayEvents = eventsByDate[format(day, 'yyyy-MM-dd')] || []
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isTodayDate = isToday(day)

            return (
              <button
                key={format(day, 'yyyy-MM-dd')}
                onClick={() => { setSelectedDate(day); onDateClick?.(day) }}
                className={`
                  relative h-24 w-full p-1.5 text-left rounded-xl transition-all
                  ${!isCurrentMonth ? 'text-zinc-600 bg-base-900/50' : 'text-zinc-100 bg-base-900/30'}
                  ${isTodayDate ? 'ring-2 ring-cyan-400/50' : ''}
                  ${isSelected ? 'ring-2 ring-fuchsia-400 bg-fuchsia-500/10' : ''}
                  hover:bg-white/5
                `}
                disabled={dayEvents.length === 0 && !isCurrentMonth}
              >
                <span className={`text-sm font-medium ${isTodayDate ? 'text-cyan-300' : ''}`}>
                  {format(day, 'd')}
                </span>
                
                {dayEvents.length > 0 && (
                  <div className="mt-1 space-y-0.5 max-h-[120px] overflow-y-auto pr-1">
                    {dayEvents.slice(0, 4).map(event => (
                      <button
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); handleEventClick(event) }}
                        className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px] truncate transition hover:bg-white/10"
                        style={{ backgroundColor: EVENT_TYPE_COLORS[event.event_type] + '30', borderColor: EVENT_TYPE_COLORS[event.event_type] + '60' }}
                      >
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: EVENT_TYPE_COLORS[event.event_type] }} />
                        <span className="truncate">{event.title}</span>
                        {event.is_estimated && <span className="flex-shrink-0 text-[8px] text-amber-300">~</span>}
                      </button>
                    ))}
                    {dayEvents.length > 4 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDateClick?.(day) }}
                        className="w-full text-center text-[10px] text-zinc-500 hover:text-zinc-300 py-0.5"
                      >
                        +{dayEvents.length - 4} más
                      </button>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Detalle del día seleccionado */}
        {selectedDate && eventsByDate[format(selectedDate, 'yyyy-MM-dd')] && (
          <div className="mt-4 double-bezel p-4 animate-fade-in">
            <div className="double-bezel__inner p-4">
              <h3 className="font-semibold mb-3">{format(selectedDate, 'EEEE d MMMM', { locale: es })}</h3>
              <div className="space-y-2">
                {eventsByDate[format(selectedDate, 'yyyy-MM-dd')].map(event => (
                  <button
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="w-full text-left p-3 rounded-xl bg-white/5 ring-1 ring-white/10 hover:ring-fuchsia-400/30 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: EVENT_TYPE_COLORS[event.event_type] }} />
                      <span className="font-medium">{event.title}</span>
                      {event.is_estimated && <span className="text-[10px] text-amber-400">estimado</span>}
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">{event.product_name} · #{event.request_code}</p>
                    {event.start_time && (
                      <p className="mt-1 text-xs text-zinc-500 flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                        {format(new Date(`2000-01-01T${event.start_time}`), 'h:mm a')}
                        {event.end_time && ` – ${format(new Date(`2000-01-01T${event.end_time}`), 'h:mm a')}`}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderWeekView() {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentDate(d => addDays(d, -7))} className="p-2 rounded-full hover:bg-white/10" aria-label="Semana anterior">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <h2 className="text-lg font-semibold">{format(weekStart, 'd MMM', { locale: es })} – {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: es })}</h2>
          <div className="flex items-center gap-2">
            <button onClick={goToToday} className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 ring-1 ring-white/10 hover:bg-white/10">Hoy</button>
            <button onClick={() => setCurrentDate(d => addDays(d, 7))} className="p-2 rounded-full hover:bg-white/10" aria-label="Semana siguiente">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => {
            const dayEvents = eventsByDate[format(day, 'yyyy-MM-dd')] || []
            const isTodayDate = isToday(day)

            return (
              <div key={format(day, 'yyyy-MM-dd')} className={`rounded-xl p-2 min-h-[200px] ${isTodayDate ? 'bg-fuchsia-500/5 ring-1 ring-fuchsia-400/20' : 'bg-base-900/30'}`}>
                <div className={`font-medium text-sm ${isTodayDate ? 'text-cyan-300' : 'text-zinc-400'}`}>
                  {format(day, 'EEE d', { locale: es })}
                </div>
                <div className="mt-2 space-y-1.5 max-h-[160px] overflow-y-auto">
                  {dayEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); handleEventClick(event) }}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-xs truncate transition hover:bg-white/10"
                      style={{ backgroundColor: EVENT_TYPE_COLORS[event.event_type] + '30' }}
                    >
                      <span className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: EVENT_TYPE_COLORS[event.event_type] }} />
                      <span className="truncate">{event.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function renderAgendaView() {
    // Próximos 30 días
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const futureEvents = events
      .filter(e => new Date(e.event_date) >= today)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .slice(0, 50)

    if (futureEvents.length === 0) {
      return (
        <div className={className}>
          <div className="double-bezel p-8 text-center">
            <div className="double-bezel__inner p-8">
              <svg className="mx-auto h-12 w-12 text-zinc-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M16 22v-4M8 2v4M8 22v-4M3 10h4M21 10h-4" />
              </svg>
              <p className="text-zinc-500">No hay eventos próximos</p>
            </div>
          </div>
        </div>
      )
    }

    // Agrupar por fecha
    const grouped = futureEvents.reduce((acc, event) => {
      const key = event.event_date
      if (!acc[key]) acc[key] = []
      acc[key].push(event)
      return acc
    }, {} as Record<string, CalendarEvent[]>)

    return (
      <div className={className}>
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, dayEvents]) => (
            <div key={date} className="double-bezel">
              <div className="double-bezel__inner p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-base-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-cyan-300">{format(new Date(date + 'T00:00:00'), 'd', { locale: es })}</span>
                    <span className="text-xs text-zinc-500">{format(new Date(date + 'T00:00:00'), 'MMM', { locale: es })}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{format(new Date(date + 'T00:00:00'), 'EEEE', { locale: es })}</h3>
                    <p className="text-sm text-zinc-500">{format(new Date(date + 'T00:00:00'), 'd MMMM yyyy', { locale: es })}</p>
                  </div>
                </div>
                <div className="space-y-2 ml-15">
                  {dayEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="w-full text-left p-3 rounded-xl bg-white/5 ring-1 ring-white/10 hover:ring-fuchsia-400/30 transition flex items-center gap-3"
                    >
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: EVENT_TYPE_COLORS[event.event_type] }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-zinc-400">{TYPE_ICONS[event.type] || ''} {event.product_name} · #{event.request_code}</p>
                        {event.start_time && (
                          <p className="text-xs text-zinc-500 flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 6v6l4 2" />
                            </svg>
                            {format(new Date(`2000-01-01T${event.start_time}`), 'h:mm a')}
                            {event.end_time && ` – ${format(new Date(`2000-01-01T${event.end_time}`), 'h:mm a')}`}
                          </p>
                        )}
                      </div>
                      {event.is_estimated && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">Estimado</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
}