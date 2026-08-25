import type { SupabaseClient } from "@supabase/supabase-js";

export type Pedido = {
  id: string;
  numero_pedido: number;
  cliente_id: string;
  estado: string;
  origen: string;
  total: number;
  created_at: string;
  entregado_at: string | null;
};

export type PedidoItemInput = { producto_id: string; cantidad: number };

/** Cliente con sesión y perfil completo — usa su ficha existente en `clientes`. */
export async function crearPedido(
  supabase: SupabaseClient,
  clienteId: string,
  items: PedidoItemInput[]
): Promise<{ pedido: Pedido | null; error: string | null }> {
  const { data, error } = await supabase.rpc("crear_pedido", {
    p_cliente_id: clienteId,
    p_items: items,
  });
  if (error) return { pedido: null, error: error.message };
  return { pedido: data as Pedido, error: null };
}

export async function getMisPedidos(supabase: SupabaseClient, clienteId: string): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

/** Sin cuenta — crea la ficha de cliente y el pedido en un solo paso (ver sql/crear_pedido_invitado.sql). */
export async function crearPedidoInvitado(
  supabase: SupabaseClient,
  datos: { nombre: string; telefono: string | null; direccion: string },
  items: PedidoItemInput[]
): Promise<{ pedido: Pedido | null; error: string | null }> {
  const { data, error } = await supabase.rpc("crear_pedido_invitado", {
    p_nombre: datos.nombre,
    p_telefono: datos.telefono,
    p_direccion: datos.direccion,
    p_items: items,
  });
  if (error) return { pedido: null, error: error.message };
  return { pedido: data as Pedido, error: null };
}
