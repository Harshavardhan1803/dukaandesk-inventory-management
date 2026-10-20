export type ProductUnit = 'pcs' | 'kg' | 'packet' | 'liter' | 'box' | 'meter' | 'dozen';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  reorderThreshold: number;
  unit: ProductUnit;
  barcode?: string;
  lastRestocked?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  total: number;
}

export type PaymentMethod = 'Cash' | 'Card' | 'UPI / QR' | 'Store Credit';

export interface Sale {
  id: string;
  invoiceNumber: string;
  timestamp: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  status: 'Completed' | 'Refunded';
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  currencySymbol: string;
  taxRatePercent: number;
  phone: string;
  address: string;
  receiptNotes: string;
  defaultReorderThreshold: number;
}

export type NavigationTab = 'dashboard' | 'products' | 'sales' | 'reports' | 'settings';
