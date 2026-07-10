/* =====================================================================
   MAIN.JS — punto de entrada. Se ejecuta cuando el DOM y Firebase
   (evento 'firebase-ready' disparado por firebase-config.js) están listos.
===================================================================== */

function initApp() {
  loadCart();
  loadProducts();
  updateCartUI();
  if (document.getElementById('adminLoginBox')) initAdminAuth();
}

if (window._fbDb) {
  // Firebase ya estaba listo (poco probable, pero por si acaso)
  initApp();
} else {
  window.addEventListener('firebase-ready', initApp, { once: true });
}

// Cierre de modales con la tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  document.getElementById('detailOverlay')?.classList.remove('open');
  window.toggleCart && window.toggleCart(false);
});
