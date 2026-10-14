'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export async function updateRequestPricing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) throw new Error('No autorizado')

  const id = String(formData.get('id'))
  const product_price = num(formData.get('product_price'))
  const shipping_cost = num(formData.get('shipping_cost'))
  const commission = num(formData.get('commission'))
  const total = (product_price ?? 0) + (shipping_cost ?? 0) + (commission ?? 0)
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (product_price !== null) updates.product_price = product_price
  if (shipping_cost !== null) updates.shipping_cost = shipping_cost
  if (commission !== null) updates.commission = commission
  updates.total_price = total
  if (formData.get('admin_notes')) updates.admin_notes = String(formData.get('admin_notes'))

  await supabase.from('requests').update(updates).eq('id', id)
  await supabase.from('audit_logs').insert({ actor_id: user.id, action: 'request.pricing', entity: 'request', entity_id: id, after: updates })
  revalidatePath(`/admin/solicitudes/${id}`)
}
