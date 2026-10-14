import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ItemInput = { product_id: string; quantity: number }

export async function POST(req: NextRequest) {
  let body: {
    customer_name?: string
    customer_phone?: string
    customer_email?: string
    shipping_address?: string
    shipping_city?: string
    shipping_cost?: number
    payment_method?: string
    notes?: string
    idempotency_key?: string
    items?: ItemInput[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const name = String(body.customer_name ?? '').trim()
  const phone = String(body.customer_phone ?? '').trim()
  const items = Array.isArray(body.items) ? body.items : []
  if (!name || name.length < 3) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  if (!phone) return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 })
  if (items.length === 0) return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 })
  for (const it of items) {
    if (!it.product_id || !Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 99) {
      return NextResponse.json({ error: 'Items inválidos' }, { status: 400 })
    }
  }

  const supabase = await createClient()

  if (body.idempotency_key) {
    const { data: existing } = await supabase
      .from('orders')
      .select('id, order_number, total')
      .eq('idempotency_key', body.idempotency_key)
      .maybeSingle()
    if (existing) return NextResponse.json({ order: existing, duplicate: true })
  }

  const ids = items.map((i) => i.product_id)
  const { data: products } = await supabase.from('products').select('id, name, price, stock').in('id', ids)
  const byId = new Map((products ?? []).map((p) => [p.id, p]))

  let subtotal = 0
  const lines: { product_id: string; product_name: string; quantity: number; price: number }[] = []
  for (const it of items) {
    const p = byId.get(it.product_id)
    if (!p) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 400 })
    if ((p.stock ?? 0) < it.quantity) return NextResponse.json({ error: `Stock insuficiente: ${p.name}` }, { status: 409 })
    const price = Number(p.price)
    subtotal += price * it.quantity
    lines.push({ product_id: p.id, product_name: p.name, quantity: it.quantity, price })
  }

  const shipping = Math.max(0, Number(body.shipping_cost ?? 0) || 0)
  const total = subtotal + shipping

  let customerId: string | null = null
  const { data: customerIdData } = await supabase.rpc('upsert_customer', { p_name: name, p_phone: phone, p_email: body.customer_email ?? null })
  customerId = customerIdData ?? null

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: null,
      customer_id: customerId,
      customer_name: name,
      customer_phone: phone,
      customer_email: body.customer_email ?? null,
      shipping_address: body.shipping_address ?? null,
      shipping_city: body.shipping_city ?? null,
      shipping_cost: shipping,
      subtotal,
      total,
      payment_method: body.payment_method ?? 'cod',
      notes: body.notes ?? null,
      idempotency_key: body.idempotency_key ?? null,
      status: 'nuevo',
    })
    .select('id, order_number, total, status')
    .single()

  if (error || !order) {
    if (error?.code === '23505') {
      const { data: existing } = await supabase
        .from('orders')
        .select('id, order_number, total')
        .eq('idempotency_key', body.idempotency_key ?? '')
        .maybeSingle()
      if (existing) return NextResponse.json({ order: existing, duplicate: true })
    }
    return NextResponse.json({ error: 'No se pudo crear el pedido' }, { status: 500 })
  }

  await supabase.from('order_items').insert(lines.map((l) => ({ ...l, order_id: order.id })))
  for (const l of lines) {
    const p = byId.get(l.product_id)!
    await supabase.from('products').update({ stock: Math.max(0, (p.stock ?? 0) - l.quantity) }).eq('id', l.product_id)
  }

  const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-order-events`
  fetch(fnUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' } }).catch(() => {})

  return NextResponse.json({ order }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const { requireStaffApi } = await import('@/lib/api/auth')
  const staff = await requireStaffApi()
  if (!staff) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const q = searchParams.get('q')
  const limit = Math.min(100, Number(searchParams.get('limit') ?? 50))

  let query = staff.supabase.from('orders').select('id, order_number, customer_name, customer_phone, total, status, created_at').order('created_at', { ascending: false }).limit(limit)
  if (status) query = query.eq('status', status)
  if (q) {
    const safe = q.replace(/[,%()]/g, ' ').trim()
    if (safe) query = query.or(`order_number.ilike.%${safe}%,customer_name.ilike.%${safe}%,customer_phone.ilike.%${safe}%`)
  }
  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Error' }, { status: 500 })
  return NextResponse.json({ orders: data })
}
