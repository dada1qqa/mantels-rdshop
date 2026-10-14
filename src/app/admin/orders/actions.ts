'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { canTransition } from '@/lib/orders/states'

export async function updateOrderStatus(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) throw new Error('No autorizado')

  const id = String(formData.get('id'))
  const next = String(formData.get('status'))
  const { data: order } = await supabase.from('orders').select('id, status').eq('id', id).single()
  if (!order) throw new Error('Pedido no encontrado')
  if (!canTransition(order.status, next)) throw new Error('Transición inválida')

  await supabase.from('orders').update({ status: next }).eq('id', id)
  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'order.status_change',
    entity: 'order',
    entity_id: id,
    before: { status: order.status },
    after: { status: next },
  })
  revalidatePath('/admin/orders')
}
