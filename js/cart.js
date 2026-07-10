/* =====================================================================
   CART.JS — carrito persistido en localStorage + checkout vía WhatsApp.
   Depende de ui.js y de window._getProductById (definido en catalog.js).
===================================================================== */

// ⚠️ Reemplaza por el número de WhatsApp del negocio (formato internacional, sin +).
const WHATSAPP_NUMBER = '573000000000';

let cart = [];

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

/** Arma el mensaje de pedido y abre WhatsApp. No procesa pagos: solo formaliza el pedido. */
function checkoutWhatsApp() {
  if (!cart.length) { showToast('Tu carrito está vacío', 'warning'); return; }
  let lines = ['Hola, quiero hacer este pedido:', ''];
  cart.forEach(item => {
    const p = window._getProductById(item.id);
    if (!p) return;
    lines.push(`• ${p.nombre} x${item.qty} — ${formatCOP(p.precio * item.qty)}`);
  });
  lines.push('', `Total: ${formatCOP(cartTotal())}`);
  const text = encodeURIComponent(lines.join('\n'));
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
}

window.cart = cart;
window.loadCart = loadCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeCartQty = changeCartQty;
window.clearCart = clearCart;
window.updateCartUI = updateCartUI;
window.toggleCart = toggleCart;
window.checkoutWhatsApp = checkoutWhatsApp;
