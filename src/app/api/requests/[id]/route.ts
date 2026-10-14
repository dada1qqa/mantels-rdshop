import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const phone = searchParams.get('phone')

  if (code && phone) {
    const { data } = await supabase.rpc('get_request_details', { p_code: code, p_phone: phone })
    if (!data) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    return NextResponse.json(data)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: request } = await supabase.from('requests').select('*').eq('id', id).single()
  if (!request) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isStaff = profile && ['owner', 'admin', 'staff'].includes(profile.role)
  if (!isStaff && request.user_id !== user.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data: history } = await supabase.from('request_status_history').select('*').eq('request_id', request.id).order('created_at')
  const { data: messages } = await supabase.from('request_messages').select('*').eq('request_id', request.id).order('created_at')
  return NextResponse.json({ request, history: history ?? [], messages: messages ?? [] })
}
