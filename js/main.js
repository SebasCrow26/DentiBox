/* =====================================================================
   MAIN.JS — punto de entrada. Se ejecuta cuando el DOM y Supabase
   (evento 'supabase-ready' disparado por supabase-config.js) están listos.
   El panel admin se gatea desde auth.js (renderAdminGate, llamado en
   cada cambio de sesión) — no necesita inicialización aparte aquí.
===================================================================== */

async function initApp() {
  loadCart();
  await loadProducts();
  initClienteAuth();
  updateCartUI();

  // Muestra la página real de la URL con la que se entró (deep link / refresh),
  // en vez de arrancar siempre en "inicio".
  const { pageId, extra } = resolveRoute();
  goToPage(pageId, { extra, updateUrl: false });
  if (pageId === 'tienda' && extra) openDetail(extra, { updateUrl: false });
  setupScrollAnimations();
}

if (window._sb) {
  // Supabase ya estaba listo (poco probable, pero por si acaso)
  initApp();
} else {
  window.addEventListener('supabase-ready', initApp, { once: true });
}

// Cierre de modales con la tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  window.closeDetail && closeDetail();
  document.getElementById('facturaOverlay')?.classList.remove('open');
  window.toggleCart && window.toggleCart(false);
});
