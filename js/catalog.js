/* =====================================================================
   CATALOG.JS — lee productos desde Firestore (colección "productos")
   y renderiza el grid de la tienda + el modal de detalle.
   Depende de ui.js (escapeHtml, formatCOP, showToast) y de cart.js
   (window.addToCart) ya cargados antes que este archivo.
===================================================================== */

let allProducts = [];
let activeCategory = 'todos';
let searchTerm = '';
let detailQty = 1;
let currentDetailProduct = null;

/** Icono por categoría (Tabler Icons) — se usa si el producto no tiene imagen. */
const CATEGORY_ICONS = {
  restauracion: 'ti-flask',
  ortodoncia: 'ti-align-center',
  bioseguridad: 'ti-shield-check',
  instrumental: 'ti-tool',
  endodoncia: 'ti-file-analytics',
  consumibles: 'ti-package',
  default: 'ti-dental'
};

async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="empty-state"><i class="ti ti-loader-2"></i><p>Cargando productos...</p></div>';
  try {
    const { collection, getDocs, query, orderBy } = window._fbFns;
    const db = window._fbDb;
    const q = query(collection(db, 'productos'), orderBy('creadoEn', 'desc'));
    const snap = await getDocs(q);
    allProducts = [];
    snap.forEach(d => allProducts.push({ id: d.id, ...d.data() }));
    renderCatalog();
  } catch (e) {
    console.error(e);
    grid.innerHTML = '<div class="empty-state"><i class="ti ti-alert-triangle"></i><p>No se pudieron cargar los productos. Intenta de nuevo más tarde.</p></div>';
  }
}

function renderCatalog() {
  const grid = document.getElementById('productsGrid');
  const label = document.getElementById('resultLabel');
  if (!grid) return;

  let filtered = allProducts.filter(p => !p.oculto);
  if (activeCategory !== 'todos') filtered = filtered.filter(p => p.categoria === activeCategory);
  if (searchTerm.trim()) {
    const t = searchTerm.toLowerCase();
    filtered = filtered.filter(p => (p.nombre || '').toLowerCase().includes(t) || (p.descripcion || '').toLowerCase().includes(t));
  }

  if (label) label.textContent = `${filtered.length} producto${filtered.length === 1 ? '' : 's'}`;

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state"><i class="ti ti-search-off"></i><p>No encontramos productos con ese criterio.</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(p => productCardHtml(p)).join('');
}

function productCardHtml(p) {
  const icon = CATEGORY_ICONS[p.categoria] || CATEGORY_ICONS.default;
  const img = p.imagen
    ? `<img src="${escapeHtml(p.imagen)}" alt="${escapeHtml(p.nombre)}" loading="lazy">`
    : `<i class="ti ${icon}"></i>`;
  const badge = p.oferta ? '<span class="prod-badge oferta">Oferta</span>'
    : p.nuevo ? '<span class="prod-badge nuevo">Nuevo</span>' : '';
  const oldPrice = p.precioAnterior ? `<span class="old">${formatCOP(p.precioAnterior)}</span>` : '';

  return `
  <div class="prod-card" onclick="openDetail('${p.id}')">
    ${badge}
    <div class="prod-img">${img}</div>
    <div class="prod-body">
      <span class="prod-ref">REF-${escapeHtml(p.id.slice(0, 6).toUpperCase())}</span>
      <h3>${escapeHtml(p.nombre)}</h3>
      <p class="prod-desc">${escapeHtml((p.descripcion || '').slice(0, 70))}</p>
      <div class="prod-footer">
        <div class="prod-price">${oldPrice}<span class="current">${formatCOP(p.precio)}</span></div>
        <button class="add-btn" onclick="event.stopPropagation();addToCart('${p.id}',1)"><i class="ti ti-plus"></i> Agregar</button>
      </div>
    </div>
  </div>`;
}

function setActiveCategory(cat, btnEl) {
  activeCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderCatalog();
}

function handleSearch(value) {
  searchTerm = value;
  renderCatalog();
}

/* ===== MODAL DE DETALLE ===== */
function openDetail(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  currentDetailProduct = p;
  detailQty = 1;

  const icon = CATEGORY_ICONS[p.categoria] || CATEGORY_ICONS.default;
  document.getElementById('detailImgCol').innerHTML = p.imagen
    ? `<img src="${escapeHtml(p.imagen)}" alt="${escapeHtml(p.nombre)}">`
    : `<i class="ti ${icon}"></i>`;
  document.getElementById('detailRef').textContent = `REF-${p.id.slice(0, 6).toUpperCase()} · ${p.categoria || 'General'}`;
  document.getElementById('detailTitle').textContent = p.nombre;
  document.getElementById('detailDesc').textContent = p.descripcion || 'Sin descripción disponible.';
  document.getElementById('detailPriceCurrent').textContent = formatCOP(p.precio);
  const oldEl = document.getElementById('detailPriceOld');
  if (p.precioAnterior) { oldEl.textContent = formatCOP(p.precioAnterior); oldEl.style.display = 'inline'; }
  else { oldEl.style.display = 'none'; }
  document.getElementById('detailQtyVal').textContent = detailQty;

  document.getElementById('detailOverlay').classList.add('open');
}

function closeDetail() {
  document.getElementById('detailOverlay').classList.remove('open');
  currentDetailProduct = null;
}

function detailQtyChange(delta) {
  detailQty = Math.max(1, detailQty + delta);
  document.getElementById('detailQtyVal').textContent = detailQty;
}

function addDetailToCart() {
  if (!currentDetailProduct) return;
  addToCart(currentDetailProduct.id, detailQty);
  closeDetail();
}

window.loadProducts = loadProducts;
window.renderCatalog = renderCatalog;
window.setActiveCategory = setActiveCategory;
window.handleSearch = handleSearch;
window.openDetail = openDetail;
window.closeDetail = closeDetail;
window.detailQtyChange = detailQtyChange;
window.addDetailToCart = addDetailToCart;
window._getProductById = id => allProducts.find(p => p.id === id);
