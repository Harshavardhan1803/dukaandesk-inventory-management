import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  IndianRupee, 
  Printer, 
  Copy, 
  Check, 
  AlertTriangle,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const ReportsView: React.FC = () => {
  const { metrics, topSellingProducts, lowStockProducts, products, sales, settings } = useStore();
  const [copiedManifest, setCopiedManifest] = useState(false);

  // Completed sales
  const completedSales = sales.filter((s) => s.status === 'Completed');

  // Category breakdown calculation
  const categorySummary = React.useMemo(() => {
    const summary: Record<string, { productCount: number; stockQty: number; retailValue: number; costValue: number }> = {};
    products.forEach((p) => {
      const cat = p.category || 'General';
      if (!summary[cat]) {
        summary[cat] = { productCount: 0, stockQty: 0, retailValue: 0, costValue: 0 };
      }
      summary[cat].productCount += 1;
      summary[cat].stockQty += p.quantity;
      summary[cat].retailValue += p.sellingPrice * p.quantity;
      summary[cat].costValue += p.costPrice * p.quantity;
    });

    return Object.entries(summary).map(([category, data]) => ({
      category,
      ...data,
      potentialProfit: data.retailValue - data.costValue,
      marginPercent: data.retailValue > 0 ? Math.round(((data.retailValue - data.costValue) / data.retailValue) * 100) : 0,
    })).sort((a, b) => b.retailValue - a.retailValue);
  }, [products]);

  // Payment method breakdown
  const paymentMethodSummary = React.useMemo(() => {
    const methods: Record<string, { count: number; total: number }> = {
      Cash: { count: 0, total: 0 },
      'UPI / QR': { count: 0, total: 0 },
      Card: { count: 0, total: 0 },
      'Store Credit': { count: 0, total: 0 },
    };

    completedSales.forEach((s) => {
      if (methods[s.paymentMethod]) {
        methods[s.paymentMethod].count += 1;
        methods[s.paymentMethod].total += s.total;
      }
    });

    return Object.entries(methods).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
      percentage: metrics.totalSalesRevenue > 0 ? Math.round((data.total / metrics.totalSalesRevenue) * 100) : 0,
    }));
  }, [completedSales, metrics.totalSalesRevenue]);

  // Copy low-stock manifest to clipboard
  const handleCopyManifest = () => {
    const lines = [
      `PURCHASE / REORDER MANIFEST - ${settings.storeName}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Total items to reorder: ${lowStockProducts.length}`,
      '------------------------------------------------',
      ...lowStockProducts.map(
        (p) =>
          `• ${p.name} [SKU: ${p.sku}] - Current: ${p.quantity} ${p.unit} (Need approx: ${Math.max(10, p.reorderThreshold * 2)} ${p.unit})`
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedManifest(true);
    setTimeout(() => setCopiedManifest(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Retail Business Performance & Valuation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock valuation, category margins, and reorder sheets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 3-Column Valuation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Inventory Cost Valuation
          </span>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {settings.currencySymbol}{metrics.totalInventoryCost.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Total capital invested in stock across {metrics.productCount} catalog products.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Retail Realization Value
          </span>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {settings.currencySymbol}{metrics.totalInventoryRetail.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Expected revenue once current store inventory is sold at retail prices.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Unrealized Gross Margin
          </span>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {settings.currencySymbol}{metrics.potentialProfit.toLocaleString()}{' '}
            <span className="text-sm font-semibold text-emerald-600">
              ({metrics.totalInventoryRetail > 0
                ? Math.round((metrics.potentialProfit / metrics.totalInventoryRetail) * 100)
                : 0}%)
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Net potential trading margin from existing on-shelf stock.
          </p>
        </div>
      </div>

      {/* Two Column: Category Breakdown & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Category Margins & Stock</h3>
              <p className="text-xs text-slate-500">Inventory spread across departments</p>
            </div>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {categorySummary.map((cat) => (
              <div key={cat.category} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 block">{cat.category}</span>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{cat.productCount} products</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{cat.stockQty} total units</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold font-mono tabular-nums text-slate-900">
                    {settings.currencySymbol}{cat.retailValue.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    {cat.marginPercent}% margin ({settings.currencySymbol}{cat.potentialProfit.toLocaleString()})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Products by Sales Volume */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Top Moving Products</h3>
              <p className="text-xs text-slate-500">Highest volume items sold</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {topSellingProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No products sold yet. Record sales to populate top selling data.
              </div>
            ) : (
              topSellingProducts.map((p, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-900 block">{p.productName}</span>
                      <span className="text-[11px] text-slate-500">{p.category}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold font-mono tabular-nums text-slate-900 block">
                      {p.unitsSold} sold
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {settings.currencySymbol}{p.totalRevenue.toLocaleString()} revenue
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Payment Channels & Low Stock Purchase Manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Channels */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">
            Payment Breakdown
          </h3>
          <div className="mt-4 space-y-3">
            {paymentMethodSummary.map((pm) => (
              <div key={pm.method} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{pm.method}</span>
                  <span className="font-mono font-bold tabular-nums text-slate-900">
                    {settings.currencySymbol}{pm.total.toLocaleString()} ({pm.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pm.percentage}%` }}
                    className="bg-slate-800 h-full rounded-full"
                  />
                </div>
                <div className="text-[10px] text-slate-400">
                  {pm.count} {pm.count === 1 ? 'transaction' : 'transactions'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Reorder Manifest for Suppliers */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Supplier Reorder Manifest
              </h3>
              <p className="text-xs text-slate-500">
                Quick checklist for ordering wholesale stock from distributors
              </p>
            </div>
            <button
              onClick={handleCopyManifest}
              disabled={lowStockProducts.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40"
            >
              {copiedManifest ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Order List</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-3">
            {lowStockProducts.length === 0 ? (
              <div className="py-10 text-center text-xs text-emerald-700 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <Check className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                All stock levels are currently sufficient. No reorders needed!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 pb-1 text-[11px] font-semibold uppercase">
                      <th className="py-2">Item</th>
                      <th className="py-2">SKU</th>
                      <th className="py-2 text-center">In Hand</th>
                      <th className="py-2 text-center">Suggested Order</th>
                      <th className="py-2 text-right">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lowStockProducts.map((p) => {
                      const suggestedQty = Math.max(10, p.reorderThreshold * 2);
                      const estimatedCost = suggestedQty * p.costPrice;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 font-medium text-slate-900 pr-2">
                            {p.name}
                          </td>
                          <td className="py-2.5 font-mono text-slate-500 text-[11px]">
                            {p.sku}
                          </td>
                          <td className="py-2.5 text-center font-mono font-bold text-amber-600 tabular-nums">
                            {p.quantity} {p.unit}
                          </td>
                          <td className="py-2.5 text-center font-mono text-emerald-700 font-semibold tabular-nums">
                            +{suggestedQty} {p.unit}
                          </td>
                          <td className="py-2.5 text-right font-mono tabular-nums text-slate-800">
                            {settings.currencySymbol}{estimatedCost.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
