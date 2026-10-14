import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const { data, error } = await supabase.from('requests').select('id, request_code, type, product_name, status, maximum_price, confirmed_price, total_price, created_at, updated_at').eq('user_id', user.id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Error' }, { status: 500 })
  return NextResponse.json({ requests: data })
}
