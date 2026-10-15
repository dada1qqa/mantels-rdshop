'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    currency: string
    date_format: string
    time_format: string
  }
  email_notifications: {
    order_updates: boolean
    payment_reminders: boolean
    delivery_updates: boolean
    promotions: boolean
    newsletter: boolean
    security_alerts: boolean
  }
  privacy_settings: {
    profile_visibility: 'public' | 'private' | 'friends'
    show_order_history: boolean
    analytics_consent: boolean
    marketing_consent: boolean
  }
}

type SavePreferencesFn = (prefs: Partial<UserProfile['preferences']>) => Promise<void>
type SaveNotificationsFn = (notifs: Partial<UserProfile['email_notifications']>) => Promise<void>
type SavePrivacyFn = (privacy: Partial<UserProfile['privacy_settings']>) => Promise<void>
type SaveProfileFn = (data: Partial<UserProfile>) => Promise<void>
type UploadAvatarFn = (file: File) => Promise<void>

interface SettingsClientProps {
  initialProfile: UserProfile
  userId: string
}

export function SettingsClient({ initialProfile, userId }: SettingsClientProps) {
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile>(initialProfile)
  const [activeTab, setActiveTab] = useState<'perfil' | 'preferencias' | 'notificaciones' | 'privacidad' | 'seguridad' | 'peligro'>('perfil')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    if (typeof window === 'undefined') return
    try { window.localStorage.setItem('mantels-theme', theme) } catch { }
    const resolved: 'light' | 'dark' = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
  }

  const handleSavePreferences = async (prefs: Partial<UserProfile['preferences']>) => {
    setLoading(true)
    try {
      if (prefs.theme) applyTheme(prefs.theme)
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: { ...profile.preferences, ...prefs } })
        .eq('id', userId)
      if (error) throw error
      setProfile(prev => ({ ...prev, preferences: { ...prev.preferences, ...prefs } }))
      showMessage('success', 'Preferencias guardadas')
    } catch (err) {
      console.error(err)
      showMessage('error', 'Error al guardar preferencias')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotifications = async (notifs: Partial<UserProfile['email_notifications']>) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email_notifications: { ...profile.email_notifications, ...notifs } })
        .eq('id', userId)
      if (error) throw error
      setProfile(prev => ({ ...prev, email_notifications: { ...prev.email_notifications, ...notifs } }))
      showMessage('success', 'Notificaciones guardadas')
    } catch (err) {
      console.error(err)
      showMessage('error', 'Error al guardar notificaciones')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePrivacy = async (privacy: Partial<UserProfile['privacy_settings']>) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ privacy_settings: { ...profile.privacy_settings, ...privacy } })
        .eq('id', userId)
      if (error) throw error
      setProfile(prev => ({ ...prev, privacy_settings: { ...prev.privacy_settings, ...privacy } }))
      showMessage('success', 'Privacidad guardada')
    } catch (err) {
      console.error(err)
      showMessage('error', 'Error al guardar privacidad')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (data: Partial<UserProfile>) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)
      if (error) throw error
      setProfile(prev => ({ ...prev, ...data }))
      showMessage('success', 'Perfil guardado')
    } catch (err) {
      console.error(err)
      showMessage('error', 'Error al guardar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    setLoading(true)
    try {
      console.log('[Avatar] Upload attempted for:', file.name, file.size, 'bytes')
      showMessage('error', 'Subida de avatar requiere configurar bucket de Storage')
    } catch (err) {
      console.error(err)
      showMessage('error', 'Error al subir avatar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-slide-down ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
          {message.type === 'success' ? (
            <>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </>
          )}
        </svg>
        <span className="text-sm">{message.text}</span>
      </div>
      )}

      <div className="double-bezel p-1">
        <div className="double-bezel__inner p-1 flex gap-1 overflow-x-auto">
          {[
            { id: 'perfil', label: '👤 Perfil' },
            { id: 'preferencias', label: '⚙️ Preferencias' },
            { id: 'notificaciones', label: '🔔 Notificaciones' },
            { id: 'privacidad', label: '🔒 Privacidad' },
            { id: 'seguridad', label: '🛡️ Seguridad' },
            { id: 'peligro', label: '⚠️ Peligro' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-base-950 shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="double-bezel p-6 animate-fade-in">
        <div className="double-bezel__inner p-6">
          {activeTab === 'perfil' && <PerfilTab profile={profile} onSave={handleSaveProfile} onAvatarUpload={handleAvatarUpload} loading={loading} />}
          {activeTab === 'preferencias' && <PreferenciasTab profile={profile} onSave={handleSavePreferences} />}
          {activeTab === 'notificaciones' && <NotificacionesTab profile={profile} onSave={handleSaveNotifications} />}
          {activeTab === 'privacidad' && <PrivacidadTab profile={profile} onSave={handleSavePrivacy} />}
          {activeTab === 'seguridad' && <SeguridadTab />}
          {activeTab === 'peligro' && <PeligroTab />}
        </div>
      </div>
    </div>
  )
}

function PerfilTab({ profile, onSave, onAvatarUpload, loading }: { profile: UserProfile; onSave: SaveProfileFn; onAvatarUpload: UploadAvatarFn; loading: boolean }) {
  const [name, setName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [address, setAddress] = useState(profile?.address || '')
  const [city, setCity] = useState(profile?.city || '')
  const [country, setCountry] = useState(profile?.country || 'República Dominicana')

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-6">
        <div className="relative">
          <Image
            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || '')}&background=1a1a2e&color=fuchsia&size=128`}
            alt="Avatar"
            width={96}
            height={96}
            className="w-24 h-24 rounded-2xl ring-2 ring-white/10"
            unoptimized
          />
          <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 flex items-center justify-center cursor-pointer hover:opacity-90 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-base-950">
              <path d="M11 4a2 2 0 1 1 4 0v1a1 1 0 0 0 1 1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-1a2 2 0 1 0-4 0v3a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1z" />
            </svg>
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files?.[0] && onAvatarUpload(e.target.files[0])} />
          </label>
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Nombre completo</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl bg-white/5 px-4 py-3 text-base ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50" placeholder="Tu nombre" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Email</label>
            <input type="email" value={''} disabled className="w-full rounded-xl bg-white/5 px-4 py-3 text-base ring-1 ring-white/10 text-zinc-500" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Teléfono</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-xl bg-white/5 px-4 py-3 text-base ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50" placeholder="+1 809 555 0123" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Ciudad</label>
          <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full rounded-xl bg-white/5 px-4 py-3 text-base ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50" placeholder="Santo Domingo" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1">Dirección completa</label>
        <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} className="w-full rounded-xl bg-white/5 px-4 py-3 text-base ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50 resize-none" placeholder="Calle, número, sector, referencia..." />
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1">País</label>
        <select value={country} onChange={e => setCountry(e.target.value)} className="w-full rounded-xl bg-white/5 px-4 py-3 text-base ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50">
          <option value="República Dominicana">🇩🇴 República Dominicana</option>
          <option value="Estados Unidos">🇺🇸 Estados Unidos</option>
          <option value="España">🇪🇸 España</option>
          <option value="México">🇲🇽 México</option>
          <option value="Colombia">🇨🇴 Colombia</option>
          <option value="Otros">🌍 Otros</option>
        </select>
      </div>

      <div className="pt-4 border-t border-white/10 flex justify-end">
        <button onClick={() => onSave({ full_name: name, phone, address, city, country })} disabled={loading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-base-950 font-medium hover:opacity-90 transition disabled:opacity-50">
          {loading ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>
    </div>
  )
}

function PreferenciasTab({ profile, onSave }: { profile: UserProfile; onSave: SavePreferencesFn }) {
  const [prefs, setPrefs] = useState(profile?.preferences || { theme: 'system', language: 'es-DO', currency: 'DOP', date_format: 'DD/MM/YYYY', time_format: '24h' })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try { await onSave(prefs) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="double-bezel p-6">
        <div className="double-bezel__inner p-6 space-y-6">
          <h3 className="text-lg font-semibold">Apariencia</h3>
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Tema</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light' as const, label: '☀️ Claro', desc: 'Siempre claro' },
                { value: 'dark' as const, label: '🌙 Oscuro', desc: 'Siempre oscuro' },
                { value: 'system' as const, label: '💻 Sistema', desc: 'Según tu SO' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setPrefs((prev: typeof prefs) => ({ ...prev, theme: opt.value }))} className={`p-4 rounded-xl border-2 text-left transition ${prefs.theme === opt.value ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-white/10 hover:border-fuchsia-500/50'}`}>
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-zinc-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Idioma</label>
              <select value={prefs.language} onChange={e => setPrefs((prev: typeof prefs) => ({ ...prev, language: e.target.value }))} className="w-full rounded-xl bg-white/5 px-4 py-3 text-base ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50">
                <option value="es-DO">🇩🇴 Español (RD)</option>
                <option value="es-ES">🇪🇸 Español (España)</option>
                <option value="en-US">🇺🇸 English (US)</option>
                <option value="en-GB">🇬🇧 English (UK)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Moneda</label>
              <select value={prefs.currency} onChange={e => setPrefs((prev: typeof prefs) => ({ ...prev, currency: e.target.value }))} className="w-full rounded-xl bg-white/5 px-4 py-3 text-base ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50">
                <option value="DOP">🇩🇴 DOP - Peso Dominicano</option>
                <option value="USD">🇺🇸 USD - Dólar Americano</option>
                <option value="EUR">🇪🇺 EUR - Euro</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Formato de fecha</label>
              <select value={prefs.date_format} onChange={e => setPrefs((prev: typeof prefs) => ({ ...prev, date_format: e.target.value }))} className="w-full rounded-xl bg-white/5 px-4 py-3 text-base ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50">
                <option value="DD/MM/YYYY">31/12/2024</option>
                <option value="MM/DD/YYYY">12/31/2024</option>
                <option value="YYYY-MM-DD">2024-12-31</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Formato de hora</label>
              <select value={prefs.time_format} onChange={e => setPrefs((prev: typeof prefs) => ({ ...prev, time_format: e.target.value }))} className="w-full rounded-xl bg-white/5 px-4 py-3 text-base ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50">
                <option value="24h">23:59</option>
                <option value="12h">11:59 PM</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={loading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-base-950 font-medium hover:opacity-90 transition disabled:opacity-50">
          {loading ? 'Guardando...' : 'Guardar preferencias'}
        </button>
      </div>
    </div>
  )
}

function NotificacionesTab({ profile, onSave }: { profile: UserProfile; onSave: SaveNotificationsFn }) {
  const [notifs, setNotifs] = useState(profile?.email_notifications || { order_updates: true, payment_reminders: true, delivery_updates: true, promotions: false, newsletter: false, security_alerts: true })
  const [loading, setLoading] = useState(false)

  const notifications = [
    { key: 'order_updates', label: 'Actualizaciones de pedidos', desc: 'Cambios de estado, confirmaciones, envíos', icon: '📦' },
    { key: 'payment_reminders', label: 'Recordatorios de pago', desc: 'Pagos pendientes, vencimientos', icon: '💳' },
    { key: 'delivery_updates', label: 'Actualizaciones de entrega', desc: 'En tránsito, llegada, entregado', icon: '🚚' },
    { key: 'promotions', label: 'Promociones y ofertas', desc: 'Descuentos, códigos, ventas flash', icon: '🏷️' },
    { key: 'newsletter', label: 'Newsletter semanal', desc: 'Novedades, consejos, destacados', icon: '📰' },
    { key: 'security_alerts', label: 'Alertas de seguridad', desc: 'Intentos de login, cambios de contraseña', icon: '🛡️' },
  ] as const

  const handleSave = async () => {
    setLoading(true)
    try { await onSave(notifs) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="double-bezel p-6">
        <div className="double-bezel__inner p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Notificaciones por email</h3>
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input type="checkbox" checked={Object.values(notifs).every(v => v)} onChange={e => { const val = e.target.checked; setNotifs((prev: typeof notifs) => Object.fromEntries(Object.keys(prev).map(key => [key, val])) as typeof notifs) }} className="rounded border-white/20 text-fuchsia-500 focus:ring-fuchsia-500" />
              <span>Todas</span>
            </label>
          </div>

          <div className="space-y-3">
            {notifications.map(n => (
              <label key={n.key} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer">
                <span className="text-2xl">{n.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{n.label}</div>
                  <div className="text-xs text-zinc-500">{n.desc}</div>
                </div>
                <input type="checkbox" checked={notifs[n.key as keyof typeof notifs]} onChange={e => setNotifs((prev: typeof notifs) => ({ ...prev, [n.key]: e.target.checked }))} className="w-5 h-5 rounded border-white/20 text-fuchsia-500 focus:ring-fuchsia-500" />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={loading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-base-950 font-medium hover:opacity-90 transition disabled:opacity-50">
          {loading ? 'Guardando...' : 'Guardar notificaciones'}
        </button>
      </div>
    </div>
  )
}

function PrivacidadTab({ profile, onSave }: { profile: UserProfile; onSave: SavePrivacyFn }) {
  const [privacy, setPrivacy] = useState(profile?.privacy_settings || { profile_visibility: 'private', show_order_history: false, analytics_consent: true, marketing_consent: false })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => { setLoading(true); try { await onSave(privacy) } finally { setLoading(false) } }

  const visibilityOptions = [
    { value: 'private' as const, label: '🔒 Privado', desc: 'Solo tú ves tu perfil y actividad' },
    { value: 'friends' as const, label: '👥 Solo contactos', desc: 'Tus contactos y tú ven tu perfil' },
    { value: 'public' as const, label: '🌐 Público', desc: 'Cualquiera puede ver tu perfil' },
  ]

  return (
    <div className="space-y-6 max-w-xl">
      <div className="double-bezel p-6">
        <div className="double-bezel__inner p-6 space-y-6">
          <h3 className="text-lg font-semibold">Visibilidad del perfil</h3>
          <div className="space-y-3">
            {visibilityOptions.map(opt => (
              <label key={opt.value} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer">
                <input type="radio" name="profile_visibility" checked={privacy.profile_visibility === opt.value} onChange={() => setPrivacy((prev: typeof privacy) => ({ ...prev, profile_visibility: opt.value }))} className="w-5 h-5 text-fuchsia-500 focus:ring-fuchsia-500" />
                <div className="flex-1">
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-zinc-500">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="border-t border-white/10 pt-6 space-y-4">
            <h3 className="text-lg font-semibold">Datos y actividad</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer">
                <input type="checkbox" checked={privacy.show_order_history} onChange={e => setPrivacy((prev: typeof privacy) => ({ ...prev, show_order_history: e.target.checked }))} className="w-5 h-5 rounded border-white/20 text-fuchsia-500 focus:ring-fuchsia-500" />
                <div className="flex-1">
                  <div className="font-medium">Mostrar historial de pedidos</div>
                  <div className="text-xs text-zinc-500">Permite que otros vean tu historial de compras</div>
                </div>
              </label>

              <label className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer">
                <input type="checkbox" checked={privacy.analytics_consent} onChange={e => setPrivacy((prev: typeof privacy) => ({ ...prev, analytics_consent: e.target.checked }))} className="w-5 h-5 rounded border-white/20 text-fuchsia-500 focus:ring-fuchsia-500" />
                <div className="flex-1">
                  <div className="font-medium">Consentimiento de analytics</div>
                  <div className="text-xs text-zinc-500">Permite recopilación de datos anónimos para mejorar el servicio</div>
                </div>
              </label>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold mb-4">Comunicaciones de marketing</h3>
            <label className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer">
              <input type="checkbox" checked={privacy.marketing_consent || false} onChange={e => setPrivacy((prev: typeof privacy) => ({ ...prev, marketing_consent: e.target.checked }))} className="w-5 h-5 rounded border-white/20 text-fuchsia-500 focus:ring-fuchsia-500" />
              <div className="flex-1">
                <div className="font-medium">Recibir comunicaciones comerciales</div>
                <div className="text-xs text-zinc-500">Acepto recibir ofertas, novedades y promociones por email</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={loading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-base-950 font-medium hover:opacity-90 transition disabled:opacity-50">
          {loading ? 'Guardando...' : 'Guardar privacidad'}
        </button>
      </div>
    </div>
  )
}

function SeguridadTab() {
  const [loading, setLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { alert('Las contraseñas no coinciden'); return }
    if (newPassword.length < 8) { alert('La contraseña debe tener al menos 8 caracteres'); return }
    setLoading(true)
    try { alert('Función de cambio de contraseña requiere implementar con Supabase Auth') } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="double-bezel p-6">
        <div className="double-bezel__inner p-6 space-y-6">
          <h3 className="text-lg font-semibold">Cambiar contraseña</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Contraseña actual</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full rounded-xl bg-white/5 px-4 py-3 text-base ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Nueva contraseña</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded-xl bg-white/5 px-4 py-3 text-base ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50" minLength={8} />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Confirmar nueva contraseña</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full rounded-xl bg-white/5 px-4 py-3 text-base ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/50" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleChangePassword} disabled={loading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-base-950 font-medium hover:opacity-90 transition disabled:opacity-50">
          {loading ? 'Actualizando...' : 'Cambiar contraseña'}
        </button>
      </div>
    </div>
  )
}

function PeligroTab() {
  const [loading, setLoading] = useState(false)

  const handleExportData = async () => { setLoading(true); try { alert('Exportar datos requiere implementar endpoint de exportación') } finally { setLoading(false) } }
  const handleDeleteAccount = async () => { if (!confirm('¿Estás SEGURO? Esta acción NO se puede deshacer. Se eliminarán todos tus datos permanentemente.')) return; if (!confirm('Última confirmación: Tu cuenta y todos tus pedidos serán eliminados para siempre.')) return; setLoading(true); try { alert('Eliminar cuenta requiere implementar con Supabase Auth Admin API') } finally { setLoading(false) } }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="double-bezel p-6 border border-red-500/20">
        <div className="double-bezel__inner p-6 space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-300">Zona de peligro</h3>
              <p className="text-sm text-zinc-400">Estas acciones son irreversibles. Úsalas con precaución.</p>
            </div>
          </div>

          <div className="space-y-4">
            <button onClick={handleExportData} disabled={loading} className="w-full px-4 py-3 rounded-xl bg-white/5 ring-1 ring-white/10 text-zinc-300 hover:bg-white/10 hover:text-zinc-100 transition disabled:opacity-50 flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              <span>Exportar mis datos (JSON)</span>
            </button>

            <button onClick={handleDeleteAccount} disabled={loading} className="w-full px-4 py-3 rounded-xl bg-red-500/10 ring-1 ring-red-500/30 text-red-300 hover:bg-red-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>Eliminar mi cuenta permanentemente</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}