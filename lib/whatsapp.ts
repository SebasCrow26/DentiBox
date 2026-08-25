import { fmtCOP } from "./format";

export const WHATSAPP_NUMBER = "573107992293";

export type WhatsAppOrderItem = { nombre: string; cantidad: number; precio: number };

/** Arma el link wa.me con el resumen del pedido, para avisar al negocio apenas se confirma. */
export function buildWhatsAppOrderLink(numeroPedido: number, items: WhatsAppOrderItem[], total: number): string {
  const lineas = items.map((item) => `• ${item.nombre} x${item.cantidad} — ${fmtCOP(item.precio * item.cantidad)}`);
  const texto = [
    `Hola, acabo de hacer el pedido #${numeroPedido} en DentiBox:`,
    "",
    ...lineas,
    "",
    `Total: ${fmtCOP(total)}`,
  ].join("\n");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
}
