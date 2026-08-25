"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Producto } from "@/lib/productos";

export type CartItem = {
  id: string;
  nombre: string;
  precio: number;
  imagen_url: string | null;
  cantidad: number;
};

const STORAGE_KEY = "dentibox_cart";

type CartContextValue = {
  items: CartItem[];
  cartCount: number;
  cartTotal: number;
  toastMsg: string | null;
  isCartOpen: boolean;
  isGuestFormOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  openGuestForm: () => void;
  closeGuestForm: () => void;
  addToCart: (producto: Producto, cantidad?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isGuestFormOpen, setIsGuestFormOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Carga el carrito guardado una sola vez, al montar en el navegador.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage bloqueado o corrupto — arranca con carrito vacío.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignorar — el carrito sigue funcionando en memoria aunque no persista.
    }
  }, [items, hydrated]);

  useEffect(() => {
    if (!toastMsg) return;
    const id = setTimeout(() => setToastMsg(null), 2600);
    return () => clearTimeout(id);
  }, [toastMsg]);

  const addToCart = useCallback((producto: Producto, cantidad = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === producto.id);
      if (existing) {
        return prev.map((i) => (i.id === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i));
      }
      return [
        ...prev,
        { id: producto.id, nombre: producto.nombre, precio: producto.precio, imagen_url: producto.imagen_url, cantidad },
      ];
    });
    setToastMsg("Producto agregado al carrito");
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, cantidad: number) => {
    setItems((prev) => {
      if (cantidad <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, cantidad } : i));
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const cartCount = useMemo(() => items.reduce((s, i) => s + i.cantidad, 0), [items]);
  const cartTotal = useMemo(() => items.reduce((s, i) => s + i.precio * i.cantidad, 0), [items]);

  const value: CartContextValue = {
    items,
    cartCount,
    cartTotal,
    toastMsg,
    isCartOpen,
    isGuestFormOpen,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    openGuestForm: () => setIsGuestFormOpen(true),
    closeGuestForm: () => setIsGuestFormOpen(false),
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
