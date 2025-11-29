export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  promoPrice?: number; // 🆕 NUEVO: Precio promocional en efectivo (opcional)
  stock: number;
  description?: string;
  image?: string; // Base64 string or URL
}

export interface CartItem extends Product {
  quantity: number;
  appliedPrice?: number; // 🆕 NUEVO: Precio que se aplicó realmente en el carrito
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
  initialAmount: number;
  totalSales: number;
  totalExpenses: number;
  totalCash: number;
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
  adminPin?: string;
  whatsappNumber?: string;
}

export interface SalesSummary {
  name: string;
  value: number;
}
