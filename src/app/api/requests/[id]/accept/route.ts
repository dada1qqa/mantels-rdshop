import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const phone = searchParams.get('phone')
  const supabase = await createClient()

  if (code && phone) {
    const { error } = await supabase.rpc('accept_request_price', { p_code: code, p_phone: phone })
    if (error) return NextResponse.json({ error: 'No se pudo aceptar' }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  const { id } = await params
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { data: reqRow } = await supabase.from('requests').select('id, request_code, customer_phone, user_id').eq('id', id).single()
  if (!reqRow || reqRow.user_id !== user.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const { error } = await supabase.rpc('accept_request_price', { p_code: reqRow.request_code, p_phone: reqRow.customer_phone })
  if (error) return NextResponse.json({ error: 'No se pudo aceptar' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
