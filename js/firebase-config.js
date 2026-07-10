/* =====================================================================
   FIREBASE — configuración e inicialización
   1) Reemplaza el objeto firebaseConfig con el de tu proyecto
      (Firebase console → Configuración del proyecto → Tus apps → SDK).
   2) Este archivo se importa como módulo ES desde index.html:
      <script type="module" src="js/firebase-config.js"></script>
   3) Expone window._fbApp / window._fbDb / window._fbAuth / window._fbFns
      para que el resto de scripts (no-módulo) puedan usarlos.
===================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, orderBy, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ⚠️ Reemplaza estos valores por los de tu proyecto Firebase.
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "000000000000",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Se exponen en window para que los demás archivos (cargados sin type="module")
// puedan usarlos sin necesidad de convertir todo el proyecto a módulos.
window._fbApp = app;
window._fbDb = db;
window._fbAuth = auth;
window._fbFns = {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, serverTimestamp,
  signInWithEmailAndPassword, onAuthStateChanged, signOut
};

// Avisa al resto de la app que Firebase ya está listo.
window.dispatchEvent(new Event('firebase-ready'));
