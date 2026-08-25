export const CATEGORIAS = [
  { slug: "todos", nombre: "Todos" },
  { slug: "restauracion", nombre: "Restauración" },
  { slug: "ortodoncia", nombre: "Ortodoncia" },
  { slug: "bioseguridad", nombre: "Bioseguridad" },
  { slug: "instrumental", nombre: "Instrumental" },
  { slug: "endodoncia", nombre: "Endodoncia" },
  { slug: "consumibles", nombre: "Consumibles" },
] as const;

export type CategoriaSlug = (typeof CATEGORIAS)[number]["slug"];
