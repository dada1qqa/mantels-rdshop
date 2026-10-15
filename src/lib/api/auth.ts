import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/client'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function requireStaffApi() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  // Usar Drizzle para obtener el perfil
  const profile = await db.select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)
    .then(rows => rows[0] ?? null)
  
  if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) return null
  
  return { db, user, role: profile.role as string }
}