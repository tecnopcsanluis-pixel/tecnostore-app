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
const cleanData = (data: any) => {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      cleaned[key] = null;
    }
  });
  return cleaned;
};

let hasAlertedPermission = false;

const handleError = (error: any, action: string) => {
  console.error(`Error en ${action}:`, error);
  if (error.code === 'permission-denied') {
    if (!hasAlertedPermission) {
      alert(`⛔ ERROR DE PERMISOS CRÍTICO ⛔\n\nFirebase está bloqueando el guardado de datos.\n\nSOLUCIÓN:\n1. Ve a Firebase Console -> Firestore Database -> Reglas\n2. Cambia "allow read, write: if false;" por "allow read, write: if true;"\n3. Dale a Publicar.`);
      hasAlertedPermission = true;
    }
  } else if (error.message && error.message.includes("undefined")) {
    alert(`Error de datos: Campo indefinido detectado en ${action}.`);
  } else {
    if (error.code !== 'unavailable') {
       console.warn(`Aviso nube (${action}): ${error.message}`);
    }
  }
};

const handleSubscriptionError = (error: any, context: string) => {
  console.error(`Error suscribiendo a ${context}:`, error);
  if (error.code === 'permission-denied' && !hasAlertedPermission) {
    alert(`⛔ ERROR DE CONEXIÓN ⛔\n\nNo tienes permiso para LEER los datos de ${context}.\n\nRevisa las Reglas de Seguridad en Firebase Console.`);
    hasAlertedPermission = true;
  }
};

export const StorageService = {
  
  // --- UTILS DE DIAGNÓSTICO ---
  testConnection: async () => {
    if (!isFirebaseEnabled || !db) throw new Error("Firebase no inicializado");
    try {
      const testId = 'test_connection_' + Date.now();
      await setDoc(doc(db, 'connection_test', testId), { 
        status: 'ok', 
        timestamp: new Date().toISOString() 
      });
      await deleteDoc(doc(db, 'connection_test', testId));
      return true;
    } catch (e: any) {
      handleError(e, 'Prueba de Conexión');
      throw e;
    }
  },

  // --- CONFIGURACIÓN ---
  subscribeToSettings: (callback: (settings: CompanySettings | null) => void) => {
    if (isFirebaseEnabled && db) {
      const docRef = doc(db, COLS.SETTINGS, 'company');
      return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          callback(doc.data() as CompanySettings);
        } else {
          callback(null);
        }
      }, (error) => handleSubscriptionError(error, 'Configuración'));
    }
    return () => {};
  },

  getSettings: async (): Promise<CompanySettings | null> => {
    if (!isFirebaseEnabled || !db) return null;
    try {
      const docRef = doc(db, COLS.SETTINGS, 'company');
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data() as CompanySettings;
      return null;
    } catch (e) { return null; }
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
      }, (error) => handleSubscriptionError(error, 'Productos'));
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
      }, (error) => handleSubscriptionError(error, 'Ventas'));
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

  deleteSale: async (id: string) => {
    if (!isFirebaseEnabled || !db) return;
    try {
      await deleteDoc(doc(db, COLS.SALES, id));
    } catch (e) { handleError(e, 'Eliminar Venta'); }
  },

  // --- GASTOS ---
  subscribeToExpenses: (callback: (expenses: Expense[]) => void) => {
    if (isFirebaseEnabled && db) {
      const q = query(collection(db, COLS.EXPENSES));
      return onSnapshot(q, (snapshot) => {
        const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
        callback(expenses);
      }, (error) => handleSubscriptionError(error, 'Gastos'));
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
      }, (error) => handleSubscriptionError(error, 'Cierres'));
    }
    return () => {};
  },

  addClosure: async (closure: CashClosure) => {
    if (!isFirebaseEnabled || !db) return;
    try {
      const { id, ...data } = closure;
      await setDoc(doc(db, COLS.CLOSURES, id), cleanData(data));
    } catch (e) { handleError(e, 'Cerrar Caja'); }
  },

  deleteClosure: async (id: string) => {
    if (!isFirebaseEnabled || !db) return;
    try {
      await deleteDoc(doc(db, COLS.CLOSURES, id));
    } catch (e) { handleError(e, 'Eliminar Cierre'); }
  }
};