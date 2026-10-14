import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Glow } from '@/components/Glow'
import { SiteNav } from '@/components/SiteNav'
import { Footer } from '@/components/Footer'

export default async function ActividadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: activity } = await supabase.rpc('get_user_recent_activity', { 
    p_user_id: user.id, 
    p_limit: 50 
  })

  return (
    <div className="min-h-[100dvh] bg-base-950 text-base-50 relative">
      <div className="bg-mesh" aria-hidden="true" />
      <Glow />
      <SiteNav />

      <main className="relative mx-auto max-w-3xl px-4 py-10 md:py-16">
        <div className="mb-8 reveal">
          <p className="text-sm font-medium uppercase tracking-wide text-accent-cyan">Centro de Pedidos</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Actividad</h1>
          <p className="mt-2 text-zinc-400">Historial de actualizaciones de tus pedidos</p>
        </div>

        <div className="reveal delay-1">
          {activity && activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((item: any, index: number) => (
                <ActivityItem key={item.id || index} item={item} />
              ))}
            </div>
          ) : (
            <div className="double-bezel p-12 text-center">
              <div className="double-bezel__inner p-8">
                <svg className="mx-auto h-16 w-16 text-zinc-600 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <h2 className="text-xl font-bold mb-2">No hay actividad reciente</h2>
                <p className="text-zinc-500">Cuando tus pedidos tengan actualizaciones, aparecerán aquí</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

function ActivityItem({ item }: { item: any }) {
  const isMessage = item.event_type === 'message'
  const icon = isMessage ? '💬' : getEventIcon(item.event_type)
  const color = isMessage ? 'text-blue-400' : getEventColor(item.event_type)

  return (
    <div className="double-bezel">
      <div className="double-bezel__inner p-4">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 text-xl">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium ${color}`}>{item.title}</span>
              <span className="text-xs text-zinc-500">{formatRelativeTime(item.created_at)}</span>
            </div>
            <p className="mt-1 text-sm text-zinc-400">{item.product_name} · #{item.request_code}</p>
            {item.description && !isMessage && (
              <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
            )}
            {isMessage && item.body && (
              <p className="mt-1 text-sm text-zinc-500 italic">"{item.body.slice(0, 150)}{item.body.length > 150 ? '...' : ''}"</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
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
  return date.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getEventIcon(type: string): string {
  const icons: Record<string, string> = {
    request_received: '📝', request_accepted: '✅', price_confirmed: '💰',
    payment_requested: '💳', payment_received: '💳', purchase_made: '🛒',
    preparing: '📦', shipped: '🚚', estimated_arrival: '📍',
    delivery_scheduled: '📅', delivered: '✅', date_changed: '🔄',
    cancelled: '⚫', rejected: '🔴', digital_delivery: '🎮',
    message: '💬',
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
    digital_delivery: 'text-emerald-400', message: 'text-blue-400',
  }
  return colors[type] || 'text-zinc-400'
}