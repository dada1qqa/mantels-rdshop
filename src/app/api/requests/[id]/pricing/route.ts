import { NextRequest, NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/api/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const staff = await requireStaffApi()
  if (!staff) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 }) }

  const num = (v: unknown) => (v === '' || v === null || v === undefined ? null : Number(v))
  for (const f of ['confirmed_price', 'product_price', 'shipping_cost', 'taxes', 'commission', 'total_price']) {
    if (body[f] !== undefined && num(body[f]) !== null && Number.isNaN(num(body[f]))) {
      return NextResponse.json({ error: 'Valor numérico inválido' }, { status: 400 })
    }
  }

  const { data, error } = await staff.supabase.from('requests').update({
    confirmed_price: num(body.confirmed_price),
    product_price: num(body.product_price),
    shipping_cost: num(body.shipping_cost),
    taxes: num(body.taxes),
    commission: num(body.commission),
    total_price: num(body.total_price),
    admin_notes: body.admin_notes !== undefined ? String(body.admin_notes) : undefined,
    status: body.set_status === 'precio_confirmado' ? 'precio_confirmado' : undefined,
  }).eq('id', id).select('*').single()

  if (error) return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 })
  await staff.supabase.from('audit_logs').insert({ actor_id: staff.user.id, action: 'request.pricing', entity: 'request', entity_id: id, after: body as never })
  return NextResponse.json({ request: data })
}
