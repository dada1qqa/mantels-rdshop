'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function CartCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    function read() {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') ?? '[]') as { qty: number }[]
        setCount(cart.reduce((s, i) => s + (i.qty || 0), 0))
      } catch {
        setCount(0)
      }
    }
    read()
    window.addEventListener('cart:updated', read)
    window.addEventListener('storage', read)
    return () => {
      window.removeEventListener('cart:updated', read)
      window.removeEventListener('storage', read)
    }
  }, [])

  return (
    <Link href="/cart" className="relative hover:text-zinc-100">
      Carrito
      {count > 0 && (
        <span className="absolute -right-4 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-zinc-950">
          {count}
        </span>
      )}
    </Link>
  )
}
