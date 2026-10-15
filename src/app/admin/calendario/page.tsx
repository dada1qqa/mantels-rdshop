import { db } from '@/lib/db/client'
import { orderEvents, requests } from '@/lib/db/schema'
import { eq, and, gte, lte, asc } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'

interface CalendarEvent {
  id: string
  requestId: string
  requestCode: string
  productName: string
  type: string
  eventType: string
  title: string
  description: string | null
  eventDate: string
  startTime: string | null
  endTime: string | null
  endDate: string | null
  isEstimated: boolean
  isRange: boolean
  toleranceDays: number | null
  status: string
}

interface CalendarParams {
  startDate: string
  endDate: string
  eventType?: string
  status?: string
  requestId?: string
  limit?: number
}

type CalendarViewMode = 'month' | 'week' | 'agenda'

async function getCalendarEvents(
  userId: string,
  params: CalendarParams
): Promise<CalendarEvent[]> {
  const startDate = new Date(params.startDate + 'T00:00:00')
  const endDate = new Date(params.endDate + 'T23:59:59.999')

  const conditions = [
    eq(requests.userId, userId),
    gte(orderEvents.eventDate, startDate),
    lte(orderEvents.eventDate, endDate),
  ]

  if (params.eventType) {
    conditions.push(eq(orderEvents.eventType, params.eventType))
  }

  if (params.requestId) {
    conditions.push(eq(orderEvents.requestId, params.requestId))
  }

  if (params.status) {
    conditions.push(eq(requests.status, params.status))
  }

  const data = await db
    .select({
      id: orderEvents.id,
      requestId: orderEvents.requestId,
      requestCode: requests.requestCode,
      productName: requests.productName,
      type: requests.type,
      eventType: orderEvents.eventType,
      title: orderEvents.title,
      description: orderEvents.description,
      eventDate: orderEvents.eventDate,
      startTime: orderEvents.startTime,
      endTime: orderEvents.endTime,
      endDate: orderEvents.endDate,
      isEstimated: orderEvents.isEstimated,
      isRange: orderEvents.isRange,
      toleranceDays: orderEvents.toleranceDays,
      status: requests.status,
    })
    .from(orderEvents)
    .innerJoin(requests, eq(orderEvents.requestId, requests.id))
    .where(and(...conditions))
    .orderBy(asc(orderEvents.eventDate), asc(orderEvents.startTime))
    .limit(Math.min(500, Math.max(1, params.limit ?? 200)))

  return data.map((event) => ({
    ...event,
    eventDate: normalizeDate(event.eventDate) ?? '',
    startTime: normalizeTime(event.startTime),
    endTime: normalizeTime(event.endTime),
    endDate: normalizeDate(event.endDate),
    isEstimated: event.isEstimated ?? false,
    isRange: event.isRange ?? false,
  }))
}

function normalizeDate(date: Date | string | null): string | null {
  if (date === null || date === undefined) {
    return null
  }

  if (date instanceof Date) {
    if (Number.isNaN(date.getTime())) {
      return null
    }

    const year = String(date.getFullYear())
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return year + '-' + month + '-' + day
  }

  const match = date.match(/^(\d{4}-\d{2}-\d{2})/)

  if (match) {
    return match[1]
  }

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  const year = String(parsedDate.getFullYear())
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getDate()).padStart(2, '0')

  return year + '-' + month + '-' + day
}

function normalizeTime(time: Date | string | null): string | null {
  if (time === null || time === undefined) {
    return null
  }

  if (time instanceof Date) {
    if (Number.isNaN(time.getTime())) {
      return null
    }

    const hours = String(time.getHours()).padStart(2, '0')
    const minutes = String(time.getMinutes()).padStart(2, '0')

    return hours + ':' + minutes
  }

  const match = time.match(/^(\d{2}:\d{2})/)

  if (match) {
    return match[1]
  }

  return null
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{
    start_date?: string
    end_date?: string
    event_type?: string
    status?: string
    request_id?: string
    view?: CalendarViewMode
    limit?: string
  }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        No autenticado
      </div>
    )
  }

  const params = await searchParams

  const today = new Date()
  const defaultStartDate =
    today.getFullYear() +
    '-' +
    String(today.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(today.getDate()).padStart(2, '0')

  const defaultEnd = new Date(today)
  defaultEnd.setDate(defaultEnd.getDate() + 30)

  const defaultEndDate =
    defaultEnd.getFullYear() +
    '-' +
    String(defaultEnd.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(defaultEnd.getDate()).padStart(2, '0')

  const startDate = params.start_date ?? defaultStartDate
  const endDate = params.end_date ?? defaultEndDate

  const allowedViews: CalendarViewMode[] = [
    'month',
    'week',
    'agenda',
  ]

  const view: CalendarViewMode =
    params.view && allowedViews.includes(params.view)
      ? params.view
      : 'month'

  const parsedLimit = Number.parseInt(params.limit ?? '200', 10)

  const limit = Number.isFinite(parsedLimit)
    ? Math.min(500, Math.max(1, parsedLimit))
    : 200

  const events = await getCalendarEvents(user.id, {
    startDate,
    endDate,
    eventType: params.event_type || undefined,
    status: params.status || undefined,
    requestId: params.request_id || undefined,
    limit,
  })

  return (
    <div className="min-h-[100dvh] bg-base-950 text-base-50 relative">
      <div className="bg-mesh" aria-hidden="true" />

      <main className="relative mx-auto max-w-7xl px-4 py-10 md:py-16">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-accent-cyan">
            Centro de Pedidos
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Calendario operativo
          </h1>

          <p className="mt-2 text-zinc-400">
            Vista de eventos de tus pedidos
          </p>
        </div>

        <CalendarioView
          events={events}
          view={view}
          startDate={startDate}
          endDate={endDate}
        />
      </main>
    </div>
  )
}

function CalendarioView({
  events,
  view,
  startDate,
  endDate,
}: {
  events: CalendarEvent[]
  view: CalendarViewMode
  startDate: string
  endDate: string
}) {
  return (
    <div className="space-y-4">
      {view === 'month' && (
        <div className="grid grid-cols-7 gap-1">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(
            (day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-zinc-500 py-2"
              >
                {day}
              </div>
            )
          )}

          {(() => {
            const firstDate = new Date(startDate + 'T00:00:00')
            const lastDate = new Date(endDate + 'T00:00:00')

            const dayCount =
              Math.floor(
                (lastDate.getTime() - firstDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              ) + 1

            if (!Number.isFinite(dayCount) || dayCount < 1) {
              return null
            }

            return Array.from({ length: dayCount }, (_, i) => {
              const date = new Date(firstDate)
              date.setDate(date.getDate() + i)

              const dateStr =
                date.getFullYear() +
                '-' +
                String(date.getMonth() + 1).padStart(2, '0') +
                '-' +
                String(date.getDate()).padStart(2, '0')

              const dayEvents = events.filter(
                (event) => event.eventDate === dateStr
              )

              return (
                <div
                  key={dateStr}
                  className="min-h-[120px] p-2 border border-white/10 rounded-xl bg-base-900/50"
                >
                  <div className="text-sm font-medium text-zinc-300 mb-1">
                    {date.toLocaleDateString('es-DO', {
                      weekday: 'short',
                      day: 'numeric',
                    })}
                  </div>

                  <div className="space-y-1 max-h-[80px] overflow-y-auto">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        title={event.title}
                        className="text-xs p-1.5 rounded bg-white/5 hover:bg-white/10 truncate cursor-pointer"
                      >
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                          style={{
                            backgroundColor: getEventColor(event.eventType),
                          }}
                        />

                        {event.title}

                        {event.isEstimated && (
                          <span className="ml-1 text-[10px] text-amber-400">
                            ~
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          })()}
        </div>
      )}

      {view === 'week' && (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startDate + 'T00:00:00')
            date.setDate(date.getDate() + i)

            const dateStr =
              date.getFullYear() +
              '-' +
              String(date.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(date.getDate()).padStart(2, '0')

            const dayEvents = events.filter(
              (event) => event.eventDate === dateStr
            )

            return (
              <div
                key={dateStr}
                className="min-h-[200px] p-2 rounded-xl bg-base-900/30 border border-white/10"
              >
                <div className="font-medium text-sm mb-2">
                  {date.toLocaleDateString('es-DO', {
                    weekday: 'short',
                    day: 'numeric',
                  })}
                </div>

                <div className="space-y-1 max-h-[160px] overflow-y-auto">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      title={event.title}
                      className="text-xs p-1.5 rounded bg-white/5 hover:bg-white/10 truncate"
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                        style={{
                          backgroundColor: getEventColor(event.eventType),
                        }}
                      />

                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === 'agenda' && (
        <div className="space-y-4">
          {events
            .filter(
              (event) =>
                event.eventDate >=
                new Date().toISOString().split('T')[0]
            )
            .slice(0, 50)
            .map((event) => (
              <div key={event.id} className="double-bezel p-4">
                <div className="double-bezel__inner p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-base-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">
                        {getEventIcon(event.eventType)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{event.title}</p>

                      <p className="mt-1 text-sm text-zinc-400">
                        {event.productName} · #{event.requestCode}
                      </p>

                      {event.startTime && (
                        <p className="mt-1 text-xs text-zinc-500 flex items-center gap-1">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>

                          {event.startTime}

                          {event.endTime && ' – ' + event.endTime}
                        </p>
                      )}
                    </div>

                    {event.isEstimated && (
                      <span className="mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Estimado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function getEventColor(type: string): string {
  const colors: Record<string, string> = {
    request_received: '#f59e0b',
    request_accepted: '#22c55e',
    price_confirmed: '#06b6d4',
    payment_requested: '#f43f5e',
    payment_received: '#22c55e',
    purchase_made: '#06b6d4',
    preparing: '#f59e0b',
    shipped: '#06b6d4',
    estimated_arrival: '#f43f5e',
    delivery_scheduled: '#06b6d4',
    delivered: '#22c55e',
    date_changed: '#f59e0b',
    cancelled: '#71717a',
    rejected: '#ef4444',
    digital_delivery: '#22c55e',
    external_purchase: '#06b6d4',
    external_shipped: '#06b6d4',
    arrived_carrier: '#f43f5e',
    arrived_country: '#22c55e',
    custom: '#71717a',
  }

  return colors[type] || '#71717a'
}

function getEventIcon(type: string): string {
  const icons: Record<string, string> = {
    request_received: '📝',
    request_accepted: '✅',
    price_confirmed: '💰',
    payment_requested: '💳',
    payment_received: '💳',
    purchase_made: '🛒',
    preparing: '📦',
    shipped: '🚚',
    estimated_arrival: '📍',
    delivery_scheduled: '📅',
    delivered: '✅',
    date_changed: '🔄',
    cancelled: '⚫',
    rejected: '🔴',
    digital_delivery: '🎮',
    external_purchase: '🌐',
    external_shipped: '🚚',
    arrived_carrier: '📍',
    arrived_country: '🇩🇴',
    custom: '✨',
  }

  return icons[type] || '📌'
}