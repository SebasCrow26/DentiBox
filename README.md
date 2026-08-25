# DentiBox

Depósito digital de insumos odontológicos: catálogo con categorías, carrito,
checkout sin cuenta obligatoria (nombre + dirección, y aviso automático por
WhatsApp), cuenta opcional para no volver a llenar el formulario, y panel de
administración. Next.js 15 (App Router) + TypeScript + Tailwind + Supabase,
mismo stack que Bodega Cómpralo Colombia y SanMiguel.

## Estructura

```
DentiBox/
├── app/            ← rutas reales (cada carpeta = una URL)
│   ├── page.tsx           inicio = catálogo (banner arriba + productos)
│   ├── catalogo/[id]/       detalle de un producto (modal sobre el catálogo)
│   ├── contacto/, cuenta/, admin/
│   └── api/admin/cloudinary-signature/   firma subidas de fotos (solo admin)
├── components/     ← UI, incluye components/admin/ (panel)
├── lib/            ← Supabase (client/server), productos, pedidos, whatsapp, cloudinary
├── middleware.ts    ← refresca la sesión de Supabase en cada request
└── sql/            ← todo el SQL para pegar en Supabase (ver abajo)
```

## 1. Configurar Supabase

1. Copia `.env.local.example` a `.env.local` y llena `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).
2. En el SQL Editor de Supabase, corre en orden todo lo que hay en `sql/`:
   - `crear_pedido.sql` — checkout de un cliente con cuenta.
   - `crear_pedido_invitado.sql` — checkout sin cuenta (invitado).
   - `profiles_and_admin.sql` — tabla `profiles` + gate de admin (reemplaza el correo fijo de antes por una columna `is_admin`; al final del archivo se promueve automáticamente a `sebastian.ramos26122005@gmail.com`).
3. Para dar acceso de admin a alguien más en el futuro: que se registre primero, luego `update public.profiles set is_admin = true where email = '...'`.

## 2. Configurar Cloudinary

Las fotos de producto se suben desde el panel admin con **firma del servidor** (más seguro que un preset sin firmar): el navegador pide una firma a `/api/admin/cloudinary-signature` (que revisa que seas admin) y sube directo a Cloudinary.

1. Dashboard de Cloudinary → copia Cloud name, API key y API secret.
2. Ponlos en `.env.local`: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (este último **nunca** lleva el prefijo `NEXT_PUBLIC_`).

## 3. Correr en local

```bash
npm install       # usa --legacy-peer-deps automáticamente (ver .npmrc)
npm run dev
```

Abre `http://localhost:3000`.

## 4. Desplegar en Cloudflare Pages

El dominio ya configurado es `dentibox.pages.dev`.

```bash
npm run pages:build      # compila con @cloudflare/next-on-pages
npm run pages:preview    # sirve ese build localmente con wrangler
```

Nota: `@cloudflare/next-on-pages` es poco confiable corriendo en Windows directo
(su propio CLI lo advierte) — si falla localmente con `spawn npx ENOENT`, no es
un problema del código: usa WSL, o simplemente conecta el repo a Cloudflare
Pages desde su dashboard y deja que el build corra allá (Linux), que es como
se despliega en la práctica.

## WhatsApp y checkout

`lib/whatsapp.ts` arma el link `wa.me` con el resumen del pedido. El botón
"Confirmar pedido" del carrito:
- si hay sesión con perfil completo → usa la RPC `crear_pedido` (tu ficha de cliente ya existe).
- si no → pide nombre + dirección (teléfono opcional) y usa `crear_pedido_invitado`, que crea la ficha de cliente y el pedido en un solo paso.

En ambos casos el pedido queda guardado en Supabase (con stock descontado de forma atómica) **y además** se abre WhatsApp para avisar de inmediato — no reemplaza uno al otro.
