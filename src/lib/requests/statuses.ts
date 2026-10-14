export const REQUEST_STATUSES = [
  { value: 'en_revision', label: 'En revisión', icon: '🟡' },
  { value: 'en_busqueda', label: 'En búsqueda', icon: '🔵' },
  { value: 'esperando_confirmacion', label: 'Esperando confirmación', icon: '🟠' },
  { value: 'aceptada', label: 'Aceptada', icon: '🟢' },
  { value: 'precio_confirmado', label: 'Precio confirmado', icon: '💰' },
  { value: 'esperando_pago', label: 'Esperando pago', icon: '💳' },
  { value: 'pagada', label: 'Pagada', icon: '🔵' },
  { value: 'producto_comprado', label: 'Producto comprado', icon: '🛒' },
  { value: 'procesando', label: 'Procesando', icon: '📦' },
  { value: 'en_transito', label: 'En tránsito', icon: '🚚' },
  { value: 'entregada', label: 'Entregada', icon: '🟣' },
  { value: 'rechazada', label: 'Rechazada', icon: '🔴' },
  { value: 'cancelada', label: 'Cancelada', icon: '⚫' },
] as const

export function statusLabel(v: string) {
  return REQUEST_STATUSES.find((s) => s.value === v)
}
