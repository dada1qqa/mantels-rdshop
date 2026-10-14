'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canTransition } from '@/lib/requests/states'

export async function updateRequestStatus(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) redirect('/admin/login?error=permisos')

  const id = String(formData.get('id'))
  const next = String(formData.get('status'))
  const rejection_reason = formData.get('rejection_reason') ? String(formData.get('rejection_reason')) : null

  const { data: current } = await supabase.from('requests').select('status').eq('id', id).single()
  if (!current) throw new Error('No encontrado')
  if (!canTransition(current.status, next)) throw new Error(`Transición inválida: ${current.status} → ${next}`)

  const updates: Record<string, unknown> = { status: next, updated_at: new Date().toISOString() }
  if (rejection_reason) updates.rejection_reason = rejection_reason
  await supabase.from('requests').update(updates).eq('id', id)
  await supabase.from('request_status_history').insert({ request_id: id, previous_status: current.status, new_status: next, changed_by: user.id, note: rejection_reason })
  await supabase.from('audit_logs').insert({ actor_id: user.id, action: 'request.status_change', entity: 'request', entity_id: id, before: { status: current.status }, after: { status: next, reason: rejection_reason } })
  revalidatePath(`/admin/solicitudes/${id}`)
  revalidatePath('/admin/solicitudes')
}
