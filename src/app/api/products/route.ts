import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireStaffApi } from '@/lib/api/auth'

type ProductInput = {
  id?: string
  name: string
  description?: string | null
  price: number
  category?: string | null
  tag?: string | null
  image_url?: string | null
  stock?: number | null
  source?: string | null
  source_url?: string | null
  original_price?: number | null
  brand?: string | null
  model?: string | null
}

export async function GET() {
  const staff = await requireStaffApi()
  if (!staff) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await staff.supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: 'Error al listar productos' }, { status: 500 })
  return NextResponse.json({ products: data })
}

export async function POST(req: NextRequest) {
  const staff = await requireStaffApi()
  if (!staff) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: ProductInput | ProductInput[]
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const items = Array.isArray(body) ? body : [body]
  if (items.length === 0) return NextResponse.json({ error: 'Sin productos' }, { status: 400 })

  const inserted: ProductInput[] = []
  const errors: { name: string; error: string }[] = []

  for (const item of items) {
    if (!item.name || typeof item.price !== 'number') {
      errors.push({ name: item.name ?? 'sin nombre', error: 'Nombre y precio requeridos' })
      continue
    }

    const uuid = await staff.supabase.rpc('gen_random_uuid')
    const id = item.id ?? (uuid.data as string) ?? crypto.randomUUID()
    const product = {
      id,
      name: item.name,
      description: item.description ?? null,
      price: item.price,
      category: item.category ?? null,
      tag: item.tag ?? null,
      image_url: item.image_url ?? null,
      stock: item.stock ?? 1,
      source: item.source ?? null,
      source_url: item.source_url ?? null,
      original_price: item.original_price ?? null,
      brand: item.brand ?? null,
      model: item.model ?? null,
    }

    const { error } = await staff.supabase.from('products').insert(product)
    if (error) {
      errors.push({ name: item.name, error: error.message })
    } else {
      inserted.push(product)
    }
  }

  return NextResponse.json({ inserted: inserted.length, errors, products: inserted }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const staff = await requireStaffApi()
  if (!staff) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: ProductInput & { id: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  if (!body.id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { error } = await staff.supabase
    .from('products')
    .update({
      name: body.name,
      description: body.description ?? null,
      price: body.price,
      category: body.category ?? null,
      tag: body.tag ?? null,
      image_url: body.image_url ?? null,
      stock: body.stock ?? 1,
      source: body.source ?? null,
      source_url: body.source_url ?? null,
      original_price: body.original_price ?? null,
      brand: body.brand ?? null,
      model: body.model ?? null,
    })
    .eq('id', body.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const staff = await requireStaffApi()
  if (!staff) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { error } = await staff.supabase.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
