import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const view = searchParams.get('view') || 'month' // month, week, agenda

  if (!startDate || !endDate) {
    // Default al mes actual
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return NextResponse.json({ 
      error: 'Fechas requeridas', 
      default_start: start.toISOString().split('T')[0],
      default_end: end.toISOString().split('T')[0]
    }, { status: 400 })
  }

  // Usar RPC para obtener eventos del calendario
  const { data, error } = await supabase.rpc('get_user_calendar', {
    p_user_id: user.id,
    p_start_date: startDate,
    p_end_date: endDate
  })

  if (error) return NextResponse.json({ error: 'Error al obtener calendario' }, { status: 500 })

  const events = data ?? []

  // Agrupar por fecha para vista mensual
  const byDate: Record<string, any[]> = {}
  for (const event of events) {
    const dateKey = event.event_date
    if (!byDate[dateKey]) byDate[dateKey] = []
    byDate[dateKey].push(event)
  }

  // Para rangos, expandir a cada día del rango
  const expandedByDate: Record<string, any[]> = {}
  for (const event of events) {
    const start = new Date(event.event_date)
    const end = event.end_date ? new Date(event.end_date) : start
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0]
      if (!expandedByDate[key]) expandedByDate[key] = []
      // Solo agregar una vez por evento por día
      if (!expandedByDate[key].find(e => e.id === event.id)) {
        expandedByDate[key].push({ ...event, is_range_day: event.is_range && d > start })
      }
    }
  }

  return NextResponse.json({ 
    events,
    by_date: byDate,
    expanded_by_date: expandedByDate,
    view,
    range: { start: startDate, end: endDate }
  })
}