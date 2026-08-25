"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Producto } from "@/lib/productos";
import type { Promocion } from "@/lib/promociones";
import { fmtCOP } from "@/lib/format";

const EMPTY = { producto_id: "", tipo: "dia" as Promocion["tipo"], precio_promocional: "", fecha_inicio: "", fecha_fin: "", activo: true };

export function PromocionesAdmin() {
  const [promos, setPromos] = useState<(Promocion & { productos: { nombre: string } | null })[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  async function load() {
    const supabase = createClient();
    if (!supabase) return;
    const [{ data: promoData }, { data: prodData }] = await Promise.all([
      supabase.from("promociones").select("*, productos(nombre)").order("fecha_inicio", { ascending: false }),
      supabase.from("productos").select("*").order("nombre"),
    ]);
    setPromos((promoData as (Promocion & { productos: { nombre: string } | null })[]) ?? []);
    setProductos((prodData as Producto[]) ?? []);
    if (!form.producto_id && prodData?.length) setForm((f) => ({ ...f, producto_id: prodData[0].id }));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setEditandoId(null);
    setForm({ ...EMPTY, producto_id: productos[0]?.id || "" });
  }

  function editar(p: Promocion) {
    setEditandoId(p.id);
    setForm({
      producto_id: p.producto_id,
      tipo: p.tipo,
      precio_promocional: String(p.precio_promocional),
      fecha_inicio: p.fecha_inicio,
      fecha_fin: p.fecha_fin,
      activo: p.activo,
    });
  }

  async function guardar() {
    if (!form.producto_id || !form.precio_promocional || !form.fecha_inicio || !form.fecha_fin) return;
    const supabase = createClient();
    if (!supabase) return;
    const data = {
      producto_id: form.producto_id,
      tipo: form.tipo,
      precio_promocional: Number(form.precio_promocional),
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      activo: form.activo,
    };
    if (editandoId) await supabase.from("promociones").update(data).eq("id", editandoId);
    else await supabase.from("promociones").insert(data);
    resetForm();
    load();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta promoción?")) return;
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from("promociones").delete().eq("id", id);
    load();
  }

  if (loading) return <p className="text-muted">Cargando...</p>;

  return (
    <div>
      <div className="mb-6 rounded-lg border border-border bg-surface p-6">
        <h3 className="mb-4 text-[1.02rem] font-bold">{editandoId ? "Editar promoción" : "Nueva promoción"}</h3>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <select value={form.producto_id} onChange={(e) => setForm({ ...form, producto_id: e.target.value })} className="rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem]">
            {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as Promocion["tipo"] })} className="rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem]">
            <option value="dia">Del día</option>
            <option value="semana">Semanal</option>
            <option value="mes">Mensual</option>
          </select>
        </div>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="number" value={form.precio_promocional} onChange={(e) => setForm({ ...form, precio_promocional: e.target.value })} placeholder="Precio promocional" className="rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem]" />
          <label className="flex items-center gap-1.5 text-[0.83rem]">
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} /> Activa
          </label>
        </div>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} className="rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem]" />
          <input type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} className="rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem]" />
        </div>
        <div className="flex gap-2.5">
          <button onClick={guardar} className="rounded-full bg-ink px-4 py-2.5 text-[0.85rem] font-semibold text-white">{editandoId ? "Guardar cambios" : "Guardar promoción"}</button>
          <button onClick={resetForm} className="rounded-full border border-border-strong px-4 py-2.5 text-[0.85rem] font-semibold">Cancelar edición</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[0.83rem]">
          <thead>
            <tr className="bg-bg-soft text-left text-[0.7rem] uppercase text-muted">
              <th className="px-4 py-2.5">Producto</th><th className="px-4 py-2.5">Tipo</th><th className="px-4 py-2.5">Precio promo</th><th className="px-4 py-2.5">Vigencia</th><th className="px-4 py-2.5">Estado</th><th className="px-4 py-2.5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!promos.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-light">No hay promociones creadas.</td></tr>}
            {promos.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-2.5">{p.productos?.nombre ?? "Producto eliminado"}</td>
                <td className="px-4 py-2.5 capitalize">{p.tipo}</td>
                <td className="px-4 py-2.5">{fmtCOP(p.precio_promocional)}</td>
                <td className="px-4 py-2.5">{p.fecha_inicio} → {p.fecha_fin}</td>
                <td className="px-4 py-2.5">{p.activo ? <span className="text-deep">Activa</span> : <span className="text-muted-light">Inactiva</span>}</td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <button onClick={() => editar(p)} className="mr-1 rounded-full bg-bg-soft px-3 py-1.5 text-[0.72rem] font-semibold hover:text-deep">Editar</button>
                  <button onClick={() => eliminar(p.id)} className="rounded-full bg-bg-soft px-3 py-1.5 text-[0.72rem] font-semibold hover:text-danger">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
