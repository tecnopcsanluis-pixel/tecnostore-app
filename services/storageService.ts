
import { Product, Sale, CashClosure, Expense } from '../types';

const KEYS = {
  PRODUCTS: 'tecnostore_products',
  SALES: 'tecnostore_sales',
  CLOSURES: 'tecnostore_closures',
  EXPENSES: 'tecnostore_expenses',
};

// Mock Initial Data with Images (Using generic placeholders for demo stability)
const INITIAL_PRODUCTS: Product[] = [
  { 
    id: '1', 
    name: 'Funda iPhone 14 Pro', 
    category: 'Fundas', 
    price: 15000, 
    stock: 20,
    image: 'https://images.unsplash.com/photo-1664478383314-704bf6325ade?auto=format&fit=crop&w=300&q=80'
  },
  { 
    id: '2', 
    name: 'Cable USB-C Carga Rápida', 
    category: 'Cables', 
    price: 8500, 
    stock: 50,
    image: 'https://images.unsplash.com/photo-1609619387578-1483a4795561?auto=format&fit=crop&w=300&q=80'
  },
  { 
    id: '3', 
    name: 'Vidrio Templado Samsung S23', 
    category: 'Protectores', 
    price: 5000, 
    stock: 30,
    image: 'https://images.unsplash.com/photo-1677751985372-8d9f87835283?auto=format&fit=crop&w=300&q=80'
  },
  { 
    id: '4', 
    name: 'Cargador 20W Original', 
    category: 'Cargadores', 
    price: 25000, 
    stock: 15,
    image: 'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?auto=format&fit=crop&w=300&q=80'
  },
  { 
    id: '5', 
    name: 'Auriculares Bluetooth TWS', 
    category: 'Audio', 
    price: 35000, 
    stock: 10,
    image: 'https://images.unsplash.com/photo-1572569028738-411a197b83cd?auto=format&fit=crop&w=300&q=80'
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
