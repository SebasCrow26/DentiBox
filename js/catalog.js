/* =====================================================================
   CATALOG.JS — lee productos desde Supabase (tabla "productos") y
   renderiza el grid de la tienda + el modal de detalle. Se suscribe a
   cambios en tiempo real para que el stock se actualice para todos los
   clientes sin recargar la página.
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

/** Adapta una fila de la tabla `productos` al formato que usa el catálogo. */
function mapProductoRow(row) {
  return { ...row, imagen: row.imagen_url };
}

async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="empty-state"><i class="ti ti-loader-2"></i><p>Cargando productos...</p></div>';
  try {
    const { data, error } = await window._sb
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    allProducts = data.map(mapProductoRow);
    renderCatalog();
    subscribeToStockChanges();
  } catch (e) {
    console.error(e);
    grid.innerHTML = '<div class="empty-state"><i class="ti ti-alert-triangle"></i><p>No se pudieron cargar los productos. Intenta de nuevo más tarde.</p></div>';
  }
}

/** Escucha INSERT/UPDATE/DELETE en `productos` para reflejar stock e inventario en tiempo real. */
function subscribeToStockChanges() {
  if (window._productosChannel) return; // ya suscrito
  window._productosChannel = window._sb
    .channel('productos-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, (payload) => {
      if (payload.eventType === 'DELETE') {
        allProducts = allProducts.filter(p => p.id !== payload.old.id);
      } else {
        const row = mapProductoRow(payload.new);
        if (!row.activo) {
          allProducts = allProducts.filter(p => p.id !== row.id);
        } else {
          const idx = allProducts.findIndex(p => p.id === row.id);
          if (idx > -1) allProducts[idx] = row; else allProducts.unshift(row);
        }
      }
      renderCatalog();
      updateCartUI();
    })
    .subscribe();
}

function renderCatalog() {
  const grid = document.getElementById('productsGrid');
  const label = document.getElementById('resultLabel');
  if (!grid) return;

  let filtered = allProducts.slice();
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
