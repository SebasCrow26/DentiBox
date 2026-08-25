"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Edit, ShoppingBag } from "lucide-react";
import { useCliente } from "@/lib/useCliente";
import { createClient } from "@/lib/supabase/client";
import { upsertMyCliente } from "@/lib/clientes";
import { getMisPedidos, type Pedido } from "@/lib/pedidos";
import { AuthPanel } from "./AuthPanel";
import { fmtCOP, fmtDateEs } from "@/lib/format";

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  alistado: "Alistado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export function CuentaClient() {
  const { user, cliente, loading, clienteListo } = useCliente();
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [consultorio, setConsultorio] = useState("");
  const [direccion, setDireccion] = useState("");
  const [msg, setMsg] = useState("");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    if (cliente) {
      setNombre(cliente.nombre || "");
      setTelefono(cliente.telefono || "");
      const partes = (cliente.direccion || "").split(" · ");
      if (partes.length > 1) {
        setConsultorio(partes[0]);
        setDireccion(partes.slice(1).join(" · "));
      } else {
        setDireccion(cliente.direccion || "");
      }
    }
  }, [cliente]);

  useEffect(() => {
    if (!cliente) return;
    const supabase = createClient();
    if (!supabase) return;
    getMisPedidos(supabase, cliente.id).then(setPedidos);
  }, [cliente]);

  async function guardar() {
    if (!user) return;
    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) {
      setMsg("Completa nombre, teléfono y dirección.");
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    const direccionFull = [consultorio.trim(), direccion.trim()].filter(Boolean).join(" · ");
    setMsg("Guardando...");
    const { error } = await upsertMyCliente(supabase, user.id, user.email ?? null, {
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      direccion: direccionFull,
    });
    if (error) { setMsg(error); return; }
    setMsg("");
    setEditando(false);
    router.refresh();
  }

  async function cerrarSesion() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const mapaQuery = direccion ? encodeURIComponent([consultorio, direccion].filter(Boolean).join(" · ")) : "";

  if (loading) {
    return <div className="mx-auto max-w-[520px] px-[5%] py-16 text-center text-muted">Cargando...</div>;
  }

  return (
    <div className="mx-auto max-w-[520px] px-[5%] py-12">
      <span className="mb-2 block font-mono text-[0.7rem] uppercase tracking-wide text-deep">Mi cuenta</span>
      <h2 className="mb-2 text-2xl font-bold">
        {!user ? "Inicia sesión" : !clienteListo || editando ? (clienteListo ? "Editar datos" : "Completa tu perfil") : "Mi cuenta"}
      </h2>

      {!user && (
        <>
          <p className="mb-6 text-[0.9rem] text-muted">Inicia sesión para hacer pedidos y ver tu historial de compras.</p>
          <AuthPanel />
        </>
      )}

      {user && (!clienteListo || editando) && (
        <div className="rounded-lg border border-border bg-surface p-6">
          <label className="mb-1.5 block text-[0.8rem] font-semibold">Nombre completo</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Dra. Nombre Apellido"
            className="mb-4 w-full rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem] outline-none focus:border-deep"
          />
          <label className="mb-1.5 block text-[0.8rem] font-semibold">Teléfono</label>
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="300 123 4567"
            className="mb-4 w-full rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem] outline-none focus:border-deep"
          />
          <label className="mb-1.5 block text-[0.8rem] font-semibold">Consultorio (opcional)</label>
          <input
            value={consultorio}
            onChange={(e) => setConsultorio(e.target.value)}
            placeholder="Nombre del consultorio"
            className="mb-4 w-full rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem] outline-none focus:border-deep"
          />
          <label className="mb-1.5 block text-[0.8rem] font-semibold">Dirección de entrega</label>
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Dirección completa"
            className="mb-4 w-full rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem] outline-none focus:border-deep"
          />
          {direccion && (
            <div className="mb-4 overflow-hidden rounded-[10px] border border-border">
              <iframe
                src={`https://maps.google.com/maps?q=${mapaQuery}&z=15&output=embed`}
                className="h-[180px] w-full border-0"
                loading="lazy"
              />
            </div>
          )}
          <p className="mb-3 min-h-[1.1em] text-[0.72rem] text-muted-light">{msg}</p>
          <button onClick={guardar} className="mb-2 w-full rounded-full bg-ink py-3.5 text-[0.9rem] font-semibold text-white hover:bg-deep">
            Guardar y continuar
          </button>
          <div className="flex gap-2.5">
            <button onClick={cerrarSesion} className="flex-1 rounded-full border border-border-strong py-2.5 text-[0.85rem] font-semibold">
              Cerrar sesión
            </button>
            {clienteListo && (
              <button onClick={() => setEditando(false)} className="flex-1 rounded-full border border-border-strong py-2.5 text-[0.85rem] font-semibold">
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {user && clienteListo && !editando && cliente && (
        <div className="rounded-lg border border-border bg-surface p-6">
          <h3 className="mb-1 text-[1.05rem] font-bold">Hola, {cliente.nombre}</h3>
          <p className="text-[0.8rem] text-muted-light">{cliente.email || "—"}</p>
          <p className="text-[0.8rem] text-muted-light">{cliente.telefono || "—"}</p>
          <p className="text-[0.8rem] text-muted-light">{cliente.direccion || "—"}</p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button onClick={() => setEditando(true)} className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[0.85rem] font-semibold text-white hover:bg-deep">
              <Edit size={15} /> Editar datos
            </button>
            <button onClick={() => router.push("/")} className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[0.85rem] font-semibold text-white hover:bg-deep">
              <ShoppingBag size={15} /> Ir a la tienda
            </button>
            <button onClick={cerrarSesion} className="flex items-center gap-1.5 rounded-full border border-border-strong px-4 py-2.5 text-[0.85rem] font-semibold">
              <LogOut size={15} /> Cerrar sesión
            </button>
          </div>

          {pedidos.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-2 text-[0.9rem] font-bold">Historial de pedidos</h4>
              <div className="overflow-hidden rounded-[10px] border border-border">
                <table className="w-full text-[0.83rem]">
                  <thead>
                    <tr className="bg-bg-soft text-left text-[0.7rem] uppercase text-muted">
                      <th className="px-3 py-2">Pedido</th>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-3 py-2">#{p.numero_pedido}</td>
                        <td className="px-3 py-2">{fmtDateEs(p.created_at)}</td>
                        <td className="px-3 py-2">{ESTADO_LABEL[p.estado] || p.estado}</td>
                        <td className="px-3 py-2">{fmtCOP(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
