import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProductos } from "@/lib/productos";
import { CatalogoClient } from "@/components/CatalogoClient";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const supabase = await createClient();
  const productos = supabase ? await getProductos(supabase) : [];

  return (
    <Suspense fallback={null}>
      <CatalogoClient productos={productos} />
    </Suspense>
  );
}
