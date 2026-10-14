'use client'

import { useState } from 'react'

export function AddToCart({ productId, name, className = '' }: { productId: string; name: string; className?: string }) {
  const [added, setAdded] = useState(false)

  function add() {
    const cart = JSON.parse(localStorage.getItem('cart') ?? '[]') as { id: string; qty: number }[]
    const found = cart.find((i) => i.id === productId)
    if (found) found.qty += 1
    else cart.push({ id: productId, qty: 1 })
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart:updated'))
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button
      onClick={add}
      className={`rounded-full px-8 py-3 text-sm font-semibold text-white transition ${className} ${added ? 'bg-emerald-500' : 'bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:opacity-90'}`}
    >
      {added ? `"${name}" agregado ✓` : 'Agregar al carrito'}
    </button>
  )
}
