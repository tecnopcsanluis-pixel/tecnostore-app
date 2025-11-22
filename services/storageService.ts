
import { Product, Sale, CashClosure, Expense } from '../types';

// Changed keys to '_v2' to force a clean slate for the user, removing old cached images.
const KEYS = {
  PRODUCTS: 'tecnostore_products_v2', 
  SALES: 'tecnostore_sales_v2',
  CLOSURES: 'tecnostore_closures_v2',
  EXPENSES: 'tecnostore_expenses_v2',
};

// Mock Initial Data - CLEAN without images, relying on the UI fallback icons
const INITIAL_PRODUCTS: Product[] = [
  { 
    id: '1', 
    name: 'Funda iPhone 14 Pro', 
    category: 'Fundas', 
    price: 15000, 
    stock: 20
    // No image provided, will use generic icon
  },
  { 
    id: '2', 
    name: 'Cable USB-C Carga Rápida', 
    category: 'Cables', 
    price: 8500, 
    stock: 50
  },
  { 
    id: '3', 
    name: 'Vidrio Templado Samsung S23', 
    category: 'Protectores', 
    price: 5000, 
    stock: 30
  },
  { 
    id: '4', 
    name: 'Cargador 20W Original', 
    category: 'Cargadores', 
    price: 25000, 
    stock: 15
  },
  { 
    id: '5', 
    name: 'Auriculares Bluetooth TWS', 
    category: 'Audio', 
    price: 35000, 
    stock: 10
  },
];

export const StorageService = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    if (!data) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(data);
  },

  saveProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  getSales: (): Sale[] => {
    const data = localStorage.getItem(KEYS.SALES);
    return data ? JSON.parse(data) : [];
  },

  saveSale: (sale: Sale) => {
    const sales = StorageService.getSales();
    sales.push(sale);
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
  },

  getExpenses: (): Expense[] => {
    const data = localStorage.getItem(KEYS.EXPENSES);
    return data ? JSON.parse(data) : [];
  },

  saveExpense: (expense: Expense) => {
    const expenses = StorageService.getExpenses();
    expenses.push(expense);
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  },

  getClosures: (): CashClosure[] => {
    const data = localStorage.getItem(KEYS.CLOSURES);
    return data ? JSON.parse(data) : [];
  },

  saveClosure: (closure: CashClosure) => {
    const closures = StorageService.getClosures();
    closures.push(closure);
    localStorage.setItem(KEYS.CLOSURES, JSON.stringify(closures));
  },

  getLastClosureDate: (): Date | null => {
    const closures = StorageService.getClosures();
    if (closures.length === 0) return null;
    // Sort to find the latest
    const sorted = closures.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return new Date(sorted[0].date);
  },

  clearAll: () => {
    localStorage.removeItem(KEYS.PRODUCTS);
    localStorage.removeItem(KEYS.SALES);
    localStorage.removeItem(KEYS.CLOSURES);
    localStorage.removeItem(KEYS.EXPENSES);
    window.location.reload();
  }
};
