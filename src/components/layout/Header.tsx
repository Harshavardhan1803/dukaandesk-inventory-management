import React from 'react';
import { Menu, Plus, ShoppingCart } from 'lucide-react';
import { NavigationTab } from '../../types';
import { useStore } from '../../context/StoreContext';

interface HeaderProps {
  currentTab: NavigationTab;
  onOpenMobile: () => void;
  onOpenAddProduct: () => void;
  onOpenNewSale: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobile,
  onOpenAddProduct,
  onOpenNewSale,
}) => {
  const { settings } = useStore();

  const getBreadcrumbTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Overview & Analytics';
      case 'products':
        return 'Inventory Catalog';
      case 'sales':
        return 'Sales & Register';
      case 'reports':
        return 'Business Reports';
      case 'settings':
        return 'Store Settings';
      default:
        return 'Overview';
    }
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-3.5 bg-white border-b border-slate-200">
      {/* Left: Mobile toggle + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-900 capitalize">
            {currentTab}
          </span>
          <span className="text-slate-300" aria-hidden="true">
            /
          </span>
          <span className="text-slate-500 hidden sm:inline text-xs">
            {getBreadcrumbTitle(currentTab)}
          </span>
        </div>
      </div>

      {/* Right: Date info & Fast action */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 tabular-nums">
          <span>{settings.storeName}</span>
          <span aria-hidden="true">·</span>
          <span>{todayFormatted}</span>
        </div>

        {currentTab === 'products' ? (
          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        ) : (
          <button
            onClick={onOpenNewSale}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>New Sale</span>
          </button>
        )}
      </div>
    </header>
  );
};
