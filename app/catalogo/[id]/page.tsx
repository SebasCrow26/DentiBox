import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProductoById } from "@/lib/productos";
import { ProductDetail } from "@/components/ProductDetail";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ProductoPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const producto = supabase ? await getProductoById(supabase, id) : null;
  if (!producto) notFound();

  return <ProductDetail producto={producto} />;
}
