// Helper de la página de contacto.
// Antes estaba como <script> inline en index.html, pero la política de
// seguridad (CSP) bloquea scripts inline por seguridad. Se movió aquí
// para que funcione correctamente.

function enviarContactoWhatsApp() {
  const nombre = document.getElementById('contactoNombre').value.trim();
  const mensaje = document.getElementById('contactoMensaje').value.trim();
  if (!mensaje) { showToast('Escribe un mensaje', 'warning'); return; }
  const texto = encodeURIComponent(`Hola, soy ${nombre || 'un cliente'}.\n\n${mensaje}`);
  window.open(`https://wa.me/573000000000?text=${texto}`, '_blank');
}
