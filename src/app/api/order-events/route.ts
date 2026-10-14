import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Tipos de eventos válidos
const EVENT_TYPES = [
  'request_received', 'request_accepted', 'price_confirmed', 'payment_requested',
  'payment_received', 'purchase_made', 'preparing', 'shipped', 'estimated_arrival',
  'delivery_scheduled', 'delivered', 'date_changed', 'cancelled', 'rejected',
  'custom', 'digital_delivery', 'external_purchase', 'external_shipped',
  'arrived_carrier', 'arrived_country'
] as const

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const requestId = searchParams.get('request_id')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const eventType = searchParams.get('event_type')

  if (!requestId) return NextResponse.json({ error: 'request_id requerido' }, { status: 400 })

  // Verificar que el request pertenece al usuario (o es admin)
  const { data: request } = await supabase.from('requests').select('id, user_id').eq('id', requestId).single()
  if (!request) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isStaff = profile && ['owner', 'admin', 'staff'].includes(profile.role)
  if (!isStaff && request.user_id !== user.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // Usar RPC para obtener eventos
  const { data, error } = await supabase.rpc('get_request_events', { p_request_id: requestId })
  if (error) return NextResponse.json({ error: 'Error al obtener eventos' }, { status: 500 })

  let events = data ?? []

  // Filtrar por fecha si se proporciona
  if (startDate) {
    events = events.filter((e: any) => e.event_date >= startDate)
  }
  if (endDate) {
    events = events.filter((e: any) => e.event_date <= endDate)
  }
  if (eventType) {
    events = events.filter((e: any) => e.event_type === eventType)
  }

  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Solo admins pueden crear eventos
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 }) }

  const {
    request_id,
    event_type,
    title,
    description,
    status,
    event_date,
    start_time,
    end_time,
    end_date,
    is_estimated = false,
    is_range = false,
    tolerance_days,
    is_visible_to_customer = true,
    metadata = {}
  } = body

  if (!request_id || !event_type || !title || !event_date) {
    return NextResponse.json({ error: 'Campos requeridos: request_id, event_type, title, event_date' }, { status: 400 })
  }

  if (!EVENT_TYPES.includes(event_type as any)) {
    return NextResponse.json({ error: 'Tipo de evento inválido' }, { status: 400 })
  }

  // Verificar que la solicitud existe
  const { data: request } = await supabase.from('requests').select('id, user_id').eq('id', request_id).single()
  if (!request) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })

  // Crear evento usando RPC
  const { data: eventId, error } = await supabase.rpc('create_order_event', {
    p_request_id: request_id,
    p_event_type: event_type,
    p_title: title,
    p_description: description,
    p_status: status,
    p_event_date: event_date,
    p_start_time: start_time,
    p_end_time: end_time,
    p_end_date: end_date,
    p_is_estimated: is_estimated,
    p_is_range: is_range,
    p_tolerance_days: tolerance_days,
    p_is_visible_to_customer: is_visible_to_customer,
    p_metadata: metadata
  })

  if (error) return NextResponse.json({ error: 'No se pudo crear el evento' }, { status: 500 })

  // Log de auditoría
  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'order_event.create',
    entity: 'order_event',
    entity_id: eventId,
    after: body
  })

  return NextResponse.json({ event_id: eventId }, { status: 201 })
}