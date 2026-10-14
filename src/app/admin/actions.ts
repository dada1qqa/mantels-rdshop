import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) throw new Error('No autorizado')
  return { supabase, user, role: profile.role as string }
}

export async function login(formData: FormData) {
  'use server'
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) redirect('/admin/login?error=datos')
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect('/admin/login?error=credenciales')
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
  if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) {
    await supabase.auth.signOut()
    redirect('/admin/login?error=permisos')
  }
  redirect('/admin')
}

export async function logout() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export async function createProduct(formData: FormData) {
  'use server'
  const supabase = await createClient()
  await requireStaff()
  await supabase.from('products').insert({
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
    price: Number(formData.get('price') ?? 0),
    category: String(formData.get('category') ?? ''),
    tag: String(formData.get('tag') ?? ''),
    image_url: String(formData.get('image_url') ?? ''),
    source_url: String(formData.get('source_url') ?? ''),
    stock: Number(formData.get('stock') ?? 0),
  })
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function updateProduct(formData: FormData) {
  'use server'
  const supabase = await createClient()
  await requireStaff()
  await supabase.from('products').update({
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
    price: Number(formData.get('price') ?? 0),
    category: String(formData.get('category') ?? ''),
    tag: String(formData.get('tag') ?? ''),
    image_url: String(formData.get('image_url') ?? ''),
    source_url: String(formData.get('source_url') ?? ''),
    stock: Number(formData.get('stock') ?? 0),
  }).eq('id', String(formData.get('id')))
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function deleteProduct(formData: FormData) {
  'use server'
  const supabase = await createClient()
  await requireStaff()
  await supabase.from('products').delete().eq('id', String(formData.get('id')))
  revalidatePath('/admin')
  revalidatePath('/')
}
