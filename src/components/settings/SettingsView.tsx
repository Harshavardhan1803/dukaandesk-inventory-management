import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Store, 
  Save, 
  RotateCcw, 
  Download, 
  FileText, 
  Database, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle2 
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Modal } from '../common/Modal';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetToDefaults, 
    exportDataJson, 
    exportProductsCsv,
    products,
    sales 
  } = useStore();

  const [formData, setFormData] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    resetToDefaults();
    setFormData({ ...settings });
    setIsResetModalOpen(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Store settings have been updated successfully.</span>
        </div>
      )}

      {/* Shop Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Retail Store Profile
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Business information displayed on printed receipts and bills
            </p>
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Store Name */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Store / Shop Name *
            </label>
            <input
              type="text"
              required
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Tagline */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Store Tagline
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900"
              placeholder="e.g. Daily Groceries & Essentials"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Contact Phone / WhatsApp
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Currency Symbol */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Currency Symbol
            </label>
            <input
              type="text"
              value={formData.currencySymbol}
              onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-900"
              placeholder="e.g. ₹ or $ or €"
            />
          </div>

          {/* Store Address */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Store Physical Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Tax Rate % */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Default Sales Tax / GST Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.taxRatePercent}
              onChange={(e) => setFormData({ ...formData, taxRatePercent: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-900"
            />
            <span className="text-[11px] text-slate-400">
              Applied automatically to POS checkout bills
            </span>
          </div>

          {/* Default Reorder Threshold */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Default Low Stock Alert Threshold
            </label>
            <input
              type="number"
              min="1"
              value={formData.defaultReorderThreshold}
              onChange={(e) => setFormData({ ...formData, defaultReorderThreshold: parseInt(e.target.value, 10) || 5 })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-900"
            />
            <span className="text-[11px] text-slate-400">
              Assigned to newly created products by default
            </span>
          </div>

          {/* Receipt Footer Notes */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Receipt Footer Disclaimer / Terms
            </label>
            <input
              type="text"
              value={formData.receiptNotes}
              onChange={(e) => setFormData({ ...formData, receiptNotes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900"
              placeholder="e.g. Thank you for shopping with us! No returns on perishable items."
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Data Management & Export Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">
            Data Backup & Reset
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Download your inventory catalog and transactions or reset back to realistic defaults
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={exportProductsCsv}
            className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors flex items-start gap-3"
          >
            <FileText className="w-5 h-5 text-slate-700 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-slate-900 block">Export Products CSV</span>
              <span className="text-[11px] text-slate-500">Download {products.length} products to Excel</span>
            </div>
          </button>

          <button
            type="button"
            onClick={exportDataJson}
            className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors flex items-start gap-3"
          >
            <Download className="w-5 h-5 text-slate-700 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-slate-900 block">Full Backup (JSON)</span>
              <span className="text-[11px] text-slate-500">Products, settings & {sales.length} sales</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-left transition-colors flex items-start gap-3"
          >
            <RotateCcw className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-rose-900 block">Reset to Sample Data</span>
              <span className="text-[11px] text-rose-700">Restore factory sample store state</span>
            </div>
          </button>
        </div>
      </div>

      {/* Architecture & Persistence Notice */}
      <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Storage & Scope Disclaimer</span>
        </div>
        <p className="leading-relaxed text-slate-600">
          DukaanDesk currently uses <strong>client-side browser storage (localStorage)</strong>.
          Your catalog changes, stock deductions, and sales invoices will persist reliably across page refreshes in this browser.
        </p>
        <p className="leading-relaxed text-slate-500 text-[11px]">
          <strong>Note on Production Multi-Device Scaling:</strong> To support multi-counter synchronization,
          remote tablet orders, or automated cloud backups, a persistent backend database (such as PostgreSQL or Firebase Firestore)
          can be provisioned when you are ready to expand beyond single-terminal offline operation.
        </p>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Store to Sample Data"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            This action will replace all current inventory items, sales logs, and custom settings
            with the initial sample store dataset.
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Any custom products or test transactions you created will be replaced.</span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-1.5 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
            >
              Confirm Reset
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
