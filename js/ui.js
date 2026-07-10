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

/* =====================================================================
   ROUTING — cada página tiene su propia URL real (history API), para
   que se pueda entrar directo, refrescar o compartir el link. Requiere
   que el hosting sirva index.html para cualquier ruta (ver _redirects,
   pensado para Cloudflare Pages).
===================================================================== */
const PAGE_PATHS = { inicio: '/', tienda: '/catalogo', contacto: '/contacto', cuenta: '/cuenta', admin: '/admin' };
const PATH_PAGES = { '': 'inicio', catalogo: 'tienda', contacto: 'contacto', cuenta: 'cuenta', admin: 'admin' };

function pathForPage(pageId, extra) {
  const base = PAGE_PATHS[pageId] || '/';
  if (!extra) return base;
  return (base === '/' ? '' : base) + '/' + extra;
}

/** Lee location.pathname y devuelve a qué página/ítem corresponde. */
function resolveRoute() {
  const parts = location.pathname.split('/').filter(Boolean);
  const pageId = PATH_PAGES[parts[0] || ''] || 'inicio';
  return { pageId, extra: parts[1] || null };
}

/** Navegación entre "páginas" (SPA de una sola página HTML) + URL real. */
function goToPage(pageId, opts = {}) {
  const { extra = null, updateUrl = true } = opts;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageId);
  });
  document.getElementById('mobileMenu')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

  if (pageId === 'tienda' && window.renderCatalog) renderCatalog();
  if (pageId === 'cuenta' && window.renderCuentaPage) renderCuentaPage();

  if (updateUrl) {
    const path = pathForPage(pageId, extra);
    if (location.pathname !== path) history.pushState({ pageId, extra }, '', path);
  }
}

/** Handler de clic para <a> internos: SPA en clic normal, deja abrir en pestaña nueva con ctrl/cmd/clic central. */
function navClick(e, pageId, extra) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
  e.preventDefault();
  if (pageId === 'tienda' && extra && window.openDetail) { openDetail(extra); return; }
  goToPage(pageId, { extra });
}

window.addEventListener('popstate', () => {
  const { pageId, extra } = resolveRoute();
  goToPage(pageId, { updateUrl: false });
  if (pageId === 'tienda' && extra && window.openDetail) openDetail(extra, { updateUrl: false });
  else window.closeDetail && closeDetail({ updateUrl: false });
});

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
window.navClick = navClick;
window.pathForPage = pathForPage;
window.resolveRoute = resolveRoute;
window.toggleMobileMenu = toggleMobileMenu;
