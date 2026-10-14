'use client'

import { UserPreferences } from './context'

// Separate caches for each formatter type to avoid TypeScript union issues
const currencyCache = new Map<string, Intl.NumberFormat>()
const dateCache = new Map<string, Intl.DateTimeFormat>()
const numberCache = new Map<string, Intl.NumberFormat>()

export function getCurrencyFormatter(prefs: UserPreferences): Intl.NumberFormat {
  const key = `currency-${prefs.currency}-${prefs.language}`
  let formatter = currencyCache.get(key)
  
  if (!formatter) {
    formatter = new Intl.NumberFormat(prefs.language, {
      style: 'currency',
      currency: prefs.currency,
      minimumFractionDigits: prefs.currency === 'DOP' ? 0 : 2,
      maximumFractionDigits: prefs.currency === 'DOP' ? 0 : 2,
    })
    currencyCache.set(key, formatter)
  }
  
  return formatter
}

export function formatCurrency(amount: number, prefs: UserPreferences): string {
  return getCurrencyFormatter(prefs).format(amount)
}

export function getDateFormatter(prefs: UserPreferences, options: Intl.DateTimeFormatOptions = {}): Intl.DateTimeFormat {
  const key = `date-${prefs.date_format}-${prefs.language}-${JSON.stringify(options)}`
  let formatter = dateCache.get(key)
  
  if (!formatter) {
    const formatMap: Record<string, Intl.DateTimeFormatOptions> = {
      'DD/MM/YYYY': { day: '2-digit', month: '2-digit', year: 'numeric' },
      'MM/DD/YYYY': { day: '2-digit', month: '2-digit', year: 'numeric' },
      'YYYY-MM-DD': { day: '2-digit', month: '2-digit', year: 'numeric' },
    }
    
    const baseOptions = formatMap[prefs.date_format] || formatMap['DD/MM/YYYY']
    formatter = new Intl.DateTimeFormat(prefs.language, { ...baseOptions, ...options })
    dateCache.set(key, formatter)
  }
  
  return formatter
}

export function formatDate(date: Date | string, prefs: UserPreferences, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return ''
  return getDateFormatter(prefs, options).format(dateObj)
}

export function formatDateTime(date: Date | string, prefs: UserPreferences): string {
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: prefs.time_format === '12h',
  }
  return formatDate(date, prefs, timeOptions)
}

export function formatRelativeTime(date: Date | string, prefs: UserPreferences): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora mismo'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} h`
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
  return formatDate(date, prefs)
}

export function formatNumber(num: number, prefs: UserPreferences): string {
  const key = `number-${prefs.language}`
  let formatter = numberCache.get(key)
  
  if (!formatter) {
    formatter = new Intl.NumberFormat(prefs.language)
    numberCache.set(key, formatter)
  }
  
  return formatter.format(num)
}

// Status labels for orders
export const STATUS_LABELS: Record<string, string> = {
  en_revision: '🟡 En revisión',
  en_busqueda: '🔵 En búsqueda',
  esperando_confirmacion: '🟠 Esperando confirmación',
  aceptada: '🟢 Aceptada',
  precio_confirmado: '💰 Precio confirmado',
  esperando_pago: '💳 Esperando pago',
  pagada: '🔵 Pagada',
  producto_comprado: '🛒 Producto comprado',
  procesando: '📦 Procesando',
  en_transito: '🚚 En tránsito',
  entregada: '✅ Entregada',
  rechazada: '🔴 Rechazada',
  cancelada: '⚫ Cancelada',
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status
}