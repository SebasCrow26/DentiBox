export type Promocion = {
  id: string;
  producto_id: string;
  tipo: "dia" | "semana" | "mes";
  precio_promocional: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
};
