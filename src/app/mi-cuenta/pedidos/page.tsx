import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OrderCard } from '@/components/orders/OrderCard'
import { NotificationBell } from '@/components/orders/NotificationBell'
import { Glow } from '@/components/Glow'
import { SiteNav } from '@/components/SiteNav'
import { Footer } from '@/components/Footer'

export default async function MisPedidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener solicitudes del usuario
  const { data: requests } = await supabase
    .from('requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Obtener eventos para el calendario y próxima actividad
  const today = new Date()
  const endDate = new Date(today.getTime() + 90 * 86400000)
  const { data: events } = await supabase.rpc('get_user_calendar', {
    p_user_id: user.id,
    p_start_date: today.toISOString().split('T')[0],
    p_end_date: endDate.toISOString().split('T')[0]
  })

  // Próxima actividad
  const { data: nextActivity } = await supabase.rpc('get_user_next_activity', { p_user_id: user.id })
  const next = nextActivity?.[0] || null

  // Actividad reciente
  const { data: recentActivity } = await supabase.rpc('get_user_recent_activity', { 
    p_user_id: user.id, 
    p_limit: 10 
  })

  const items = requests ?? []
  const calendarEvents = events ?? []

  // Estadísticas
  const stats = {
    activos: items.filter(r => !['entregada', 'rechazada', 'cancelada'].includes(r.status)).length,
    en_transito: items.filter(r => r.status === 'en_transito').length,
    pendientes: items.filter(r => ['esperando_pago', 'precio_confirmado'].includes(r.status)).length,
    completados: items.filter(r => r.status === 'entregada').length,
  }

  // Calcular progreso para cada pedido
  const STATUS_ORDER = [
    'en_revision', 'en_busqueda', 'esperando_confirmacion', 'aceptada',
    'precio_confirmado', 'esperando_pago', 'pagada', 'producto_comprado',
    'procesando', 'en_transito', 'entregada'
  ]

  const itemsWithProgress = items.map(r => {
    const idx = STATUS_ORDER.indexOf(r.status)
    const progress = idx >= 0 ? ((idx + 1) / STATUS_ORDER.length) * 100 : 0
    return { ...r, progress }
  })

  return (
    <div className="min-h-[100dvh] bg-base-950 text-base-50 relative">
      <div className="bg-mesh" aria-hidden="true" />
      <Glow />
      <SiteNav />

      <main className="relative mx-auto max-w-6xl px-4 py-10 md:py-16 lg:py-20">
        {/* Header con stats y notificaciones */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 reveal">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-accent-cyan">Centro de Pedidos</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Mis pedidos</h1>
          </div>
          <NotificationBell />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 reveal delay-1">
          <StatCard label="Activos" value={stats.activos} icon="📦" color="cyan" />
          <StatCard label="En tránsito" value={stats.en_transito} icon="🚚" color="blue" />
          <StatCard label="Pendientes" value={stats.pendientes} icon="⏳" color="amber" />
          <StatCard label="Completados" value={stats.completados} icon="✅" color="emerald" />
        </div>

        {/* Próxima actividad */}
        {next && (
          <div className="mb-8 reveal delay-2">
            <NextActivityCard activity={next} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 reveal delay-3" role="tablist">
          <button role="tab" aria-selected={true} className="tab-active px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-base-950">
            📦 Pedidos
          </button>
          <Link href="/mi-cuenta/calendario" className="tab-inactive px-4 py-2 rounded-full text-sm font-medium bg-white/5 ring-1 ring-white/10 hover:bg-white/10">
            📅 Calendario
          </Link>
          <Link href="/mi-cuenta/actividad" className="tab-inactive px-4 py-2 rounded-full text-sm font-medium bg-white/5 ring-1 ring-white/10 hover:bg-white/10">
            🔔 Actividad
          </Link>
        </div>

        {/* Lista de pedidos */}
        <section className="reveal delay-4" aria-label="Lista de pedidos">
          {itemsWithProgress.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4" role="list">
              {itemsWithProgress.map((request, index) => (
                <OrderCard
                  key={request.id}
                  {...request}
                  index={index}
                  next_event={calendarEvents
                    .filter((e: { request_id: string; event_date: string }) => e.request_id === request.id)
                    .sort((a: { event_date: string }, b: { event_date: string }) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())[0] || null
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* Actividad reciente */}
        {recentActivity && recentActivity.length > 0 && (
          <section className="mt-12 reveal delay-5">
            <h2 className="text-xl font-bold mb-4">Actividad reciente</h2>
            <div className="space-y-2">
              {recentActivity.slice(0, 5).map((activity: { id: string; request_id: string; product_name: string; request_code: string; event_type: string; title: string; created_at: string; body: string | null }, i: number) => (
                <ActivityItem key={activity.id || i} activity={activity} />
              ))}
            </div>
            <Link href="/mi-cuenta/actividad" className="mt-3 inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-400">
              Ver toda la actividad
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    cyan: 'from-cyan-500 to-cyan-600',
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-amber-600',
    emerald: 'from-emerald-500 to-emerald-600',
  }
  return (
    <Link href="/mi-cuenta/pedidos" className="double-bezel p-4 group">
      <div className="double-bezel__inner p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-2xl`}>
            {icon}
          </div>
        </div>
      </div>
    </Link>
  )
}

function NextActivityCard({ activity }: { activity: { event_type: string; request_id: string; product_name: string; request_code: string; is_range: boolean; event_date: string; end_date: string | null; is_estimated: boolean } }) {
  const isPayment = activity.event_type === 'payment_requested' || activity.event_type === 'payment_received'
  const isDelivery = ['shipped', 'estimated_arrival', 'delivery_scheduled', 'delivered'].includes(activity.event_type)
  const isDigital = activity.event_type === 'digital_delivery'

  let icon = '📦'
  let label = 'PRÓXIMA ACTIVIDAD'
  let bgColor = 'from-fuchsia-600 to-cyan-600'

  if (isPayment) {
    icon = '💳'
    label = 'PRÓXIMO PAGO'
    bgColor = 'from-amber-500 to-fuchsia-600'
  } else if (isDelivery) {
    icon = '🚚'
    label = 'PRÓXIMA ENTREGA'
    bgColor = 'from-cyan-500 to-blue-600'
  } else if (isDigital) {
    icon = '🎮'
    label = 'ENTREGA DIGITAL'
    bgColor = 'from-emerald-500 to-cyan-600'
  }

  return (
    <Link href={`/mi-cuenta/pedidos/${activity.request_id}`} className="block">
      <div className="double-bezel p-4">
        <div className="double-bezel__inner p-4">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bgColor} flex items-center justify-center text-3xl flex-shrink-0`}>
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-zinc-300">{label}</span>
              </div>
              <h3 className="mt-2 font-semibold text-lg">{activity.product_name}</h3>
              <p className="mt-1 text-sm text-zinc-400">#{activity.request_code}</p>
              <div className="mt-3 flex items-center gap-3 text-sm text-zinc-300">
                <span className="font-medium">
                  {activity.is_range 
                    ? `entre el ${formatDateRange(activity.event_date, activity.end_date)}`
                    : `el ${formatDate(activity.event_date)}`
                  }
                </span>
                {activity.is_estimated && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Estimado
                  </span>
                )}
              </div>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 flex-shrink-0">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}

function ActivityItem({ activity }: { activity: { event_type: string; title: string; created_at: string; product_name: string; request_code: string; body: string | null } }) {
  const isMessage = activity.event_type === 'message'
  const icon = isMessage ? '💬' : getEventIcon(activity.event_type)
  const color = isMessage ? 'text-blue-400' : getEventColor(activity.event_type)

  return (
    <div className="double-bezel p-3">
      <div className="double-bezel__inner p-3">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 text-lg">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium ${color}`}>{activity.title}</span>
              <span className="text-xs text-zinc-500">{formatRelativeTime(activity.created_at)}</span>
            </div>
            <p className="mt-0.5 text-sm text-zinc-400">{activity.product_name} · #{activity.request_code}</p>
            {isMessage && activity.body && (
              <p className="mt-1 text-sm text-zinc-500 italic">{`"${activity.body.slice(0, 100)}..."`}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="double-bezel p-12 text-center">
      <div className="double-bezel__inner p-8">
        <svg className="mx-auto h-16 w-16 text-zinc-600 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
          <path d="M8 8l6 6" />
          <path d="M14 8l-6 6" />
        </svg>
        <h2 className="text-xl font-bold mb-2">No tienes pedidos aún</h2>
        <p className="text-zinc-500 mb-6">Cuando crees una solicitud, aparecerá aquí con todo su seguimiento</p>
        <Link href="/solicitar" className="inline-flex items-center gap-2 btn-magnetic">
          <span>Crear mi primera solicitud</span>
          <span className="btn-magnetic__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateRange(start: string, end: string | null): string {
  if (!end || start === end) return formatDate(start)
  const startDate = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T00:00:00')
  return `${startDate.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })} – ${endDate.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}`
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora mismo'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} h`
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
  return formatDate(dateStr.split('T')[0])
}

function getEventIcon(type: string): string {
  const icons: Record<string, string> = {
    request_received: '📝', request_accepted: '✅', price_confirmed: '💰',
    payment_requested: '💳', payment_received: '💳', purchase_made: '🛒',
    preparing: '📦', shipped: '🚚', estimated_arrival: '📍',
    delivery_scheduled: '📅', delivered: '✅', date_changed: '🔄',
    cancelled: '⚫', rejected: '🔴', digital_delivery: '🎮',
  }
  return icons[type] || '📌'
}

function getEventColor(type: string): string {
  const colors: Record<string, string> = {
    request_received: 'text-amber-400', request_accepted: 'text-emerald-400',
    price_confirmed: 'text-cyan-400', payment_requested: 'text-fuchsia-400',
    payment_received: 'text-emerald-400', purchase_made: 'text-cyan-400',
    preparing: 'text-amber-400', shipped: 'text-cyan-400',
    estimated_arrival: 'text-fuchsia-400', delivery_scheduled: 'text-cyan-400',
    delivered: 'text-emerald-400', date_changed: 'text-amber-400',
    cancelled: 'text-zinc-500', rejected: 'text-red-400',
    digital_delivery: 'text-emerald-400',
  }
  return colors[type] || 'text-zinc-400'
}