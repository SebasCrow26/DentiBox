export function fmtCOP(n: number): string {
  const num = Number(n) || 0;
  return "$" + num.toLocaleString("es-CO");
}

export function fmtDateEs(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" }) +
    " · " +
    d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
  );
}
