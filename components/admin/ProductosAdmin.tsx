"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Producto } from "@/lib/productos";
import { CATEGORIAS } from "@/lib/categorias";
import { fmtCOP } from "@/lib/format";
import { ImageUploadSlot } from "./ImageUploadSlot";

const CATEGORIAS_PRODUCTO = CATEGORIAS.filter((c) => c.slug !== "todos");

const EMPTY = { nombre: "", categoria: "restauracion", precio: "", stock: "", descripcion: "", imagen_url: "", activo: true };

export function ProductosAdmin() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  async function load() {
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase.from("productos").select("*").order("created_at", { ascending: false });
    setProductos((data as Producto[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setEditandoId(null);
    setForm(EMPTY);
  }

  function editar(p: Producto) {
    setEditandoId(p.id);
    setForm({
      nombre: p.nombre,
      categoria: p.categoria || "restauracion",
      precio: String(p.precio),
      stock: String(p.stock ?? 0),
      descripcion: p.descripcion || "",
      imagen_url: p.imagen_url || "",
      activo: p.activo,
    });
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.precio) return;
    const supabase = createClient();
    if (!supabase) return;
    const data = {
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      precio: Number(form.precio),
      stock: Number(form.stock) || 0,
      descripcion: form.descripcion.trim(),
      imagen_url: form.imagen_url || null,
      activo: form.activo,
    };
    if (editandoId) {
      await supabase.from("productos").update(data).eq("id", editandoId);
    } else {
      await supabase.from("productos").insert(data);
    }
    resetForm();
    load();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from("productos").delete().eq("id", id);
    load();
  }

  if (loading) return <p className="text-muted">Cargando...</p>;

  return (
    <div>
      <div className="mb-6 rounded-lg border border-border bg-surface p-6">
        <h3 className="mb-4 text-[1.02rem] font-bold">{editandoId ? "Editar producto" : "Agregar producto"}</h3>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem]" />
          <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem]">
            {CATEGORIAS_PRODUCTO.map((c) => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} placeholder="Precio" className="rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem]" />
          <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Stock disponible" className="rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem]" />
        </div>
        <div className="mb-4">
          <label className="mb-1.5 block text-[0.8rem] font-semibold">Foto del producto</label>
          <ImageUploadSlot value={form.imagen_url || null} onChange={(url) => setForm({ ...form, imagen_url: url })} />
        </div>
        <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3} placeholder="Descripción" className="mb-4 w-full rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem]" />
        <label className="mb-4 flex items-center gap-1.5 text-[0.83rem]">
          <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} /> Visible en la tienda
        </label>
        <div className="flex gap-2.5">
          <button onClick={guardar} className="rounded-full bg-ink px-4 py-2.5 text-[0.85rem] font-semibold text-white">{editandoId ? "Guardar cambios" : "Guardar producto"}</button>
          <button onClick={resetForm} className="rounded-full border border-border-strong px-4 py-2.5 text-[0.85rem] font-semibold">Cancelar edición</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[0.83rem]">
          <thead>
            <tr className="bg-bg-soft text-left text-[0.7rem] uppercase text-muted">
              <th className="px-4 py-2.5">Imagen</th><th className="px-4 py-2.5">Nombre</th><th className="px-4 py-2.5">Categoría</th><th className="px-4 py-2.5">Precio</th><th className="px-4 py-2.5">Estado</th><th className="px-4 py-2.5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!productos.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-light">Aún no has agregado productos.</td></tr>}
            {productos.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-2.5">
                  {p.imagen_url ? <Image src={p.imagen_url} alt="" width={36} height={36} className="rounded-[8px] object-cover" /> : "—"}
                </td>
                <td className="px-4 py-2.5">{p.nombre}</td>
                <td className="px-4 py-2.5">{p.categoria || "—"}</td>
                <td className="px-4 py-2.5">{fmtCOP(p.precio)} <span className="text-muted-light">· stock {p.stock ?? "—"}</span></td>
                <td className="px-4 py-2.5">{p.activo ? <span className="text-deep">Visible</span> : <span className="text-muted-light">Oculto</span>}</td>
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
