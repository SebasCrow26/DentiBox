/* =====================================================================
   SUPABASE-CONFIG.JS — configuración e inicialización del cliente.

   1) Reemplaza SUPABASE_URL y SUPABASE_ANON_KEY por los de tu proyecto:
      Supabase → Project Settings (engranaje) → API
        - "Project URL"            → SUPABASE_URL
        - "anon public" (API Key)  → SUPABASE_ANON_KEY
      La anon key es pública a propósito (viaja al navegador del
      cliente); la seguridad real la dan las políticas RLS que ya
      escribimos en las tablas, no esta llave.

   2) Este archivo carga la librería @supabase/supabase-js desde CDN
      como <script> normal (no type="module"), para mantener el mismo
      patrón que el resto del proyecto (ui.js, cart.js, etc. tampoco
      son módulos). Por eso en index.html va DESPUÉS del <script> que
      trae la librería y ANTES de ui.js/cart.js/catalog.js/admin.js.

   3) Expone window._sb como el cliente ya inicializado. El resto de
      archivos lo usan así:
        const { data, error } = await window._sb.from('productos').select('*');
      También dispara el evento 'supabase-ready' para que main.js sepa
      cuándo puede arrancar la app (igual que hacía 'firebase-ready').
===================================================================== */

const SUPABASE_URL = 'https://jhmqvuxarimkndrpdlbf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zSINM2nnxevFftcyyiVhaw_PWkGyNn2';

if (!window.supabase || !window.supabase.createClient) {
  console.error('No se encontró la librería de Supabase. Revisa que el <script> del CDN esté antes de supabase-config.js en index.html.');
} else if (!SUPABASE_ANON_KEY) {
  console.error('Falta configurar SUPABASE_ANON_KEY en js/supabase-config.js.');
} else {
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // A partir de aquí, window.supabase deja de ser la librería cruda y
  // pasa a ser el cliente ya conectado (patrón estándar de los ejemplos
  // de Supabase). window._sb queda como alias explícito por claridad.
  window.supabase = client;
  window._sb = client;

  window.dispatchEvent(new Event('supabase-ready'));
}
