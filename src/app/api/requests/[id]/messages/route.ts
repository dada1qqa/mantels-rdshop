import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from('request_messages').select('*').eq('request_id', id).order('created_at')
  if (error) return NextResponse.json({ error: 'Error' }, { status: 500 })
  return NextResponse.json({ messages: data })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let body: { body?: string; phone?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 }) }
  const text = String(body.body ?? '').trim()
  if (!text) return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })

  const { data: reqRow } = await supabase.from('requests').select('id, user_id, customer_phone, request_code').eq('id', id).single()
  if (!reqRow) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  let role: 'admin' | 'customer'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile && ['owner', 'admin', 'staff'].includes(profile.role)) role = 'admin'
    else if (reqRow.user_id === user.id) role = 'customer'
    else return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  } else {
    if (!body.phone || body.phone !== reqRow.customer_phone) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    const { error } = await supabase.rpc('post_request_message', { p_code: reqRow.request_code, p_phone: body.phone, p_body: text })
    if (error) return NextResponse.json({ error: 'No se pudo enviar' }, { status: 500 })
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  const { data, error } = await supabase.from('request_messages').insert({ request_id: id, sender_role: role, body: text }).select().single()
  if (error) return NextResponse.json({ error: 'No se pudo enviar' }, { status: 500 })
  return NextResponse.json({ message: data }, { status: 201 })
}
