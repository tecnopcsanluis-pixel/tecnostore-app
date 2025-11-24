import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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

// Exportar base de datos y estado
export const db = getFirestore(app);
export const isFirebaseEnabled = true;