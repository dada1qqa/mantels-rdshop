import { NextRequest, NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/api/auth'

const ALLOWED = ['en_revision', 'en_busqueda', 'esperando_confirmacion', 'aceptada', 'precio_confirmado', 'esperando_pago', 'pagada', 'producto_comprado', 'procesando', 'en_transito', 'entregada', 'rechazada', 'cancelada']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const staff = await requireStaffApi()
  if (!staff) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: { status?: string; note?: string; rejection_reason?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 }) }
  if (!ALLOWED.includes(String(body.status))) return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  if (body.status === 'rechazada' && !String(body.rejection_reason ?? '').trim()) {
    return NextResponse.json({ error: 'Motivo de rechazo requerido' }, { status: 400 })
  }

  const { data: reqRow } = await staff.supabase.from('requests').select('id, status').eq('id', id).single()
  if (!reqRow) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const { data, error } = await staff.supabase.from('requests').update({
    status: body.status,
    rejection_reason: body.status === 'rechazada' ? body.rejection_reason : null,
  }).eq('id', id).select('id, request_code, status').single()
  if (error) return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })

  await staff.supabase.from('audit_logs').insert({ actor_id: staff.user.id, action: 'request.status_change', entity: 'request', entity_id: id, before: { status: reqRow.status }, after: { status: body.status, note: body.note ?? null } })
  return NextResponse.json({ request: data })
}
