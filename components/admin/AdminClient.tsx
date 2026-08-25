"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useCliente } from "@/lib/useCliente";
import { createClient } from "@/lib/supabase/client";
import { PedidosAdmin } from "./PedidosAdmin";
import { ClientesAdmin } from "./ClientesAdmin";
import { ProductosAdmin } from "./ProductosAdmin";
import { PromocionesAdmin } from "./PromocionesAdmin";
import { AnaliticaAdmin } from "./AnaliticaAdmin";

const TABS = [
  { id: "pedidos", label: "Pedidos" },
  { id: "clientes", label: "Clientes" },
  { id: "productos", label: "Productos" },
  { id: "promos", label: "Promociones" },
  { id: "analitica", label: "Analítica" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AdminClient() {
  const { user, esAdmin, loading } = useCliente();
  const [tab, setTab] = useState<TabId>("pedidos");

  async function cerrarSesion() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return <div className="mx-auto max-w-[1100px] px-[5%] py-16 text-center text-muted">Cargando...</div>;
  }

  if (!esAdmin) {
    return (
      <div className="mx-auto max-w-[380px] px-[5%] py-20">
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <h2 className="mb-2 text-xl font-bold">Acceso administrador</h2>
          <p className="mb-6 text-[0.85rem] text-muted">
            {user
              ? "Esta cuenta no tiene permisos de administrador."
              : 'Esta sección es solo para la cuenta autorizada. Inicia sesión desde "Mi cuenta" con ese correo.'}
          </p>
          <Link href="/cuenta" className="block w-full rounded-full bg-ink py-3 text-center text-[0.9rem] font-semibold text-white hover:bg-deep">
            Ir a Mi cuenta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-[5%] py-8 pb-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.45rem] font-bold">Panel de administración</h1>
          <p className="text-[0.8rem] text-muted-light">{user?.email}</p>
        </div>
        <button onClick={cerrarSesion} className="flex items-center gap-1.5 rounded-full border border-border-strong px-4 py-2.5 text-[0.85rem] font-semibold">
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>

      <div className="mb-6 flex gap-0.5 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-[0.85rem] font-semibold transition ${
              tab === t.id ? "border-deep text-deep" : "border-transparent text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pedidos" && <PedidosAdmin />}
      {tab === "clientes" && <ClientesAdmin />}
      {tab === "productos" && <ProductosAdmin />}
      {tab === "promos" && <PromocionesAdmin />}
      {tab === "analitica" && <AnaliticaAdmin />}
    </div>
  );
}
