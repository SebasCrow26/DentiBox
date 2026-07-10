/* =====================================================================
   MAIN.JS — punto de entrada. Se ejecuta cuando el DOM y Supabase
   (evento 'supabase-ready' disparado por supabase-config.js) están listos.
   El panel admin se gatea desde auth.js (renderAdminGate, llamado en
   cada cambio de sesión) — no necesita inicialización aparte aquí.
===================================================================== */

function initApp() {
  loadCart();
  loadProducts();
  initClienteAuth();
  updateCartUI();
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
  document.getElementById('detailOverlay')?.classList.remove('open');
  document.getElementById('facturaOverlay')?.classList.remove('open');
  window.toggleCart && window.toggleCart(false);
});
