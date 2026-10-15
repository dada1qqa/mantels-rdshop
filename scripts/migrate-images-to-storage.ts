/**
 * Descarga imágenes externas, súbelas a Supabase Storage y actualiza la BD
 */
import { createClient } from '@supabase/supabase-js'
import https from 'https'
import http from 'http'

const SUPABASE_URL = 'https://ivzwfkwacvjmjmmafafh.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2endma3dhY3ZqbWptbWFmYWZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTIzMzMxMCwiZXhwIjoyMTA2ODA5MzEwfQ.HHwm1YhpjYES044JXHz4aJE8L0qfKJH-z_McDd2b6Xs'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const BUCKET_NAME = 'product-images'

// Descargar imagen como buffer
function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const options = {
      rejectUnauthorized: false, // Permite SSL self-signed
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }
    client.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${url}`))
        return
      }
      const chunks: Buffer[] = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

// Obtener extensión del archivo
function getExtension(url: string, contentType?: string): string {
  if (contentType) {
    const map: Record<string, string> = {
      'image/webp': '.webp',
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
    }
    if (map[contentType]) return map[contentType]
  }
  // Fallback: extraer de URL
  const match = url.match(/\.(webp|png|jpe?g)(?:\?|$)/i)
  return match ? `.${match[1]}` : '.webp'
}

async function main() {
  console.log('🚀 Iniciando migración de imágenes a Supabase Storage...\n')

  // 1. Crear bucket si no existe
  console.log('📦 Verificando/creando bucket...')
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/webp', 'image/png', 'image/jpeg', 'image/jpg']
    })
    if (error) {
      console.error('❌ Error creando bucket:', error.message)
      process.exit(1)
    }
    console.log('✅ Bucket creado:', BUCKET_NAME)
  } else {
    console.log('✅ Bucket ya existe:', BUCKET_NAME)
  }

  // 2. Obtener productos con imágenes externas
  console.log('\n🔍 Buscando productos con imágenes externas...')
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, image_url')
    .not('image_url', 'is', null)

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  const externalProducts = products?.filter(p => p.image_url?.startsWith('http')) || []
  console.log(`📸 ${externalProducts.length} productos con imágenes externas\n`)

  // 3. Procesar cada imagen
  let ok = 0, fail = 0

  for (const product of externalProducts) {
    try {
      console.log(`⬇️  Descargando: ${product.name}`)
      const buffer = await downloadImage(product.image_url)

      // Generar nombre de archivo único
      const ext = getExtension(product.image_url)
      const fileName = `${product.id}${ext}`
      const filePath = `products/${fileName}`

      // 4. Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType: `image/${ext.replace('.', '')}`,
          upsert: true
        })

      if (uploadError) throw uploadError

      // 5. Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      // 6. Actualizar BD
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', product.id)

      if (updateError) throw updateError

      console.log(`   ✅ Subida: ${publicUrl}`)
      ok++
    } catch (e: unknown) {
      console.log(`   ❌ Error: ${e instanceof Error ? e.message : String(e)}`)
      fail++
    }
  }

  console.log(`\n🎯 Resumen: ${ok} exitosas, ${fail} fallidas`)
}

main().catch(console.error)