import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'next' | 'recent'
  const limit = Math.min(50, Number(searchParams.get('limit') ?? 20))

  if (type === 'next') {
    // Próxima actividad relevante
    const { data, error } = await supabase.rpc('get_user_next_activity', { p_user_id: user.id })
    if (error) return NextResponse.json({ error: 'Error al obtener próxima actividad' }, { status: 500 })

    const activity = data?.[0] || null
    return NextResponse.json({ activity })
  }

  if (type === 'recent') {
    // Actividad reciente
    const { data, error } = await supabase.rpc('get_user_recent_activity', { 
      p_user_id: user.id, 
      p_limit: limit 
    })
    if (error) return NextResponse.json({ error: 'Error al obtener actividad reciente' }, { status: 500 })

    return NextResponse.json({ activity: data ?? [] })
  }

  return NextResponse.json({ error: 'Tipo requerido: next o recent' }, { status: 400 })
}