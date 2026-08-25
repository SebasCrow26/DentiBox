"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus, Dice5 } from "lucide-react";
import type { Producto } from "@/lib/productos";
import { useCart } from "./CartContext";
import { fmtCOP } from "@/lib/format";

export function ProductCard({ producto }: { producto: Producto }) {
  const { addToCart } = useCart();

  return (
    <Link
      href={`/catalogo/${producto.id}`}
      className="group flex flex-col overflow-hidden rounded-md border border-border bg-surface no-underline transition duration-300 hover:-translate-y-1 hover:shadow-lift hover:border-transparent"
    >
      <div className="flex h-[150px] items-center justify-center overflow-hidden bg-bg-soft">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            width={230}
            height={150}
            className="h-full w-full object-cover"
          />
        ) : (
          <Dice5 size={40} className="text-muted-light" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-light">
          REF-{producto.id.slice(0, 6).toUpperCase()}
        </span>
        <h3 className="text-[0.9rem] font-semibold leading-snug">{producto.nombre}</h3>
        <p className="flex-1 text-[0.79rem] leading-snug text-muted">{(producto.descripcion || "").slice(0, 70)}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="font-mono text-[1rem] font-semibold">{fmtCOP(producto.precio)}</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(producto, 1);
            }}
            className="flex items-center gap-1 rounded-full bg-ink px-3.5 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-deep"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>
    </Link>
  );
}
