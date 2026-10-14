import { NextRequest, NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/api/auth'

export async function GET(req: NextRequest) {
  const staff = await requireStaffApi()
  if (!staff) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Estadísticas del dashboard
  const { data: stats, error: statsError } = await staff.supabase.rpc('get_admin_dashboard_stats')
  if (statsError) return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })

  // Pedidos atrasados
  const { data: overdue, error: overdueError } = await staff.supabase.rpc('get_overdue_requests')
  if (overdueError) return NextResponse.json({ error: 'Error al obtener pedidos atrasados' }, { status: 500 })

  // Entregas por día (próximos 14 días)
  const { data: deliveries, error: deliveriesError } = await staff.supabase
    .from('requests')
    .select('id, request_code, product_name, customer_name, status, estimated_delivery_date, estimated_delivery_end_date')
    .not('estimated_delivery_date', 'is', null)
    .gte('estimated_delivery_date', new Date().toISOString().split('T')[0])
    .lte('estimated_delivery_date', new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0])
    .order('estimated_delivery_date', { ascending: true })

  const deliveriesByDate: Record<string, any[]> = {}
  for (const d of deliveries ?? []) {
    const date = d.estimated_delivery_date
    if (!deliveriesByDate[date]) deliveriesByDate[date] = []
    deliveriesByDate[date].push(d)
  }

  // Pagos pendientes
  const { data: pendingPayments } = await staff.supabase
    .from('requests')
    .select('id, request_code, product_name, customer_name, customer_phone, total_price, maximum_price, updated_at')
    .eq('status', 'esperando_pago')
    .order('updated_at', { ascending: true })

  return NextResponse.json({
    stats: stats?.[0] ?? {},
    overdue: overdue ?? [],
    deliveries_by_date: deliveriesByDate,
    pending_payments: pendingPayments ?? [],
    generated_at: new Date().toISOString()
  })
}