import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Product, Sale, StoreSettings } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SALES, INITIAL_SETTINGS } from '../data/initialData';

interface AddProductInput {
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  reorderThreshold: number;
  unit: Product['unit'];
  barcode?: string;
}

interface RecordSaleInput {
  items: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: Sale['paymentMethod'];
  customerName?: string;
  customerPhone?: string;
}

interface DailySalesData {
  date: string;
  displayDate: string;
  totalRevenue: number;
  transactionsCount: number;
  estimatedProfit: number;
}

interface StoreContextType {
  products: Product[];
  sales: Sale[];
  settings: StoreSettings;
  categories: string[];
  
  // Product actions
  addProduct: (input: AddProductInput) => { success: boolean; error?: string };
  updateProduct: (id: string, updates: Partial<Product>) => { success: boolean; error?: string };
  deleteProduct: (id: string) => { success: boolean; error?: string };
  adjustStock: (id: string, delta: number) => { success: boolean; error?: string };
  
  // Sales actions
  recordSale: (input: RecordSaleInput) => { success: boolean; invoiceNumber?: string; error?: string };
  refundSale: (id: string) => { success: boolean; error?: string };
  
  // Settings & Storage actions
  updateSettings: (updates: Partial<StoreSettings>) => void;
  resetToDefaults: () => void;
  exportDataJson: () => void;
  exportProductsCsv: () => void;
  
  // Computed analytics
  metrics: {
    totalSalesRevenue: number;
    totalTransactions: number;
    productCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalInventoryCost: number;
    totalInventoryRetail: number;
    potentialProfit: number;
    averageOrderValue: number;
  };
  recentSales: Sale[];
  lowStockProducts: Product[];
  dailySalesTrend: DailySalesData[];
  topSellingProducts: {
    productName: string;
    category: string;
    unitsSold: number;
    totalRevenue: number;
  }[];
}

const STORAGE_KEYS = {
  PRODUCTS: 'dukaandesk_products_v1',
  SALES: 'dukaandesk_sales_v1',
  SETTINGS: 'dukaandesk_settings_v1',
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SALES);
      return stored ? JSON.parse(stored) : INITIAL_SALES;
    } catch {
      return INITIAL_SALES;
    }
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? JSON.parse(stored) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('Failed to save products to localStorage', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    } catch (e) {
      console.warn('Failed to save sales to localStorage', e);
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  // Add Product
  const addProduct = (input: AddProductInput) => {
    // Basic validation
    if (!input.name.trim()) return { success: false, error: 'Product name is required.' };
    if (!input.sku.trim()) return { success: false, error: 'SKU is required.' };
    
    // Check SKU duplicate
    const skuExists = products.some((p) => p.sku.toLowerCase() === input.sku.trim().toLowerCase());
    if (skuExists) {
      return { success: false, error: `SKU "${input.sku}" already exists. Please use a unique SKU.` };
    }

    const now = new Date().toISOString();
    const newProduct: Product = {
      id: 'prod-' + Date.now(),
      name: input.name.trim(),
      sku: input.sku.trim().toUpperCase(),
      category: input.category.trim() || 'General',
      costPrice: Math.max(0, Number(input.costPrice) || 0),
      sellingPrice: Math.max(0, Number(input.sellingPrice) || 0),
      quantity: Math.max(0, Number(input.quantity) || 0),
      reorderThreshold: Math.max(0, Number(input.reorderThreshold) || settings.defaultReorderThreshold),
      unit: input.unit || 'pcs',
      barcode: input.barcode?.trim() || undefined,
      lastRestocked: input.quantity > 0 ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    setProducts((prev) => [newProduct, ...prev]);
    return { success: true };
  };

  // Update Product
  const updateProduct = (id: string, updates: Partial<Product>) => {
    const existing = products.find((p) => p.id === id);
    if (!existing) return { success: false, error: 'Product not found.' };

    if (updates.sku && updates.sku.trim().toLowerCase() !== existing.sku.toLowerCase()) {
      const skuExists = products.some(
        (p) => p.id !== id && p.sku.toLowerCase() === updates.sku!.trim().toLowerCase()
      );
      if (skuExists) {
        return { success: false, error: `SKU "${updates.sku}" already exists on another item.` };
      }
    }

    const now = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const qtyChanged = updates.quantity !== undefined && updates.quantity > p.quantity;
        return {
          ...p,
          ...updates,
          sku: updates.sku ? updates.sku.toUpperCase() : p.sku,
          lastRestocked: qtyChanged ? now : p.lastRestocked,
          updatedAt: now,
        };
      })
    );

    return { success: true };
  };

  // Delete Product
  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    return { success: true };
  };

  // Quick adjust stock
  const adjustStock = (id: string, delta: number) => {
    const target = products.find((p) => p.id === id);
    if (!target) return { success: false, error: 'Product not found.' };

    const newQty = target.quantity + delta;
    if (newQty < 0) {
      return { success: false, error: `Cannot reduce below zero. Current stock is ${target.quantity}.` };
    }

    const now = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              quantity: newQty,
              lastRestocked: delta > 0 ? now : p.lastRestocked,
              updatedAt: now,
            }
          : p
      )
    );
    return { success: true };
  };

  // Record Sale & automatically deduct stock
  const recordSale = (input: RecordSaleInput) => {
    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'Cannot record a sale with zero items.' };
    }

    // Verify stock availability
    for (const item of input.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        return { success: false, error: `Product "${item.productName}" not found in inventory.` };
      }
      if (prod.quantity < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${prod.name}". In stock: ${prod.quantity}, requested: ${item.quantity}.`,
        };
      }
    }

    const now = new Date();
    const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSale: Sale = {
      id: 'sale-' + Date.now(),
      invoiceNumber,
      timestamp: now.toISOString(),
      items: input.items,
      subtotal: input.subtotal,
      discount: input.discount,
      tax: input.tax,
      total: input.total,
      paymentMethod: input.paymentMethod,
      customerName: input.customerName?.trim() || undefined,
      customerPhone: input.customerPhone?.trim() || undefined,
      status: 'Completed',
    };

    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => {
        const soldItem = input.items.find((item) => item.productId === p.id);
        if (!soldItem) return p;
        return {
          ...p,
          quantity: Math.max(0, p.quantity - soldItem.quantity),
          updatedAt: now.toISOString(),
        };
      })
    );

    // Add sale to top of sales list
    setSales((prev) => [newSale, ...prev]);

    return { success: true, invoiceNumber };
  };

  // Refund Sale & restore stock
  const refundSale = (id: string) => {
    const sale = sales.find((s) => s.id === id);
    if (!sale) return { success: false, error: 'Sale record not found.' };
    if (sale.status === 'Refunded') return { success: false, error: 'Sale is already refunded.' };

    const now = new Date().toISOString();
    // Restore product quantities
    setProducts((prev) =>
      prev.map((p) => {
        const item = sale.items.find((it) => it.productId === p.id);
        if (!item) return p;
        return {
          ...p,
          quantity: p.quantity + item.quantity,
          updatedAt: now,
        };
      })
    );

    // Mark sale as refunded
    setSales((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'Refunded' } : s))
    );

    return { success: true };
  };

  // Settings
  const updateSettings = (updates: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  // Reset to initial sample data
  const resetToDefaults = () => {
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setSettings(INITIAL_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  };

  // Export JSON
  const exportDataJson = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      storeSettings: settings,
      products,
      sales,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dukaandesk-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const exportProductsCsv = () => {
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Cost Price', 'Selling Price', 'Quantity', 'Unit', 'Reorder Threshold', 'Stock Status'];
    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      `"${p.category.replace(/"/g, '""')}"`,
      p.costPrice,
      p.sellingPrice,
      p.quantity,
      p.unit,
      p.reorderThreshold,
      p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.reorderThreshold ? 'Low Stock' : 'In Stock',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dukaandesk-products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Computed metrics
  const completedSales = useMemo(() => sales.filter((s) => s.status === 'Completed'), [sales]);

  const metrics = useMemo(() => {
    const totalSalesRevenue = completedSales.reduce((acc, s) => acc + s.total, 0);
    const totalTransactions = completedSales.length;
    const productCount = products.length;
    
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalInventoryCost = 0;
    let totalInventoryRetail = 0;

    for (const p of products) {
      if (p.quantity === 0) {
        outOfStockCount++;
      } else if (p.quantity <= p.reorderThreshold) {
        lowStockCount++;
      }
      totalInventoryCost += p.costPrice * p.quantity;
      totalInventoryRetail += p.sellingPrice * p.quantity;
    }

    const potentialProfit = Math.max(0, totalInventoryRetail - totalInventoryCost);
    const averageOrderValue = totalTransactions > 0 ? totalSalesRevenue / totalTransactions : 0;

    return {
      totalSalesRevenue,
      totalTransactions,
      productCount,
      lowStockCount,
      outOfStockCount,
      totalInventoryCost,
      totalInventoryRetail,
      potentialProfit,
      averageOrderValue,
    };
  }, [completedSales, products]);

  // Low stock products list
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.quantity <= p.reorderThreshold).sort((a, b) => a.quantity - b.quantity);
  }, [products]);

  // Recent sales list (latest 8)
  const recentSales = useMemo(() => {
    return [...sales].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);
  }, [sales]);

  // Daily sales trends (last 7 calendar days up to today)
  const dailySalesTrend = useMemo(() => {
    const result: DailySalesData[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const displayDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      // Find completed sales matching date
      const daysSales = completedSales.filter((s) => s.timestamp.startsWith(dateKey));
      const totalRevenue = daysSales.reduce((acc, s) => acc + s.total, 0);
      const transactionsCount = daysSales.length;

      // Estimated profit for that day
      let estimatedProfit = 0;
      daysSales.forEach((s) => {
        const saleItemsProfit = s.items.reduce((sum, item) => sum + (item.unitPrice - item.costPrice) * item.quantity, 0);
        estimatedProfit += saleItemsProfit - s.discount;
      });

      result.push({
        date: dateKey,
        displayDate,
        totalRevenue,
        transactionsCount,
        estimatedProfit: Math.max(0, estimatedProfit),
      });
    }

    return result;
  }, [completedSales]);

  // Top selling products
  const topSellingProducts = useMemo(() => {
    const productStats: Record<string, { productName: string; category: string; unitsSold: number; totalRevenue: number }> = {};

    completedSales.forEach((s) => {
      s.items.forEach((item) => {
        if (!productStats[item.productId]) {
          const prod = products.find((p) => p.id === item.productId);
          productStats[item.productId] = {
            productName: item.productName,
            category: prod?.category || 'General',
            unitsSold: 0,
            totalRevenue: 0,
          };
        }
        productStats[item.productId].unitsSold += item.quantity;
        productStats[item.productId].totalRevenue += item.total;
      });
    });

    return Object.values(productStats).sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);
  }, [completedSales, products]);

  return (
    <StoreContext.Provider
      value={{
        products,
        sales,
        settings,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        recordSale,
        refundSale,
        updateSettings,
        resetToDefaults,
        exportDataJson,
        exportProductsCsv,
        metrics,
        recentSales,
        lowStockProducts,
        dailySalesTrend,
        topSellingProducts,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
