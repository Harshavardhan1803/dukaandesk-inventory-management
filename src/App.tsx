/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StoreProvider } from './context/StoreContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductsView } from './components/products/ProductsView';
import { SalesView } from './components/sales/SalesView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { NavigationTab } from './types';

function MainLayout() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  const handleOpenAddProduct = () => {
    setCurrentTab('products');
    setIsAddProductModalOpen(true);
  };

  const handleOpenNewSale = () => {
    setCurrentTab('sales');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenNewSale={handleOpenNewSale}
      />

      {/* Main Content Area (offset by sidebar width on md+) */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          onOpenMobile={() => setMobileMenuOpen(true)}
          onOpenAddProduct={handleOpenAddProduct}
          onOpenNewSale={handleOpenNewSale}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentTab}
              onOpenNewSale={handleOpenNewSale}
              onOpenAddProduct={handleOpenAddProduct}
            />
          )}

          {currentTab === 'products' && (
            <ProductsView
              isAddModalOpen={isAddProductModalOpen}
              onCloseAddModal={() => setIsAddProductModalOpen(false)}
              onOpenAddModal={() => setIsAddProductModalOpen(true)}
            />
          )}

          {currentTab === 'sales' && <SalesView />}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
}
