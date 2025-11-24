import { 
  collection, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db, isFirebaseEnabled } from '../firebaseConfig';
import { Product, Sale, CashClosure, Expense, CompanySettings } from '../types';

const COLS = {
  PRODUCTS: 'products',
  SALES: 'sales',
  EXPENSES: 'expenses',
  CLOSURES: 'closures',
  SETTINGS: 'settings'
};

// --- FIX CRÍTICO: Limpiador de datos ---
// Convierte undefined a null para evitar errores en Firebase
const cleanData = (data: any) => {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      cleaned[key] = null;
    }
  });
  return cleaned;
};

const handleError = (error: any, action: string) => {
  console.error(`Error en ${action}:`, error);
  if (error.code === 'permission-denied') {
    alert(`ERROR DE PERMISOS: Firebase rechazó la operación "${action}". \n\nSOLUCIÓN: Ve a Firebase Console -> Firestore Database -> Reglas, y cambia "allow read, write: if false;" por "allow read, write: if true;"`);
  } else if (error.message && error.message.includes("undefined")) {
    alert(`Error de datos: Campo indefinido detectado en ${action}. (Corregido automáticamente en el próximo intento)`);
  } else {
    alert(`Error al guardar en la nube (${action}): ${error.message}`);
  }
  throw error;
};

export const StorageService = {
  
  // --- CONFIGURACIÓN ---
  getSettings: async (): Promise<CompanySettings | null> => {
    if (!isFirebaseEnabled || !db) return null;
    try {
      const docRef = doc(db, COLS.SETTINGS, 'company');
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data() as CompanySettings;
      return null;
    } catch (e) { console.error("Error fetching settings", e); return null; }
  },

  saveSettings: async (settings: CompanySettings) => {
    if (!isFirebaseEnabled || !db) return;
    try {
      await setDoc(doc(db, COLS.SETTINGS, 'company'), cleanData(settings));
    } catch (e) { handleError(e, 'Guardar Configuración'); }
  },

  // --- PRODUCTOS ---
  subscribeToProducts: (callback: (products: Product[]) => void) => {
    if (isFirebaseEnabled && db) {
      const q = query(collection(db, COLS.PRODUCTS));
      return onSnapshot(q, (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        callback(products);
      }, (error) => console.error("Error suscribiendo a productos:", error));
    }
    return () => {};
  },

  addProduct: async (product: Product) => {
    if (!isFirebaseEnabled || !db) return;
    try {
      const { id, ...data } = product;
      await setDoc(doc(db, COLS.PRODUCTS, id), cleanData(data));
    } catch (e) { handleError(e, 'Agregar Producto'); }
  },

  updateProduct: async (product: Product) => {
    if (!isFirebaseEnabled || !db) return;
    try {
      const { id, ...data } = product;
      await updateDoc(doc(db, COLS.PRODUCTS, id), cleanData(data));
    } catch (e) { handleError(e, 'Actualizar Producto'); }
  },

  deleteProduct: async (id: string) => {
    if (!isFirebaseEnabled || !db) return;
    try {
      await deleteDoc(doc(db, COLS.PRODUCTS, id));
    } catch (e) { handleError(e, 'Eliminar Producto'); }
  },

  // --- VENTAS ---
  subscribeToSales: (callback: (sales: Sale[]) => void) => {
    if (isFirebaseEnabled && db) {
      const q = query(collection(db, COLS.SALES)); 
      return onSnapshot(q, (snapshot) => {
        const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
        callback(sales);
      }, (error) => console.error("Error suscribiendo a ventas:", error));
    }
    return () => {};
  },

  addSale: async (sale: Sale) => {
    if (!isFirebaseEnabled || !db) return;
    try {
      const { id, ...data } = sale;
      await setDoc(doc(db, COLS.SALES, id), cleanData(data));
    } catch (e) { handleError(e, 'Registrar Venta'); }
  },

  // --- GASTOS ---
  subscribeToExpenses: (callback: (expenses: Expense[]) => void) => {
    if (isFirebaseEnabled && db) {
      const q = query(collection(db, COLS.EXPENSES));
      return onSnapshot(q, (snapshot) => {
        const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
        callback(expenses);
      }, (error) => console.error("Error suscribiendo a gastos:", error));
    }
    return () => {};
  },

  addExpense: async (expense: Expense) => {
    if (!isFirebaseEnabled || !db) return;
    try {
      const { id, ...data } = expense;
      await setDoc(doc(db, COLS.EXPENSES, id), cleanData(data));
    } catch (e) { handleError(e, 'Agregar Gasto'); }
  },

  deleteExpense: async (id: string) => {
    if (!isFirebaseEnabled || !db) return;
    try {
      await deleteDoc(doc(db, COLS.EXPENSES, id));
    } catch (e) { handleError(e, 'Eliminar Gasto'); }
  },

  // --- CIERRES ---
  subscribeToClosures: (callback: (closures: CashClosure[]) => void) => {
    if (isFirebaseEnabled && db) {
      const q = query(collection(db, COLS.CLOSURES));
      return onSnapshot(q, (snapshot) => {
        const closures = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CashClosure));
        callback(closures);
      }, (error) => console.error("Error suscribiendo a cierres:", error));
    }
    return () => {};
  },

  addClosure: async (closure: CashClosure) => {
    if (!isFirebaseEnabled || !db) return;
    try {
      const { id, ...data } = closure;
      await setDoc(doc(db, COLS.CLOSURES, id), cleanData(data));
    } catch (e) { handleError(e, 'Cerrar Caja'); }
  }
};