import Link from 'next/link'
import { signin, signup } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; msg?: string }> }) {
  const { error, msg } = await searchParams
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050508] px-4 text-zinc-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-[140px]" />
        <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-[140px]" />
      </div>
      <form className="relative w-full max-w-sm rounded-[2rem] bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-xl sm:p-8">
        <h1 className="mb-2 text-xl font-bold">Tu cuenta</h1>
        <p className="mb-6 text-sm text-zinc-500">Inicia sesión o crea una cuenta</p>
        {error && <p className="mb-4 text-sm text-red-400">{error === '1' || error === 'datos' ? 'Email o contraseña inválidos' : error}</p>}
        {msg === 'cuenta-creada' && <p className="mb-4 text-sm text-emerald-400">Cuenta creada. Revisa tu email para confirmar.</p>}
        <input name="email" type="email" placeholder="Email" required className="mb-3 w-full rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-cyan-400/50 focus:outline-none" />
        <input name="password" type="password" placeholder="Contraseña" required minLength={6} className="mb-4 w-full rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-cyan-400/50 focus:outline-none" />
        <button formAction={signin} className="mb-3 w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 py-2.5 text-sm font-semibold text-white">Entrar</button>
        <button formAction={signup} className="w-full rounded-full border border-white/10 py-2.5 text-sm text-zinc-300 hover:bg-white/10">Crear cuenta</button>
        <p className="mt-4 text-center text-xs text-zinc-600">
          <Link href="/" className="hover:text-zinc-400">← Volver al catálogo</Link>
        </p>
      </form>
    </div>
  )
}
