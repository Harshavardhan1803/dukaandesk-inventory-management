import React, { useState, useMemo } from 'react';
import { 
  ReceiptText, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  IndianRupee, 
  QrCode, 
  BookOpen, 
  ShoppingBag, 
  CheckCircle2, 
  Printer, 
  RotateCcw, 
  Eye, 
  User, 
  Phone,
  AlertCircle
} from 'lucide-react';
import { Product, PaymentMethod, SaleItem, Sale } from '../../types';
import { useStore } from '../../context/StoreContext';
import { ReceiptModal } from './ReceiptModal';

interface CartItem {
  product: Product;
  quantity: number;
}

export const SalesView: React.FC = () => {
  const { products, sales, settings, recordSale, refundSale, categories } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'pos' | 'history'>('pos');

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [posCategory, setPosCategory] = useState('all');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [posError, setPosError] = useState<string | null>(null);

  // Completed Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<Sale | null>(null);

  // Sales History State
  const [historySearch, setHistorySearch] = useState('');
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState<string>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');

  // Filtered Products for POS catalog selector
  const posProducts = useMemo(() => {
    return products.filter((p) => {
      const search = productSearch.toLowerCase().trim();
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        (p.barcode && p.barcode.includes(search));

      const matchesCat = posCategory === 'all' || p.category === posCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, productSearch, posCategory]);

  // Cart calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  }, [cart]);

  const cartTax = useMemo(() => {
    const taxableAmount = Math.max(0, cartSubtotal - discountAmount);
    return (taxableAmount * settings.taxRatePercent) / 100;
  }, [cartSubtotal, discountAmount, settings.taxRatePercent]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discountAmount + cartTax);
  }, [cartSubtotal, discountAmount, cartTax]);

  // Add product to cart
  const addToCart = (product: Product) => {
    setPosError(null);
    if (product.quantity <= 0) {
      setPosError(`"${product.name}" is completely out of stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          setPosError(`Cannot add more than ${product.quantity} ${product.unit} (maximum available stock).`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setPosError(null);
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const targetProduct = products.find((p) => p.id === productId);
          const maxAvailable = targetProduct ? targetProduct.quantity : item.product.quantity;
          const nextQty = item.quantity + delta;

          if (nextQty > maxAvailable) {
            setPosError(`Only ${maxAvailable} ${item.product.unit} available in stock.`);
            return item;
          }
          return { ...item, quantity: nextQty };
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setCustomerName('');
    setCustomerPhone('');
    setPosError(null);
  };

  // Complete checkout & record sale
  const handleCheckout = () => {
    if (cart.length === 0) {
      setPosError('Cart is empty. Add items from the catalog.');
      return;
    }

    const saleItems: SaleItem[] = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      unitPrice: item.product.sellingPrice,
      costPrice: item.product.costPrice,
      total: item.product.sellingPrice * item.quantity,
    }));

    const res = recordSale({
      items: saleItems,
      subtotal: cartSubtotal,
      discount: discountAmount,
      tax: cartTax,
      total: cartTotal,
      paymentMethod,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
    });

    if (res.success && res.invoiceNumber) {
      // Find the newly recorded sale
      const createdSale = sales.find((s) => s.invoiceNumber === res.invoiceNumber) || {
        id: 'new-' + Date.now(),
        invoiceNumber: res.invoiceNumber,
        timestamp: new Date().toISOString(),
        items: saleItems,
        subtotal: cartSubtotal,
        discount: discountAmount,
        tax: cartTax,
        total: cartTotal,
        paymentMethod,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        status: 'Completed',
      };

      setActiveReceipt(createdSale);
      clearCart();
    } else {
      setPosError(res.error || 'Failed to complete transaction.');
    }
  };

  // Filtered History
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const search = historySearch.toLowerCase().trim();
      const matchesSearch =
        !search ||
        s.invoiceNumber.toLowerCase().includes(search) ||
        (s.customerName && s.customerName.toLowerCase().includes(search)) ||
        s.items.some((it) => it.productName.toLowerCase().includes(search));

      const matchesPayment =
        historyPaymentFilter === 'all' || s.paymentMethod === historyPaymentFilter;

      const matchesStatus =
        historyStatusFilter === 'all' || s.status.toLowerCase() === historyStatusFilter.toLowerCase();

      return matchesSearch && matchesPayment && matchesStatus;
    });
  }, [sales, historySearch, historyPaymentFilter, historyStatusFilter]);

  return (
    <div className="space-y-5">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('pos')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'pos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Counter Billing (POS)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>Sales Ledger & Invoices ({sales.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 hidden sm:block">
          Tax rate: <span className="font-semibold text-slate-800">{settings.taxRatePercent}%</span>
        </div>
      </div>

      {activeSubTab === 'pos' ? (
        /* POS Split Layout: Catalog on Left, Live Cart on Right */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Product Picker (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search item by title, SKU, or barcode..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <select
                  value={posCategory}
                  onChange={(e) => setPosCategory(e.target.value)}
                  className="px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[580px] overflow-y-auto pr-1">
                {posProducts.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-xs text-slate-400">
                    No products matching search in this category.
                  </div>
                ) : (
                  posProducts.map((p) => {
                    const isOutOfStock = p.quantity === 0;
                    const inCartCount = cart.find((item) => item.product.id === p.id)?.quantity || 0;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addToCart(p)}
                        disabled={isOutOfStock}
                        className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all relative ${
                          isOutOfStock
                            ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                            : inCartCount > 0
                            ? 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-400'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        {inCartCount > 0 && (
                          <span className="absolute top-2 right-2 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">
                            {inCartCount} in bill
                          </span>
                        )}

                        <div>
                          <div className="font-semibold text-xs text-slate-900 line-clamp-2 leading-tight">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-1">
                            {p.sku}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-bold font-mono text-slate-900 tabular-nums">
                            {settings.currencySymbol}{p.sellingPrice}
                          </span>
                          <span
                            className={`text-[10px] font-mono tabular-nums ${
                              isOutOfStock
                                ? 'text-rose-600 font-bold'
                                : p.quantity <= p.reorderThreshold
                                ? 'text-amber-600 font-medium'
                                : 'text-slate-400'
                            }`}
                          >
                            {isOutOfStock ? '0 left' : `${p.quantity} ${p.unit}`}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Bill / Cart (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ReceiptText className="w-4 h-4 text-slate-700" />
                  <h3 className="text-sm font-semibold text-slate-900">Active Bill</h3>
                  <span className="text-xs text-slate-400 font-mono">
                    ({cart.reduce((sum, item) => sum + item.quantity, 0)} units)
                  </span>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-rose-600 hover:underline font-medium"
                  >
                    Clear Bill
                  </button>
                )}
              </div>

              {posError && (
                <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{posError}</span>
                </div>
              )}

              {/* Items in Cart */}
              <div className="mt-4 space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    Bill is empty. Click any item from the left catalog to add.
                  </div>
                ) : (
                  cart.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-semibold text-slate-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {settings.currencySymbol}{product.sellingPrice} × {quantity} ={' '}
                          <span className="font-semibold text-slate-800">
                            {settings.currencySymbol}{(product.sellingPrice * quantity).toFixed(2)}
                          </span>
                        </p>
                      </div>

                      {/* Steppers */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateCartQuantity(product.id, -1)}
                          className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-slate-900 tabular-nums">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(product.id, 1)}
                          className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 ml-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bill Summary, Customer Info & Payment */}
            <div className="mt-5 pt-4 border-t border-slate-200 space-y-3">
              {/* Optional Customer */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <input
                    type="text"
                    placeholder="Customer Name (optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Phone # (optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs"
                  />
                </div>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Discount ({settings.currencySymbol})</span>
                <input
                  type="number"
                  min="0"
                  max={cartSubtotal}
                  value={discountAmount || ''}
                  placeholder="0.00"
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right px-2 py-1 border border-slate-200 rounded font-mono text-xs"
                />
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="tabular-nums">
                    {settings.currencySymbol}{cartSubtotal.toFixed(2)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="tabular-nums">
                      -{settings.currencySymbol}{discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Tax ({settings.taxRatePercent}%):</span>
                  <span className="tabular-nums">
                    +{settings.currencySymbol}{cartTax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Due:</span>
                  <span className="tabular-nums text-emerald-700">
                    {settings.currencySymbol}{cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {(['Cash', 'UPI / QR', 'Card', 'Store Credit'] as PaymentMethod[]).map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`py-1.5 px-1 rounded-md text-center font-medium border text-[11px] transition-colors ${
                        paymentMethod === pm
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-bold tracking-wide transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Bill ({settings.currencySymbol}{cartTotal.toFixed(2)})</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Sales History Ledger */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative flex-1 w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice # or customer..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={historyPaymentFilter}
                onChange={(e) => setHistoryPaymentFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700"
              >
                <option value="all">All Payment Methods</option>
                <option value="Cash">Cash</option>
                <option value="UPI / QR">UPI / QR</option>
                <option value="Card">Card</option>
                <option value="Store Credit">Store Credit</option>
              </select>

              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Items</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3 text-right">Total Amount</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No transactions match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {sale.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {new Date(sale.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {sale.customerName || <span className="text-slate-400 italic">Walk-in</span>}
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate">
                          {sale.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {sale.paymentMethod}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                          {settings.currencySymbol}{sale.total.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {sale.status === 'Refunded' ? (
                            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                              Refunded
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-emerald-700">
                              Completed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setActiveReceipt(sale)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium text-xs transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Bill</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View/Print Receipt Modal */}
      <ReceiptModal
        sale={activeReceipt}
        isOpen={Boolean(activeReceipt)}
        onClose={() => setActiveReceipt(null)}
        onRefund={refundSale}
      />
    </div>
  );
};
