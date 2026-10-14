export const ORDER_STATES = [
  'nuevo',
  'confirmado',
  'preparando',
  'listo_para_envio',
  'enviado',
  'entregado',
  'cancelado',
  'reembolsado',
] as const

export type OrderState = (typeof ORDER_STATES)[number]

const TRANSITIONS: Record<OrderState, OrderState[]> = {
  nuevo: ['confirmado', 'cancelado'],
  confirmado: ['preparando', 'cancelado'],
  preparando: ['listo_para_envio', 'cancelado'],
  listo_para_envio: ['enviado', 'cancelado'],
  enviado: ['entregado', 'reembolsado'],
  entregado: ['reembolsado'],
  cancelado: [],
  reembolsado: [],
}

export function canTransition(from: string, to: string): boolean {
  return (TRANSITIONS[from as OrderState] ?? []).includes(to as OrderState)
}

export function allowedTransitions(from: string): OrderState[] {
  return TRANSITIONS[from as OrderState] ?? []
}
