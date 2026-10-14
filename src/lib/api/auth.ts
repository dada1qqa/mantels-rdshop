import { createClient } from '@/lib/supabase/server'

export async function requireStaffApi() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) return null
  return { supabase, user, role: profile.role as string }
}
