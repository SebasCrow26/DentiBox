/* =====================================================================
   CLOUDINARY-UPLOAD.JS — dropzone de arrastrar y soltar reutilizable
   para subir fotos a Cloudinary (unsigned upload, sin backend propio).

   1) Crea una cuenta gratuita en https://cloudinary.com (sin tarjeta).
   2) Dashboard → copia tu "Cloud name" → pégalo en CLOUDINARY_CLOUD_NAME.
   3) Settings → Upload → Upload presets → Add upload preset →
      Signing Mode: "Unsigned" → guarda y pega el nombre del preset en
      CLOUDINARY_UPLOAD_PRESET.
   Usa una cuenta separada de la del proyecto de streaming, para no
   mezclar las fotos de los dos negocios en el mismo Cloudinary.

   Uso:
     initCloudinaryDropzone({
       dropzoneId: 'pImagenDropzone',   // contenedor con la clase .dropzone
       fileInputId: 'pImagenFile',      // <input type="file"> oculto
       emptyId: 'pImagenDropzoneEmpty', // estado vacío (ícono + texto)
       previewId: 'pImagenPreview',     // <img> de vista previa
       hiddenInputId: 'pImagen',        // <input type="hidden"> con la URL final
       statusId: 'pImagenStatus'        // <p> para mensajes de estado/error
     });
===================================================================== */

const CLOUDINARY_CLOUD_NAME = 'b8s550ww';
const CLOUDINARY_UPLOAD_PRESET = 'dentibox_productos';

async function uploadFileToCloudinary(file) {
  if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === 'TU_CLOUD_NAME_AQUI' ||
      !CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET === 'TU_UPLOAD_PRESET_AQUI') {
    throw new Error('Configura CLOUDINARY_CLOUD_NAME y CLOUDINARY_UPLOAD_PRESET en js/cloudinary-upload.js');
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Error en la subida a Cloudinary');
  }
  const data = await res.json();
  return data.secure_url;
}

/** Conecta un contenedor .dropzone con un input file oculto y un hidden con la URL final. */
function initCloudinaryDropzone({ dropzoneId, fileInputId, emptyId, previewId, hiddenInputId, statusId }) {
  const dropzone = document.getElementById(dropzoneId);
  const fileInput = document.getElementById(fileInputId);
  const emptyEl = document.getElementById(emptyId);
  const previewEl = document.getElementById(previewId);
  const hiddenInput = document.getElementById(hiddenInputId);
  const statusEl = document.getElementById(statusId);
  if (!dropzone || !fileInput || !hiddenInput) return;

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      if (statusEl) { statusEl.textContent = 'Solo se aceptan imágenes.'; statusEl.style.color = 'var(--danger)'; }
      return;
    }
    if (statusEl) { statusEl.textContent = 'Subiendo imagen...'; statusEl.style.color = 'var(--muted-2)'; }
    try {
      const url = await uploadFileToCloudinary(file);
      hiddenInput.value = url;
      if (previewEl) { previewEl.src = url; previewEl.style.display = 'block'; }
      if (emptyEl) emptyEl.style.display = 'none';
      if (statusEl) { statusEl.textContent = 'Imagen subida.'; statusEl.style.color = 'var(--accent)'; }
    } catch (e) {
      console.error(e);
      if (statusEl) { statusEl.textContent = e.message; statusEl.style.color = 'var(--danger)'; }
    }
  }

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); dropzone.classList.add('dragover'); });
  });
  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('dragover'); });
  });
  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(file);
  });

  return {
    reset() {
      hiddenInput.value = '';
      fileInput.value = '';
      if (previewEl) { previewEl.style.display = 'none'; previewEl.src = ''; }
      if (emptyEl) emptyEl.style.display = 'flex';
      if (statusEl) statusEl.textContent = '';
    },
    setValue(url) {
      hiddenInput.value = url || '';
      if (url && previewEl) { previewEl.src = url; previewEl.style.display = 'block'; if (emptyEl) emptyEl.style.display = 'none'; }
      else { if (previewEl) previewEl.style.display = 'none'; if (emptyEl) emptyEl.style.display = 'flex'; }
    }
  };
}

window.initCloudinaryDropzone = initCloudinaryDropzone;
