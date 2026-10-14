import { NextRequest, NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/api/auth'
import { canTransition } from '@/lib/orders/states'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const staff = await requireStaffApi()
  if (!staff) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: { status?: string; note?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }
  const next = String(body.status ?? '')
  if (!next) return NextResponse.json({ error: 'Estado requerido' }, { status: 400 })

  const { data: order } = await staff.supabase.from('orders').select('id, status').eq('id', id).single()
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  if (!canTransition(order.status, next)) {
    return NextResponse.json({ error: `Transición inválida: ${order.status} → ${next}` }, { status: 409 })
  }

  const { data: updated, error } = await staff.supabase
    .from('orders')
    .update({ status: next })
    .eq('id', id)
    .select('id, order_number, status')
    .single()
  if (error) return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })

  await staff.supabase.from('audit_logs').insert({
    actor_id: staff.user.id,
    action: 'order.status_change',
    entity: 'order',
    entity_id: id,
    before: { status: order.status },
    after: { status: next, note: body.note ?? null },
  })

  return NextResponse.json({ order: updated })
}
