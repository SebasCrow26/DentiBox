import type { SupabaseClient } from "@supabase/supabase-js";

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
  auth_user_id: string | null;
  created_at: string;
};

export async function getMyCliente(supabase: SupabaseClient, authUserId: string): Promise<Cliente | null> {
  const { data, error } = await supabase.from("clientes").select("*").eq("auth_user_id", authUserId).maybeSingle();
  if (error) return null;
  return data;
}

export function isClienteListo(cliente: Cliente | null): boolean {
  return !!(cliente && cliente.nombre);
}

export async function upsertMyCliente(
  supabase: SupabaseClient,
  authUserId: string,
  email: string | null,
  datos: { nombre: string; telefono: string; direccion: string }
): Promise<{ cliente: Cliente | null; error: string | null }> {
  const { data, error } = await supabase
    .from("clientes")
    .upsert({ auth_user_id: authUserId, email, ...datos }, { onConflict: "auth_user_id" })
    .select()
    .single();
  if (error) return { cliente: null, error: error.message };
  return { cliente: data, error: null };
}
