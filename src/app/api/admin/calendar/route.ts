import { NextRequest, NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/api/auth'

export async function GET(req: NextRequest) {
  const staff = await requireStaffApi()
  if (!staff) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const eventType = searchParams.get('event_type')
  const status = searchParams.get('status')
  const requestId = searchParams.get('request_id')
  const limit = Math.min(500, Number(searchParams.get('limit') ?? 200))

  if (!startDate || !endDate) {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return NextResponse.json({ 
      error: 'Fechas requeridas', 
      default_start: start.toISOString().split('T')[0],
      default_end: end.toISOString().split('T')[0]
    }, { status: 400 })
  }

  let query = staff.supabase
    .from('admin_calendar_view')
    .select('*')
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: true })
    .limit(limit)

  if (eventType) query = query.eq('event_type', eventType)
  if (status) query = query.eq('status', status)
  if (requestId) query = query.eq('request_id', requestId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Error al obtener calendario' }, { status: 500 })

  // Agrupar por fecha
  const byDate: Record<string, any[]> = {}
  for (const event of data ?? []) {
    const key = event.event_date
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(event)
  }

  // Resumen por fecha para vista mensual
  const summary: Record<string, { count: number; types: Record<string, number> }> = {}
  for (const [date, events] of Object.entries(byDate)) {
    const types: Record<string, number> = {}
    for (const e of events) {
      types[e.event_type] = (types[e.event_type] || 0) + 1
    }
    summary[date] = { count: events.length, types }
  }

  return NextResponse.json({ 
    events: data ?? [],
    by_date: byDate,
    summary,
    range: { start: startDate, end: endDate },
    filters: { eventType, status, requestId }
  })
}