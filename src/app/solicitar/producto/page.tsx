import { Glow } from '@/components/Glow'
import { SiteNav } from '@/components/SiteNav'
import { Footer } from '@/components/Footer'
import { RequestForm } from '@/components/RequestForm'

export default function Page() {
  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100"><Glow /><SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-16"><RequestForm type="product" /></main><Footer />
    </div>
  )
}
