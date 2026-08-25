"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function iniciarSesion() {
    const supabase = createClient();
    if (!supabase) return;
    if (!email || !password) { setMsg("Completa correo y contraseña."); return; }
    setMsg("Ingresando...");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMsg(error ? error.message : "");
  }

  async function registrarse() {
    const supabase = createClient();
    if (!supabase) return;
    if (!email || !password) { setMsg("Completa correo y contraseña."); return; }
    if (password.length < 6) { setMsg("La contraseña debe tener al menos 6 caracteres."); return; }
    setMsg("Creando cuenta...");
    const { error } = await supabase.auth.signUp({ email, password });
    setMsg(error ? error.message : "Cuenta creada. Revisa tu correo si se requiere confirmación.");
  }

  async function conGoogle() {
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setMsg(error.message);
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <label className="mb-1.5 block text-[0.8rem] font-semibold">Correo</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tucorreo@consultorio.com"
        className="mb-4 w-full rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem] outline-none focus:border-deep"
      />
      <label className="mb-1.5 block text-[0.8rem] font-semibold">Contraseña</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        className="mb-2 w-full rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[0.88rem] outline-none focus:border-deep"
      />
      <p className="mb-2 min-h-[1.1em] text-[0.72rem] text-muted-light">{msg}</p>
      <div className="mb-2.5 flex gap-2.5">
        <button onClick={iniciarSesion} className="flex-1 rounded-full bg-ink py-3 text-[0.88rem] font-semibold text-white hover:bg-deep">
          Ingresar
        </button>
        <button onClick={registrarse} className="flex-1 rounded-full border border-border-strong py-3 text-[0.88rem] font-semibold hover:border-deep hover:text-deep">
          Crear cuenta
        </button>
      </div>
      <button
        onClick={conGoogle}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-border-strong py-3 text-[0.88rem] font-semibold hover:border-deep hover:text-deep"
      >
        Continuar con Google
      </button>
    </div>
  );
}
