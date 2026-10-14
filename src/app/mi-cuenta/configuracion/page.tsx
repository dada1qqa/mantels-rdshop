import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './SettingsClient'
import { Glow } from '@/components/Glow'
import { SiteNav } from '@/components/SiteNav'
import { Footer } from '@/components/Footer'

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener o crear perfil
  let { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Si no existe perfil, crearlo
  if (error || !profile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
        role: 'customer',
        notification_prefs: {},
        preferences: {
          theme: 'system',
          language: 'es-DO',
          currency: 'DOP',
          date_format: 'DD/MM/YYYY',
          time_format: '24h'
        },
        email_notifications: {
          order_updates: true,
          payment_reminders: true,
          delivery_updates: true,
          promotions: false,
          newsletter: false,
          security_alerts: true
        },
        privacy_settings: {
          profile_visibility: 'private',
          show_order_history: false,
          analytics_consent: true,
          marketing_consent: false
        }
      })
      .select()
      .single()
    
    profile = newProfile
  }

  return (
    <div className="min-h-[100dvh] bg-base-950 text-base-50 relative">
      <div className="bg-mesh" aria-hidden="true" />
      <Glow />
      <SiteNav />

      <main className="relative mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="mb-8 reveal">
          <p className="text-sm font-medium uppercase tracking-wide text-accent-cyan">Centro de Pedidos</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="mt-2 text-zinc-400">Gestiona tu perfil, preferencias y seguridad</p>
        </div>

        <SettingsClient 
          initialProfile={profile!}
          userId={user.id}
          userEmail={user.email || ''}
        />
      </main>

      <Footer />
    </div>
  )
}