import type { SupabaseClient } from "@supabase/supabase-js";

export type Producto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagen_url: string | null;
  categoria: string | null;
  activo: boolean;
  created_at: string;
};

/** Catálogo público — solo productos activos. Se usa en Server Components (home, detalle). */
export async function getProductos(supabase: SupabaseClient): Promise<Producto[]> {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function getProductoById(supabase: SupabaseClient, id: string): Promise<Producto | null> {
  const { data, error } = await supabase.from("productos").select("*").eq("id", id).maybeSingle();
  if (error) return null;
  return data;
}
