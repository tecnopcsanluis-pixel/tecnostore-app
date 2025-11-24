import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Configuración de Firebase para TecnoStore
const firebaseConfig = {
  apiKey: "AIzaSyBGCHrNR_btZLjHbX_ZqJfigjKeBVrFcis",
  authDomain: "tecnostore-app.firebaseapp.com",
  projectId: "tecnostore-app",
  storageBucket: "tecnostore-app.firebasestorage.app",
  messagingSenderId: "483928325380",
  appId: "1:483928325380:web:17d9d16e8601f653076451"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar base de datos
export const db = getFirestore(app);
export const isFirebaseEnabled = true;

// Habilitar persistencia offline (para que funcione si se corta internet)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
      console.warn('Persistencia fallida: multiples pestañas abiertas.');
  } else if (err.code == 'unimplemented') {
      console.warn('El navegador no soporta persistencia offline.');
  }
});
