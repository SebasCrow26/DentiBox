"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

export default function ContactoPage() {
  const [nombre, setNombre] = useState("");
  const [mensaje, setMensaje] = useState("");

  function enviar() {
    if (!mensaje.trim()) return;
    const texto = encodeURIComponent(`Hola, soy ${nombre.trim() || "un cliente"}.\n\n${mensaje.trim()}`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${texto}`, "_blank");
  }

  return (
    <div className="mx-auto max-w-[520px] px-[5%] py-12">
      <span className="mb-2 block font-mono text-[0.7rem] uppercase tracking-wide text-deep">Contacto</span>
      <h2 className="mb-2 text-2xl font-bold">Escríbenos</h2>
      <p className="mb-6 text-[0.9rem] text-muted">Respondemos por WhatsApp en horario de oficina.</p>

      <div className="rounded-lg border border-border bg-surface p-6">
        <label className="mb-1.5 block text-[0.8rem] font-semibold">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          className="mb-4 w-full rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem] outline-none focus:border-deep"
        />
        <label className="mb-1.5 block text-[0.8rem] font-semibold">Mensaje</label>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          rows={4}
          placeholder="¿En qué te podemos ayudar?"
          className="mb-4 w-full rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem] outline-none focus:border-deep"
        />
        <button
          onClick={enviar}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[0.92rem] font-semibold text-white hover:bg-deep"
        >
          <MessageCircle size={18} /> Enviar por WhatsApp
        </button>
      </div>
    </div>
  );
}
