"use client";

import { useCart } from "./CartContext";

export function Toast() {
  const { toastMsg } = useCart();
  return (
    <div
      className={`fixed bottom-7 left-1/2 z-[9999] -translate-x-1/2 rounded-full bg-navy px-6 py-3 text-sm font-medium text-white shadow-lift transition-all duration-300 ${
        toastMsg ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      {toastMsg}
    </div>
  );
}
