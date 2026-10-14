export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { login } = await import('../actions')
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050508] text-zinc-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-[140px]" />
        <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-[140px]" />
      </div>
      <form action={login} className="relative w-full max-w-sm rounded-[2rem] bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur-xl">
        <h1 className="mb-6 text-xl font-bold">Admin — Mantelsio<span className="bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">RDshop</span></h1>
        {error === 'credenciales' && <p className="mb-4 text-sm text-red-400">Credenciales incorrectas</p>}
        {error === 'permisos' && <p className="mb-4 text-sm text-red-400">Sin permisos de administrador</p>}
        {error === 'datos' && <p className="mb-4 text-sm text-red-400">Completa email y contraseña</p>}
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="mb-3 w-full rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-cyan-400/50 focus:outline-none"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          className="mb-4 w-full rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-cyan-400/50 focus:outline-none"
          required
        />
        <button className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 py-2.5 font-semibold text-white transition hover:opacity-90">
          Entrar
        </button>
      </form>
    </div>
  )
}
