/* =====================================================================
   AUTH.JS — sesión de cliente (odontólogo) vía Supabase Auth.
   Login email/password + Google OAuth, y formulario de "completar
   perfil" que hace upsert en la tabla `clientes` usando auth_user_id.

   Estado expuesto:
     window._clienteState = { user, cliente }
       user    → objeto de auth.users (o null si no hay sesión)
       cliente → fila de la tabla clientes (o null si aún no existe)

   cart.js usa window.clienteListo() / window.getClienteActual() para
   saber si puede crear un pedido.
   Depende de ui.js (showToast, goToPage) y de supabase-config.js
   (window._sb) ya cargados antes que este archivo.
===================================================================== */

/** Único correo con acceso al panel de administrador. */
const ADMIN_EMAIL = 'sebastian.ramos26122005@gmail.com';

let _clienteState = { user: null, cliente: null };
let _clienteEditando = false;
const TESTIMONIOS_STORAGE_KEY = 'dentibox.testimonios';
let _testimonios = [];
let _reviewStars = 0;

function esAdmin() {
  return !!(_clienteState.user && _clienteState.user.email === ADMIN_EMAIL);
}

async function initClienteAuth() {
  loadTestimonios();
  const { data: { session } } = await window._sb.auth.getSession();
  await onSesionCambio(session);

  window._sb.auth.onAuthStateChange(async (_event, session) => {
    await onSesionCambio(session);
  });
}

async function actualizarCuentaNavLabel() {
  const label = _clienteState.user ? 'Mi cuenta' : 'Iniciar sesión';
  const navCuentaLink = document.getElementById('navCuentaLink');
  const navCuentaLinkMobile = document.getElementById('navCuentaLinkMobile');
  if (navCuentaLink) navCuentaLink.textContent = label;
  if (navCuentaLinkMobile) navCuentaLinkMobile.textContent = label;
}

async function onSesionCambio(session) {
  _clienteState.user = session ? session.user : null;
  _clienteState.cliente = null;

  if (_clienteState.user) {
    const { data, error } = await window._sb
      .from('clientes')
      .select('*')
      .eq('auth_user_id', _clienteState.user.id)
      .maybeSingle();
    if (error) console.error('Error cargando cliente:', error);
    _clienteState.cliente = data || null;
  }

  const adminLink = document.getElementById('navAdminLink');
  if (adminLink) adminLink.style.display = esAdmin() ? '' : 'none';
  const adminLinkMobile = document.getElementById('navAdminLinkMobile');
  if (adminLinkMobile) adminLinkMobile.style.display = esAdmin() ? '' : 'none';

  actualizarCuentaNavLabel();

  renderCuentaPage();
  renderTestimonios();
  updateTestimonioFormState();
  updateCartUI();
  window.renderAdminGate && window.renderAdminGate();
}

function clienteListo() {
  return !!(_clienteState.user && _clienteState.cliente && _clienteState.cliente.nombre);
}

function getClienteActual() {
  return _clienteState;
}

function clienteVerificado() {
  if (!_clienteState.user) return false;
  const user = _clienteState.user;
  if (user.email_confirmed_at || user.confirmed_at) return true;
  if (user.identities && Array.isArray(user.identities)) {
    return user.identities.some(id => id.provider === 'email' || id.provider === 'google');
  }
  return false;
}

async function loadTestimonios() {
  try {
    const raw = localStorage.getItem(TESTIMONIOS_STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    if (Array.isArray(saved) && saved.length) {
      _testimonios = saved;
    } else {
      _testimonios = [
        { nombre: 'Dra. Ana Pérez', estrellas: 5, comentario: 'Muy buena experiencia. Pedidos rápidos y sin vueltas.' },
        { nombre: 'Dr. Mario Alonso', estrellas: 4, comentario: 'Los insumos llegaron bien empaquetados y a tiempo.' }
      ];
    }
  } catch (err) {
    console.warn('Error cargando testimonios locales:', err);
    _testimonios = [
      { nombre: 'Dra. Ana Pérez', estrellas: 5, comentario: 'Muy buena experiencia. Pedidos rápidos y sin vueltas.' },
      { nombre: 'Dr. Mario Alonso', estrellas: 4, comentario: 'Los insumos llegaron bien empaquetados y a tiempo.' }
    ];
  }

  await fetchTestimoniosFromBackend();
}

function saveTestimoniosLocal() {
  try {
    localStorage.setItem(TESTIMONIOS_STORAGE_KEY, JSON.stringify(_testimonios));
  } catch (err) {
    console.warn('No se pudieron guardar los testimonios locales:', err);
  }
}

async function fetchTestimoniosFromBackend() {
  if (!window._sb) return;
  try {
    const { data, error } = await window._sb
      .from('testimonios')
      .select('nombre,estrellas,comentario')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) {
      console.warn('No se pudieron cargar testimonios desde Supabase:', error.message || error);
      return;
    }
    if (Array.isArray(data) && data.length) {
      _testimonios = data;
      renderTestimonios();
      saveTestimoniosLocal();
    }
  } catch (err) {
    console.warn('Error consultando testimonios en Supabase:', err);
  }
}

async function insertTestimonioBackend(entry) {
  if (!window._sb) return false;
  try {
    const { error } = await window._sb.from('testimonios').insert([entry]);
    if (error) {
      console.warn('Error guardando testimonio en Supabase:', error.message || error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error insertando testimonio en Supabase:', err);
    return false;
  }
}

function renderTestimonios() {
  const grid = document.getElementById('testimoniosGrid');
  if (!grid) return;
  if (!_testimonios.length) {
    grid.innerHTML = '<p class="form-hint">Aún no hay testimonios. Sé el primero en dejar el tuyo.</p>';
    return;
  }
  grid.innerHTML = _testimonios.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-meta">
        <div class="testimonial-name">${escapeHtml(t.nombre)}</div>
        <div class="testimonial-stars">${'★'.repeat(t.estrellas)}${'☆'.repeat(5 - t.estrellas)}</div>
      </div>
      <div class="testimonial-text">${escapeHtml(t.comentario)}</div>
    </div>
  `).join('');
}

function updateTestimonioFormState() {
  const note = document.getElementById('testimonioFormNote');
  const submit = document.getElementById('testimonioSubmitBtn');
  const textarea = document.getElementById('testimonioComentario');
  const stars = document.getElementById('testimonioStarButtons');
  if (!note || !submit || !textarea || !stars) return;

  if (!_clienteState.user) {
    note.textContent = 'Inicia sesión para enviar tu opinión.';
    submit.disabled = true;
    textarea.disabled = true;
    stars.querySelectorAll('button').forEach(btn => btn.disabled = true);
    return;
  }

  if (!clienteVerificado()) {
    note.textContent = 'Solo las cuentas verificadas pueden dejar testimonios.';
    submit.disabled = true;
    textarea.disabled = true;
    stars.querySelectorAll('button').forEach(btn => btn.disabled = true);
    return;
  }

  note.textContent = 'Tu cuenta está verificada. Deja tu opinión con estrellas.';
  submit.disabled = false;
  textarea.disabled = false;
  stars.querySelectorAll('button').forEach(btn => btn.disabled = false);
}

function setReviewStars(value) {
  _reviewStars = value;
  document.querySelectorAll('#testimonioStarButtons button').forEach((btn, idx) => {
    btn.classList.toggle('active', idx < value);
  });
}

async function submitTestimonio() {
  const msgEl = document.getElementById('testimonioMsg');
  const textarea = document.getElementById('testimonioComentario');
  if (!msgEl || !textarea) return;
  const comentario = textarea.value.trim();
  if (!_clienteState.user) {
    msgEl.textContent = 'Inicia sesión para enviar tu opinión.';
    return;
  }
  if (!clienteVerificado()) {
    msgEl.textContent = 'Solo cuentas verificadas pueden enviar testimonios.';
    return;
  }
  if (_reviewStars < 1) {
    msgEl.textContent = 'Selecciona entre 1 y 5 estrellas.';
    return;
  }
  if (!comentario) {
    msgEl.textContent = 'Escribe tu opinión antes de enviar.';
    return;
  }

  const nombre = _clienteState.cliente?.nombre || _clienteState.user.email || 'Cliente verificado';
  const entry = {
    auth_user_id: _clienteState.user.id,
    nombre,
    estrellas: _reviewStars,
    comentario,
    created_at: new Date().toISOString()
  };

  const saved = await insertTestimonioBackend(entry);
  if (!saved) {
    msgEl.textContent = 'Ocurrió un problema al guardar tu testimonio. Intenta de nuevo.';
    return;
  }

  _testimonios.unshift(entry);
  if (_testimonios.length > 10) _testimonios.length = 10;
  saveTestimoniosLocal();
  renderTestimonios();
  textarea.value = '';
  setReviewStars(0);
  msgEl.textContent = 'Gracias por tu testimonio.';
}

/* ============================================================
   LOGIN / REGISTRO
============================================================ */
async function clienteIniciarSesion() {
  const email = document.getElementById('cuentaEmail').value.trim();
  const password = document.getElementById('cuentaPassword').value;
  const msgEl = document.getElementById('cuentaAuthMsg');
  if (!email || !password) { msgEl.textContent = 'Completa correo y contraseña.'; return; }
  msgEl.textContent = 'Ingresando...';
  const { error } = await window._sb.auth.signInWithPassword({ email, password });
  if (error) { msgEl.textContent = error.message; return; }
  msgEl.textContent = '';
}

async function clienteRegistrarse() {
  const email = document.getElementById('cuentaEmail').value.trim();
  const password = document.getElementById('cuentaPassword').value;
  const msgEl = document.getElementById('cuentaAuthMsg');
  if (!email || !password) { msgEl.textContent = 'Completa correo y contraseña.'; return; }
  if (password.length < 6) { msgEl.textContent = 'La contraseña debe tener al menos 6 caracteres.'; return; }
  msgEl.textContent = 'Creando cuenta...';
  const { error } = await window._sb.auth.signUp({ email, password });
  if (error) { msgEl.textContent = error.message; return; }
  msgEl.textContent = 'Cuenta creada. Revisa tu correo si se requiere confirmación.';
}

async function clienteLoginGoogle() {
  const { error } = await window._sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if (error) showToast(error.message, 'error');
}

async function clienteCerrarSesion() {
  await window._sb.auth.signOut();
  _clienteEditando = false;
  _clienteState.user = null;
  actualizarCuentaNavLabel();
  showToast('Sesión cerrada', 'success');
  goToPage('inicio');
}

function abrirEditarPerfilCliente() {
  _clienteEditando = true;
  renderCuentaPage();
}

function cancelarEditarPerfilCliente() {
  _clienteEditando = false;
  renderCuentaPage();
}

function guardarPerfilBorrador() {
  const nombre = document.getElementById('cuentaNombre')?.value || '';
  const telefono = document.getElementById('cuentaTelefono')?.value || '';
  const consultorio = document.getElementById('cuentaConsultorio')?.value || '';
  const direccion = document.getElementById('cuentaDireccion')?.value || '';
  const draft = { nombre, telefono, consultorio, direccion };
  sessionStorage.setItem('dentibox.cuentaPerfilDraft', JSON.stringify(draft));
}

function leerPerfilBorrador() {
  try {
    const raw = sessionStorage.getItem('dentibox.cuentaPerfilDraft');
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function limpiarPerfilBorrador() {
  sessionStorage.removeItem('dentibox.cuentaPerfilDraft');
}

function actualizarVistaDireccion() {
  const consultorio = document.getElementById('cuentaConsultorio')?.value.trim();
  const direccion = document.getElementById('cuentaDireccion')?.value.trim();
  const fullAddress = [consultorio, direccion].filter(Boolean).join(' · ');
  const preview = document.getElementById('cuentaDireccionPreview');
  const iframe = document.getElementById('cuentaDireccionMapa');
  const mapsLink = document.getElementById('cuentaDireccionMapsLink');
  if (!preview || !iframe || !mapsLink) return;

  if (!direccion) {
    preview.innerHTML = '<p class="form-hint">Escribe tu dirección para ver una vista previa en Google Maps.</p>';
    iframe.style.display = 'none';
    mapsLink.style.display = 'none';
    iframe.src = '';
    mapsLink.href = '#';
    return;
  }

  preview.textContent = 'Vista previa en Google Maps. Si el mapa no carga, abre el enlace.';
  const query = encodeURIComponent(fullAddress);
  iframe.src = `https://maps.google.com/maps?q=${query}&z=15&output=embed`;
  iframe.style.display = 'block';
  mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
  mapsLink.style.display = 'inline-flex';
}

function actualizarMapaClienteListo() {
  const direccion = _clienteState.cliente?.direccion?.trim();
  const mapaWrap = document.getElementById('cuentaListoMapaWrap');
  const iframe = document.getElementById('cuentaListoMapa');
  const mapsLink = document.getElementById('cuentaListoMapsLink');
  if (!mapaWrap || !iframe || !mapsLink) return;

  if (!direccion) {
    mapaWrap.style.display = 'none';
    iframe.src = '';
    mapsLink.href = '#';
    return;
  }

  const query = encodeURIComponent(direccion);
  mapaWrap.style.display = 'block';
  iframe.src = `https://maps.google.com/maps?q=${query}&z=15&output=embed`;
  mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/* ============================================================
   COMPLETAR PERFIL (upsert en `clientes`)
============================================================ */
async function guardarPerfilCliente() {
  const nombre = document.getElementById('cuentaNombre').value.trim();
  const telefono = document.getElementById('cuentaTelefono').value.trim();
  const consultorio = document.getElementById('cuentaConsultorio').value.trim();
  const direccion = document.getElementById('cuentaDireccion').value.trim();
  const msgEl = document.getElementById('cuentaPerfilMsg');

  if (!nombre || !telefono || !direccion) {
    msgEl.textContent = 'Completa nombre, teléfono y dirección.';
    return;
  }
  if (!_clienteState.user) { msgEl.textContent = 'Tu sesión expiró, vuelve a iniciar sesión.'; return; }

  const direccionFull = [consultorio, direccion].filter(Boolean).join(' · ');
  msgEl.textContent = 'Guardando...';
  const { data, error } = await window._sb
    .from('clientes')
    .upsert({
      auth_user_id: _clienteState.user.id,
      nombre,
      telefono,
      direccion: direccionFull,
      email: _clienteState.user.email
    }, { onConflict: 'auth_user_id' })
    .select()
    .single();

  if (error) { msgEl.textContent = error.message; return; }
  msgEl.textContent = '';
  _clienteState.cliente = data;
  limpiarPerfilBorrador();
  _clienteEditando = false;
  showToast('Perfil guardado', 'success');
  renderCuentaPage();
  updateCartUI();
}

/* ============================================================
   RENDER — muestra el estado correcto en la página "Mi cuenta"
============================================================ */
function renderCuentaPage() {
  const loginCard = document.getElementById('cuentaLoginCard');
  const perfilCard = document.getElementById('cuentaPerfilCard');
  const listoCard = document.getElementById('cuentaListoCard');
  const titulo = document.getElementById('cuentaTitulo');
  const subtitulo = document.getElementById('cuentaSubtitulo');
  const navLink = document.getElementById('navCuentaLink');
  if (!loginCard) return; // la página aún no está en el DOM (no debería pasar)

  loginCard.style.display = 'none';
  perfilCard.style.display = 'none';
  listoCard.style.display = 'none';

  function prefillPerfilInputs() {
    const nombreEl = document.getElementById('cuentaNombre');
    const telefonoEl = document.getElementById('cuentaTelefono');
    const consultorioEl = document.getElementById('cuentaConsultorio');
    const direccionEl = document.getElementById('cuentaDireccion');
    if (!nombreEl || !telefonoEl || !consultorioEl || !direccionEl) return;
    nombreEl.value = _clienteState.cliente?.nombre || '';
    telefonoEl.value = _clienteState.cliente?.telefono || '';
    const savedDireccion = _clienteState.cliente?.direccion || '';
    const parts = savedDireccion.split(' · ');
    if (parts.length > 1) {
      consultorioEl.value = parts[0];
      direccionEl.value = parts.slice(1).join(' · ');
    } else {
      consultorioEl.value = '';
      direccionEl.value = savedDireccion;
    }
    const draft = leerPerfilBorrador();
    if (draft) {
      nombreEl.value = draft.nombre || nombreEl.value;
      telefonoEl.value = draft.telefono || telefonoEl.value;
      consultorioEl.value = draft.consultorio || consultorioEl.value;
      direccionEl.value = draft.direccion || direccionEl.value;
    }
    actualizarVistaDireccion();
  }

  if (!_clienteState.user) {
    loginCard.style.display = 'block';
    titulo.textContent = 'Inicia sesión';
    subtitulo.textContent = 'Inicia sesión para hacer pedidos y ver tu historial de compras.';
    if (navLink) navLink.textContent = 'Iniciar sesión';
  } else if (!clienteListo() || _clienteEditando) {
    perfilCard.style.display = 'block';
    if (!clienteListo()) {
      titulo.textContent = 'Completa tu perfil';
      subtitulo.textContent = 'Un último paso antes de poder comprar.';
      _clienteEditando = true;
      if (navLink) navLink.textContent = 'Mi cuenta';
    } else {
      titulo.textContent = 'Editar datos';
      subtitulo.textContent = 'Actualiza tu información y revisa tu dirección en el mapa.';
      if (navLink) navLink.textContent = _clienteState.cliente.nombre.split(' ')[0];
    }
  } else {
    listoCard.style.display = 'block';
    titulo.textContent = 'Mi cuenta';
    subtitulo.textContent = '';
    document.getElementById('cuentaNombreListo').textContent = _clienteState.cliente.nombre;
    document.getElementById('cuentaEmailListo').textContent = _clienteState.cliente.email || '—';
    document.getElementById('cuentaTelefonoListo').textContent = _clienteState.cliente.telefono || '—';
    document.getElementById('cuentaDireccionListo').textContent = _clienteState.cliente.direccion || '—';
    if (navLink) navLink.textContent = _clienteState.cliente.nombre.split(' ')[0];
  }

  const cancelarBtn = document.getElementById('cuentaPerfilCancelarBtn');
  if (cancelarBtn) {
    cancelarBtn.style.display = (_clienteEditando && clienteListo()) ? 'inline-flex' : 'none';
  }

  if (perfilCard.style.display === 'block') {
    prefillPerfilInputs();
  }

  if (listoCard.style.display === 'block') {
    actualizarMapaClienteListo();
  }
}

window.initClienteAuth = initClienteAuth;
window.clienteListo = clienteListo;
window.getClienteActual = getClienteActual;
window.clienteIniciarSesion = clienteIniciarSesion;
window.clienteRegistrarse = clienteRegistrarse;
window.clienteLoginGoogle = clienteLoginGoogle;
window.clienteCerrarSesion = clienteCerrarSesion;
window.abrirEditarPerfilCliente = abrirEditarPerfilCliente;
window.cancelarEditarPerfilCliente = cancelarEditarPerfilCliente;
window.actualizarVistaDireccion = actualizarVistaDireccion;
window.guardarPerfilCliente = guardarPerfilCliente;
window.renderCuentaPage = renderCuentaPage;
window.setReviewStars = setReviewStars;
window.submitTestimonio = submitTestimonio;
window.esAdmin = esAdmin;
window.ADMIN_EMAIL = ADMIN_EMAIL;
