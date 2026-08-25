import { redirect } from "next/navigation";

// El catálogo vive en "/" (inicio fusionado con catálogo). Esta ruta se
// mantiene solo para que los links viejos a /catalogo no den 404.
type SearchParams = Promise<{ categoria?: string }>;

export default async function CatalogoRedirect({ searchParams }: { searchParams: SearchParams }) {
  const { categoria } = await searchParams;
  redirect(categoria ? `/?categoria=${categoria}` : "/");
}
