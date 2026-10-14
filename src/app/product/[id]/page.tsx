import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { AddToCart } from "./AddToCart";
import { Glow } from "@/components/Glow";
import { SiteNav } from "@/components/SiteNav";
import { Footer } from "@/components/Footer";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("products")
    .select("id, name, description, price, category, tag, image_url, stock")
    .eq("id", id)
    .single();

  if (!p) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-base-950 text-base-400 px-4">
        <div className="double-bezel p-12 max-w-md text-center">
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
            <h1 className="text-2xl font-bold mb-2">Producto no encontrado</h1>
            <p className="text-base-400 mb-6">El producto que buscas no existe o fue removido.</p>
            <Link
              href="/"
              className="btn-magnetic inline-flex"
            >
              <span>Volver al catálogo</span>
              <span className="btn-magnetic__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const money = (n: number) =>
    `RD$${Number(n).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

  const isExternal = (url: string) => url.startsWith("http");

  return (
    <div className="min-h-[100dvh] bg-base-950 text-base-50 relative">
      <div className="bg-mesh" aria-hidden="true" />

      <Glow />
      <SiteNav />

      <main className="relative mx-auto max-w-6xl px-4 py-10 md:py-16 lg:py-20">
        {/* Back link */}
        <Link
          href="/"
          className="reveal inline-flex items-center gap-2 text-sm text-base-400 hover:text-accent-cyan transition-colors mb-8"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>

        {/* HERO: Full-width image (16:9) */}
        <div className="reveal product-hero">
          <div className="double-bezel p-0">
            <div className="double-bezel__inner product-hero">
              {p.image_url ? (
                <>
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    fill
                    className="product-hero__image"
                    priority
                    sizes="(max-width: 768px) 100vw, 100vw"
                    quality={85}
                    unoptimized={isExternal(p.image_url)}
                  />
                  <div className="product-hero__gradient" aria-hidden="true" />
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-base-900 text-base-500">
                  <svg className="h-24 w-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="M21 15l-5-5L5 17" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* INFO STACK */}
        <div className="mt-10 product-info reveal delay-1">
          <div className="product-info__header">
            {p.category && (
              <span className="product-info__category">{p.category}</span>
            )}
            {p.tag && (
              <span className="inline-flex items-center gap-2 rounded-full bg-accent-cyan/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-accent-cyan ring-1 ring-accent-cyan/30 w-fit">
                {p.tag}
              </span>
            )}
            <h1 className="product-info__name">{p.name}</h1>
          </div>

          <p className="product-info__desc">{p.description ?? "Sin descripción disponible."}</p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap">
            <div className="flex items-baseline gap-4">
              <span className="product-info__price">{money(p.price)}</span>
              <span
                className={`product-info__stock ${(p.stock ?? 0) <= 0 ? "product-info__stock--oos" : ""}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                {(p.stock ?? 0) > 0 ? `${p.stock} disponibles` : "Sin stock"}
              </span>
            </div>
          </div>

          <div className="product-info__actions">
            <AddToCart productId={p.id} name={p.name} className="w-full sm:w-auto" />
            <Link
              href="/cart"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border px-8 py-3 text-sm font-medium text-base-300 transition-all duration-300 hover:bg-base-800/50 hover:text-base-100 hover:border-accent-cyan/50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Ver carrito
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}