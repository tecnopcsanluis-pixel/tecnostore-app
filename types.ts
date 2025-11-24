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

export interface CashClosure {
  id: string;
  date: string;
  totalSales: number;
  totalExpenses: number;
  totalCash: number; // Net Cash (Sales - Expenses)
  totalDigital: number; 
  transactionCount: number;
  notes?: string;
}

export interface SalesSummary {
  name: string;
  value: number;
}