/* =====================================================================
   UI.JS — utilidades compartidas: toast, escape de HTML, formato $.
   Sin dependencias. Debe cargarse ANTES que catalog.js / cart.js / admin.js
===================================================================== */

/** Escapa texto de usuario antes de insertarlo en innerHTML. Previene XSS. */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Formatea un número como pesos colombianos. */
function formatCOP(n) {
  const num = Number(n) || 0;
  return '$' + num.toLocaleString('es-CO');
}

/** Muestra un toast temporal. type: 'success' | 'error' | 'warning' | '' */
function showToast(msg, type = '') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { el.classList.remove('show'); }, 2600);
}

/** Navegación simple entre "páginas" (SPA de una sola página HTML). */
function goToPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageId);
  });
  document.getElementById('mobileMenu')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function toggleMobileMenu() {
  document.getElementById('mobileMenu')?.classList.toggle('open');
}

/** Formatea un ISO string como fecha/hora corta en español. */
function formatDateEs(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) + ' · ' +
    d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

window.escapeHtml = escapeHtml;
window.formatCOP = formatCOP;
window.formatDateEs = formatDateEs;
window.showToast = showToast;
window.goToPage = goToPage;
window.toggleMobileMenu = toggleMobileMenu;
