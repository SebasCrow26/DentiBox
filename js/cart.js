/* =====================================================================
   CART.JS — carrito persistido en localStorage + checkout real contra
   Supabase (crea filas en `pedidos`/`pedido_items` vía la función RPC
   `crear_pedido`, ver sql/crear_pedido.sql).
   Depende de ui.js, de auth.js (window.clienteListo/getClienteActual)
   y de window._getProductById (definido en catalog.js).
===================================================================== */

let cart = [];
let _checkoutEnCurso = false;

function loadCart() {
  try {
    const s = localStorage.getItem('dentibox_cart');
    cart = s ? JSON.parse(s) : [];
  } catch (e) { cart = []; }
}

function saveCart() {
  try { localStorage.setItem('dentibox_cart', JSON.stringify(cart)); } catch (e) {}
}

function addToCart(productId, qty = 1) {
  const existing = cart.find(i => i.id === productId);
  if (existing) existing.qty += qty;
  else cart.push({ id: productId, qty });
  saveCart();
  updateCartUI();
  const count = document.getElementById('cartCount');
  if (count) { count.classList.remove('pop'); void count.offsetWidth; count.classList.add('pop'); }
  showToast('Producto agregado al carrito', 'success');
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  updateCartUI();
}

function changeCartQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(productId); return; }
  saveCart();
  updateCartUI();
}

function clearCart() {
  if (cart.length && !confirm('¿Vaciar el carrito?')) return;
  cart = [];
  saveCart();
  updateCartUI();
}

function cartTotal() {
  return cart.reduce((sum, item) => {
    const p = window._getProductById(item.id);
    return sum + (p ? p.precio * item.qty : 0);
  }, 0);
}

function updateCartUI() {
  const countEl = document.getElementById('cartCount');
  const itemsWrap = document.getElementById('cartItemsWrap');
  const totalEl = document.getElementById('cartTotal');
  const totalCount = cart.reduce((s, i) => s + i.qty, 0);
  if (countEl) countEl.textContent = totalCount;
  if (totalEl) totalEl.textContent = formatCOP(cartTotal());
  if (!itemsWrap) return;

  if (!cart.length) {
    itemsWrap.innerHTML = `<div class="cart-empty-state"><i class="ti ti-shopping-cart-off"></i><p>Tu carrito está vacío.</p></div>`;
    return;
  }

  itemsWrap.innerHTML = cart.map(item => {
    const p = window._getProductById(item.id);
    if (!p) return '';
    const img = p.imagen ? `<img src="${escapeHtml(p.imagen)}" alt="">` : `<i class="ti ti-dental"></i>`;
    return `
    <div class="cart-item">
      <div class="ci-thumb">${img}</div>
      <div class="ci-info">
        <h4>${escapeHtml(p.nombre)}</h4>
        <span class="ci-price">${formatCOP(p.precio)}</span>
      </div>
      <div class="ci-qty-ctrl">
        <button class="ci-qty-btn" onclick="changeCartQty('${p.id}',-1)">−</button>
        <span class="ci-qty-num">${item.qty}</span>
        <button class="ci-qty-btn" onclick="changeCartQty('${p.id}',1)">+</button>
      </div>
      <button class="cart-remove" onclick="removeFromCart('${p.id}')"><i class="ti ti-trash"></i></button>
    </div>`;
  }).join('');
}

function toggleCart(forceOpen) {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  const open = forceOpen !== undefined ? forceOpen : !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', open);
  overlay.classList.toggle('open', open);
  if (open) updateCartUI();
}

/** Crea el pedido real en Supabase (pedidos + pedido_items) vía RPC. */
async function confirmarPedido() {
  if (_checkoutEnCurso) return;
  if (!cart.length) { showToast('Tu carrito está vacío', 'warning'); return; }

  if (!window.clienteListo || !clienteListo()) {
    showToast('Inicia sesión y completa tu perfil para poder comprar', 'warning');
    toggleCart(false);
    goToPage('cuenta');
    return;
  }

  _checkoutEnCurso = true;
  showToast('Enviando pedido...', '');
  try {
    const { cliente } = getClienteActual();
    const p_items = cart.map(item => ({ producto_id: item.id, cantidad: item.qty }));
    const { data: pedido, error } = await window._sb.rpc('crear_pedido', {
      p_cliente_id: cliente.id,
      p_items
    });
    if (error) throw error;

    cart = [];
    saveCart();
    updateCartUI();
    toggleCart(false);
    showToast(`Pedido #${pedido.numero_pedido} confirmado`, 'success');
  } catch (e) {
    console.error(e);
    showToast(e.message || 'No se pudo crear el pedido. Intenta de nuevo.', 'error');
  } finally {
    _checkoutEnCurso = false;
  }
}

window.cart = cart;
window.loadCart = loadCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeCartQty = changeCartQty;
window.clearCart = clearCart;
window.updateCartUI = updateCartUI;
window.toggleCart = toggleCart;
window.confirmarPedido = confirmarPedido;
