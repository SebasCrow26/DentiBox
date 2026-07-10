/* =====================================================================
   ADMIN.JS — panel de administración contra Supabase real.
   El acceso está gateado por correo (ver ADMIN_EMAIL / esAdmin() en
   auth.js): solo esa cuenta ve el panel, todo lo demás lo bloquea RLS
   en el servidor (ver sql/admin_policies.sql).
===================================================================== */

let editingProductId = null;
let editingClienteId = null;
let editingPromoId = null;
let expandedClienteId = null;
let _pImagenDropzoneCtrl = null;

let _pedidosCache = [];
let _clientesCache = [];
let _productosCache = [];
let _promosCache = [];

/* ============================================================
   GATE DE ACCESO (llamado desde auth.js en cada cambio de sesión)
============================================================ */
function renderAdminGate() {
  const deniedBox = document.getElementById('adminDeniedBox');
  const panel = document.getElementById('adminPanelWrap');
  if (!deniedBox) return; // la página admin no está en el DOM

  if (!window.esAdmin || !esAdmin()) {
    deniedBox.style.display = 'block';
    panel.style.display = 'none';
    return;
  }

  deniedBox.style.display = 'none';
  panel.style.display = 'block';
  document.getElementById('adminUserEmail').textContent = getClienteActual().user.email;

  if (!_pImagenDropzoneCtrl) {
    _pImagenDropzoneCtrl = initCloudinaryDropzone({
      dropzoneId: 'pImagenDropzone',
      fileInputId: 'pImagenFile',
      emptyId: 'pImagenDropzoneEmpty',
      previewId: 'pImagenPreview',
      hiddenInputId: 'pImagen',
      statusId: 'pImagenStatus'
    });
  }

  renderAllAdminPanels();
}

function renderAllAdminPanels() {
  loadQueue();
  loadClientes();
  loadAdminProducts();
  loadPromos();
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

async function loadQueue() {
  const wrap = document.getElementById('queueList');
  if (wrap) wrap.innerHTML = '<div class="empty-state"><i class="ti ti-loader-2"></i><p>Cargando pedidos...</p></div>';
  const { data, error } = await window._sb
    .from('pedidos')
    .select('*, clientes(nombre), pedido_items(*, productos(nombre))')
    .order('numero_pedido', { ascending: true });
  if (error) { console.error(error); if (wrap) wrap.innerHTML = '<div class="empty-state"><i class="ti ti-alert-triangle"></i><p>No se pudieron cargar los pedidos.</p></div>'; return; }
  _pedidosCache = data;
  renderQueue();
}

function renderQueue() {
  const wrap = document.getElementById('queueList');
  if (!wrap) return;
  let pedidos = _pedidosCache;

  if (pedidosSearchTerm.trim()) {
    const t = pedidosSearchTerm.toLowerCase();
    pedidos = pedidos.filter(p => p.clientes && p.clientes.nombre.toLowerCase().includes(t));
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
  const clienteNombre = pedido.clientes ? pedido.clientes.nombre : 'Cliente eliminado';
  const itemsHtml = pedido.pedido_items.map(it => {
    const nombre = it.productos ? it.productos.nombre : 'Producto eliminado';
    return `<div class="queue-item-row">
      <span class="queue-item-name">${escapeHtml(nombre)}</span>
      <span class="queue-item-qty">x${it.cantidad}</span>
      <span>${formatCOP(it.subtotal)}</span>
    </div>`;
  }).join('');

  const nextEstado = { pendiente: 'alistado', alistado: 'entregado' }[pedido.estado];
  const nextLabel = { pendiente: 'Marcar alistado', alistado: 'Marcar entregado' }[pedido.estado];

  return `<div class="queue-card" id="queue-${pedido.id}">
    <div class="queue-card-header">
      <div class="queue-meta">
        <span class="queue-order-id">#${pedido.numero_pedido}</span>
        <span class="queue-client">${escapeHtml(clienteNombre)}</span>
        <span class="badge-pill badge-origen">${pedido.origen === 'online' ? 'Online' : 'Presencial'}</span>
      </div>
      <div class="queue-meta">
        <span class="queue-time">${formatDateEs(pedido.created_at)}</span>
        <span class="badge-pill badge-${pedido.estado}">${pedido.estado}</span>
      </div>
    </div>
    <div class="queue-items">${itemsHtml || '<p class="form-hint">Sin productos (pedido vacío).</p>'}</div>
    <div class="queue-footer">
      <span class="queue-total">Total ${formatCOP(pedido.total)}</span>
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

async function setPedidoEstado(id, estado) {
  const payload = { estado };
  if (estado === 'entregado') payload.entregado_at = new Date().toISOString();
  const { error } = await window._sb.from('pedidos').update(payload).eq('id', id);
  if (error) { showToast(error.message, 'error'); return; }
  await loadQueue();
  showToast(estado === 'entregado' ? 'Pedido marcado como entregado' : 'Pedido actualizado', 'success');
}

async function cancelarPedido(id) {
  if (!confirm('¿Cancelar este pedido? El cliente deberá volver a pedir si aún lo necesita.')) return;
  await setPedidoEstado(id, 'cancelado');
}

/* ============================================================
   CLIENTES (CRM)
============================================================ */
let clientesSearchTerm = '';

async function loadClientes() {
  const tbody = document.getElementById('adminClientesBody');
  if (tbody) tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Cargando...</td></tr>';
  const { data, error } = await window._sb.from('clientes').select('*, pedidos(count)').order('nombre');
  if (error) { console.error(error); if (tbody) tbody.innerHTML = '<tr class="loading-row"><td colspan="6">No se pudieron cargar los clientes.</td></tr>'; return; }
  _clientesCache = data;
  renderClientes();
}

function renderClientes() {
  const tbody = document.getElementById('adminClientesBody');
  if (!tbody) return;
  let clientes = _clientesCache;
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
    const numPedidos = c.pedidos && c.pedidos[0] ? c.pedidos[0].count : 0;
    html += `<tr>
      <td>${escapeHtml(c.nombre)}</td>
      <td>${escapeHtml(c.telefono || '—')}</td>
      <td>${escapeHtml(c.email || '—')}</td>
      <td>${escapeHtml(c.direccion || '—')}</td>
      <td>${numPedidos} pedido${numPedidos === 1 ? '' : 's'}</td>
      <td style="white-space:nowrap;">
        <button class="admin-action-btn" onclick="toggleClienteHistorial('${c.id}')">Historial</button>
        <button class="admin-action-btn" onclick="startEditCliente('${c.id}')">Editar</button>
        <button class="admin-action-btn danger" onclick="deleteCliente('${c.id}')">Eliminar</button>
      </td>
    </tr>`;
    if (expandedClienteId === c.id) {
      html += `<tr class="client-history-row"><td colspan="6"><div class="client-history-wrap" id="clienteHistorial-${c.id}">Cargando...</div></td></tr>`;
    }
  });
  tbody.innerHTML = html;
  if (expandedClienteId) loadClienteHistorial(expandedClienteId);
}

function handleClientesSearch(value) {
  clientesSearchTerm = value;
  renderClientes();
}

function toggleClienteHistorial(id) {
  expandedClienteId = expandedClienteId === id ? null : id;
  renderClientes();
}

async function loadClienteHistorial(clienteId) {
  const { data, error } = await window._sb
    .from('pedidos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });
  const el = document.getElementById(`clienteHistorial-${clienteId}`);
  if (!el) return;
  if (error) { el.innerHTML = '<p class="form-hint">No se pudo cargar el historial.</p>'; return; }
  el.innerHTML = data.length
    ? `<table><thead><tr><th>Pedido</th><th>Fecha</th><th>Estado</th><th>Total</th></tr></thead><tbody>
        ${data.map(p => `<tr><td>#${p.numero_pedido}</td><td>${formatDateEs(p.created_at)}</td><td><span class="badge-pill badge-${p.estado}">${p.estado}</span></td><td>${formatCOP(p.total)}</td></tr>`).join('')}
      </tbody></table>`
    : '<p class="form-hint">Este cliente aún no tiene pedidos.</p>';
}

function resetClienteForm() {
  editingClienteId = null;
  document.getElementById('clienteFormCard').style.display = 'none';
}

function startEditCliente(id) {
  const c = _clientesCache.find(x => x.id === id);
  if (!c) return;
  editingClienteId = id;
  document.getElementById('clNombre').value = c.nombre || '';
  document.getElementById('clDireccion').value = c.direccion || '';
  document.getElementById('clTelefono').value = c.telefono || '';
  const card = document.getElementById('clienteFormCard');
  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth' });
}

async function saveCliente() {
  if (!editingClienteId) return;
  const nombre = document.getElementById('clNombre').value.trim();
  const direccion = document.getElementById('clDireccion').value.trim();
  const telefono = document.getElementById('clTelefono').value.trim();
  if (!nombre) { showToast('El nombre es obligatorio', 'warning'); return; }

  const { error } = await window._sb.from('clientes').update({ nombre, direccion, telefono }).eq('id', editingClienteId);
  if (error) { showToast(error.message, 'error'); return; }
  showToast('Cliente actualizado', 'success');
  resetClienteForm();
  await loadClientes();
}

async function deleteCliente(id) {
  if (!confirm('¿Eliminar este cliente? Su historial de pedidos seguirá existiendo pero sin ficha asociada.')) return;
  const { error } = await window._sb.from('clientes').delete().eq('id', id);
  if (error) { showToast(error.message, 'error'); return; }
  await loadClientes();
  showToast('Cliente eliminado', 'success');
}

/* ============================================================
   PRODUCTOS
============================================================ */
async function loadAdminProducts() {
  const tbody = document.getElementById('adminProductsBody');
  if (tbody) tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Cargando...</td></tr>';
  const { data, error } = await window._sb.from('productos').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); if (tbody) tbody.innerHTML = '<tr class="loading-row"><td colspan="6">No se pudieron cargar los productos.</td></tr>'; return; }
  _productosCache = data;
  renderProductsTable();
  populatePromoProductSelect();
}

function renderProductsTable() {
  const tbody = document.getElementById('adminProductsBody');
  if (!tbody) return;
  if (!_productosCache.length) {
    tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Aún no has agregado productos.</td></tr>';
    return;
  }
  let html = '';
  _productosCache.forEach(p => {
    const thumb = p.imagen_url ? `<img class="admin-thumb" src="${escapeHtml(p.imagen_url)}" alt="">` : '—';
    html += `<tr>
      <td>${thumb}</td>
      <td>${escapeHtml(p.nombre)}</td>
      <td>${escapeHtml(p.categoria || '—')}</td>
      <td>${formatCOP(p.precio)} <span class="form-hint">· stock ${p.stock ?? '—'}</span></td>
      <td>${p.activo ? '<span style="color:var(--accent);">Visible</span>' : '<span style="color:var(--muted-2);">Oculto</span>'}</td>
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
  ['pNombre', 'pCategoria', 'pPrecio', 'pDescripcion', 'pStock'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('pActivo').checked = true;
  if (_pImagenDropzoneCtrl) _pImagenDropzoneCtrl.reset();
  document.getElementById('productFormTitle').textContent = 'Agregar producto';
  document.getElementById('productFormSubmitBtn').textContent = 'Guardar producto';
}

function startEditProduct(id) {
  const p = _productosCache.find(x => x.id === id);
  if (!p) return;
  editingProductId = id;
  document.getElementById('pNombre').value = p.nombre || '';
  document.getElementById('pCategoria').value = p.categoria || 'consumibles';
  document.getElementById('pPrecio').value = p.precio || '';
  document.getElementById('pDescripcion').value = p.descripcion || '';
  document.getElementById('pStock').value = p.stock ?? '';
  document.getElementById('pActivo').checked = !!p.activo;
  if (_pImagenDropzoneCtrl) _pImagenDropzoneCtrl.setValue(p.imagen_url);
  document.getElementById('productFormTitle').textContent = 'Editar producto';
  document.getElementById('productFormSubmitBtn').textContent = 'Guardar cambios';
  document.getElementById('adminFormCard')?.scrollIntoView({ behavior: 'smooth' });
}

async function saveProduct() {
  const nombre = document.getElementById('pNombre').value.trim();
  const categoria = document.getElementById('pCategoria').value;
  const precio = Number(document.getElementById('pPrecio').value);
  const stock = Number(document.getElementById('pStock').value) || 0;
  const imagen_url = document.getElementById('pImagen').value.trim();
  const descripcion = document.getElementById('pDescripcion').value.trim();
  const activo = document.getElementById('pActivo').checked;

  if (!nombre || !precio) { showToast('Nombre y precio son obligatorios', 'warning'); return; }

  const data = { nombre, categoria, precio, stock, imagen_url: imagen_url || null, descripcion, activo };

  const { error } = editingProductId
    ? await window._sb.from('productos').update(data).eq('id', editingProductId)
    : await window._sb.from('productos').insert(data);

  if (error) { showToast(error.message, 'error'); return; }
  showToast(editingProductId ? 'Producto actualizado' : 'Producto agregado', 'success');
  resetProductForm();
  await loadAdminProducts();
}

async function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
  const { error } = await window._sb.from('productos').delete().eq('id', id);
  if (error) { showToast(error.message, 'error'); return; }
  await loadAdminProducts();
  showToast('Producto eliminado', 'success');
}

/* ============================================================
   PROMOCIONES (día / semana / mes)
============================================================ */
function populatePromoProductSelect() {
  const sel = document.getElementById('promoProducto');
  if (!sel) return;
  sel.innerHTML = _productosCache.map(p => `<option value="${p.id}">${escapeHtml(p.nombre)}</option>`).join('');
}

async function loadPromos() {
  const tbody = document.getElementById('adminPromosBody');
  if (tbody) tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Cargando...</td></tr>';
  const { data, error } = await window._sb.from('promociones').select('*, productos(nombre)').order('fecha_inicio', { ascending: false });
  if (error) { console.error(error); if (tbody) tbody.innerHTML = '<tr class="loading-row"><td colspan="6">No se pudieron cargar las promociones.</td></tr>'; return; }
  _promosCache = data;
  renderPromos();
}

function renderPromos() {
  const tbody = document.getElementById('adminPromosBody');
  if (!tbody) return;
  if (!_promosCache.length) {
    tbody.innerHTML = '<tr class="loading-row"><td colspan="6">No hay promociones creadas.</td></tr>';
    return;
  }
  let html = '';
  _promosCache.forEach(promo => {
    html += `<tr>
      <td>${escapeHtml(promo.productos ? promo.productos.nombre : 'Producto eliminado')}</td>
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
  const promo = _promosCache.find(p => p.id === id);
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

async function savePromo() {
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

  const { error } = editingPromoId
    ? await window._sb.from('promociones').update(data).eq('id', editingPromoId)
    : await window._sb.from('promociones').insert(data);

  if (error) { showToast(error.message, 'error'); return; }
  showToast(editingPromoId ? 'Promoción actualizada' : 'Promoción creada', 'success');
  resetPromoForm();
  await loadPromos();
}

async function deletePromo(id) {
  if (!confirm('¿Eliminar esta promoción?')) return;
  const { error } = await window._sb.from('promociones').delete().eq('id', id);
  if (error) { showToast(error.message, 'error'); return; }
  await loadPromos();
  showToast('Promoción eliminada', 'success');
}

/* ============================================================
   ANALÍTICA (calculada en el navegador sobre los pedidos ya cargados)
============================================================ */
function renderAnalitica() {
  const wrap = document.getElementById('analiticaWrap');
  if (!wrap) return;

  const activos = _pedidosCache.filter(p => p.estado !== 'cancelado');
  const ingresos = activos.reduce((sum, p) => sum + Number(p.total), 0);

  const prodAcc = {};
  const clienteAcc = {};
  activos.forEach(p => {
    const clienteNombre = p.clientes ? p.clientes.nombre : 'Cliente eliminado';
    clienteAcc[p.cliente_id] = clienteAcc[p.cliente_id] || { nombre: clienteNombre, pedidos: 0, total: 0 };
    clienteAcc[p.cliente_id].pedidos += 1;
    clienteAcc[p.cliente_id].total += Number(p.total);

    p.pedido_items.forEach(it => {
      const nombre = it.productos ? it.productos.nombre : 'Producto eliminado';
      prodAcc[it.producto_id] = prodAcc[it.producto_id] || { nombre, unidades: 0, ingresos: 0 };
      prodAcc[it.producto_id].unidades += it.cantidad;
      prodAcc[it.producto_id].ingresos += Number(it.subtotal);
    });
  });

  const topProductos = Object.values(prodAcc).sort((a, b) => b.unidades - a.unidades).slice(0, 5);
  const topClientes = Object.values(clienteAcc).sort((a, b) => b.total - a.total).slice(0, 5);

  wrap.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Pedidos totales</div>
        <div class="stat-value">${_pedidosCache.length}</div>
        <div class="stat-sub">${activos.length} activos, ${_pedidosCache.length - activos.length} cancelados</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Ingresos (pedidos activos)</div>
        <div class="stat-value">${formatCOP(ingresos)}</div>
        <div class="stat-sub">Suma de pedidos no cancelados</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Clientes registrados</div>
        <div class="stat-value">${_clientesCache.length}</div>
        <div class="stat-sub">Con cuenta y perfil completo</div>
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
              <td>${escapeHtml(row.nombre)}</td>
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
              <td>${escapeHtml(row.nombre)}</td>
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
function openFactura(pedidoId) {
  const pedido = _pedidosCache.find(p => p.id === pedidoId);
  if (!pedido) return;
  const clienteNombre = pedido.clientes ? pedido.clientes.nombre : '—';

  document.getElementById('facturaPrintArea').innerHTML = `
    <div class="f-brand">DentiBox</div>
    <div class="f-sub">Insumos odontológicos · Comprobante de venta</div>
    <hr>
    <div class="f-row"><span>Pedido</span><span>#${pedido.numero_pedido}</span></div>
    <div class="f-row"><span>Fecha</span><span>${formatDateEs(pedido.created_at)}</span></div>
    <div class="f-row"><span>Origen</span><span>${pedido.origen === 'online' ? 'Pedido en línea' : 'Venta presencial'}</span></div>
    <hr>
    <div class="f-row"><span>Cliente</span><span>${escapeHtml(clienteNombre)}</span></div>
    <hr>
    <table>
      <thead><tr><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr></thead>
      <tbody>
        ${pedido.pedido_items.map(it => {
          const nombre = it.productos ? it.productos.nombre : 'Producto eliminado';
          return `<tr><td>${escapeHtml(nombre)}</td><td>${it.cantidad}</td><td>${formatCOP(it.subtotal)}</td></tr>`;
        }).join('')}
      </tbody>
    </table>
    <hr>
    <div class="f-row f-total"><span>Total</span><span>${formatCOP(pedido.total)}</span></div>
    <p class="form-hint" style="margin-top:14px;">Pago contra entrega. Este comprobante no reemplaza la factura electrónica DIAN (pendiente de integrar).</p>
  `;
  document.getElementById('facturaOverlay').classList.add('open');
}

function closeFactura() {
  document.getElementById('facturaOverlay').classList.remove('open');
}

function printFactura() {
  window.print();
}

window.renderAdminGate = renderAdminGate;
window.switchAdminTab = switchAdminTab;

window.handleQueueSearch = handleQueueSearch;
window.setPedidoEstado = setPedidoEstado;
window.cancelarPedido = cancelarPedido;

window.handleClientesSearch = handleClientesSearch;
window.toggleClienteHistorial = toggleClienteHistorial;
window.resetClienteForm = resetClienteForm;
window.startEditCliente = startEditCliente;
window.saveCliente = saveCliente;
window.deleteCliente = deleteCliente;

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
