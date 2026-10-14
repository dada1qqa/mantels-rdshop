import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Calendar } from '@/components/orders/Calendar'

export default async function AdminCalendarioPage({ searchParams }: { searchParams: Promise<{ 
  start_date?: string; 
  end_date?: string;
  event_type?: string;
  status?: string;
  request_id?: string;
  view?: 'month' | 'week' | 'agenda';
}> }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError) {
    console.error('Admin auth error:', authError)
    redirect('/admin/login?error=auth_failed')
  }
  if (!user) redirect('/admin/login')
  
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profileError || !profile || !['owner', 'admin', 'staff'].includes(profile.role)) {
    redirect('/admin/login?error=permisos')
  }

  const params = await searchParams
  const view = (params.view as 'month' | 'week' | 'agenda') || 'month'
  
  // Fechas por defecto: mes actual
  const now = new Date()
  const defaultStart = params.start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const defaultEnd = params.end_date || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  // Obtener eventos del calendario admin usando RPC directo
  const { data: events, error: eventsError } = await supabase.rpc('get_admin_calendar', {
    p_start_date: defaultStart,
    p_end_date: defaultEnd,
    p_event_type: params.event_type || null,
    p_status: params.status || null,
    p_request_id: params.request_id || null,
    p_limit: 500
  })

  if (eventsError) {
    console.error('Calendar RPC error:', eventsError)
  }

  // Obtener estadísticas para el header
  const { data: statsData, error: statsError } = await supabase.rpc('get_admin_dashboard_stats')
  const stats = statsData?.[0] ?? {}
  
  const { data: overdueData, error: overdueError } = await supabase.rpc('get_overdue_requests')
  const overdue = overdueData ?? []

  // Tipos de evento para filtro
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
  ]

  return (
    <div className="min-h-[100dvh] bg-base-950 text-base-50 relative">
      <main className="relative mx-auto max-w-7xl px-4 py-10 md:py-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-accent-cyan">Centro de Pedidos</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Calendario operativo</h1>
            </div>
            <a href="/admin/solicitudes" className="px-4 py-2 rounded-full text-sm font-medium bg-white/5 ring-1 ring-white/10 hover:bg-white/10">
              Ver solicitudes
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <AdminStatCard label="Entregas hoy" value={stats.entregas_hoy || 0} icon="📦" color="cyan" />
          <AdminStatCard label="Mañana" value={stats.entregas_manana || 0} icon="📅" color="blue" />
          <AdminStatCard label="Esta semana" value={stats.entregas_semana || 0} icon="📆" color="emerald" />
          <AdminStatCard label="Pagos pendientes" value={stats.pagos_pendientes || 0} icon="💳" color="amber" />
          <AdminStatCard label="En tránsito" value={stats.en_transito || 0} icon="🚚" color="blue" />
          <AdminStatCard label="Atrasados" value={stats.pedidos_atrasados || 0} icon="⚠️" color="red" />
          <AdminStatCard label="Sin fecha" value={stats.sin_fecha_estimada || 0} icon="❓" color="zinc" />
        </div>

        {/* Alertas de pedidos atrasados */}
        {overdue.length > 0 && (
          <div className="mb-6">
            <div className="double-bezel p-4 border border-red-500/30">
              <div className="double-bezel__inner p-4">
                <div className="flex items-start gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 flex-shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-300">{overdue.length} pedido{overdue.length > 1 ? 's' : ''} atrasado{overdue.length > 1 ? 's' : ''}</h3>
                    <p className="mt-1 text-sm text-zinc-400">La fecha estimada de entrega ya pasó y no están marcados como entregados</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {overdue.slice(0, 5).map((o: any) => (
                        <a key={o.id} href={`/admin/solicitudes/${o.id}`} className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30">
                          #{o.request_code} ({o.days_overdue}d)
                        </a>
                      ))}
                      {overdue.length > 5 && <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-zinc-400">+{overdue.length - 5} más</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="double-bezel p-4 mb-6">
          <div className="double-bezel__inner p-4">
            <form className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 sm:w-48">
                <label className="block text-xs text-zinc-500 mb-1">Desde</label>
                <input 
                  type="date" 
                  name="start_date" 
                  value={defaultStart}
                  className="w-full rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50"
                />
              </div>
              <div className="flex-1 sm:w-48">
                <label className="block text-xs text-zinc-500 mb-1">Hasta</label>
                <input 
                  type="date" 
                  name="end_date" 
                  value={defaultEnd}
                  className="w-full rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50"
                />
              </div>
              <div className="flex-1 sm:w-64">
                <label className="block text-xs text-zinc-500 mb-1">Tipo de evento</label>
                <select name="event_type" className="w-full rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50">
                  <option value="">Todos los tipos</option>
                  {EVENT_TYPES.map(t => (
                    <option key={t.value} value={t.value} selected={params.event_type === t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 sm:w-48">
                <label className="block text-xs text-zinc-500 mb-1">Estado</label>
                <select name="status" className="w-full rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50">
                  <option value="">Todos los estados</option>
                  <option value="en_revision" selected={params.status === 'en_revision'}>🟡 En revisión</option>
                  <option value="en_busqueda" selected={params.status === 'en_busqueda'}>🔵 En búsqueda</option>
                  <option value="esperando_confirmacion" selected={params.status === 'esperando_confirmacion'}>🟠 Esperando confirmación</option>
                  <option value="aceptada" selected={params.status === 'aceptada'}>🟢 Aceptada</option>
                  <option value="precio_confirmado" selected={params.status === 'precio_confirmado'}>💰 Precio confirmado</option>
                  <option value="esperando_pago" selected={params.status === 'esperando_pago'}>💳 Esperando pago</option>
                  <option value="pagada" selected={params.status === 'pagada'}>🔵 Pagada</option>
                  <option value="producto_comprado" selected={params.status === 'producto_comprado'}>🛒 Producto comprado</option>
                  <option value="procesando" selected={params.status === 'procesando'}>📦 Procesando</option>
                  <option value="en_transito" selected={params.status === 'en_transito'}>🚚 En tránsito</option>
                  <option value="entregada" selected={params.status === 'entregada'}>🟣 Entregada</option>
                  <option value="rechazada" selected={params.status === 'rechazada'}>🔴 Rechazada</option>
                  <option value="cancelada" selected={params.status === 'cancelada'}>⚫ Cancelada</option>
                </select>
              </div>
              <button type="submit" className="px-4 py-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-base-950 font-medium hover:opacity-90 transition whitespace-nowrap">
                Filtrar
              </button>
            </form>
          </div>
        </div>

        {/* Vista del calendario */}
        <div>
          <div className="flex gap-2 mb-4">
            {(['month', 'week', 'agenda'] as const).map(v => (
              <a
                key={v}
                href={`/admin/calendario?view=${v}&start_date=${defaultStart}&end_date=${defaultEnd}${params.event_type ? `&event_type=${params.event_type}` : ''}${params.status ? `&status=${params.status}` : ''}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${view === v 
                  ? 'bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-base-950' 
                  : 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10'}`}
              >
                {v === 'month' ? '📅 Mes' : v === 'week' ? '📆 Semana' : '📋 Agenda'}
              </a>
            ))}
          </div>

          <Calendar 
            events={events ?? []}
            view={view}
            eventBasePath="/admin/solicitudes"
          />
        </div>
      </main>
    </div>
  )
}

function AdminStatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    cyan: 'from-cyan-500 to-cyan-600',
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    zinc: 'from-zinc-500 to-zinc-600',
  }
  return (
    <div className="double-bezel p-4">
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
    </div>
  )
}