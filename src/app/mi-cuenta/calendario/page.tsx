import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Calendar } from '@/components/orders/Calendar'
import { Glow } from '@/components/Glow'
import { SiteNav } from '@/components/SiteNav'
import { Footer } from '@/components/Footer'

export default async function CalendarioPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError) {
    console.error('Auth error:', authError)
    redirect('/login?error=auth_failed')
  }
  if (!user) redirect('/login')

  // Obtener eventos para 3 meses (pasado y futuro)
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 1)
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 2)

  const { data: events, error: rpcError } = await supabase.rpc('get_user_calendar', {
    p_user_id: user.id,
    p_start_date: startDate.toISOString().split('T')[0],
    p_end_date: endDate.toISOString().split('T')[0]
  })

  if (rpcError) {
    console.error('RPC error:', rpcError)
    return (
      <div className="min-h-[100dvh] bg-base-950 text-base-50 relative">
        <div className="bg-mesh" aria-hidden="true" />
        <Glow />
        <SiteNav />
        <main className="relative mx-auto max-w-6xl px-4 py-10 md:py-16">
          <div className="double-bezel p-8">
            <div className="double-bezel__inner p-8 text-center">
              <h2 className="text-2xl font-bold text-red-400 mb-4">Error cargando calendario</h2>
              <pre className="text-left text-sm bg-base-900 p-4 rounded overflow-auto text-red-300">
                {JSON.stringify(rpcError, null, 2)}
              </pre>
              <p className="mt-4 text-zinc-400">Revisa los logs del servidor para más detalles.</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-base-950 text-base-50 relative">
      <div className="bg-mesh" aria-hidden="true" />
      <Glow />
      <SiteNav />

      <main className="relative mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="mb-8 reveal">
          <p className="text-sm font-medium uppercase tracking-wide text-accent-cyan">Centro de Pedidos</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Mi calendario</h1>
          <p className="mt-2 text-zinc-400">Visualiza todas las fechas importantes de tus pedidos</p>
        </div>

        <div className="reveal delay-1">
          <Calendar 
            events={events ?? []}
            view="month"
            eventBasePath="/mi-cuenta/pedidos"
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}