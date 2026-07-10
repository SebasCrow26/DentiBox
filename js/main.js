/* =====================================================================
   MAIN.JS — punto de entrada. Se ejecuta cuando el DOM y Supabase
   (evento 'supabase-ready' disparado por supabase-config.js) están listos.
   El panel admin corre en modo demo (js/mock-data.js) y todavía no
   depende de Supabase, así que se inicializa de inmediato.
===================================================================== */

if (document.getElementById('adminLoginBox')) initAdminAuth();

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
