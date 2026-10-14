/**
 * Seed script — Sube los CPUs desde cpus_data.json a Supabase.
 *
 * Uso:
 *   1. Crea un archivo .env.local con:
 *        NEXT_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
 *   2. Ejecuta:  npx tsx scripts/seed-cpus.ts
 *
 * Requiere: @supabase/supabase-js (ya instalado) y tsx (npx tsx lo descarga).
 */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('❌ Faltan variables. Crea .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

type Cpu = {
  name: string
  brand?: string
  model?: string
  category?: string
  source?: string
  source_url?: string
  price: number
  original_price?: number | null
  description?: string
  stock?: number
  tag?: string
  image_url?: string
}

const raw = fs.readFileSync(path.join(process.cwd(), 'cpus_data.json'), 'utf-8')
const cpus: Cpu[] = JSON.parse(raw)

const supabase = createClient(url, serviceKey)

async function main() {
  console.log(`📦 Procesando ${cpus.length} CPUs...\n`)

  let ok = 0
  const fallidos: { name: string; error: string }[] = []

  for (const cpu of cpus) {
    const { data: uuidData } = await supabase.rpc('gen_random_uuid' as never)
    const id = (uuidData as string) ?? crypto.randomUUID()

    // Add margin: 500-1000 RD$ depending on price tier
    const margin = cpu.price >= 20000 ? 1000 : cpu.price >= 10000 ? 800 : 500
    const salePrice = cpu.price + margin

    const row = {
      id,
      name: cpu.name,
      description: cpu.description ?? null,
      price: salePrice, // Precio de venta con margen
      category: cpu.category ?? 'Procesador',
      tag: cpu.tag ?? null,
      image_url: cpu.image_url || null,
      stock: cpu.stock ?? 1,
      source: cpu.source ?? null,
      source_url: cpu.source_url ?? null,
      original_price: cpu.price, // Precio de compra (costo)
      brand: cpu.brand ?? null,
      model: cpu.model ?? null,
    }

    const { error } = await supabase.from('products').insert(row)
    if (error) {
      fallidos.push({ name: cpu.name, error: error.message })
      console.log(`❌ ${cpu.name} — ${error.message}`)
    } else {
      ok++
      console.log(`✅ ${cpu.name} — Compra: RD$${cpu.price.toLocaleString('es-DO')} → Venta: RD$${salePrice.toLocaleString('es-DO')} (+${margin})`)
    }
  }

  console.log(`\n📊 Resumen: ${ok} insertados, ${fallidos.length} fallidos`)
  if (fallidos.length) {
    console.log('Fallidos:', fallidos)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
