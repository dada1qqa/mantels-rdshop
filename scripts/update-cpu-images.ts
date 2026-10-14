/**
 * Actualiza imágenes de los 10 CPUs insertados
 */
import { createClient } from '@supabase/supabase-js'

const url = 'https://ivzwfkwacvjmjmmafafh.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2endma3dhY3ZqbWptbWFmYWZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTIzMzMxMCwiZXhwIjoyMTA2ODA5MzEwfQ.HHwm1YhpjYES044JXHz4aJE8L0qfKJH-z_McDd2b6Xs'

const supabase = createClient(url, serviceKey)

// Imágenes disponibles de las fuentes autorizadas
const imagenes = {
  'Procesador AMD Ryzen 7 7800X3D': 'https://overclockedrd.com/wp-content/uploads/2025/03/image_2024-05-22_005842283-600x600.png',
  'Procesador Intel Core i5-11400': 'https://sis.omega.com.do/ProductImages/e1fb4f86-6b72-4b37-8d88-bbb031b09ff2.png',
  'Intel Core i3-12100': 'https://sis.omega.com.do/ProductImages/b789d708-546a-407e-b588-4793294829ff.png',
  'Procesador Intel Core i3 13100F': 'https://overclockedrd.com/wp-content/uploads/2025/03/image_2024-11-01_202526357-600x600.png',
  // Para los de ArkTech que no tienen imagen directa, usar placeholder genérico de AMD/Intel
  'Procesador AMD Ryzen 5 7600X': 'https://overclockedrd.com/wp-content/uploads/2025/03/Ryzen-5-7600x-600x600.webp',
  'Procesador AMD Ryzen 7 7700X': 'https://overclockedrd.com/wp-content/uploads/2025/03/image_2024-05-22_005629144-600x600.png',
  'Procesador AMD Ryzen 5 7600X3D': 'https://overclockedrd.com/wp-content/uploads/2025/07/image_2025-07-10_182129207-600x600.png',
  'Procesador AMD Ryzen 9 9900X': 'https://overclockedrd.com/wp-content/uploads/2025/07/image_2025-07-10_181007250-600x600.png',
  'Procesador AMD Ryzen 5 5600G': 'https://overclockedrd.com/wp-content/uploads/2025/03/Ryzen-5-7600x-600x600.webp',
  'Procesador AMD Ryzen 5 5500': 'https://overclockedrd.com/wp-content/uploads/2025/03/image_2024-05-22_005136924-600x600.png',
}

async function main() {
  console.log('🖼️ Actualizando imágenes...\n')

  for (const [nombre, imagen] of Object.entries(imagenes)) {
    const { error } = await supabase
      .from('products')
      .update({ image_url: imagen })
      .eq('name', nombre)

    if (error) {
      console.log(`❌ ${nombre} — ${error.message}`)
    } else {
      console.log(`✅ ${nombre}`)
    }
  }

  console.log('\n🎯 Listo')
}

main().catch(console.error)