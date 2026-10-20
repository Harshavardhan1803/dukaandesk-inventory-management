import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  Check, 
  ArrowUpDown, 
  Minus, 
  Package,
  Layers,
  Sparkles
} from 'lucide-react';
import { Product, ProductUnit } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Modal } from '../common/Modal';

interface ProductsViewProps {
  isAddModalOpen: boolean;
  onCloseAddModal: () => void;
  onOpenAddModal: () => void;
}

const PRODUCT_UNITS: ProductUnit[] = ['pcs', 'kg', 'packet', 'liter', 'box', 'meter', 'dozen'];

export const ProductsView: React.FC<ProductsViewProps> = ({
  isAddModalOpen,
  onCloseAddModal,
  onOpenAddModal,
}) => {
  const {
    products,
    categories,
    settings,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    exportProductsCsv,
  } = useStore();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortField, setSortField] = useState<'name' | 'quantity' | 'sellingPrice' | 'costPrice'>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Edit State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete Confirmation State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Quick Adjust Modal State
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Stock replenishment');

  // Form input states for Add Product
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formCostPrice, setFormCostPrice] = useState<number | ''>('');
  const [formSellingPrice, setFormSellingPrice] = useState<number | ''>('');
  const [formQuantity, setFormQuantity] = useState<number | ''>('');
  const [formThreshold, setFormThreshold] = useState<number | ''>(settings.defaultReorderThreshold);
  const [formUnit, setFormUnit] = useState<ProductUnit>('pcs');
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search
        const search = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !search ||
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search);

        // Category
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

        // Stock Status
        let matchesStatus = true;
        if (selectedStockStatus === 'in_stock') {
          matchesStatus = p.quantity > p.reorderThreshold;
        } else if (selectedStockStatus === 'low_stock') {
          matchesStatus = p.quantity > 0 && p.quantity <= p.reorderThreshold;
        } else if (selectedStockStatus === 'out_of_stock') {
          matchesStatus = p.quantity === 0;
        }

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB as string).toLowerCase();
        }
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [products, searchTerm, selectedCategory, selectedStockStatus, sortField, sortAsc]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const resetAddForm = () => {
    setFormName('');
    setFormSku('');
    setFormCategory('');
    setFormCostPrice('');
    setFormSellingPrice('');
    setFormQuantity('');
    setFormThreshold(settings.defaultReorderThreshold);
    setFormUnit('pcs');
    setFormError(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Product name is required.');
      return;
    }
    if (!formSku.trim()) {
      setFormError('SKU code is required.');
      return;
    }
    if (formSellingPrice === '' || Number(formSellingPrice) < 0) {
      setFormError('Valid selling price is required.');
      return;
    }

    const res = addProduct({
      name: formName,
      sku: formSku,
      category: formCategory || 'General Staples',
      costPrice: Number(formCostPrice) || 0,
      sellingPrice: Number(formSellingPrice) || 0,
      quantity: Number(formQuantity) || 0,
      reorderThreshold: Number(formThreshold) || settings.defaultReorderThreshold,
      unit: formUnit,
    });

    if (res.success) {
      resetAddForm();
      onCloseAddModal();
    } else {
      setFormError(res.error || 'Failed to add product');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const res = updateProduct(editingProduct.id, {
      name: editingProduct.name,
      sku: editingProduct.sku,
      category: editingProduct.category,
      costPrice: editingProduct.costPrice,
      sellingPrice: editingProduct.sellingPrice,
      quantity: editingProduct.quantity,
      reorderThreshold: editingProduct.reorderThreshold,
      unit: editingProduct.unit,
    });

    if (res.success) {
      setEditingProduct(null);
    } else {
      alert(res.error);
    }
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || adjustDelta === 0) return;

    const res = adjustStock(adjustingProduct.id, adjustDelta);
    if (res.success) {
      setAdjustingProduct(null);
      setAdjustDelta(0);
    } else {
      alert(res.error);
    }
  };

  // Helper to suggest SKU from name
  const suggestSku = (name: string) => {
    if (!name.trim()) return;
    const words = name.trim().split(/\s+/).slice(0, 3);
    const prefix = words.map(w => w.slice(0, 3).toUpperCase()).join('-');
    const randomCode = Math.floor(100 + Math.random() * 900);
    setFormSku(`${prefix}-${randomCode}`);
  };

  return (
    <div className="space-y-5">
      {/* Search, Filter & Action Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by title, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-slate-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportProductsCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              title="Download Product List as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Filter chips / Selectors */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium">Filter by:</span>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Stock Status Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setSelectedStockStatus('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedStockStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Items ({products.length})
            </button>
            <button
              onClick={() => setSelectedStockStatus('in_stock')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedStockStatus === 'in_stock'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setSelectedStockStatus('low_stock')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedStockStatus === 'low_stock'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setSelectedStockStatus('out_of_stock')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedStockStatus === 'out_of_stock'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Out of Stock
            </button>
          </div>

          {(searchTerm || selectedCategory !== 'all' || selectedStockStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedStockStatus('all');
              }}
              className="text-xs text-rose-600 hover:underline ml-auto font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Product Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">
                  <button
                    onClick={() => toggleSort('name')}
                    className="flex items-center gap-1 hover:text-slate-900"
                  >
                    <span>Item & SKU</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">
                  <button
                    onClick={() => toggleSort('costPrice')}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    <span>Cost</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right">
                  <button
                    onClick={() => toggleSort('sellingPrice')}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    <span>Price</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right">Margin</th>
                <th className="py-3 px-3 text-center">
                  <button
                    onClick={() => toggleSort('quantity')}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    <span>Quantity</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">No products found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {products.length === 0
                        ? 'Your inventory is currently empty.'
                        : 'No products match your current search and filters.'}
                    </p>
                    {products.length === 0 ? (
                      <button
                        onClick={onOpenAddModal}
                        className="mt-3 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                      >
                        Add First Product
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedCategory('all');
                          setSelectedStockStatus('all');
                        }}
                        className="mt-3 px-3 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium hover:bg-slate-200"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.quantity === 0;
                  const isLowStock = p.quantity > 0 && p.quantity <= p.reorderThreshold;
                  const marginPercent =
                    p.sellingPrice > 0
                      ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100)
                      : 0;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Name & SKU */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                          <span>{p.sku}</span>
                          {p.barcode && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{p.barcode}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {p.category}
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                        {settings.currencySymbol}{p.costPrice.toFixed(2)}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {settings.currencySymbol}{p.sellingPrice.toFixed(2)}
                      </td>

                      {/* Margin % */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs">
                        <span className={marginPercent > 0 ? 'text-emerald-700' : 'text-slate-500'}>
                          {marginPercent}%
                        </span>
                      </td>

                      {/* Quantity & Stepper */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                          <button
                            onClick={() => adjustStock(p.id, -1)}
                            disabled={p.quantity <= 0}
                            className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Decrease quantity by 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono tabular-nums font-bold text-slate-900 min-w-[28px] text-center">
                            {p.quantity}
                          </span>
                          <button
                            onClick={() => adjustStock(p.id, 1)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-600"
                            title="Increase quantity by 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          {p.unit}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {isOutOfStock ? (
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            Low (limit: {p.reorderThreshold})
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setAdjustingProduct(p);
                              setAdjustDelta(10);
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                            title="Adjust batch stock"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table summary bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Showing <strong className="text-slate-800">{filteredProducts.length}</strong> of{' '}
            <strong className="text-slate-800">{products.length}</strong> products
          </div>
          <div className="flex items-center gap-3">
            <span>
              Total Units:{' '}
              <strong className="font-mono tabular-nums text-slate-800">
                {filteredProducts.reduce((acc, p) => acc + p.quantity, 0)}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Stock Retail Value:{' '}
              <strong className="font-mono tabular-nums text-slate-800">
                {settings.currencySymbol}
                {filteredProducts
                  .reduce((acc, p) => acc + p.sellingPrice * p.quantity, 0)
                  .toLocaleString()}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          resetAddForm();
          onCloseAddModal();
        }}
        title="Add New Inventory Product"
        description="Enter product details, pricing, and initial stock level."
        maxWidth="xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Aashirvaad Superior Atta (5kg)"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (!formSku) suggestSku(e.target.value);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>

            {/* SKU */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">SKU Code *</label>
                <button
                  type="button"
                  onClick={() => suggestSku(formName)}
                  className="text-[11px] text-emerald-700 hover:underline"
                >
                  Generate SKU
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. STA-ATT-05K"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Category
              </label>
              <input
                type="text"
                list="category-suggestions"
                placeholder="e.g. Groceries & Staples"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
              <datalist id="category-suggestions">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Cost Price */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cost Price ({settings.currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formCostPrice}
                onChange={(e) => setFormCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
              <span className="text-[11px] text-slate-400">Wholesale cost from distributor</span>
            </div>

            {/* Selling Price */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Selling Price ({settings.currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={formSellingPrice}
                onChange={(e) => setFormSellingPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
              <span className="text-[11px] text-slate-400">Retail price charged to customer</span>
            </div>

            {/* Initial Stock Quantity */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Current Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Unit of Measurement
              </label>
              <select
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value as ProductUnit)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white"
              >
                {PRODUCT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Reorder Threshold */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Reorder Threshold (Low stock alert point)
              </label>
              <input
                type="number"
                min="0"
                value={formThreshold}
                onChange={(e) => setFormThreshold(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
              <span className="text-[11px] text-slate-400">
                Trigger low-stock warning when quantity falls to or below this level
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                resetAddForm();
                onCloseAddModal();
              }}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      {editingProduct && (
        <Modal
          isOpen={Boolean(editingProduct)}
          onClose={() => setEditingProduct(null)}
          title={`Edit Product: ${editingProduct.name}`}
          maxWidth="xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  SKU Code *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.sku}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, sku: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editingProduct.category}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cost Price ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingProduct.costPrice}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      costPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Selling Price ({settings.currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={editingProduct.sellingPrice}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      sellingPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Current Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingProduct.quantity}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      quantity: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Unit
                </label>
                <select
                  value={editingProduct.unit}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      unit: e.target.value as ProductUnit,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {PRODUCT_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Reorder Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingProduct.reorderThreshold}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      reorderThreshold: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Update Product
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <Modal
          isOpen={Boolean(adjustingProduct)}
          onClose={() => setAdjustingProduct(null)}
          title={`Adjust Inventory: ${adjustingProduct.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Current In Stock:</span>
                <span className="text-base font-bold font-mono tabular-nums text-slate-900">
                  {adjustingProduct.quantity} {adjustingProduct.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">New Quantity:</span>
                <span className="text-base font-bold font-mono tabular-nums text-emerald-600">
                  {Math.max(0, adjustingProduct.quantity + adjustDelta)} {adjustingProduct.unit}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Adjustment Amount (Use positive to add, negative to deduct)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustDelta((prev) => prev - 10)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustDelta((prev) => prev - 1)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono"
                >
                  -1
                </button>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(parseInt(e.target.value, 10) || 0)}
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded font-mono text-center font-bold text-sm"
                />
                <button
                  type="button"
                  onClick={() => setAdjustDelta((prev) => prev + 1)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustDelta((prev) => prev + 10)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono"
                >
                  +10
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reason / Note
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Supplier delivery, damage, audit count"
                className="w-full px-3 py-2 border border-slate-300 rounded"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="px-3 py-1.5 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adjustDelta === 0}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 disabled:opacity-40"
              >
                Apply Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <Modal
          isOpen={Boolean(deletingProduct)}
          onClose={() => setDeletingProduct(null)}
          title="Delete Product"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Are you sure you want to permanently remove{' '}
              <strong className="text-slate-900 font-semibold">{deletingProduct.name}</strong>{' '}
              ({deletingProduct.sku}) from your inventory?
            </p>
            <p className="text-slate-500 text-[11px]">
              This will not affect previously recorded completed sales receipts.
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProduct(deletingProduct.id);
                  setDeletingProduct(null);
                }}
                className="px-4 py-1.5 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
              >
                Delete Product
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
