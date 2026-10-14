/**
 * Seed script — Solo los 10 MEJORES CPUs para reventa.
 *
 * Uso:
 *   1. Edita .env.local con tus credenciales Supabase
 *   2. Ejecuta:  npx tsx scripts/seed-top10-cpus.ts
 */
import { createClient } from '@supabase/supabase-js'

const url = 'https://ivzwfkwacvjmjmmafafh.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2endma3dhY3ZqbWptbWFmYWZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTIzMzMxMCwiZXhwIjoyMTA2ODA5MzEwfQ.HHwm1YhpjYES044JXHz4aJE8L0qfKJH-z_McDd2b6Xs'

if (!url || !serviceKey) {
  console.error('❌ Faltan variables. Edita .env.local con tus credenciales Supabase')
  process.exit(1)
}

// TOP 10 CPUs seleccionados por: margen, demanda, rotación, plataforma moderna
const top10 = [
  // AMD AM5 - Plataforma actual, alta demanda
  { name: 'Procesador AMD Ryzen 5 7600X', brand: 'AMD', model: 'Ryzen 5 7600X', category: 'Procesador', source: 'arktechrd.catalog.kyte.site', source_url: 'https://arktechrd.catalog.kyte.site/procesadores', cost: 11500, description: '6 Núcleos, 12 Hilos - AM5', tag: 'AMD', image_url: '' },
  { name: 'Procesador AMD Ryzen 7 7800X3D', brand: 'AMD', model: 'Ryzen 7 7800X3D', category: 'Procesador', source: 'overclockedrd.com', source_url: 'https://overclockedrd.com/producto/procesador-amd-ryzen-7-7800x3d-l-am5/', cost: 29999, description: '8 Núcleos, 16 Hilos - 3D V-Cache - Rey del gaming', tag: 'AMD', image_url: 'https://overclockedrd.com/wp-content/uploads/2025/03/image_2024-05-22_005842283-600x600.png' },
  { name: 'Procesador AMD Ryzen 7 7700X', brand: 'AMD', model: 'Ryzen 7 7700X', category: 'Procesador', source: 'arktechrd.catalog.kyte.site', source_url: 'https://arktechrd.catalog.kyte.site/procesadores', cost: 17500, description: '8 Núcleos, 16 Hilos - AM5', tag: 'AMD', image_url: '' },
  { name: 'Procesador AMD Ryzen 5 7600X3D', brand: 'AMD', model: 'Ryzen 5 7600X3D', category: 'Procesador', source: 'arktechrd.catalog.kyte.site', source_url: 'https://arktechrd.catalog.kyte.site/procesadores', cost: 16500, description: '6 Núcleos, 12 Hilos - 3D V-Cache gaming', tag: 'AMD', image_url: '' },
  { name: 'Procesador AMD Ryzen 9 9900X', brand: 'AMD', model: 'Ryzen 9 9900X', category: 'Procesador', source: 'arktechrd.catalog.kyte.site', source_url: 'https://arktechrd.catalog.kyte.site/procesadores', cost: 19500, description: '12 Núcleos, 24 Hilos - AM5', tag: 'AMD', image_url: '' },
  
  // AMD AM4 - Volumen alto, presupuesto
  { name: 'Procesador AMD Ryzen 5 5600G', brand: 'AMD', model: 'Ryzen 5 5600G', category: 'Procesador', source: 'arktechrd.catalog.kyte.site', source_url: 'https://arktechrd.catalog.kyte.site/procesadores', cost: 11500, description: '6 Núcleos, 12 Hilos - Gráficos integrados Radeon', tag: 'AMD', image_url: '' },
  { name: 'Procesador AMD Ryzen 5 5500', brand: 'AMD', model: 'Ryzen 5 5500', category: 'Procesador', source: 'arktechrd.catalog.kyte.site', source_url: 'https://arktechrd.catalog.kyte.site/procesadores', cost: 5900, description: '6 Núcleos, 12 Hilos - AM4 presupuesto', tag: 'AMD', image_url: '' },
  
  // Intel LGA1700/1200 - Oficina/entry gaming
  { name: 'Intel Core i5-11400', brand: 'Intel', model: 'Core i5-11400', category: 'Procesador', source: 'tienda.omega.com.do', source_url: 'https://tienda.omega.com.do/es/product/consul/91309', cost: 12969, description: '6 Núcleos, 12 Hilos - LGA1200', tag: 'Intel', image_url: 'https://sis.omega.com.do/ProductImages/e1fb4f86-6b72-4b37-8d88-bbb031b09ff2.png' },
  { name: 'Intel Core i3-12100', brand: 'Intel', model: 'Core i3-12100', category: 'Procesador', source: 'tienda.omega.com.do', source_url: 'https://tienda.omega.com.do/es/product/consul/92423', cost: 12967, description: '4 Núcleos, 8 Hilos - LGA1700 entry', tag: 'Intel', image_url: 'https://sis.omega.com.do/ProductImages/b789d708-546a-407e-b588-4793294829ff.png' },
  { name: 'Procesador Intel Core i3 13100F', brand: 'Intel', model: 'Core i3-13100F', category: 'Procesador', source: 'overclockedrd.com', source_url: 'https://overclockedrd.com/producto/procesador-intel-core-i3-13100f-l-lga-1200/', cost: 6499, description: '4 Núcleos, 8 Hilos - LGA1200', tag: 'Intel', image_url: 'https://overclockedrd.com/wp-content/uploads/2025/03/image_2024-11-01_202526357-600x600.png' },
]

const supabase = createClient(url, serviceKey)

function calcularMargen(costo: number) {
  if (costo >= 20000) return 1000
  if (costo >= 10000) return 800
  return 500
}

async function main() {
  console.log(`📦 Insertando TOP 10 CPUs para reventa...\n`)

  let ok = 0
  for (const cpu of top10) {
    const margen = calcularMargen(cpu.cost)
    const precioVenta = cpu.cost + margen

    const { data: uuidData } = await supabase.rpc('gen_random_uuid' as never)
    const id = (uuidData as string) ?? crypto.randomUUID()

    const row = {
      id,
      name: cpu.name,
      description: cpu.description,
      price: precioVenta,
      category: cpu.category,
      tag: cpu.tag,
      image_url: cpu.image_url || null,
      stock: 1,
    }

    const { error } = await supabase.from('products').insert(row)
    if (error) {
      console.log(`❌ ${cpu.name} — ${error.message}`)
    } else {
      ok++
      console.log(`✅ ${cpu.name}`)
      console.log(`   Compra: RD$${cpu.cost.toLocaleString('es-DO')} → Venta: RD$${precioVenta.toLocaleString('es-DO')} (+RD$${margen})`)
      console.log(`   Fuente: ${cpu.source}\n`)
    }
  }

  console.log(`🎯 Listo: ${ok}/10 CPUs insertados con margen.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})