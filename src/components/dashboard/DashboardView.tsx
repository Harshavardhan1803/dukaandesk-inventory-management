import React, { useState } from 'react';
import { 
  IndianRupee, 
  ReceiptText, 
  Package, 
  AlertTriangle, 
  ArrowRight, 
  Plus, 
  Eye, 
  Clock, 
  TrendingUp, 
  CheckCircle2 
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { StatCard } from '../common/StatCard';
import { SalesChart } from './SalesChart';
import { ReceiptModal } from '../sales/ReceiptModal';
import { Sale, NavigationTab } from '../../types';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenNewSale: () => void;
  onOpenAddProduct: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewSale,
  onOpenAddProduct,
}) => {
  const { metrics, recentSales, lowStockProducts, settings, adjustStock, refundSale } = useStore();
  const [selectedReceipt, setSelectedReceipt] = useState<Sale | null>(null);
  const [restockedMessage, setRestockedMessage] = useState<string | null>(null);

  const handleQuickRestock = (productId: string, productName: string) => {
    const res = adjustStock(productId, 10);
    if (res.success) {
      setRestockedMessage(`Restocked +10 units of ${productName}`);
      setTimeout(() => setRestockedMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast message if quick restocked */}
      {restockedMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{restockedMessage}</span>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`${settings.currencySymbol}${metrics.totalSalesRevenue.toLocaleString()}`}
          icon={IndianRupee}
          subtitle={`Avg ${settings.currencySymbol}${Math.round(metrics.averageOrderValue)} / bill`}
          trend={{ text: 'Completed', isPositive: true }}
        />
        <StatCard
          title="Total Transactions"
          value={metrics.totalTransactions}
          icon={ReceiptText}
          subtitle="Processed bills"
          trend={{ text: `${recentSales.length} recent`, isPositive: true }}
        />
        <StatCard
          title="Active Products"
          value={metrics.productCount}
          icon={Package}
          subtitle={`Valuation: ${settings.currencySymbol}${metrics.totalInventoryRetail.toLocaleString()}`}
          onClick={() => onNavigate('products')}
        />
        <StatCard
          title="Low Stock Alerts"
          value={metrics.lowStockCount + metrics.outOfStockCount}
          icon={AlertTriangle}
          subtitle={
            metrics.outOfStockCount > 0
              ? `${metrics.outOfStockCount} completely out of stock`
              : 'Items below reorder limit'
          }
          trend={{
            text: metrics.lowStockCount > 0 ? 'Requires attention' : 'Inventory healthy',
            isWarning: metrics.lowStockCount > 0,
            isPositive: metrics.lowStockCount === 0,
          }}
          onClick={() => onNavigate('products')}
        />
      </div>

      {/* Main middle section: Sales Chart & Action quickbar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>

        {/* Quick Operations & Inventory Health */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">
              Counter Actions
            </h3>
            <div className="mt-4 space-y-2.5">
              <button
                onClick={onOpenNewSale}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-600 text-white rounded">
                    <ReceiptText className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">Record New Sale</span>
                    <span className="text-[11px] text-emerald-700">Quick POS counter billing</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-700" />
              </button>

              <button
                onClick={onOpenAddProduct}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-slate-900 text-white rounded">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">Add New Product</span>
                    <span className="text-[11px] text-slate-500">Insert item with SKU & price</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-slate-200 text-slate-700 rounded">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">View Profit & Reports</span>
                    <span className="text-[11px] text-slate-500">Margins, stock valuation</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Catalog Stock Status</span>
              <span className="font-mono tabular-nums font-semibold text-slate-700">
                {metrics.productCount - metrics.lowStockCount - metrics.outOfStockCount} / {metrics.productCount} Safe
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${
                    metrics.productCount > 0
                      ? ((metrics.productCount - metrics.lowStockCount - metrics.outOfStockCount) / metrics.productCount) * 100
                      : 100
                  }%`,
                }}
                className="bg-emerald-500 h-full"
              />
              <div
                style={{
                  width: `${
                    metrics.productCount > 0 ? (metrics.lowStockCount / metrics.productCount) * 100 : 0
                  }%`,
                }}
                className="bg-amber-400 h-full"
              />
              <div
                style={{
                  width: `${
                    metrics.productCount > 0 ? (metrics.outOfStockCount / metrics.productCount) * 100 : 0
                  }%`,
                }}
                className="bg-rose-500 h-full"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Optimal
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Low ({metrics.lowStockCount})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Out ({metrics.outOfStockCount})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom two-column: Recent Transactions & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Transactions</h3>
              <p className="text-xs text-slate-500">Latest completed counter sales</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {recentSales.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No sales recorded yet. Click "New Sale" to record your first transaction.
              </div>
            ) : (
              recentSales.slice(0, 6).map((sale) => (
                <div
                  key={sale.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600 mt-0.5">
                      <ReceiptText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-slate-900">
                          {sale.invoiceNumber}
                        </span>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span className="text-xs text-slate-500">{sale.paymentMethod}</span>
                        {sale.status === 'Refunded' && (
                          <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                            Refunded
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>
                          {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {sale.customerName && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-[120px]">{sale.customerName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono tabular-nums text-slate-900">
                        {settings.currencySymbol}{sale.total.toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedReceipt(sale)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                      title="View Bill Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Low Stock Notice</h3>
              <p className="text-xs text-slate-500">Products at or below reorder threshold</p>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>Manage Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                All product stock levels are above reorder thresholds.
              </div>
            ) : (
              lowStockProducts.slice(0, 6).map((product) => {
                const isOutOfStock = product.quantity === 0;
                return (
                  <div
                    key={product.id}
                    className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
                  >
                    <div className="pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {product.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span className="font-mono text-slate-400">{product.sku}</span>
                        <span aria-hidden="true">·</span>
                        <span>{product.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>Threshold: {product.reorderThreshold} {product.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span
                          className={`text-xs font-bold font-mono tabular-nums ${
                            isOutOfStock ? 'text-rose-600' : 'text-amber-600'
                          }`}
                        >
                          {product.quantity} {product.unit}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleQuickRestock(product.id, product.name)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap"
                        title="Add +10 units to stock"
                      >
                        +10 Restock
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bill Details Modal */}
      <ReceiptModal
        sale={selectedReceipt}
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        onRefund={refundSale}
      />
    </div>
  );
};
