"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fmtCOP, fmtDateEs } from "@/lib/format";

type ClienteRow = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  pedidos: { count: number }[];
};

type PedidoHist = { id: string; numero_pedido: number; estado: string; total: number; created_at: string };

export function ClientesAdmin() {
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editando, setEditando] = useState<ClienteRow | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [expandido, setExpandido] = useState<string | null>(null);
  const [historial, setHistorial] = useState<PedidoHist[]>([]);

  async function load() {
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase.from("clientes").select("*, pedidos(count)").order("nombre");
    setClientes((data as ClienteRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function editar(c: ClienteRow) {
    setEditando(c);
    setNombre(c.nombre || "");
    setTelefono(c.telefono || "");
    setDireccion(c.direccion || "");
  }

  async function guardar() {
    if (!editando || !nombre.trim()) return;
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from("clientes").update({ nombre: nombre.trim(), telefono: telefono.trim(), direccion: direccion.trim() }).eq("id", editando.id);
    setEditando(null);
    load();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este cliente? Su historial de pedidos seguirá existiendo pero sin ficha asociada.")) return;
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from("clientes").delete().eq("id", id);
    load();
  }

  async function toggleHistorial(c: ClienteRow) {
    if (expandido === c.id) { setExpandido(null); return; }
    setExpandido(c.id);
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase.from("pedidos").select("*").eq("cliente_id", c.id).order("created_at", { ascending: false });
    setHistorial((data as PedidoHist[]) ?? []);
  }

  const filtrados = useMemo(() => {
    if (!search.trim()) return clientes;
    const q = search.trim().toLowerCase();
    return clientes.filter((c) => c.nombre.toLowerCase().includes(q));
  }, [clientes, search]);

  if (loading) return <p className="text-muted">Cargando...</p>;

  return (
    <div>
      {editando && (
        <div className="mb-6 rounded-lg border border-border bg-surface p-6">
          <h3 className="mb-1 text-[1.02rem] font-bold">Editar cliente</h3>
          <p className="mb-4 text-[0.8rem] text-muted-light">Los clientes se registran ellos mismos desde &quot;Mi cuenta&quot;. Aquí solo puedes corregir sus datos.</p>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem]" />
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono" className="rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem]" />
          </div>
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección" className="mb-4 w-full rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem]" />
          <div className="flex gap-2.5">
            <button onClick={guardar} className="rounded-full bg-ink px-4 py-2.5 text-[0.85rem] font-semibold text-white">Guardar cambios</button>
            <button onClick={() => setEditando(null)} className="rounded-full border border-border-strong px-4 py-2.5 text-[0.85rem] font-semibold">Cancelar</button>
          </div>
        </div>
      )}

      <div className="relative mb-5">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-light" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente por nombre..."
          className="w-full rounded-full border border-border-strong py-3 pl-10 pr-3.5 text-[0.86rem] outline-none focus:border-deep"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[0.83rem]">
          <thead>
            <tr className="bg-bg-soft text-left text-[0.7rem] uppercase text-muted">
              <th className="px-4 py-2.5">Nombre</th>
              <th className="px-4 py-2.5">Teléfono</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Dirección</th>
              <th className="px-4 py-2.5">Pedidos</th>
              <th className="px-4 py-2.5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!filtrados.length && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-light">Ningún cliente coincide con la búsqueda.</td></tr>
            )}
            {filtrados.map((c) => (
              <Fragment key={c.id}>
                <tr className="border-t border-border">
                  <td className="px-4 py-2.5">{c.nombre}</td>
                  <td className="px-4 py-2.5">{c.telefono || "—"}</td>
                  <td className="px-4 py-2.5">{c.email || "—"}</td>
                  <td className="px-4 py-2.5">{c.direccion || "—"}</td>
                  <td className="px-4 py-2.5">{c.pedidos?.[0]?.count ?? 0} pedido{(c.pedidos?.[0]?.count ?? 0) === 1 ? "" : "s"}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <button onClick={() => toggleHistorial(c)} className="mr-1 rounded-full bg-bg-soft px-3 py-1.5 text-[0.72rem] font-semibold hover:text-deep">Historial</button>
                    <button onClick={() => editar(c)} className="mr-1 rounded-full bg-bg-soft px-3 py-1.5 text-[0.72rem] font-semibold hover:text-deep">Editar</button>
                    <button onClick={() => eliminar(c.id)} className="rounded-full bg-bg-soft px-3 py-1.5 text-[0.72rem] font-semibold hover:text-danger">Eliminar</button>
                  </td>
                </tr>
                {expandido === c.id && (
                  <tr className="border-t border-border bg-bg-soft">
                    <td colSpan={6} className="px-4 py-3">
                      {!historial.length ? (
                        <p className="text-[0.8rem] text-muted-light">Este cliente aún no tiene pedidos.</p>
                      ) : (
                        <table className="w-full bg-surface text-[0.8rem]">
                          <thead>
                            <tr className="text-left"><th className="px-2 py-1.5">Pedido</th><th className="px-2 py-1.5">Fecha</th><th className="px-2 py-1.5">Estado</th><th className="px-2 py-1.5">Total</th></tr>
                          </thead>
                          <tbody>
                            {historial.map((p) => (
                              <tr key={p.id}><td className="px-2 py-1.5">#{p.numero_pedido}</td><td className="px-2 py-1.5">{fmtDateEs(p.created_at)}</td><td className="px-2 py-1.5">{p.estado}</td><td className="px-2 py-1.5">{fmtCOP(p.total)}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
