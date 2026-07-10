/* =====================================================================
   ADMIN.JS — login (Firebase Auth) + CRUD de productos (Firestore).
   Los productos solo guardan el LINK de la imagen (no se sube el archivo);
   sube tu imagen a un servicio externo (Cloudinary, Imgur, etc.) y pega
   la URL aquí. Protege esto con Firestore Rules: solo tu UID puede escribir
   en "productos" (ver firestore.rules en la raíz del proyecto).
===================================================================== */

let editingProductId = null;

function initAdminAuth() {
  const { onAuthStateChanged } = window._fbFns;
  onAuthStateChanged(window._fbAuth, (user) => {
    const loginBox = document.getElementById('adminLoginBox');
    const panel = document.getElementById('adminPanelWrap');
    if (user) {
      loginBox.style.display = 'none';
      panel.style.display = 'block';
      document.getElementById('adminUserEmail').textContent = user.email;
      loadAdminProducts();
    } else {
      loginBox.style.display = 'block';
      panel.style.display = 'none';
    }
  });
}

async function adminLogin() {
  const email = document.getElementById('adminEmail').value.trim();
  const pass = document.getElementById('adminPassword').value;
  const msgEl = document.getElementById('adminLoginMsg');
  if (!email || !pass) { msgEl.textContent = 'Completa correo y contraseña.'; return; }
  msgEl.textContent = 'Ingresando...';
  try {
    const { signInWithEmailAndPassword } = window._fbFns;
    await signInWithEmailAndPassword(window._fbAuth, email, pass);
    msgEl.textContent = '';
  } catch (e) {
    msgEl.textContent = 'Correo o contraseña incorrectos.';
  }
}

async function adminLogout() {
  const { signOut } = window._fbFns;
  await signOut(window._fbAuth);
  showToast('Sesión cerrada', 'success');
}

function switchAdminTab(tab, btnEl) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  btnEl.classList.add('active');
  document.getElementById('adminTab-' + tab).classList.add('active');
}

async function loadAdminProducts() {
  const tbody = document.getElementById('adminProductsBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Cargando productos...</td></tr>';
  try {
    const { collection, getDocs, query, orderBy } = window._fbFns;
    const db = window._fbDb;
    const q = query(collection(db, 'productos'), orderBy('creadoEn', 'desc'));
    const snap = await getDocs(q);
    if (snap.empty) {
      tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Aún no has agregado productos.</td></tr>';
      return;
    }
    let html = '';
    snap.forEach(d => {
      const p = { id: d.id, ...d.data() };
      const thumb = p.imagen ? `<img class="admin-thumb" src="${escapeHtml(p.imagen)}" alt="">` : '—';
      html += `<tr>
        <td>${thumb}</td>
        <td>${escapeHtml(p.nombre)}</td>
        <td>${escapeHtml(p.categoria || '—')}</td>
        <td>${formatCOP(p.precio)}</td>
        <td>${p.oculto ? '<span style="color:var(--muted-2);">Oculto</span>' : '<span style="color:var(--accent);">Visible</span>'}</td>
        <td style="white-space:nowrap;">
          <button class="admin-action-btn" onclick="startEditProduct('${p.id}')">Editar</button>
          <button class="admin-action-btn danger" onclick="deleteProduct('${p.id}')">Eliminar</button>
        </td>
      </tr>`;
    });
    tbody.innerHTML = html;
    window._adminProductsCache = [];
    snap.forEach(d => window._adminProductsCache.push({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error(e);
    tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Error al cargar productos.</td></tr>';
  }
}

function resetProductForm() {
  editingProductId = null;
  ['pNombre', 'pCategoria', 'pPrecio', 'pPrecioAnterior', 'pImagen', 'pDescripcion'].forEach(id => {
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
  const p = (window._adminProductsCache || []).find(x => x.id === id);
  if (!p) return;
  editingProductId = id;
  document.getElementById('pNombre').value = p.nombre || '';
  document.getElementById('pCategoria').value = p.categoria || 'consumibles';
  document.getElementById('pPrecio').value = p.precio || '';
  document.getElementById('pPrecioAnterior').value = p.precioAnterior || '';
  document.getElementById('pImagen').value = p.imagen || '';
  document.getElementById('pDescripcion').value = p.descripcion || '';
  document.getElementById('pOferta').checked = !!p.oferta;
  document.getElementById('pNuevo').checked = !!p.nuevo;
  document.getElementById('pOculto').checked = !!p.oculto;
  document.getElementById('productFormTitle').textContent = 'Editar producto';
  document.getElementById('productFormSubmitBtn').textContent = 'Guardar cambios';
  document.getElementById('adminFormCard')?.scrollIntoView({ behavior: 'smooth' });
}

async function saveProduct() {
  const nombre = document.getElementById('pNombre').value.trim();
  const categoria = document.getElementById('pCategoria').value;
  const precio = Number(document.getElementById('pPrecio').value);
  const precioAnterior = Number(document.getElementById('pPrecioAnterior').value) || null;
  const imagen = document.getElementById('pImagen').value.trim();
  const descripcion = document.getElementById('pDescripcion').value.trim();
  const oferta = document.getElementById('pOferta').checked;
  const nuevo = document.getElementById('pNuevo').checked;
  const oculto = document.getElementById('pOculto').checked;

  if (!nombre || !precio) { showToast('Nombre y precio son obligatorios', 'warning'); return; }

  const { collection, doc, addDoc, updateDoc, serverTimestamp } = window._fbFns;
  const db = window._fbDb;
  const data = { nombre, categoria, precio, precioAnterior, imagen, descripcion, oferta, nuevo, oculto };

  try {
    if (editingProductId) {
      await updateDoc(doc(db, 'productos', editingProductId), data);
      showToast('Producto actualizado', 'success');
    } else {
      data.creadoEn = serverTimestamp();
      await addDoc(collection(db, 'productos'), data);
      showToast('Producto agregado', 'success');
    }
    resetProductForm();
    loadAdminProducts();
  } catch (e) {
    console.error(e);
    showToast('Error al guardar: ' + e.message, 'error');
  }
}

async function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
  try {
    const { doc, deleteDoc } = window._fbFns;
    await deleteDoc(doc(window._fbDb, 'productos', id));
    showToast('Producto eliminado', 'success');
    loadAdminProducts();
  } catch (e) {
    showToast('Error al eliminar: ' + e.message, 'error');
  }
}

window.initAdminAuth = initAdminAuth;
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.switchAdminTab = switchAdminTab;
window.loadAdminProducts = loadAdminProducts;
window.resetProductForm = resetProductForm;
window.startEditProduct = startEditProduct;
window.saveProduct = saveProduct;
window.deleteProduct = deleteProduct;
