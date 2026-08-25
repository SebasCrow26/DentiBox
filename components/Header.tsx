"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "./CartContext";
import { useCliente } from "@/lib/useCliente";

const LOGO_URL =
  "https://res.cloudinary.com/b8s550ww/image/upload/w_480,q_auto,f_auto/v1783701652/Dentibox_n4ifvv.png";

export function Header() {
  const { cartCount, openCart } = useCart();
  const { user, cliente, esAdmin } = useCliente();
  const [mobileOpen, setMobileOpen] = useState(false);
  const cuentaLabel = cliente?.nombre ? cliente.nombre.split(" ")[0] : user ? "Mi cuenta" : "Iniciar sesión";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-[5%] py-3">
        <Link href="/" className="flex items-center" onClick={() => setMobileOpen(false)}>
          <Image src={LOGO_URL} alt="DentiBox" width={480} height={299} className="h-10 w-auto md:h-12" priority />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/contacto" className="rounded-full px-3.5 py-2 text-sm font-medium text-muted hover:bg-bg-soft hover:text-ink">
            Contacto
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={openCart}
            className="relative flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-deep"
          >
            <ShoppingCart size={17} />
            <span className="hidden sm:inline">Carrito</span>
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sky px-1 font-mono text-[11px] font-bold text-navy">
              {cartCount}
            </span>
          </button>
          <Link
            href="/cuenta"
            className="rounded-full bg-gradient-to-br from-sky to-deep px-4 py-2 text-[13px] font-semibold text-white shadow-[0_8px_20px_-10px_rgba(30,134,232,0.55)] transition hover:-translate-y-0.5"
          >
            {cuentaLabel}
          </Link>
          {esAdmin && (
            <Link href="/admin" className="hidden rounded-full border border-border px-3.5 py-2 text-[12px] font-medium text-muted-light hover:border-deep hover:text-deep sm:inline-block">
              Admin
            </Link>
          )}
          <button className="p-1.5 md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Menú">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="flex flex-col gap-1 border-t border-border bg-surface px-[5%] py-3 md:hidden">
          <Link href="/contacto" onClick={() => setMobileOpen(false)} className="rounded-md px-2 py-3 text-[15px] font-medium text-muted">
            Contacto
          </Link>
        </div>
      )}
    </header>
  );
}
