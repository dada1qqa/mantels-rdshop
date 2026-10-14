import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const EVENT_TYPES = [
  'request_received', 'request_accepted', 'price_confirmed', 'payment_requested',
  'payment_received', 'purchase_made', 'preparing', 'shipped', 'estimated_arrival',
  'delivery_scheduled', 'delivered', 'date_changed', 'cancelled', 'rejected',
  'custom', 'digital_delivery', 'external_purchase', 'external_shipped',
  'arrived_carrier', 'arrived_country'
] as const

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: event } = await supabase.from('order_events').select('*, requests!inner(user_id)').eq('id', id).single()
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isStaff = profile && ['owner', 'admin', 'staff'].includes(profile.role)
  const requestUserId = (event.requests as any).user_id

  if (!isStaff && requestUserId !== user.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!isStaff && !event.is_visible_to_customer) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  return NextResponse.json({ event })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Solo admins pueden modificar eventos
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data: event } = await supabase.from('order_events').select('*').eq('id', id).single()
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 }) }

  const allowedFields = [
    'event_type', 'title', 'description', 'status', 'event_date',
    'start_time', 'end_time', 'end_date', 'is_estimated', 'is_range',
    'tolerance_days', 'is_visible_to_customer', 'metadata'
  ]

  const updates: any = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === 'event_type' && !EVENT_TYPES.includes(body[field])) {
        return NextResponse.json({ error: 'Tipo de evento inválido' }, { status: 400 })
      }
      updates[field] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('order_events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })

  // Si cambió la fecha y es visible al cliente, crear evento de modificación
  if ((body.event_date || body.end_date) && event.is_visible_to_customer) {
    await supabase.rpc('create_order_event', {
      p_request_id: event.request_id,
      p_event_type: 'date_changed',
      p_title: 'Fecha modificada',
      p_description: `Fecha actualizada por administrador`,
      p_event_date: body.event_date || event.event_date,
      p_is_estimated: body.is_estimated ?? event.is_estimated,
      p_is_visible_to_customer: true,
      p_metadata: { previous_date: event.event_date, previous_end_date: event.end_date, changed_by: user.id }
    })
  }

  // Log de auditoría
  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'order_event.update',
    entity: 'order_event',
    entity_id: id,
    before: event,
    after: updates
  })

  return NextResponse.json({ event: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Solo admins pueden eliminar eventos
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data: event } = await supabase.from('order_events').select('*').eq('id', id).single()
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  const { error } = await supabase.from('order_events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 })

  // Log de auditoría
  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'order_event.delete',
    entity: 'order_event',
    entity_id: id,
    before: event
  })

  return NextResponse.json({ ok: true })
}