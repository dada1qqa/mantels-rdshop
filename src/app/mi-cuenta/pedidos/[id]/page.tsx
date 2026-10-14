import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { statusLabel } from '@/lib/requests/statuses'
import { OrderEventTimeline } from '@/components/orders/OrderEventTimeline'
import { Glow } from '@/components/Glow'
import { SiteNav } from '@/components/SiteNav'
import { Footer } from '@/components/Footer'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PedidoDetallePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: request } = await supabase.from('requests').select('*').eq('id', id).single()
  if (!request || request.user_id !== user.id) redirect('/mi-cuenta/pedidos')

  // Obtener eventos del timeline
  const { data: events } = await supabase.rpc('get_request_events', { p_request_id: id })

  // Obtener mensajes
  const { data: messages } = await supabase
    .from('request_messages')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true })

  const s = statusLabel(request.status)
  const isActive = !['entregada', 'rechazada', 'cancelada'].includes(request.status)
  const canAcceptPrice = request.status === 'precio_confirmado' && !request.price_accepted

  return (
    <div className="min-h-[100dvh] bg-base-950 text-base-50 relative">
      <div className="bg-mesh" aria-hidden="true" />
      <Glow />
      <SiteNav />

      <main className="relative mx-auto max-w-4xl px-4 py-10 md:py-16">
        {/* Header */}
        <div className="mb-8 reveal">
          <Link href="/mi-cuenta/pedidos" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver a mis pedidos
          </Link>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-accent-cyan">Pedido #{request.request_code}</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">{request.product_name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBg(request.status)} ${getStatusColor(request.status)} border border-current/20`}>
                {s?.icon} {s?.label ?? request.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Columna principal: Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info del producto */}
            <section className="double-bezel p-5 reveal">
              <div className="double-bezel__inner p-5">
                <div className="flex gap-4">
                  <div className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-base-800">
                    {request.image_url ? (
                      <img src={request.image_url} alt={request.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-base-500 text-3xl">
                        {getTypeIcon(request.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{getTypeIcon(request.type)} {request.type}</p>
                    <h2 className="mt-1 font-semibold text-lg">{request.product_name}</h2>
                    {request.description && <p className="mt-1 text-sm text-zinc-400">{request.description}</p>}
                    {request.quantity && request.quantity > 1 && <p className="mt-1 text-sm text-zinc-500">Cantidad: {request.quantity}</p>}
                    {request.game && <p className="mt-1 text-sm text-zinc-500">Juego: {request.game} · {request.digital_product} · ID: {request.player_id ?? '—'}</p>}
                    {request.external_url && <a href={request.external_url} target="_blank" className="mt-1 inline-block text-sm text-cyan-300 hover:underline">{request.external_url}</a>}
                  </div>
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section className="reveal delay-1">
              <h2 className="text-lg font-semibold mb-4">Seguimiento</h2>
              <OrderEventTimeline 
                events={events ?? []} 
                currentStatus={request.status}
              />
            </section>

            {/* Mensajes */}
            <section className="reveal delay-2">
              <h2 className="text-lg font-semibold mb-4">Mensajes</h2>
              <div className="double-bezel">
                <div className="double-bezel__inner p-5 space-y-4">
                  {(messages ?? []).length === 0 ? (
                    <p className="text-zinc-500 text-center py-4">No hay mensajes aún</p>
                  ) : (
                    <>
                      {(messages ?? []).map((m) => (
                        <div key={m.id} className={`rounded-xl p-4 ${m.sender_role === 'admin' ? 'bg-cyan-500/10 ring-1 ring-cyan-500/20' : 'bg-white/5 ring-1 ring-white/10'}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-zinc-500">
                              {m.sender_role === 'admin' ? 'MantelsioRDshop' : 'Tú'} · {formatDateTime(m.created_at)}
                            </p>
                            {m.is_internal && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">Interno</span>}
                          </div>
                          <p className="mt-2">{m.body}</p>
                        </div>
                      ))}
                      <MessageForm requestId={id} />
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar: Detalles y acciones */}
          <div className="space-y-6">
            {/* Precios */}
            <section className="double-bezel p-5 reveal">
              <div className="double-bezel__inner p-5">
                <h2 className="font-semibold mb-4">Precios</h2>
                <div className="space-y-3 text-sm">
                  <PriceRow label="Precio estimado" value={request.estimated_price} />
                  <PriceRow label="Precio máximo" value={request.maximum_price} />
                  <PriceRow label="Precio confirmado" value={request.confirmed_price} highlight />
                  <PriceRow label="Precio producto" value={request.product_price} />
                  <PriceRow label="Envío" value={request.shipping_cost} />
                  <PriceRow label="Impuestos" value={request.taxes} />
                  <PriceRow label="Comisión" value={request.commission} />
                  <div className="border-t border-base-800 pt-2">
                    <PriceRow label="Total" value={request.total_price} highlight large />
                  </div>
                </div>
              </div>
            </section>

            {/* Información de entrega */}
            {(request.estimated_delivery_date || request.estimated_delivery_end_date || request.tracking_number) && (
              <section className="double-bezel p-5 reveal">
                <div className="double-bezel__inner p-5">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M16 22v-4M8 2v4M8 22v-4M3 10h4M21 10h-4" />
                    </svg>
                    Entrega
                  </h2>
                  <div className="space-y-3 text-sm">
                    {request.estimated_delivery_date && (
                      <InfoRow 
                        label="Entrega estimada" 
                        value={request.estimated_delivery_end_date && request.estimated_delivery_date !== request.estimated_delivery_end_date
                          ? `${formatDate(request.estimated_delivery_date)} – ${formatDate(request.estimated_delivery_end_date)}`
                          : formatDate(request.estimated_delivery_date)}
                        badge={request.delivery_tolerance_days ? `±${request.delivery_tolerance_days}d` : (request.estimated_delivery_end_date && request.estimated_delivery_date !== request.estimated_delivery_end_date ? 'Rango' : null)}
                      />
                    )}
                    {request.tracking_number && (
                      <InfoRow label="Tracking" value={request.tracking_number} />
                    )}
                    {request.tracking_url && (
                      <div>
                        <span className="text-zinc-500">Tracking URL</span>
                        <a href={request.tracking_url} target="_blank" className="mt-1 block text-sm text-cyan-300 hover:underline break-all">{request.tracking_url}</a>
                      </div>
                    )}
                    {request.shipped_at && (
                      <InfoRow label="Enviado el" value={formatDateTime(request.shipped_at)} />
                    )}
                    {request.delivered_at && (
                      <InfoRow label="Entregado el" value={formatDateTime(request.delivered_at)} highlight />
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Cliente */}
            <section className="double-bezel p-5 reveal">
              <div className="double-bezel__inner p-5">
                <h2 className="font-semibold mb-4">Tu información</h2>
                <div className="space-y-2 text-sm">
                  <InfoRow label="Nombre" value={request.customer_name} />
                  <InfoRow label="WhatsApp" value={request.customer_phone} />
                  {request.delivery_information && <InfoRow label="Dirección" value={request.delivery_information} />}
                  {request.payment_method && <InfoRow label="Pago" value={request.payment_method} />}
                </div>
              </div>
            </section>

            {/* Acciones según estado */}
            {isActive && (
              <section className="double-bezel p-5 reveal">
                <div className="double-bezel__inner p-5">
                  <h2 className="font-semibold mb-4">Acciones</h2>
                  <div className="space-y-2">
                    {canAcceptPrice && (
                      <AcceptPriceForm requestId={id} requestCode={request.request_code} phone={request.customer_phone} />
                    )}
                    {request.status === 'esperando_pago' && (
                      <a href={`/checkout?request=${request.request_code}`} className="btn-magnetic w-full justify-center">
                        <span>Realizar pago</span>
                        <span className="btn-magnetic__icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </span>
                      </a>
                    )}
                    {['en_transito', 'procesando', 'producto_comprado'].includes(request.status) && request.tracking_url && (
                      <a href={request.tracking_url} target="_blank" className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/10">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                        </svg>
                        Ver seguimiento
                      </a>
                    )}
                    {request.status === 'entregada' && (
                      <Link href="/solicitar" className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/10">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Volver a solicitar
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function PriceRow({ label, value, highlight, large }: { label: string; value: number | null; highlight?: boolean; large?: boolean }) {
  if (value === null || value === undefined) return null
  return (
    <div className={`flex justify-between ${highlight ? 'text-base-100' : 'text-zinc-300'} ${large ? 'text-lg font-semibold' : 'text-sm'}`}>
      <span>{label}</span>
      <span className="font-medium">RD${Number(value).toLocaleString('es-DO')}</span>
    </div>
  )
}

function InfoRow({ label, value, badge, highlight }: { label: string; value: string; badge?: string | null; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-zinc-500">{label}</span>
      <div className="flex items-center gap-2 text-right">
        <span className={highlight ? 'font-semibold text-base-100' : 'text-zinc-300'}>{value}</span>
        {badge && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">{badge}</span>}
      </div>
    </div>
  )
}

function MessageForm({ requestId }: { requestId: string }) {
  return (
    <form className="space-y-2" action={`/api/requests/${requestId}/messages`} method="POST">
      <textarea name="body" placeholder="Escribe un mensaje…" rows={3} className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50" required />
      <button type="submit" className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 py-2.5 text-sm font-semibold text-white">Enviar mensaje</button>
    </form>
  )
}

function AcceptPriceForm({ requestId, requestCode, phone }: { requestId: string; requestCode: string; phone: string }) {
  return (
    <form action={`/api/requests/x/accept?code=${encodeURIComponent(requestCode)}&phone=${encodeURIComponent(phone)}`} method="POST">
      <button type="submit" className="w-full rounded-full bg-gradient-to-r from-emerald-600 to-cyan-600 py-2.5 text-sm font-semibold text-white">Aceptar precio</button>
    </form>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getStatusBg(status: string): string {
  const bg: Record<string, string> = {
    en_revision: 'bg-amber-500/10', en_busqueda: 'bg-blue-500/10',
    esperando_confirmacion: 'bg-orange-500/10', aceptada: 'bg-emerald-500/10',
    precio_confirmado: 'bg-cyan-500/10', esperando_pago: 'bg-fuchsia-500/10',
    pagada: 'bg-blue-500/10', producto_comprado: 'bg-cyan-500/10',
    procesando: 'bg-amber-500/10', en_transito: 'bg-cyan-500/10',
    entregada: 'bg-purple-500/10', rechazada: 'bg-red-500/10',
    cancelada: 'bg-zinc-500/10',
  }
  return bg[status] || 'bg-zinc-500/10'
}

function getStatusColor(status: string): string {
  const color: Record<string, string> = {
    en_revision: 'text-amber-400', en_busqueda: 'text-blue-400',
    esperando_confirmacion: 'text-orange-400', aceptada: 'text-emerald-400',
    precio_confirmado: 'text-cyan-400', esperando_pago: 'text-fuchsia-400',
    pagada: 'text-blue-400', producto_comprado: 'text-cyan-400',
    procesando: 'text-amber-400', en_transito: 'text-cyan-400',
    entregada: 'text-purple-400', rechazada: 'text-red-400',
    cancelada: 'text-zinc-400',
  }
  return color[status] || 'text-zinc-400'
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = { product: '🛍️', digital: '🎮', external: '🌐', other: '✨' }
  return icons[type] || '📦'
}