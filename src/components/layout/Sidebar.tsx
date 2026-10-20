import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ReceiptText, 
  BarChart3, 
  Settings, 
  Store, 
  AlertTriangle, 
  Database,
  X 
} from 'lucide-react';
import { NavigationTab } from '../../types';
import { useStore } from '../../context/StoreContext';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenNewSale: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  onOpenNewSale,
}) => {
  const { settings, metrics } = useStore();

  const navItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package, badge: metrics.lowStockCount > 0 ? metrics.lowStockCount : undefined },
    { id: 'sales', label: 'Sales & Billing', icon: ReceiptText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Store className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block">
                DukaanDesk
              </span>
              <span className="text-xs text-slate-400 block truncate max-w-[140px]">
                {settings.storeName}
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Sale Action Button */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => {
              onOpenNewSale();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold tracking-wide transition-colors shadow-xs"
          >
            <ReceiptText className="w-4 h-4" />
            <span>New Sale / Billing</span>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="flex items-center gap-1 text-xs text-amber-400 font-mono tabular-nums bg-amber-400/10 px-1.5 py-0.5 rounded">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{item.badge}</span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Storage status & footer */}
        <div className="p-4 border-t border-slate-800 text-xs">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-800/70 text-slate-300">
            <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-200">Local Browser Storage</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Data saved in browser localStorage. No remote server connected.
              </p>
            </div>
          </div>
          <div className="mt-3 text-center text-[11px] text-slate-500">
            DukaanDesk v1.0 · Kirana Edition
          </div>
        </div>
      </aside>
    </>
  );
};
