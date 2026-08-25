"use client";

import Image from "next/image";
import { useState } from "react";
import { X, Trash2, Minus, Plus, ClipboardCheck } from "lucide-react";
import { useCart } from "./CartContext";
import { useCliente } from "@/lib/useCliente";
import { createClient } from "@/lib/supabase/client";
import { crearPedido, crearPedidoInvitado } from "@/lib/pedidos";
import { buildWhatsAppOrderLink } from "@/lib/whatsapp";
import { fmtCOP } from "@/lib/format";

export function CartDrawer() {
  const { items, cartTotal, isCartOpen, closeCart, isGuestFormOpen, openGuestForm, closeGuestForm, removeFromCart, updateQuantity, clearCart } =
    useCart();
  const { user, cliente, clienteListo } = useCliente();
  const [busy, setBusy] = useState(false);
  const [guestNombre, setGuestNombre] = useState("");
  const [guestTelefono, setGuestTelefono] = useState("");
  const [guestDireccion, setGuestDireccion] = useState("");
  const [guestMsg, setGuestMsg] = useState("");

  function finalizar(numeroPedido: number) {
    const link = buildWhatsAppOrderLink(
      numeroPedido,
      items.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })),
      cartTotal
    );
    clearCart();
    closeGuestForm();
    closeCart();
    window.open(link, "_blank");
  }

  async function confirmarPedido() {
    if (!items.length) return;
    const supabase = createClient();
    if (!supabase) return;

    if (clienteListo && cliente) {
      setBusy(true);
      const { pedido, error } = await crearPedido(
        supabase,
        cliente.id,
        items.map((i) => ({ producto_id: i.id, cantidad: i.cantidad }))
      );
      setBusy(false);
      if (error || !pedido) {
        alert(error || "No se pudo crear el pedido. Intenta de nuevo.");
        return;
      }
      finalizar(pedido.numero_pedido);
    } else {
      openGuestForm();
    }
  }

  async function enviarPedidoInvitado() {
    if (!guestNombre.trim() || !guestDireccion.trim()) {
      setGuestMsg("Completa al menos tu nombre y dirección.");
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    setGuestMsg("Enviando pedido...");
    const { pedido, error } = await crearPedidoInvitado(
      supabase,
      { nombre: guestNombre.trim(), telefono: guestTelefono.trim() || null, direccion: guestDireccion.trim() },
      items.map((i) => ({ producto_id: i.id, cantidad: i.cantidad }))
    );
    setBusy(false);
    if (error || !pedido) {
      setGuestMsg(error || "No se pudo crear el pedido. Intenta de nuevo.");
      return;
    }
    finalizar(pedido.numero_pedido);
  }

  async function crearCuentaConGoogle() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <>
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-[1100] bg-navy/40 backdrop-blur-[1px] transition-opacity ${
          isCartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-[1101] flex h-full w-[390px] max-w-[96vw] flex-col bg-surface shadow-lift transition-transform duration-300 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {!isGuestFormOpen ? (
          <>
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="flex items-center gap-2 text-[1.05rem] font-bold">Tu carrito</h2>
              <button onClick={closeCart} className="rounded-full p-1.5 hover:bg-bg-soft">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {!items.length ? (
                <div className="py-20 text-center text-muted-light">
                  <p className="text-[0.88rem]">Tu carrito está vacío.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 border-b border-bg-soft py-3.5">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-bg-soft">
                      {item.imagen_url && (
                        <Image src={item.imagen_url} alt="" width={48} height={48} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-[0.83rem] font-semibold">{item.nombre}</h4>
                      <span className="font-mono text-[0.78rem] font-semibold text-deep">{fmtCOP(item.precio)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                        className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-bg-soft hover:bg-ink hover:text-white"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="min-w-[18px] text-center font-mono text-[0.82rem] font-semibold">{item.cantidad}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                        className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-bg-soft hover:bg-ink hover:text-white"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-1 text-muted-light hover:text-danger">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border px-6 py-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[0.85rem] text-muted">Total</span>
                <strong className="font-mono text-[1.2rem] font-bold">{fmtCOP(cartTotal)}</strong>
              </div>
              <p className="mb-3 text-[0.73rem] leading-relaxed text-muted-light">
                Pago contra entrega. Al confirmar, el pedido queda registrado y te contactamos por WhatsApp.
              </p>
              <button
                onClick={confirmarPedido}
                disabled={!items.length || busy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-navy py-3.5 text-[0.95rem] font-bold text-white transition hover:bg-deep disabled:opacity-50"
              >
                <ClipboardCheck size={18} />
                Confirmar pedido
              </button>
              <button
                onClick={() => { if (items.length && confirm("¿Vaciar el carrito?")) clearCart(); }}
                className="mt-2 w-full rounded-full border border-border py-2.5 text-[0.8rem] font-semibold text-muted hover:border-danger hover:text-danger"
              >
                Vaciar carrito
              </button>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col overflow-y-auto px-6 py-6">
            <h3 className="text-[1.02rem] font-bold">Un último dato para tu pedido</h3>
            <p className="mb-4 mt-1 text-[0.72rem] text-muted-light">Solo tu nombre y dirección — sin crear cuenta.</p>

            <label className="mb-1.5 block text-[0.8rem] font-semibold">Nombre completo</label>
            <input
              value={guestNombre}
              onChange={(e) => setGuestNombre(e.target.value)}
              placeholder="Dra. Nombre Apellido"
              className="mb-4 w-full rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem] outline-none focus:border-deep focus:ring-2 focus:ring-accent-soft"
            />
            <label className="mb-1.5 block text-[0.8rem] font-semibold">Teléfono (opcional)</label>
            <input
              value={guestTelefono}
              onChange={(e) => setGuestTelefono(e.target.value)}
              placeholder="300 123 4567"
              className="mb-4 w-full rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem] outline-none focus:border-deep focus:ring-2 focus:ring-accent-soft"
            />
            <label className="mb-1.5 block text-[0.8rem] font-semibold">Dirección de entrega</label>
            <input
              value={guestDireccion}
              onChange={(e) => setGuestDireccion(e.target.value)}
              placeholder="Consultorio, dirección completa"
              className="mb-2 w-full rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem] outline-none focus:border-deep focus:ring-2 focus:ring-accent-soft"
            />
            <p className="mb-3 min-h-[1.2em] text-[0.72rem] text-muted-light">{guestMsg}</p>

            <button
              onClick={enviarPedidoInvitado}
              disabled={busy}
              className="w-full rounded-full bg-navy py-3.5 text-[0.9rem] font-bold text-white transition hover:bg-deep disabled:opacity-50"
            >
              Confirmar pedido
            </button>
            <button onClick={closeGuestForm} className="mt-2 w-full rounded-full border border-border py-2.5 text-[0.8rem] font-semibold text-muted">
              Volver al carrito
            </button>

            <div className="mt-5 border-t border-border pt-4 text-center">
              <p className="mb-2 text-[0.72rem] text-muted-light">¿Vas a pedir seguido? Crea tu cuenta en un clic y no vuelvas a llenar esto.</p>
              <button
                onClick={crearCuentaConGoogle}
                className="w-full rounded-full border border-border-strong py-2.5 text-[0.85rem] font-semibold text-ink hover:border-deep hover:text-deep"
              >
                Crear cuenta con Google
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
