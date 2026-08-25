/* =====================================================================
   CART.JS — carrito persistido en localStorage + checkout real contra
   Supabase (crea filas en `pedidos`/`pedido_items` vía RPC — `crear_pedido`
   si hay sesión con perfil completo, `crear_pedido_invitado` si no, ver
   sql/crear_pedido.sql y sql/crear_pedido_invitado.sql) y de paso abre
   WhatsApp con el resumen para avisar de inmediato.
   Depende de ui.js, de auth.js (window.clienteListo/getClienteActual)
   y de window._getProductById (definido en catalog.js).
===================================================================== */

// ⚠️ Número de WhatsApp del negocio (formato internacional, sin +).
const WHATSAPP_NUMBER = '573107992293';

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

/** Punto de entrada del botón "Confirmar pedido". */
function confirmarPedido() {
  if (!cart.length) { showToast('Tu carrito está vacío', 'warning'); return; }

  if (window.clienteListo && clienteListo()) {
    crearPedidoConCuenta();
  } else {
    abrirCheckoutInvitado();
  }
}

/** Cliente con sesión y perfil completo: usa su ficha de `clientes` ya existente. */
async function crearPedidoConCuenta() {
  if (_checkoutEnCurso) return;
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
    finalizarPedidoExitoso(pedido);
  } catch (e) {
    console.error(e);
    showToast(e.message || 'No se pudo crear el pedido. Intenta de nuevo.', 'error');
  } finally {
    _checkoutEnCurso = false;
  }
}

/* ============================================================
   CHECKOUT DE INVITADO (sin cuenta) — nombre + dirección y listo.
============================================================ */
function abrirCheckoutInvitado() {
  toggleCart(false);
  document.getElementById('guestCheckoutMsg').textContent = '';
  document.getElementById('guestCheckoutOverlay').classList.add('open');
}

function cerrarCheckoutInvitado() {
  document.getElementById('guestCheckoutOverlay').classList.remove('open');
}

async function enviarPedidoInvitado() {
  if (_checkoutEnCurso) return;
  const nombre = document.getElementById('guestNombre').value.trim();
  const telefono = document.getElementById('guestTelefono').value.trim();
  const direccion = document.getElementById('guestDireccion').value.trim();
  const msgEl = document.getElementById('guestCheckoutMsg');

  if (!nombre || !direccion) {
    msgEl.textContent = 'Completa al menos tu nombre y dirección.';
    return;
  }

  _checkoutEnCurso = true;
  msgEl.textContent = 'Enviando pedido...';
  try {
    const p_items = cart.map(item => ({ producto_id: item.id, cantidad: item.qty }));
    const { data: pedido, error } = await window._sb.rpc('crear_pedido_invitado', {
      p_nombre: nombre,
      p_telefono: telefono || null,
      p_direccion: direccion,
      p_items
    });
    if (error) throw error;
    cerrarCheckoutInvitado();
    finalizarPedidoExitoso(pedido);
  } catch (e) {
    console.error(e);
    msgEl.textContent = e.message || 'No se pudo crear el pedido. Intenta de nuevo.';
  } finally {
    _checkoutEnCurso = false;
  }
}

/** Común a ambos flujos: arma el mensaje de WhatsApp con el carrito (antes de vaciarlo), avisa y limpia. */
function finalizarPedidoExitoso(pedido) {
  let lines = [`Hola, acabo de hacer el pedido #${pedido.numero_pedido} en DentiBox:`, ''];
  cart.forEach(item => {
    const p = window._getProductById(item.id);
    if (!p) return;
    lines.push(`• ${p.nombre} x${item.qty} — ${formatCOP(p.precio * item.qty)}`);
  });
  lines.push('', `Total: ${formatCOP(cartTotal())}`);
  const text = encodeURIComponent(lines.join('\n'));

  cart = [];
  saveCart();
  updateCartUI();
  toggleCart(false);
  showToast(`Pedido #${pedido.numero_pedido} confirmado`, 'success');

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
window.confirmarPedido = confirmarPedido;
window.abrirCheckoutInvitado = abrirCheckoutInvitado;
window.cerrarCheckoutInvitado = cerrarCheckoutInvitado;
window.enviarPedidoInvitado = enviarPedidoInvitado;
