import React, { useState } from 'react';
import { X, Printer, Trash2, Plus, Minus, FileText, CheckCircle2, Copy, Send, Building2, MapPin, User, Phone, Tag } from 'lucide-react';
import { QuoteItem, CompanyProfile } from '../types/tire';
import { formatCurrency } from '../utils/calculations';

interface QuoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: QuoteItem[];
  onUpdateQuantity: (tireId: string, delta: number) => void;
  onSetQuantity: (tireId: string, quantity: number) => void;
  onRemoveItem: (tireId: string) => void;
  onClearQuote: () => void;
  currency: string;
  selectedRegionName?: string;
  companyProfile?: CompanyProfile;
}

export const QuoteDrawer: React.FC<QuoteDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onSetQuantity,
  onRemoveItem,
  onClearQuote,
  currency,
  selectedRegionName = 'All UAE',
  companyProfile = {
    companyName: 'Tyre Trading & Distribution',
    address: 'Deira Dubai, UAE',
    salesExecutive: 'Muhammad Waseem',
    contactNumber: '0581273079',
    routeSegment: 'Road Rice / China Tyres',
  },
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleNote, setVehicleNote] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const totalCost = items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
  const totalOffer = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalProfit = totalOffer - totalCost;
  const overallMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  const totalTyresCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const quoteRef = `TT-QT-${new Date().getFullYear()}${(new Date().getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${items.length > 0 ? items[0].tireId.slice(-4) : '001'}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `===========================================
${companyProfile.companyName.toUpperCase()}
Address: ${companyProfile.address}
Sales Executive: ${companyProfile.salesExecutive}
Contact: ${companyProfile.contactNumber}
Route / Segment: ${companyProfile.routeSegment}
===========================================
OFFICIAL CUSTOMER QUOTATION
Ref: ${quoteRef}
Date: ${new Date().toLocaleDateString('en-GB')}
Delivery Route: ${selectedRegionName}
Customer: ${customerName || 'Valued Client'} ${customerPhone ? `(${customerPhone})` : ''}
${vehicleNote ? `Vehicle / Fleet: ${vehicleNote}\n` : ''}
ITEMS BREAKDOWN:
${items
  .map(
    (item, idx) =>
      `${idx + 1}. [Origin: ${item.origin || 'China'}] ${item.size}
   Vendor Best Cost: ${item.costPrice.toFixed(2)} ${currency} (${item.bestSupplier})
   Prices Per Unit (${currency}): ${item.unitPrice.toFixed(2)} ${currency} (+${item.marginPercent}% margin)
   Qty: ${item.quantity} tyres | Subtotal: ${(item.unitPrice * item.quantity).toFixed(2)} ${currency}`
  )
  .join('\n\n')}
-------------------------------------------
TOTAL TYRES: ${totalTyresCount} units
TOTAL AMOUNT: ${totalOffer.toFixed(2)} ${currency}
Prices include 5% profit margin based on lowest vendor price.
Validity: 7 calendar days.
===========================================`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-xl h-full flex flex-col shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header & Company Letterhead */}
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-md bg-amber-400 text-slate-900 font-extrabold flex items-center justify-center text-xs">
                TT
              </span>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white">
                  {companyProfile.companyName}
                </h3>
                <p className="text-[10px] text-slate-400">{companyProfile.address}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-2.5">
            <div>
              <span className="text-slate-400">Sales Executive: </span>
              <strong className="text-white">{companyProfile.salesExecutive}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Contact: </span>
              <strong className="text-amber-300 font-mono">{companyProfile.contactNumber}</strong>
            </div>
            <div>
              <span className="text-slate-400">Segment: </span>
              <span className="text-emerald-300 font-medium">{companyProfile.routeSegment}</span>
            </div>
            <div className="text-right font-mono text-[10px] text-slate-400">
              Ref: <span className="text-slate-200">{quoteRef}</span>
            </div>
          </div>
        </div>

        {/* Customer Details Form */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50 grid grid-cols-2 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Customer / Garage Name
            </label>
            <input
              type="text"
              placeholder="e.g. Al Quoz Auto Center"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Contact / Mobile
            </label>
            <input
              type="text"
              placeholder="050-0000000"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
          <div className="col-span-2">
            <input
              type="text"
              placeholder="Vehicle note or fleet code (optional)"
              value={vehicleNote}
              onChange={(e) => setVehicleNote(e.target.value)}
              className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] text-slate-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
              <FileText className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Your Quotation Is Empty</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Click the &ldquo;+&rdquo; button in the table or select rows to add tires with 5% margin calculation to this quotation sheet.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.tireId}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 font-mono text-sm">{item.size}</span>
                    <span className="inline-block bg-slate-200 text-slate-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                      {item.origin || 'China'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>Vendor Cost: <strong className="font-mono text-slate-700">{item.costPrice} {currency}</strong> ({item.bestSupplier})</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-bold">+{item.marginPercent}% margin</span>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-900 mt-0.5 font-mono">
                    Prices Per Unit: {item.unitPrice.toFixed(2)} {currency}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5">
                  <button
                    onClick={() => onUpdateQuantity(item.tireId, -1)}
                    className="p-1 text-slate-500 hover:text-slate-800 rounded"
                    title="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => onSetQuantity(item.tireId, Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-9 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                  />
                  <button
                    onClick={() => onUpdateQuantity(item.tireId, 1)}
                    className="p-1 text-slate-500 hover:text-slate-800 rounded"
                    title="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line Item Total & Delete */}
                <div className="text-right">
                  <div className="font-black font-mono text-slate-900 text-sm">
                    {(item.unitPrice * item.quantity).toFixed(2)} {currency}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-mono font-medium">
                    +{((item.unitPrice - item.costPrice) * item.quantity).toFixed(2)} profit
                  </div>
                </div>

                <button
                  onClick={() => onRemoveItem(item.tireId)}
                  className="p-1.5 text-slate-300 hover:text-rose-600 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Summary & Actions Footer */}
        {items.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Total Quantity:</span>
                <span className="font-mono font-bold text-slate-900">{totalTyresCount} tyres</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Vendor Cost (Best Price):</span>
                <span className="font-mono text-slate-700">{totalCost.toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Calculated Profit Margin:</span>
                <span className="font-mono font-bold">
                  +{totalProfit.toFixed(2)} {currency} ({overallMargin.toFixed(1)}%)
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Final Customer Total:</span>
                <span className="font-mono text-lg font-black text-slate-900">{totalOffer.toFixed(2)} {currency}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={handleCopyText}
                className="px-3 py-2 bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Quote</span>
              </button>

              <button
                onClick={onClearQuote}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
