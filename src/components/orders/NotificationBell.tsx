'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  action_url: string | null
  created_at: string
  request_id: string | null
  metadata: Record<string, unknown>
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error && data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read).length)
      }
    } catch (e) {
      console.error('Error fetching notifications:', e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    // Initial fetch - runs once on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications()
    // Poll each 30 segundos
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  async function markAsRead(ids: string[]) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .in('id', ids)

      if (!error) {
        setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - ids.length))
      }
    } catch (e) {
      console.error('Error marking as read:', e)
    }
  }

  async function markAllAsRead() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false)

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (e) {
      console.error('Error marking all as read:', e)
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      markAsRead([notification.id])
    }
    if (notification.action_url) {
      router.push(notification.action_url)
    }
    setOpen(false)
  }

  if (loading) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-white/10 transition"
        aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
        aria-expanded={open}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-300">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 rounded-2xl bg-base-900 shadow-[0_16px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-xl overflow-hidden z-50 animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="font-semibold">Notificaciones</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-cyan-300 hover:text-cyan-400"
                >
                  Marcar todo como leído
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/10" aria-label="Cerrar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <svg className="mx-auto h-10 w-10 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map(notification => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full p-4 text-left transition ${!notification.read ? 'bg-white/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-medium ${!notification.read ? 'text-zinc-100' : 'text-zinc-300'}`}>
                            {notification.title}
                          </p>
                          <span className="flex-shrink-0 text-[10px] text-zinc-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{notification.body}</p>
                        {!notification.read && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            No leída
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function getNotificationColor(type: string): string {
  const colors: Record<string, string> = {
    request_received: 'bg-amber-500/20 text-amber-400',
    request_accepted: 'bg-emerald-500/20 text-emerald-400',
    price_confirmed: 'bg-cyan-500/20 text-cyan-400',
    payment_requested: 'bg-fuchsia-500/20 text-fuchsia-400',
    payment_received: 'bg-emerald-500/20 text-emerald-400',
    purchase_made: 'bg-cyan-500/20 text-cyan-400',
    preparing: 'bg-amber-500/20 text-amber-400',
    shipped: 'bg-cyan-500/20 text-cyan-400',
    estimated_arrival: 'bg-fuchsia-500/20 text-fuchsia-400',
    delivery_scheduled: 'bg-cyan-500/20 text-cyan-400',
    delivered: 'bg-emerald-500/20 text-emerald-400',
    date_changed: 'bg-amber-500/20 text-amber-400',
    cancelled: 'bg-zinc-500/20 text-zinc-400',
    rejected: 'bg-red-500/20 text-red-400',
    digital_delivery: 'bg-emerald-500/20 text-emerald-400',
    message: 'bg-blue-500/20 text-blue-400',
    default: 'bg-zinc-500/20 text-zinc-400',
  }
  return colors[type] || colors.default
}

function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    request_received: '📝',
    request_accepted: '✅',
    price_confirmed: '💰',
    payment_requested: '💳',
    payment_received: '💳',
    purchase_made: '🛒',
    preparing: '📦',
    shipped: '🚚',
    estimated_arrival: '📍',
    delivery_scheduled: '📅',
    delivered: '✅',
    date_changed: '🔄',
    cancelled: '⚫',
    rejected: '🔴',
    digital_delivery: '🎮',
    message: '💬',
  }
  return icons[type] || '🔔'
}