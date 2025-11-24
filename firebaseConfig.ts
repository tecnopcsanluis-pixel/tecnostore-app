import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Configuración de TecnoStore
const firebaseConfig = {
  apiKey: "AIzaSyA3hpQwxwTaRFG57yL39c9EIjQK3VqCv5k",
  authDomain: "tecnostore-34ec7.firebaseapp.com",
  projectId: "tecnostore-34ec7",
  storageBucket: "tecnostore-34ec7.firebasestorage.app",
  messagingSenderId: "995733926300",
  appId: "1:995733926300:web:06ac5429ba930c05389859"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar base de datos
export const db = getFirestore(app);
export const isFirebaseEnabled = true;

// Habilitar persistencia offline para que funcione sin internet
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
      console.warn('Persistencia fallida: multiples pestañas abiertas.');
  } else if (err.code == 'unimplemented') {
      console.warn('El navegador no soporta persistencia offline.');
  }
});