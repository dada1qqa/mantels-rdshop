export const REQUEST_STATES = [
  'en_revision',
  'en_busqueda',
  'esperando_confirmacion',
  'aceptada',
  'precio_confirmado',
  'esperando_pago',
  'pagada',
  'producto_comprado',
  'procesando',
  'en_transito',
  'entregada',
  'rechazada',
  'cancelada',
] as const

export type RequestState = (typeof REQUEST_STATES)[number]

export const STATE_META: Record<RequestState, { label: string; icon: string }> = {
  en_revision: { label: 'En revisión', icon: '🟡' },
  en_busqueda: { label: 'En búsqueda', icon: '🔵' },
  esperando_confirmacion: { label: 'Esperando confirmación', icon: '🟠' },
  aceptada: { label: 'Aceptada', icon: '🟢' },
  precio_confirmado: { label: 'Precio confirmado', icon: '💰' },
  esperando_pago: { label: 'Esperando pago', icon: '💳' },
  pagada: { label: 'Pagada', icon: '🔵' },
  producto_comprado: { label: 'Producto comprado', icon: '🛒' },
  procesando: { label: 'Procesando', icon: '📦' },
  en_transito: { label: 'En tránsito', icon: '🚚' },
  entregada: { label: 'Entregada', icon: '🟣' },
  rechazada: { label: 'Rechazada', icon: '🔴' },
  cancelada: { label: 'Cancelada', icon: '⚫' },
}

const TRANSITIONS: Record<RequestState, RequestState[]> = {
  en_revision: ['en_busqueda', 'aceptada', 'rechazada', 'cancelada'],
  en_busqueda: ['esperando_confirmacion', 'aceptada', 'rechazada', 'cancelada'],
  esperando_confirmacion: ['aceptada', 'rechazada', 'cancelada'],
  aceptada: ['precio_confirmado', 'esperando_pago', 'cancelada'],
  precio_confirmado: ['esperando_pago', 'cancelada'],
  esperando_pago: ['pagada', 'cancelada'],
  pagada: ['producto_comprado', 'procesando', 'cancelada'],
  producto_comprado: ['procesando', 'en_transito', 'cancelada'],
  procesando: ['en_transito', 'entregada', 'cancelada'],
  en_transito: ['entregada', 'cancelada'],
  entregada: [],
  rechazada: [],
  cancelada: [],
}

export function canTransition(from: string, to: string): boolean {
  return (TRANSITIONS[from as RequestState] ?? []).includes(to as RequestState)
}

export function allowedTransitions(from: string): RequestState[] {
  return TRANSITIONS[from as RequestState] ?? []
}
