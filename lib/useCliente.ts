import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getMyCliente, isClienteListo, type Cliente } from "@/lib/clientes";
import { getMyProfile, type Profile } from "@/lib/profiles";

/** Sesión de cliente reactiva — sigue los cambios de auth, su ficha en `clientes` y su `profiles.is_admin`. */
export function useCliente() {
  const [user, setUser] = useState<User | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    async function loadCliente(currentUser: User | null) {
      setUser(currentUser);
      if (!currentUser) {
        setCliente(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      const [c, p] = await Promise.all([
        getMyCliente(supabase!, currentUser.id),
        getMyProfile(supabase!, currentUser.id),
      ]);
      setCliente(c);
      setProfile(p);
      setLoading(false);
    }

    supabase.auth.getUser().then(({ data }) => loadCliente(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      loadCliente(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    user,
    cliente,
    profile,
    loading,
    clienteListo: isClienteListo(cliente),
    esAdmin: !!profile?.is_admin,
  };
}
