export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description?: string;
  image?: string; // Base64 string or URL
}

export interface CartItem extends Product {
  quantity: number;
}

export enum PaymentMethod {
  CASH = 'Efectivo',
  DEBIT = 'Débito',
  CREDIT = 'Crédito',
  TRANSFER = 'Transferencia',
  QR = 'QR / Billetera Virtual'
}

export interface Sale {
  id: string;
  date: string; // ISO string
  items: CartItem[];
  subtotal: number;
  discount: number;
  surcharge: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashierId?: string;
}

export type ExpenseCategory = 'Local' | 'Sueldos' | 'Mercadería' | 'Servicios' | 'Otros';

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
}

// Nueva interfaz para Apertura
export interface CashOpening {
  id: string;
  date: string;
  amount: number;
  notes?: string;
}

export interface CashClosure {
  id: string;
  date: string;
  initialAmount: number; // Nuevo: Con cuánto se abrió
  totalSales: number;
  totalExpenses: number;
  totalCash: number; // Net Cash (Initial + SalesCash - ExpensesCash)
  totalDigital: number; 
  transactionCount: number;
  notes?: string;
}

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  footerMessage: string;
  logoUrl?: string;
  adminPin?: string; // Nuevo PIN de seguridad
}

export interface SalesSummary {
  name: string;
  value: number;
}