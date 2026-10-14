import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Glow } from "@/components/Glow";
import { SiteNav } from "@/components/SiteNav";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  tag: string | null;
  image_url: string | null;
  stock: number | null;
};

const money = (n: number) => `RD$${Number(n).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const { cat, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("id, name, description, price, category, tag, image_url, stock")
    .order("created_at", { ascending: false });

  if (cat) query = query.eq("category", cat);
  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);

  const [{ data: products }, { data: allCategories }] = await Promise.all([
    query,
    supabase.from("products").select("category"),
  ]);

  const items = (products ?? []) as Product[];
  const categories = [
    ...new Set(
      (allCategories ?? []).map((c: { category: string | null }) => c.category).filter(Boolean)
    ),
  ] as string[];

  return (
    <div className="min-h-[100dvh] bg-base-950 text-base-50 relative">
      {/* Animated mesh background */}
      <div className="bg-mesh" aria-hidden="true" />

      <Glow />
      <SiteNav />

      <main className="relative mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16 lg:py-24">
        {/* Hero Section */}
        <section className="max-w-2xl reveal">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.25em] text-accent-cyan ring-1 ring-accent-cyan/30 bg-accent-cyan/10">
            <span className="relative flex h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse" aria-hidden="true" />
            Tienda online · República Dominicana
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Productos que se venden{" "}
            <span className="bg-gradient-to-r from-accent-fuchsia via-accent-cyan to-accent-emerald bg-clip-text text-transparent">
              solos.
            </span>
          </h1>
          <p className="mt-6 text-lg text-base-400 max-w-xl">
            Calidad, buen precio y entrega en República Dominicana. Compra por WhatsApp en un minuto.
          </p>
        </section>

        {/* Catalog Section */}
        <section id="catalogo" className="mt-16 reveal delay-1">
          {/* Search + Filters */}
          <form action="/" className="flex flex-col gap-3 sm:flex-row reveal delay-2">
            {cat && <input type="hidden" name="cat" value={cat} />}
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar producto…"
              className="w-full rounded-full bg-base-900/50 px-5 py-2.5 text-sm ring-1 ring-border placeholder:text-base-500 focus:ring-accent-fuchsia/50 focus:outline-none transition-all duration-300"
            />
            <button className="btn-magnetic">
              <span>Buscar</span>
              <span className="btn-magnetic__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </span>
            </button>
          </form>

          {/* Category filters */}
          <div className="mt-8 flex flex-wrap gap-2 reveal delay-3">
            <Link
              href={q ? `/?q=${encodeURIComponent(q)}` : "/"}
              className={`rounded-full px-4 py-1.5 text-xs font-medium ring-1 transition-all duration-300 ${
                !cat
                  ? "bg-gradient-to-r from-accent-fuchsia to-accent-cyan text-base-950 ring-transparent shadow-[0_0_20px_-4px_var(--color-accent-fuchsia)]"
                  : "bg-base-900/50 text-base-300 ring-border hover:bg-base-800/50 hover:text-base-100"
              }`}
            >
              Todos
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/?cat=${encodeURIComponent(c)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`rounded-full px-4 py-1.5 text-xs font-medium ring-1 transition-all duration-300 ${
                  cat === c
                    ? "bg-gradient-to-r from-accent-fuchsia to-accent-cyan text-base-950 ring-transparent shadow-[0_0_20px_-4px_var(--color-accent-fuchsia)]"
                    : "bg-base-900/50 text-base-300 ring-border hover:bg-base-800/50 hover:text-base-100"
                }`}
              >
                {c}
              </Link>
            ))}
          </div>

          {/* Product Grid */}
          <div className="mt-10 reveal delay-4">
            {items.length === 0 ? (
              <div className="double-bezel p-16 text-center">
                <div className="double-bezel__inner p-8">
                  <svg
                    className="mx-auto h-16 w-16 text-base-500 mb-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                    <path d="M8 8l6 6" />
                    <path d="M14 8l-6 6" />
                  </svg>
                  <p className="text-base-400 mb-2 text-lg">No encontramos productos</p>
                  <p className="text-base-500 text-sm mb-6">Prueba con otro filtro o búsqueda.</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-accent-cyan hover:text-accent-fuchsia transition-colors"
                  >
                    Ver todo el catálogo
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ) : (
              <div
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8"
                role="list"
                aria-label="Catálogo de productos"
              >
                {items.map((p, index) => (
                  <ProductCard key={p.id} {...p} index={index} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="mt-24 grid grid-cols-1 gap-4 sm:grid-cols-3 reveal delay-4">
          {[
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              ),
              t: "Entrega rápida",
              d: "Despachos en Santo Domingo y envíos al interior.",
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 8h20M10 4v16M14 4v16" />
                </svg>
              ),
              t: "Pago seguro",
              d: "Efectivo, transferencia o pago contra entrega.",
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              ),
              t: "Atención directa",
              d: "Escríbenos por WhatsApp y te respondemos al momento.",
            },
          ].map((f, i) => (
            <div key={f.t} className={`double-bezel p-6 reveal delay-${i + 5}`}>
              <div className="double-bezel__inner p-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-fuchsia/10 text-accent-fuchsia mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.t}</h3>
                <p className="text-sm text-base-400">{f.d}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}