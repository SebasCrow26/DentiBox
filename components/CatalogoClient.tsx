"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, PackageSearch } from "lucide-react";
import type { Producto } from "@/lib/productos";
import { CATEGORIAS } from "@/lib/categorias";
import { ProductCard } from "./ProductCard";

export function CatalogoClient({ productos }: { productos: Producto[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("categoria") || "todos";
  const [search, setSearch] = useState("");

  function selectCategory(slug: string) {
    router.push(slug === "todos" ? "/" : `/?categoria=${slug}`, { scroll: false });
  }

  const filtered = useMemo(() => {
    let list = productos;
    if (activeCategory !== "todos") list = list.filter((p) => p.categoria === activeCategory);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) => p.nombre.toLowerCase().includes(q) || (p.descripcion || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [productos, activeCategory, search]);

  return (
    <>
      <section className="overflow-hidden">
        <div className="mx-auto max-w-[1180px] px-[5%] pt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/b8s550ww/image/upload/v1783709339/Denti_gibp3y.png"
            alt="DentiBox — insumos odontológicos, pide contra entrega"
            className="w-full rounded-lg object-cover"
          />
        </div>
      </section>

      <div className="mx-auto max-w-[1180px] px-[5%] py-6 pb-16">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative min-w-[220px] flex-1">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-light" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full rounded-full border border-border-strong bg-surface py-2.5 pl-10 pr-3.5 text-[0.87rem] outline-none focus:border-deep"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => selectCategory(cat.slug)}
                className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-[0.78rem] font-medium transition ${
                  activeCategory === cat.slug
                    ? "border-ink bg-ink text-white"
                    : "border-border-strong bg-surface text-muted hover:bg-ink hover:text-white"
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        <p className="mb-4 font-mono text-[0.76rem] text-muted-light">
          {filtered.length} producto{filtered.length === 1 ? "" : "s"}
        </p>

        {!filtered.length ? (
          <div className="col-span-full rounded-md border border-border bg-surface py-16 text-center text-muted-light">
            <PackageSearch size={40} className="mx-auto mb-3" />
            <p>No encontramos productos con ese criterio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
