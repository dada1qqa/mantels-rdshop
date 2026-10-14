"use client";

import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  stock: number | null;
  index?: number;
}

const money = (n: number) =>
  `RD$${Number(n).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

const isExternal = (url: string) => url.startsWith("http");

export function ProductCard({
  id,
  name,
  description,
  price,
  category,
  image_url,
  stock,
  index = 0,
}: ProductCardProps) {
  const delayClass = `reveal-delay-${Math.min(index, 4)}`;
  const external = image_url ? isExternal(image_url) : false;

  return (
    <Link
      href={`/product/${id}`}
      className={`product-card group ${delayClass}`}
      aria-label={`Ver ${name}`}
    >
      {/* Double-bezel media wrapper */}
      <div className="double-bezel">
        <div className="double-bezel__inner product-card__media">
          {image_url ? (
            <Image
              src={image_url}
              alt={name}
              fill
              className="product-card__image"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
              decoding="async"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
              unoptimized={external}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-base-800 text-base-500 text-xs">
              Sin imagen
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="product-card__content">
        {category && (
          <span className="product-card__category">{category}</span>
        )}
        <h3 className="product-card__name">{name}</h3>
        <p className="product-card__desc">{description ?? "Sin descripción"}</p>

        <div className="product-card__meta">
          <span className="product-card__price">{money(price)}</span>
          <span
            className={`product-card__stock ${(stock ?? 0) <= 0 ? "product-card__stock--oos" : ""}`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {(stock ?? 0) > 0 ? `${stock} disp.` : "Sin stock"}
          </span>
        </div>
      </div>
    </Link>
  );
}