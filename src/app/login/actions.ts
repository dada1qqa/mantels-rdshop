import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signout() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function signup(formData: FormData) {
  'use server'
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || password.length < 6) redirect('/login?error=datos')
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mantels-rdshop.vercel.app'}/auth/callback` },
  })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)
  redirect('/login?msg=cuenta-creada')
}

export async function signin(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)
  redirect('/')
}
