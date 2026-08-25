"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Ban, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fmtCOP, fmtDateEs } from "@/lib/format";

type PedidoRow = {
  id: string;
  numero_pedido: number;
  estado: string;
  origen: string;
  total: number;
  created_at: string;
  clientes: { nombre: string } | null;
  pedido_items: { id: string; cantidad: number; subtotal: number; productos: { nombre: string } | null }[];
};

const NEXT_ESTADO: Record<string, string> = { pendiente: "alistado", alistado: "entregado" };
const NEXT_LABEL: Record<string, string> = { pendiente: "Marcar alistado", alistado: "Marcar entregado" };
const BADGE_CLASS: Record<string, string> = {
  pendiente: "bg-warn-soft text-warn",
  alistado: "bg-sky-soft text-deep",
  entregado: "bg-accent-soft text-deep",
  cancelado: "bg-[#F6E1DE] text-danger",
};

export function PedidosAdmin() {
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase
      .from("pedidos")
      .select("*, clientes(nombre), pedido_items(*, productos(nombre))")
      .order("numero_pedido", { ascending: true });
    setPedidos((data as PedidoRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function cambiarEstado(id: string, estado: string) {
    const supabase = createClient();
    if (!supabase) return;
    const payload: Record<string, unknown> = { estado };
    if (estado === "entregado") payload.entregado_at = new Date().toISOString();
    await supabase.from("pedidos").update(payload).eq("id", id);
    load();
  }

  async function cancelar(id: string) {
    if (!confirm("¿Cancelar este pedido? El cliente deberá volver a pedir si aún lo necesita.")) return;
    await cambiarEstado(id, "cancelado");
  }

  const filtrados = useMemo(() => {
    if (!search.trim()) return pedidos;
    const q = search.trim().toLowerCase();
    return pedidos.filter((p) => p.clientes?.nombre.toLowerCase().includes(q));
  }, [pedidos, search]);

  if (loading) return <p className="text-muted">Cargando...</p>;

  return (
    <div>
      <div className="relative mb-5">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-light" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar pedido por nombre de cliente..."
          className="w-full rounded-full border border-border-strong py-3 pl-10 pr-3.5 text-[0.86rem] outline-none focus:border-deep"
        />
      </div>
      <p className="mb-4 text-[0.85rem] text-muted-light">
        Los pedidos se muestran en orden de llegada. Alístalos y márcalos como entregados a medida que salgas a repartir.
      </p>

      {!filtrados.length ? (
        <p className="py-10 text-center text-muted-light">No hay pedidos que coincidan con la búsqueda.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtrados.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-lg border border-border">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-bold text-navy">#{p.numero_pedido}</span>
                  <span className="font-semibold">{p.clientes?.nombre ?? "Cliente eliminado"}</span>
                  <span className="rounded-full bg-bg-soft px-2.5 py-1 text-[0.68rem] font-bold uppercase text-muted">
                    {p.origen === "online" ? "Online" : "Presencial"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[0.72rem] text-muted-light">{fmtDateEs(p.created_at)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase ${BADGE_CLASS[p.estado] ?? ""}`}>{p.estado}</span>
                </div>
              </div>
              <div className="px-5 py-3">
                {p.pedido_items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between border-b border-dashed border-border py-2 text-[0.83rem] last:border-b-0">
                    <span className="flex-1">{it.productos?.nombre ?? "Producto eliminado"}</span>
                    <span className="mx-2.5 font-mono text-muted">x{it.cantidad}</span>
                    <span>{fmtCOP(it.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-bg-soft px-5 py-4">
                <span className="font-mono font-bold text-navy">Total {fmtCOP(p.total)}</span>
                {p.estado !== "entregado" && p.estado !== "cancelado" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => cancelar(p.id)}
                      className="flex items-center gap-1 rounded-full border border-border-strong px-3.5 py-2 text-[0.76rem] font-semibold hover:border-danger hover:text-danger"
                    >
                      <Ban size={13} /> Cancelar
                    </button>
                    <button
                      onClick={() => cambiarEstado(p.id, NEXT_ESTADO[p.estado])}
                      className="flex items-center gap-1 rounded-full bg-deep px-3.5 py-2 text-[0.76rem] font-semibold text-white hover:bg-navy"
                    >
                      <Check size={13} /> {NEXT_LABEL[p.estado]}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
