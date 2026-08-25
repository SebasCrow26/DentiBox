"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { X, Minus, Plus, ShoppingCart, Dice5 } from "lucide-react";
import type { Producto } from "@/lib/productos";
import { useCart } from "./CartContext";
import { fmtCOP } from "@/lib/format";

export function ProductDetail({ producto }: { producto: Producto }) {
  const { addToCart, openCart } = useCart();
  const [qty, setQty] = useState(1);

  function agregar() {
    addToCart(producto, qty);
    openCart();
  }

  return (
    <div className="fixed inset-0 z-[1150] flex items-center justify-center bg-navy/45 p-5 backdrop-blur-[2px]">
      <div className="relative flex w-full max-w-[760px] max-h-[88vh] flex-wrap overflow-y-auto rounded-lg bg-surface shadow-lift">
        <Link
          href="/"
          className="absolute right-3.5 top-3.5 z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full border border-border bg-surface hover:bg-bg-soft"
        >
          <X size={18} />
        </Link>

        <div className="flex min-h-[280px] min-w-[260px] flex-[0_0_44%] items-center justify-center bg-bg-soft">
          {producto.imagen_url ? (
            <Image src={producto.imagen_url} alt={producto.nombre} width={400} height={400} className="h-full w-full object-cover" />
          ) : (
            <Dice5 size={80} className="text-muted-light" />
          )}
        </div>

        <div className="min-w-[260px] flex-1 p-8">
          <div className="mb-1.5 font-mono text-[0.7rem] uppercase text-muted-light">
            REF-{producto.id.slice(0, 6).toUpperCase()} · {producto.categoria || "General"}
          </div>
          <h2 className="mb-3 text-[1.35rem] font-bold leading-snug">{producto.nombre}</h2>
          <div className="mb-5 font-mono text-[1.6rem] font-bold">{fmtCOP(producto.precio)}</div>
          <p className="mb-6 text-[0.88rem] leading-relaxed text-muted">
            {producto.descripcion || "Sin descripción disponible."}
          </p>

          <div className="mb-5 flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-bg-soft px-1.5 py-1">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-surface"
              >
                <Minus size={15} />
              </button>
              <span className="min-w-[22px] text-center font-mono font-semibold">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-surface"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          <button
            onClick={agregar}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[0.92rem] font-semibold text-white transition hover:bg-deep"
          >
            <ShoppingCart size={18} /> Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
}
