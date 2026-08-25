"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fmtCOP } from "@/lib/format";

type PedidoRow = {
  id: string;
  cliente_id: string;
  estado: string;
  total: number;
  clientes: { nombre: string } | null;
  pedido_items: { producto_id: string; cantidad: number; subtotal: number; productos: { nombre: string } | null }[];
};

export function AnaliticaAdmin() {
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [clientesCount, setClientesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    Promise.all([
      supabase.from("pedidos").select("*, clientes(nombre), pedido_items(*, productos(nombre))"),
      supabase.from("clientes").select("id", { count: "exact", head: true }),
    ]).then(([{ data }, { count }]) => {
      setPedidos((data as PedidoRow[]) ?? []);
      setClientesCount(count ?? 0);
      setLoading(false);
    });
  }, []);

  const { activos, ingresos, topProductos, topClientes } = useMemo(() => {
    const activos = pedidos.filter((p) => p.estado !== "cancelado");
    const ingresos = activos.reduce((s, p) => s + Number(p.total), 0);

    const prodAcc = new Map<string, { nombre: string; unidades: number; ingresos: number }>();
    const clienteAcc = new Map<string, { nombre: string; pedidos: number; total: number }>();

    activos.forEach((p) => {
      const nombreCliente = p.clientes?.nombre ?? "Cliente eliminado";
      const c = clienteAcc.get(p.cliente_id) ?? { nombre: nombreCliente, pedidos: 0, total: 0 };
      c.pedidos += 1;
      c.total += Number(p.total);
      clienteAcc.set(p.cliente_id, c);

      p.pedido_items.forEach((it) => {
        const nombre = it.productos?.nombre ?? "Producto eliminado";
        const acc = prodAcc.get(it.producto_id) ?? { nombre, unidades: 0, ingresos: 0 };
        acc.unidades += it.cantidad;
        acc.ingresos += Number(it.subtotal);
        prodAcc.set(it.producto_id, acc);
      });
    });

    return {
      activos,
      ingresos,
      topProductos: [...prodAcc.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 5),
      topClientes: [...clienteAcc.values()].sort((a, b) => b.total - a.total).slice(0, 5),
    };
  }, [pedidos]);

  if (loading) return <p className="text-muted">Cargando...</p>;

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-border bg-surface p-5">
          <div className="text-[0.7rem] font-semibold uppercase text-muted">Pedidos totales</div>
          <div className="mt-1 font-heading text-[1.7rem] font-bold text-navy">{pedidos.length}</div>
          <div className="text-[0.72rem] text-muted-light">{activos.length} activos, {pedidos.length - activos.length} cancelados</div>
        </div>
        <div className="rounded-md border border-border bg-surface p-5">
          <div className="text-[0.7rem] font-semibold uppercase text-muted">Ingresos (pedidos activos)</div>
          <div className="mt-1 font-heading text-[1.7rem] font-bold text-navy">{fmtCOP(ingresos)}</div>
          <div className="text-[0.72rem] text-muted-light">Suma de pedidos no cancelados</div>
        </div>
        <div className="rounded-md border border-border bg-surface p-5">
          <div className="text-[0.7rem] font-semibold uppercase text-muted">Clientes registrados</div>
          <div className="mt-1 font-heading text-[1.7rem] font-bold text-navy">{clientesCount}</div>
          <div className="text-[0.72rem] text-muted-light">Con cuenta y perfil completo</div>
        </div>
      </div>

      <h4 className="mb-3 mt-6 text-[0.95rem] font-bold text-navy">Productos más vendidos</h4>
      <div className="mb-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[0.83rem]">
          <thead><tr className="bg-bg-soft text-left text-[0.7rem] uppercase text-muted"><th className="px-4 py-2.5"></th><th className="px-4 py-2.5">Producto</th><th className="px-4 py-2.5">Unidades</th><th className="px-4 py-2.5">Ingresos</th></tr></thead>
          <tbody>
            {!topProductos.length && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-light">Aún no hay ventas registradas.</td></tr>}
            {topProductos.map((row, i) => (
              <tr key={row.nombre + i} className="border-t border-border">
                <td className="px-4 py-2.5"><span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-accent-soft font-mono text-[0.68rem] font-bold text-deep">{i + 1}</span></td>
                <td className="px-4 py-2.5">{row.nombre}</td>
                <td className="px-4 py-2.5">{row.unidades}</td>
                <td className="px-4 py-2.5">{fmtCOP(row.ingresos)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="mb-3 text-[0.95rem] font-bold text-navy">Mejores clientes</h4>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[0.83rem]">
          <thead><tr className="bg-bg-soft text-left text-[0.7rem] uppercase text-muted"><th className="px-4 py-2.5"></th><th className="px-4 py-2.5">Cliente</th><th className="px-4 py-2.5">Pedidos</th><th className="px-4 py-2.5">Total comprado</th></tr></thead>
          <tbody>
            {!topClientes.length && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-light">Aún no hay compras registradas.</td></tr>}
            {topClientes.map((row, i) => (
              <tr key={row.nombre + i} className="border-t border-border">
                <td className="px-4 py-2.5"><span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-accent-soft font-mono text-[0.68rem] font-bold text-deep">{i + 1}</span></td>
                <td className="px-4 py-2.5">{row.nombre}</td>
                <td className="px-4 py-2.5">{row.pedidos}</td>
                <td className="px-4 py-2.5">{fmtCOP(row.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
