/* =====================================================================
   ADMIN.JS — panel de administración.
   MODO DEMO: por ahora todo corre contra js/mock-data.js (datos en
   memoria) para que puedas probar la cola de pedidos, clientes,
   promociones y analítica en Live Server, sin backend.
   Cuando conectemos Supabase, el login pasará a usar Supabase Auth y
   cada función DB.* de mock-data.js se reemplaza por su equivalente
   con await supabase.from(...). La forma de las funciones de abajo
   (loadX / renderX) ya está pensada para que ese cambio sea quirúrgico.
===================================================================== */

let editingProductId = null;
let editingClienteId = null;
let editingPromoId = null;
let _adminLoggedIn = false;

/* ============================================================
   LOGIN (demo)
============================================================ */
function initAdminAuth() {
  const loginBox = document.getElementById('adminLoginBox');
  const panel = document.getElementById('adminPanelWrap');
  if (_adminLoggedIn) {
    loginBox.style.display = 'none';
    panel.style.display = 'block';
    renderAllAdminPanels();
  } else {
    loginBox.style.display = 'block';
    panel.style.display = 'none';
  }
}

function adminLogin() {
  const email = document.getElementById('adminEmail').value.trim();
  const pass = document.getElementById('adminPassword').value;
  const msgEl = document.getElementById('adminLoginMsg');
  if (!email || !pass) { msgEl.textContent = 'Completa correo y contraseña.'; return; }
  // MODO DEMO: cualquier correo/contraseña entra. Esto se reemplaza por
  // Supabase Auth cuando migremos.
  _adminLoggedIn = true;
  document.getElementById('adminUserEmail').textContent = email + ' (modo demo)';
  msgEl.textContent = '';
  initAdminAuth();
}

function adminLogout() {
  _adminLoggedIn = false;
  initAdminAuth();
  showToast('Sesión cerrada', 'success');
}

function renderAllAdminPanels() {
  renderQueue();
  renderClientes();
  loadAdminProducts();
  renderPromos();
  populatePromoProductSelect();
  renderAnalitica();
}

/* ============================================================
   TABS
============================================================ */
function switchAdminTab(tab, btnEl) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  btnEl.classList.add('active');
  document.getElementById('adminTab-' + tab).classList.add('active');
  if (tab === 'analitica') renderAnalitica();
}

/* ============================================================
   COLA DE PEDIDOS (orden de llegada, FIFO)
============================================================ */
let pedidosSearchTerm = '';

function renderQueue() {
  const wrap = document.getElementById('queueList');
  if (!wrap) return;
  let pedidos = DB.pedidosOrdenLlegada();

  if (pedidosSearchTerm.trim()) {
    const t = pedidosSearchTerm.toLowerCase();
    pedidos = pedidos.filter(p => {
      const c = DB.getCliente(p.cliente_id);
      return c && c.nombre.toLowerCase().includes(t);
    });
  }

  if (!pedidos.length) {
    wrap.innerHTML = '<div class="empty-state"><i class="ti ti-clipboard-off"></i><p>No hay pedidos que coincidan con la búsqueda.</p></div>';
    return;
  }

  wrap.innerHTML = pedidos.map(p => queueCardHtml(p)).join('');
}

function handleQueueSearch(value) {
  pedidosSearchTerm = value;
  renderQueue();
}

function queueCardHtml(pedido) {
  const cliente = DB.getCliente(pedido.cliente_id);
  const total = DB.totalPedido(pedido);
  const itemsHtml = pedido.items.map((it, idx) => {
    const prod = DB.getProducto(it.producto_id);
    if (!prod) return '';
    const disabled = pedido.estado === 'entregado' || pedido.estado === 'cancelado' ? 'disabled' : '';
    return `<div class="queue-item-row">
      <span class="queue-item-name">${escapeHtml(prod.nombre)}</span>
      <span class="queue-item-qty">x${it.cantidad}</span>
      <span>${formatCOP(prod.precio * it.cantidad)}</span>
      <button class="queue-item-remove" ${disabled} title="Quitar del pedido" onclick="removeQueueItem('${pedido.id}',${idx})"><i class="ti ti-x"></i></button>
    </div>`;
  }).join('');

  const nextEstado = { pendiente: 'alistado', alistado: 'entregado' }[pedido.estado];
  const nextLabel = { pendiente: 'Marcar alistado', alistado: 'Marcar entregado' }[pedido.estado];

  return `<div class="queue-card" id="queue-${pedido.id}">
    <div class="queue-card-header">
      <div class="queue-meta">
        <span class="queue-order-id">#${pedido.numero_pedido}</span>
        <span class="queue-client">${escapeHtml(cliente ? cliente.nombre : 'Cliente eliminado')}</span>
        <span class="badge-pill badge-origen">${pedido.origen === 'online' ? 'Online' : 'Presencial'}</span>
      </div>
      <div class="queue-meta">
        <span class="queue-time">${formatDateEs(pedido.created_at)}</span>
        <span class="badge-pill badge-${pedido.estado}">${pedido.estado}</span>
      </div>
    </div>
    <div class="queue-items">${itemsHtml || '<p class="form-hint">Sin productos (pedido vacío).</p>'}</div>
    <div class="queue-footer">
      <span class="queue-total">Total ${formatCOP(total)}</span>
      <div class="queue-actions">
        <button class="btn-sm" onclick="openFactura('${pedido.id}')"><i class="ti ti-printer"></i> Factura</button>
        ${pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' ? `
          <button class="btn-sm danger" onclick="cancelarPedido('${pedido.id}')"><i class="ti ti-ban"></i> Cancelar</button>
          <button class="btn-sm primary" onclick="setPedidoEstado('${pedido.id}','${nextEstado}')"><i class="ti ti-check"></i> ${nextLabel}</button>
        ` : ''}
      </div>
    </div>
  </div>`;
}

function setPedidoEstado(id, estado) {
  DB.actualizarEstadoPedido(id, estado);
  renderQueue();
  showToast(estado === 'entregado' ? 'Pedido marcado como entregado' : 'Pedido actualizado', 'success');
}

function cancelarPedido(id) {
  if (!confirm('¿Cancelar este pedido? El cliente deberá volver a pedir si aún lo necesita.')) return;
  DB.actualizarEstadoPedido(id, 'cancelado');
  renderQueue();
  showToast('Pedido cancelado', 'warning');
}

function removeQueueItem(pedidoId, idx) {
  if (!confirm('¿Quitar este producto del pedido? Úsalo cuando el cliente ya no lo necesite.')) return;
  DB.quitarItemDePedido(pedidoId, idx);
  renderQueue();
  showToast('Producto quitado del pedido', 'success');
}

/* ============================================================
   CLIENTES (CRM)
============================================================ */
let clientesSearchTerm = '';
let expandedClienteId = null;

function renderClientes() {
  const tbody = document.getElementById('adminClientesBody');
  if (!tbody) return;
  let clientes = [...DB.clientes];
  if (clientesSearchTerm.trim()) {
    const t = clientesSearchTerm.toLowerCase();
    clientes = clientes.filter(c => c.nombre.toLowerCase().includes(t));
  }
  if (!clientes.length) {
    tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Ningún cliente coincide con la búsqueda.</td></tr>';
    return;
  }
  let html = '';
  clientes.forEach(c => {
    const historial = DB.historialCliente(c.id);
    html += `<tr>
      <td>${escapeHtml(c.nombre)}</td>
      <td>${escapeHtml(c.telefono || '—')}</td>
      <td>${escapeHtml(c.email || '—')}</td>
      <td>${escapeHtml(c.direccion || '—')}</td>
      <td>${historial.length} pedido${historial.length === 1 ? '' : 's'}</td>
      <td style="white-space:nowrap;">
        <button class="admin-action-btn" onclick="toggleClienteHistorial('${c.id}')">Historial</button>
        <button class="admin-action-btn" onclick="startEditCliente('${c.id}')">Editar</button>
        <button class="admin-action-btn danger" onclick="deleteCliente('${c.id}')">Eliminar</button>
      </td>
    </tr>`;
    if (expandedClienteId === c.id) {
      html += `<tr class="client-history-row"><td colspan="6">
        <div class="client-history-wrap">
          ${historial.length ? `<table><thead><tr><th>Pedido</th><th>Fecha</th><th>Estado</th><th>Total</th></tr></thead><tbody>
            ${historial.map(p => `<tr><td>#${p.numero_pedido}</td><td>${formatDateEs(p.created_at)}</td><td><span class="badge-pill badge-${p.estado}">${p.estado}</span></td><td>${formatCOP(DB.totalPedido(p))}</td></tr>`).join('')}
          </tbody></table>` : '<p class="form-hint">Este cliente aún no tiene pedidos.</p>'}
        </div>
      </td></tr>`;
    }
  });
  tbody.innerHTML = html;
}

function handleClientesSearch(value) {
  clientesSearchTerm = value;
  renderClientes();
}

function toggleClienteHistorial(id) {
  expandedClienteId = expandedClienteId === id ? null : id;
  renderClientes();
}

function resetClienteForm() {
  editingClienteId = null;
  ['clNombre', 'clDireccion', 'clTelefono', 'clEmail', 'clFoto'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('clienteFormTitle').textContent = 'Agregar cliente';
  document.getElementById('clienteFormSubmitBtn').textContent = 'Guardar cliente';
}

function startEditCliente(id) {
  const c = DB.getCliente(id);
  if (!c) return;
  editingClienteId = id;
  document.getElementById('clNombre').value = c.nombre || '';
  document.getElementById('clDireccion').value = c.direccion || '';
  document.getElementById('clTelefono').value = c.telefono || '';
  document.getElementById('clEmail').value = c.email || '';
  document.getElementById('clFoto').value = c.foto_fachada_url || '';
  document.getElementById('clienteFormTitle').textContent = 'Editar cliente';
  document.getElementById('clienteFormSubmitBtn').textContent = 'Guardar cambios';
  document.getElementById('clienteFormCard')?.scrollIntoView({ behavior: 'smooth' });
}

function saveCliente() {
  const nombre = document.getElementById('clNombre').value.trim();
  const direccion = document.getElementById('clDireccion').value.trim();
  const telefono = document.getElementById('clTelefono').value.trim();
  const email = document.getElementById('clEmail').value.trim();
  const foto_fachada_url = document.getElementById('clFoto').value.trim();
  if (!nombre) { showToast('El nombre es obligatorio', 'warning'); return; }
  const data = { nombre, direccion, telefono, email, foto_fachada_url };
  if (editingClienteId) {
    DB.actualizarCliente(editingClienteId, data);
    showToast('Cliente actualizado', 'success');
  } else {
    DB.agregarCliente(data);
    showToast('Cliente agregado', 'success');
  }
  resetClienteForm();
  renderClientes();
}

function deleteCliente(id) {
  if (!confirm('¿Eliminar este cliente? Su historial de pedidos seguirá existiendo pero sin ficha asociada.')) return;
  DB.eliminarCliente(id);
  renderClientes();
  showToast('Cliente eliminado', 'success');
}

/* ============================================================
   PRODUCTOS (contra DB.productos en memoria — modo demo)
============================================================ */
function loadAdminProducts() {
  const tbody = document.getElementById('adminProductsBody');
  if (!tbody) return;
  if (!DB.productos.length) {
    tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Aún no has agregado productos.</td></tr>';
    return;
  }
  let html = '';
  DB.productos.forEach(p => {
    const thumb = p.imagen ? `<img class="admin-thumb" src="${escapeHtml(p.imagen)}" alt="">` : '—';
    html += `<tr>
      <td>${thumb}</td>
      <td>${escapeHtml(p.nombre)}</td>
      <td>${escapeHtml(p.categoria || '—')}</td>
      <td>${formatCOP(p.precio)} <span class="form-hint">· stock ${p.stock ?? '—'}</span></td>
      <td>${p.oculto ? '<span style="color:var(--muted-2);">Oculto</span>' : '<span style="color:var(--accent);">Visible</span>'}</td>
      <td style="white-space:nowrap;">
        <button class="admin-action-btn" onclick="startEditProduct('${p.id}')">Editar</button>
        <button class="admin-action-btn danger" onclick="deleteProduct('${p.id}')">Eliminar</button>
      </td>
    </tr>`;
  });
  tbody.innerHTML = html;
}

function resetProductForm() {
  editingProductId = null;
  ['pNombre', 'pCategoria', 'pPrecio', 'pPrecioAnterior', 'pImagen', 'pDescripcion', 'pStock'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('pOferta').checked = false;
  document.getElementById('pNuevo').checked = false;
  document.getElementById('pOculto').checked = false;
  document.getElementById('productFormTitle').textContent = 'Agregar producto';
  document.getElementById('productFormSubmitBtn').textContent = 'Guardar producto';
}

function startEditProduct(id) {
  const p = DB.getProducto(id);
  if (!p) return;
  editingProductId = id;
  document.getElementById('pNombre').value = p.nombre || '';
  document.getElementById('pCategoria').value = p.categoria || 'consumibles';
  document.getElementById('pPrecio').value = p.precio || '';
  document.getElementById('pPrecioAnterior').value = p.precioAnterior || '';
  document.getElementById('pImagen').value = p.imagen || '';
  document.getElementById('pDescripcion').value = p.descripcion || '';
  document.getElementById('pStock').value = p.stock ?? '';
  document.getElementById('pOferta').checked = !!p.oferta;
  document.getElementById('pNuevo').checked = !!p.nuevo;
  document.getElementById('pOculto').checked = !!p.oculto;
  document.getElementById('productFormTitle').textContent = 'Editar producto';
  document.getElementById('productFormSubmitBtn').textContent = 'Guardar cambios';
  document.getElementById('adminFormCard')?.scrollIntoView({ behavior: 'smooth' });
}

function saveProduct() {
  const nombre = document.getElementById('pNombre').value.trim();
  const categoria = document.getElementById('pCategoria').value;
  const precio = Number(document.getElementById('pPrecio').value);
  const precioAnterior = Number(document.getElementById('pPrecioAnterior').value) || null;
  const imagen = document.getElementById('pImagen').value.trim();
  const descripcion = document.getElementById('pDescripcion').value.trim();
  const stock = Number(document.getElementById('pStock').value) || 0;
  const oferta = document.getElementById('pOferta').checked;
  const nuevo = document.getElementById('pNuevo').checked;
  const oculto = document.getElementById('pOculto').checked;

  if (!nombre || !precio) { showToast('Nombre y precio son obligatorios', 'warning'); return; }

  const data = { nombre, categoria, precio, precioAnterior, imagen, descripcion, stock, oferta, nuevo, oculto };

  if (editingProductId) {
    Object.assign(DB.getProducto(editingProductId), data);
    showToast('Producto actualizado', 'success');
  } else {
    DB.productos.push({ id: uid(), ...data });
    showToast('Producto agregado', 'success');
  }
  resetProductForm();
  loadAdminProducts();
  populatePromoProductSelect();
}

function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
  const idx = DB.productos.findIndex(p => p.id === id);
  if (idx > -1) DB.productos.splice(idx, 1);
  loadAdminProducts();
  populatePromoProductSelect();
  showToast('Producto eliminado', 'success');
}

/* ============================================================
   PROMOCIONES (día / semana / mes)
============================================================ */
function populatePromoProductSelect() {
  const sel = document.getElementById('promoProducto');
  if (!sel) return;
  sel.innerHTML = DB.productos.map(p => `<option value="${p.id}">${escapeHtml(p.nombre)}</option>`).join('');
}

function renderPromos() {
  const tbody = document.getElementById('adminPromosBody');
  if (!tbody) return;
  if (!DB.promociones.length) {
    tbody.innerHTML = '<tr class="loading-row"><td colspan="6">No hay promociones creadas.</td></tr>';
    return;
  }
  let html = '';
  DB.promociones.forEach(promo => {
    const prod = DB.getProducto(promo.producto_id);
    html += `<tr>
      <td>${escapeHtml(prod ? prod.nombre : 'Producto eliminado')}</td>
      <td><span class="promo-type-pill">${promo.tipo}</span></td>
      <td>${formatCOP(promo.precio_promocional)}</td>
      <td>${promo.fecha_inicio} → ${promo.fecha_fin}</td>
      <td>${promo.activo ? '<span style="color:var(--accent);">Activa</span>' : '<span style="color:var(--muted-2);">Inactiva</span>'}</td>
      <td style="white-space:nowrap;">
        <button class="admin-action-btn" onclick="startEditPromo('${promo.id}')">Editar</button>
        <button class="admin-action-btn danger" onclick="deletePromo('${promo.id}')">Eliminar</button>
      </td>
    </tr>`;
  });
  tbody.innerHTML = html;
}

function resetPromoForm() {
  editingPromoId = null;
  document.getElementById('promoTipo').value = 'dia';
  document.getElementById('promoPrecio').value = '';
  document.getElementById('promoInicio').value = '';
  document.getElementById('promoFin').value = '';
  document.getElementById('promoActiva').checked = true;
  document.getElementById('promoFormTitle').textContent = 'Nueva promoción';
  document.getElementById('promoFormSubmitBtn').textContent = 'Guardar promoción';
}

function startEditPromo(id) {
  const promo = DB.promociones.find(p => p.id === id);
  if (!promo) return;
  editingPromoId = id;
  document.getElementById('promoProducto').value = promo.producto_id;
  document.getElementById('promoTipo').value = promo.tipo;
  document.getElementById('promoPrecio').value = promo.precio_promocional;
  document.getElementById('promoInicio').value = promo.fecha_inicio;
  document.getElementById('promoFin').value = promo.fecha_fin;
  document.getElementById('promoActiva').checked = !!promo.activo;
  document.getElementById('promoFormTitle').textContent = 'Editar promoción';
  document.getElementById('promoFormSubmitBtn').textContent = 'Guardar cambios';
  document.getElementById('promoFormCard')?.scrollIntoView({ behavior: 'smooth' });
}

function savePromo() {
  const producto_id = document.getElementById('promoProducto').value;
  const tipo = document.getElementById('promoTipo').value;
  const precio_promocional = Number(document.getElementById('promoPrecio').value);
  const fecha_inicio = document.getElementById('promoInicio').value;
  const fecha_fin = document.getElementById('promoFin').value;
  const activo = document.getElementById('promoActiva').checked;

  if (!producto_id || !precio_promocional || !fecha_inicio || !fecha_fin) {
    showToast('Completa producto, precio y fechas', 'warning');
    return;
  }
  const data = { producto_id, tipo, precio_promocional, fecha_inicio, fecha_fin, activo };
  if (editingPromoId) {
    DB.actualizarPromocion(editingPromoId, data);
    showToast('Promoción actualizada', 'success');
  } else {
    DB.agregarPromocion(data);
    showToast('Promoción creada', 'success');
  }
  resetPromoForm();
  renderPromos();
}

function deletePromo(id) {
  if (!confirm('¿Eliminar esta promoción?')) return;
  DB.eliminarPromocion(id);
  renderPromos();
  showToast('Promoción eliminada', 'success');
}

/* ============================================================
   ANALÍTICA
============================================================ */
function renderAnalitica() {
  const wrap = document.getElementById('analiticaWrap');
  if (!wrap) return;

  const activos = DB.pedidos.filter(p => p.estado !== 'cancelado');
  const ingresos = activos.reduce((sum, p) => sum + DB.totalPedido(p), 0);
  const topProductos = DB.productosMasVendidos(5);
  const topClientes = DB.mejoresClientes(5);

  wrap.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Pedidos totales</div>
        <div class="stat-value">${DB.pedidos.length}</div>
        <div class="stat-sub">${activos.length} activos, ${DB.pedidos.length - activos.length} cancelados</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Ingresos (pedidos activos)</div>
        <div class="stat-value">${formatCOP(ingresos)}</div>
        <div class="stat-sub">Suma de pedidos no cancelados</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Clientes registrados</div>
        <div class="stat-value">${DB.clientes.length}</div>
        <div class="stat-sub">Con al menos una ficha en el CRM</div>
      </div>
    </div>

    <div class="admin-subhead">Productos más vendidos</div>
    <div class="admin-table-wrap">
      <table>
        <thead><tr><th></th><th>Producto</th><th>Unidades</th><th>Ingresos</th></tr></thead>
        <tbody>
          ${topProductos.length ? topProductos.map((row, i) => `
            <tr>
              <td><span class="rank-badge">${i + 1}</span></td>
              <td>${escapeHtml(row.producto.nombre)}</td>
              <td>${row.unidades}</td>
              <td>${formatCOP(row.ingresos)}</td>
            </tr>`).join('') : '<tr class="loading-row"><td colspan="4">Aún no hay ventas registradas.</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="admin-subhead">Mejores clientes</div>
    <div class="admin-table-wrap">
      <table>
        <thead><tr><th></th><th>Cliente</th><th>Pedidos</th><th>Total comprado</th></tr></thead>
        <tbody>
          ${topClientes.length ? topClientes.map((row, i) => `
            <tr>
              <td><span class="rank-badge">${i + 1}</span></td>
              <td>${escapeHtml(row.cliente.nombre)}</td>
              <td>${row.pedidos}</td>
              <td>${formatCOP(row.total)}</td>
            </tr>`).join('') : '<tr class="loading-row"><td colspan="4">Aún no hay compras registradas.</td></tr>'}
        </tbody>
      </table>
    </div>`;
}

/* ============================================================
   FACTURA (comprobante imprimible — no es factura DIAN todavía)
============================================================ */
let currentFacturaPedidoId = null;

function openFactura(pedidoId) {
  const pedido = DB.pedidos.find(p => p.id === pedidoId);
  if (!pedido) return;
  const cliente = DB.getCliente(pedido.cliente_id);
  currentFacturaPedidoId = pedidoId;
  const total = DB.totalPedido(pedido);
  const numeroFactura = pedido._numeroFactura || (pedido._numeroFactura = DB.nextNumeroFactura());

  document.getElementById('facturaPrintArea').innerHTML = `
    <div class="f-brand">DentiBox</div>
    <div class="f-sub">Insumos odontológicos · Comprobante de venta N.º ${numeroFactura}</div>
    <hr>
    <div class="f-row"><span>Pedido</span><span>#${pedido.numero_pedido}</span></div>
    <div class="f-row"><span>Fecha</span><span>${formatDateEs(pedido.created_at)}</span></div>
    <div class="f-row"><span>Origen</span><span>${pedido.origen === 'online' ? 'Pedido en línea' : 'Venta presencial'}</span></div>
    <hr>
    <div class="f-row"><span>Cliente</span><span>${escapeHtml(cliente ? cliente.nombre : '—')}</span></div>
    <div class="f-row"><span>Dirección</span><span>${escapeHtml(cliente ? cliente.direccion || '—' : '—')}</span></div>
    <div class="f-row"><span>Teléfono</span><span>${escapeHtml(cliente ? cliente.telefono || '—' : '—')}</span></div>
    <hr>
    <table>
      <thead><tr><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr></thead>
      <tbody>
        ${pedido.items.map(it => {
          const prod = DB.getProducto(it.producto_id);
          if (!prod) return '';
          return `<tr><td>${escapeHtml(prod.nombre)}</td><td>${it.cantidad}</td><td>${formatCOP(prod.precio * it.cantidad)}</td></tr>`;
        }).join('')}
      </tbody>
    </table>
    <hr>
    <div class="f-row f-total"><span>Total</span><span>${formatCOP(total)}</span></div>
    <p class="form-hint" style="margin-top:14px;">Pago contra entrega. Este comprobante no reemplaza la factura electrónica DIAN (pendiente de integrar).</p>
  `;
  document.getElementById('facturaOverlay').classList.add('open');
}

function closeFactura() {
  document.getElementById('facturaOverlay').classList.remove('open');
  currentFacturaPedidoId = null;
}

function printFactura() {
  window.print();
}

window.initAdminAuth = initAdminAuth;
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.switchAdminTab = switchAdminTab;

window.handleQueueSearch = handleQueueSearch;
window.setPedidoEstado = setPedidoEstado;
window.cancelarPedido = cancelarPedido;
window.removeQueueItem = removeQueueItem;

window.handleClientesSearch = handleClientesSearch;
window.toggleClienteHistorial = toggleClienteHistorial;
window.resetClienteForm = resetClienteForm;
window.startEditCliente = startEditCliente;
window.saveCliente = saveCliente;
window.deleteCliente = deleteCliente;

window.loadAdminProducts = loadAdminProducts;
window.resetProductForm = resetProductForm;
window.startEditProduct = startEditProduct;
window.saveProduct = saveProduct;
window.deleteProduct = deleteProduct;

window.resetPromoForm = resetPromoForm;
window.startEditPromo = startEditPromo;
window.savePromo = savePromo;
window.deletePromo = deletePromo;

window.openFactura = openFactura;
window.closeFactura = closeFactura;
window.printFactura = printFactura;
