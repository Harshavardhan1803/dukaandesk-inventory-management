import React from 'react';
import { Printer, CheckCircle2, RotateCcw } from 'lucide-react';
import { Sale } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Modal } from '../common/Modal';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onRefund?: (saleId: string) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  isOpen,
  onClose,
  onRefund,
}) => {
  const { settings } = useStore();

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const isRefunded = sale.status === 'Refunded';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bill Receipt #${sale.invoiceNumber}`}
      description={new Date(sale.timestamp).toLocaleString()}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Print wrapper */}
        <div id="printable-receipt" className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs">
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h4 className="font-bold text-sm text-slate-900">{settings.storeName}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">{settings.tagline}</p>
            <p className="text-[11px] text-slate-500">{settings.address}</p>
            <p className="text-[11px] text-slate-500">Phone: {settings.phone}</p>
          </div>

          {/* Meta */}
          <div className="py-2.5 border-b border-dashed border-slate-300 flex justify-between text-[11px]">
            <div>
              <p><span className="text-slate-500">Invoice:</span> <strong className="font-mono">{sale.invoiceNumber}</strong></p>
              <p><span className="text-slate-500">Date:</span> {new Date(sale.timestamp).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p><span className="text-slate-500">Payment:</span> <strong>{sale.paymentMethod}</strong></p>
              {sale.customerName && (
                <p><span className="text-slate-500">Customer:</span> {sale.customerName}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2.5 border-b border-dashed border-slate-300">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 pb-1">
                  <th className="py-1 font-medium">Item</th>
                  <th className="py-1 text-center font-medium">Qty</th>
                  <th className="py-1 text-right font-medium">Rate</th>
                  <th className="py-1 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 pr-2 font-medium">
                      {item.productName}
                      <span className="block text-[10px] text-slate-400 font-mono">{item.sku}</span>
                    </td>
                    <td className="py-1.5 text-center font-mono tabular-nums">{item.quantity}</td>
                    <td className="py-1.5 text-right font-mono tabular-nums">
                      {settings.currencySymbol}{item.unitPrice}
                    </td>
                    <td className="py-1.5 text-right font-mono tabular-nums font-medium">
                      {settings.currencySymbol}{item.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="py-2.5 space-y-1 text-right font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{settings.currencySymbol}{sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>-{settings.currencySymbol}{sale.discount.toFixed(2)}</span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax ({settings.taxRatePercent}%):</span>
                <span>+{settings.currencySymbol}{sale.tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-300">
              <span>Grand Total:</span>
              <span>{settings.currencySymbol}{sale.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-2 text-center text-[10px] text-slate-400 italic border-t border-dashed border-slate-200">
            {settings.receiptNotes}
          </div>

          {isRefunded && (
            <div className="mt-2 text-center text-rose-600 font-semibold text-xs py-1 border border-rose-200 bg-rose-50 rounded">
              REFUNDED BILL - INVENTORY RESTORED
            </div>
          )}
        </div>

        {/* Modal actions */}
        <div className="flex items-center justify-between pt-2">
          {onRefund && !isRefunded ? (
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to refund bill #${sale.invoiceNumber}? This will return items back to inventory stock.`)) {
                  onRefund(sale.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium px-2.5 py-1.5 rounded hover:bg-rose-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refund & Restock</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
