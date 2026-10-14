'use client'

import Link from 'next/link'
import Image from 'next/image'

interface OrderCardProps {
  id: string
  request_code: string
  type: string
  product_name: string
  description: string | null
  image_url: string | null
  status: string
  total_price: number | null
  maximum_price: number | null
  confirmed_price: number | null
  created_at: string
  estimated_delivery_date: string | null
  estimated_delivery_end_date: string | null
  delivery_tolerance_days: number | null
  next_event?: {
    title: string
    event_date: string
    event_type: string
    is_estimated: boolean
    is_range: boolean
  } | null
  progress: number
  onClick?: () => void
  className?: string
}

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  en_revision: { label: 'En revisión', icon: '🟡', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  en_busqueda: { label: 'En búsqueda', icon: '🔵', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  esperando_confirmacion: { label: 'Esperando confirmación', icon: '🟠', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  aceptada: { label: 'Aceptada', icon: '🟢', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  precio_confirmado: { label: 'Precio confirmado', icon: '💰', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  esperando_pago: { label: 'Esperando pago', icon: '💳', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
  pagada: { label: 'Pagada', icon: '🔵', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  producto_comprado: { label: 'Producto comprado', icon: '🛒', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  procesando: { label: 'Procesando', icon: '📦', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  en_transito: { label: 'En tránsito', icon: '🚚', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  entregada: { label: 'Entregada', icon: '🟣', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  rechazada: { label: 'Rechazada', icon: '🔴', color: 'text-red-400', bg: 'bg-red-500/10' },
  cancelada: { label: 'Cancelada', icon: '⚫', color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
}

const TYPE_ICONS: Record<string, string> = {
  product: '🛍️',
  digital: '🎮',
  external: '🌐',
  other: '✨',
}

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '—'
  return `RD$${Number(price).toLocaleString('es-DO')}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateRange(start: string | null, end: string | null, tolerance: number | null): string {
  if (!start) return 'Sin fecha estimada'
  const startDate = new Date(start + 'T00:00:00')
  if (!end || start === end) {
    let str = startDate.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })
    if (tolerance) str += ` ±${tolerance}d`
    return str
  }
  const endDate = new Date(end + 'T00:00:00')
  return `${startDate.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })} – ${endDate.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}`
}

export function OrderCard({ 
  id, request_code, type, product_name, description, image_url, status, 
  total_price, maximum_price, confirmed_price, created_at,
  estimated_delivery_date, estimated_delivery_end_date, delivery_tolerance_days,
  next_event, progress = 0, onClick, className = ''
}: OrderCardProps) {
  const statusConfig = STATUS_CONFIG[status] || { label: status, icon: '❓', color: 'text-zinc-400', bg: 'bg-zinc-500/10' }
  const typeIcon = TYPE_ICONS[type] || '📦'
  const isActive = !['entregada', 'rechazada', 'cancelada'].includes(status)
  const isCompleted = status === 'entregada'

  return (
    <Link 
      href={`/mi-cuenta/pedidos/${id}`} 
      onClick={(e) => { if (onClick) { e.preventDefault(); onClick(); } }}
      className={`group block double-bezel transition-all duration-300 ${isCompleted ? 'opacity-70' : ''} ${className}`}
      aria-label={`Ver pedido ${request_code}: ${product_name}`}
    >
      <div className="double-bezel__inner p-4">
        <div className="flex gap-4">
          {/* Imagen del producto */}
          <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-base-800">
            {image_url ? (
              <Image
                src={image_url}
                alt={product_name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-base-500 text-2xl">
                {typeIcon}
              </div>
            )}
          </div>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">{typeIcon} {type}</p>
                <h3 className="mt-0.5 font-semibold text-base truncate group-hover:text-fuchsia-400 transition-colors">{product_name}</h3>
                {description && <p className="mt-1 text-sm text-zinc-500 truncate">{description}</p>}
              </div>
              <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium ${statusConfig.bg} ${statusConfig.color} border border-current/20`}>
                {statusConfig.icon} {statusConfig.label}
              </span>
            </div>

            {/* Precio y fecha */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="font-semibold text-cyan-300">{formatPrice(total_price ?? confirmed_price ?? maximum_price)}</span>
              <span className="text-zinc-500 flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M16 22v-4M8 2v4M8 22v-4M3 10h4M21 10h-4" />
                </svg>
                {formatDate(created_at)}
              </span>
            </div>

            {/* Próxima actividad / Entrega estimada */}
            {(next_event || estimated_delivery_date) && (
              <div className="mt-3 pt-3 border-t border-base-800">
                {next_event ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                      PRÓXIMO
                    </span>
                    <span className="font-medium text-zinc-300">{next_event.title}</span>
                    <span className="text-zinc-500">
                      {next_event.is_range ? 'entre el ' : 'el '}
                      {formatDateRange(next_event.event_date, next_event.is_range ? next_event.event_date : null, null)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      ENTREGA
                    </span>
                    <span className="font-medium text-zinc-300">Estimada</span>
                    <span className="text-zinc-500">{formatDateRange(estimated_delivery_date, estimated_delivery_end_date, delivery_tolerance_days)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Barra de progreso */}
            <div className="mt-3 h-1.5 bg-base-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}