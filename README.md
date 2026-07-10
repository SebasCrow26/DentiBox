# DentiBox Minimal

Tienda de insumos odontológicos, minimalista, con panel de administración
conectado a Firebase. Código separado en archivos (no un solo HTML gigante)
para que sea fácil de mantener y editar.

## Estructura

```
dentibox-minimal/
├── index.html          ← estructura y contenido de todas las páginas
├── css/
│   └── styles.css      ← todo el diseño (design tokens al inicio del archivo)
├── js/
│   ├── firebase-config.js  ← conexión a Firebase (AQUÍ va tu configuración)
│   ├── ui.js                ← toast, escapeHtml, navegación entre páginas
│   ├── cart.js               ← carrito (localStorage) + checkout WhatsApp
│   ├── catalog.js            ← lee productos de Firestore y los muestra
│   ├── admin.js               ← login y CRUD de productos del panel admin
│   └── main.js                 ← arranca todo cuando la página carga
└── firestore.rules      ← reglas de seguridad recomendadas para Firestore
```

## 1. Configurar Firebase

1. Crea un proyecto en [console.firebase.google.com](https://console.firebase.google.com).
2. Activa **Firestore Database** (modo producción) y **Authentication → Correo/contraseña**.
3. Crea tu usuario admin en Authentication → Users → "Add user" (el correo/contraseña con el que entrarás al panel `/admin`).
4. En "Configuración del proyecto → Tus apps", crea una app web y copia el objeto `firebaseConfig`.
5. Pega ese objeto en `js/firebase-config.js`, reemplazando los valores de ejemplo.

## 2. Configurar las reglas de seguridad

1. Copia el UID de tu usuario admin (Authentication → Users).
2. Pégalo en `firestore.rules`, reemplazando `"TU_UID_AQUI"`.
3. En Firebase Console → Firestore Database → Reglas, pega el contenido de `firestore.rules` y publica.

Esto asegura que **solo tú** puedas crear/editar/borrar productos, aunque cualquiera pueda leerlos en la tienda.

## 3. Cambiar el número de WhatsApp

Edita `WHATSAPP_NUMBER` en `js/cart.js` y los `href="https://wa.me/573000000000"` en `index.html` (botón flotante, hero y contacto) por tu número real, en formato internacional sin el `+` (ej. `573001234567`).

## 4. Cómo subir imágenes de productos

Este sitio **no almacena archivos**, solo guarda el *link* de la imagen en Firestore (como pediste). Para subir una foto:

1. Sube la imagen a un servicio gratuito como [Cloudinary](https://cloudinary.com) (recomendado, igual que en tu otra tienda) o Imgur.
2. Copia el link directo de la imagen (debe terminar en `.jpg`, `.png`, `.webp`, etc.).
3. Pégalo en el campo **"Link de la imagen"** del panel admin al crear/editar un producto.

## 5. Probar en local

Como usa módulos ES (`type="module"`), no puedes abrir `index.html` con doble clic (el navegador bloquea `import` sobre `file://`). Usa un servidor local simple:

```bash
# con Python
python3 -m http.server 8000

# o con Node
npx serve
```

Luego abre `http://localhost:8000`.

## 6. Publicar en GitHub Pages (mismo dominio que ya tienes)

1. Sube esta carpeta a tu repositorio de GitHub.
2. Repositorio → Settings → Pages → Source: la rama donde subiste el código.
3. Si usas un dominio propio, apunta el CNAME como ya lo tienes configurado en tu otro proyecto.

## Buenas prácticas ya aplicadas (heredadas de tu proyecto anterior)

- **CSP** (`Content-Security-Policy`) restringiendo qué dominios pueden cargar scripts/estilos/conexiones.
- `escapeHtml()` en todo dato de usuario/Firestore antes de insertarlo en el DOM (evita XSS).
- `loading="lazy"` en imágenes de producto.
- Reglas de Firestore explícitas: lectura pública, escritura solo admin.
- Carrito persistido con `try/catch` en `localStorage` (no rompe si el navegador lo bloquea).
- Diseño con **design tokens** (variables CSS) en vez de valores sueltos repetidos.
- Separación real en archivos por responsabilidad (UI, carrito, catálogo, admin) en vez de un solo archivo de miles de líneas.

## Pendiente antes de producción

- [ ] Reemplazar `firebaseConfig` en `js/firebase-config.js`
- [ ] Reemplazar `TU_UID_AQUI` en `firestore.rules` y publicarlas
- [ ] Reemplazar el número de WhatsApp en `js/cart.js` e `index.html`
- [ ] Agregar tus productos reales desde `/admin`
- [ ] Cambiar textos de ejemplo (testimonio, meta description, dominio en `<link rel="canonical">`)
