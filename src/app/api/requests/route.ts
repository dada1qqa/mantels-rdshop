import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TYPES = ['product', 'digital', 'external', 'other', 'producto', 'otra_tienda', 'otro']
const TYPE_MAP: Record<string, string> = { producto: 'product', product: 'product', digital: 'digital', otra_tienda: 'external', external: 'external', otro: 'other', other: 'other' }

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 }) }

  const rawType = String(body.type ?? '')
  if (!TYPES.includes(rawType)) return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  const type = TYPE_MAP[rawType]
  const name = String(body.customer_name ?? '').trim()
  const phone = String(body.customer_phone ?? '').trim()
  if (name.length < 3) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  if (!phone) return NextResponse.json({ error: 'WhatsApp requerido' }, { status: 400 })

  if (type === 'product' && !String(body.product_name ?? '').trim()) return NextResponse.json({ error: 'Nombre del artículo requerido' }, { status: 400 })
  if (type === 'digital' && (!String(body.game ?? '').trim() || !String(body.digital_product ?? '').trim())) return NextResponse.json({ error: 'Juego y producto digital requeridos' }, { status: 400 })
  if (type === 'external') {
    const url = String(body.external_url ?? '').trim()
    try { new URL(url) } catch { return NextResponse.json({ error: 'URL inválida' }, { status: 400 }) }
    if (!String(body.product_name ?? '').trim()) return NextResponse.json({ error: 'Nombre del producto requerido' }, { status: 400 })
  }
  if (type === 'other' && !String(body.description ?? '').trim()) return NextResponse.json({ error: 'Descripción requerida' }, { status: 400 })

  for (const field of ['estimated_price', 'maximum_price', 'external_price', 'original_price']) {
    if (body[field] !== undefined && body[field] !== null && body[field] !== '' && Number.isNaN(Number(body[field]))) {
      return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase.from('requests').insert({
    user_id: user?.id ?? null,
    type,
    status: 'en_revision',
    product_name: body.product_name ?? null,
    category: body.category ?? null,
    description: body.description ?? null,
    quantity: Math.max(1, Number(body.quantity ?? 1) || 1),
    estimated_price: body.estimated_price ?? null,
    maximum_price: body.maximum_price ?? null,
    external_store: body.external_store ?? null,
    external_url: body.external_url ?? null,
    original_price: body.external_price ?? body.original_price ?? null,
    original_currency: body.original_currency ?? 'RD$',
    game: body.game ?? null,
    brand: body.brand ?? null,
    model: body.model ?? null,
    digital_product: body.digital_product ?? null,
    player_id: body.player_id ?? null,
    username: body.username ?? null,
    customer_name: name,
    customer_phone: phone,
    delivery_information: body.delivery_information ?? null,
    payment_method: body.payment_method ?? null,
    customer_notes: body.customer_notes ?? null,
  }).select('id, request_code, status').single()

  if (error) return NextResponse.json({ error: 'No se pudo crear la solicitud' }, { status: 500 })
  return NextResponse.json({ request: data }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const { requireStaffApi } = await import('@/lib/api/auth')
  const staff = await requireStaffApi()
  if (!staff) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const q = searchParams.get('q')
  let query = staff.supabase.from('requests').select('*').order('created_at', { ascending: false }).limit(100)
  if (status) query = query.eq('status', status)
  if (type) query = query.eq('type', type)
  if (q) {
    const safe = q.replace(/[,%()]/g, ' ').trim()
    if (safe) query = query.or(`request_code.ilike.%${safe}%,product_name.ilike.%${safe}%,customer_name.ilike.%${safe}%,customer_phone.ilike.%${safe}%`)
  }
  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Error' }, { status: 500 })
  return NextResponse.json({ requests: data })
}
