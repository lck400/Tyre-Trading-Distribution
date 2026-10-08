import React, { useState } from 'react';
import {
  X,
  Printer,
  Trash2,
  Plus,
  Minus,
  FileText,
  CheckCircle2,
  Copy,
  Download,
  EyeOff,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { QuoteItem, QuoteMeta, CompanyProfile } from '../types/tire';
import { DEFAULT_COMPANY_PROFILE } from '../data/initialData';
import {
  computeQuoteTotals,
  money,
  buildQuoteText,
  downloadQuotePdf,
} from '../utils/quotation';
import { QuotePrintDocument } from './QuotePrintDocument';

interface QuoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: QuoteItem[];
  meta: QuoteMeta;
  onMetaChange: (patch: Partial<QuoteMeta>) => void;
  onUpdateQuantity: (tireId: string, delta: number) => void;
  onSetQuantity: (tireId: string, quantity: number) => void;
  onSetUnitPrice: (tireId: string, unitPrice: number) => void;
  onRemoveItem: (tireId: string) => void;
  onNewQuote: () => void;
  currency: string;
  selectedRegionName?: string;
  companyProfile?: CompanyProfile;
}

export const QuoteDrawer: React.FC<QuoteDrawerProps> = ({
  isOpen,
  onClose,
  items,
  meta,
  onMetaChange,
  onUpdateQuantity,
  onSetQuantity,
  onSetUnitPrice,
  onRemoveItem,
  onNewQuote,
  currency,
  selectedRegionName = 'All UAE',
  companyProfile = DEFAULT_COMPANY_PROFILE,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const totals = computeQuoteTotals(items, meta);
  const profitPct = totals.totalCost > 0 ? (totals.totalProfit / totals.totalCost) * 100 : 0;

  const handleConfirmNew = () => {
    if (items.length > 0) {
      if (!confirm('Start a new quotation? Current items and customer details will be cleared.')) {
        return;
      }
    }
    onNewQuote();
  };

  const handlePrint = () => {
    const prevTitle = document.title;
    const quoteNo = meta.quoteNo || 'Quotation';
    document.title = quoteNo;
    document.body.classList.add('printing-quote');

    const cleanup = () => {
      document.body.classList.remove('printing-quote');
      document.title = prevTitle;
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await downloadQuotePdf(items, meta, companyProfile, currency, selectedRegionName);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF quotation. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyText = async () => {
    const text = buildQuoteText(items, meta, companyProfile, currency, selectedRegionName);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Clipboard access was blocked by the browser.');
    }
  };

  return (
    <>
      {items.length > 0 && (
        <QuotePrintDocument
          items={items}
          meta={meta}
          company={companyProfile}
          currency={currency}
          regionName={selectedRegionName}
        />
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full flex flex-col shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Dark Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold tracking-tight text-white">Quotation</h3>
                <p className="text-xs font-mono text-amber-400 truncate mt-0.5">
                  {meta.quoteNo || 'Number is assigned when the first item is added'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleConfirmNew}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Clear current items and start a new quotation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                  aria-label="Close quotation drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Customer Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Customer / Garage Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Al Quoz Auto Center"
                    value={meta.customerName}
                    onChange={(e) => onMetaChange({ customerName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Contact / Mobile
                  </label>
                  <input
                    type="tel"
                    placeholder="050-0000000"
                    value={meta.customerPhone}
                    onChange={(e) => onMetaChange({ customerPhone: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Al Quoz Industrial 3, Dubai"
                    value={meta.customerAddress}
                    onChange={(e) => onMetaChange({ customerAddress: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Vehicle / Fleet / Customer Ref
                  </label>
                  <input
                    type="text"
                    placeholder="Vehicle note or customer reference (optional)"
                    value={meta.vehicleNote}
                    onChange={(e) => onMetaChange({ vehicleNote: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Quote Date
                  </label>
                  <input
                    type="date"
                    value={meta.date}
                    onChange={(e) => onMetaChange({ date: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Validity (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={meta.validityDays}
                    onChange={(e) =>
                      onMetaChange({ validityDays: Math.max(1, parseInt(e.target.value, 10) || 1) })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Items List */}
              {items.length === 0 ? (
                <div className="h-52 flex flex-col items-center justify-center text-center text-slate-400 border border-dashed border-slate-200 rounded-xl p-4">
                  <FileText className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">Your Quotation Is Empty</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Click the &ldquo;+&rdquo; button in the table or select rows to add tyres to this quotation.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {items.map((item) => {
                    const surcharge = item.regionalSurcharge || 0;
                    const landedUnitCost = item.costPrice + surcharge;
                    const lineAmount =
                      Math.round((item.unitPrice * item.quantity + Number.EPSILON) * 100) / 100;
                    const lineProfit =
                      Math.round(
                        ((item.unitPrice - item.costPrice - surcharge) * item.quantity +
                          Number.EPSILON) *
                          100
                      ) / 100;
                    const isNegativeProfit = lineProfit < 0;

                    return (
                      <div
                        key={item.tireId}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 font-mono text-sm">
                                {item.size}
                              </span>
                              <span className="inline-block bg-slate-200 text-slate-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                {item.origin || 'China'}
                              </span>
                              {item.pattern && (
                                <span className="text-slate-600 italic text-xs">
                                  {item.pattern}
                                </span>
                              )}
                            </div>

                            <div
                              className="text-[11px] text-slate-500 flex items-center gap-1 mt-1"
                              title="Internal only, never printed"
                            >
                              <EyeOff className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>
                                Cost {money(item.costPrice)} ({item.bestSupplier})
                                {surcharge > 0 ? ` + ${money(surcharge)} logistics` : ''}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.tireId)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors shrink-0"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
                          {/* Quantity Stepper */}
                          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5">
                            <button
                              type="button"
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
                              onChange={(e) =>
                                onSetQuantity(
                                  item.tireId,
                                  Math.max(1, parseInt(e.target.value, 10) || 1)
                                )
                              }
                              className="w-10 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.tireId, 1)}
                              className="p-1 text-slate-500 hover:text-slate-800 rounded"
                              title="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Editable Unit Price */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500">Unit:</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) =>
                                onSetUnitPrice(
                                  item.tireId,
                                  Math.max(0, parseFloat(e.target.value) || 0)
                                )
                              }
                              className={`w-24 px-2 py-1 bg-white border rounded-lg font-mono font-bold text-xs text-right focus:outline-none ${
                                isNegativeProfit
                                  ? 'border-rose-500 text-rose-700 ring-1 ring-rose-500'
                                  : 'border-slate-300 text-slate-900 focus:ring-1 focus:ring-slate-900'
                              }`}
                              title={`Landed cost: ${money(landedUnitCost)} ${currency}`}
                            />
                          </div>

                          {/* Line Amount & Line Profit */}
                          <div className="text-right ml-auto">
                            <div className="font-black font-mono text-slate-900 text-sm tabular-nums">
                              {money(lineAmount)} {currency}
                            </div>
                            <div
                              className={`text-[10px] font-mono font-semibold tabular-nums ${
                                isNegativeProfit ? 'text-rose-600' : 'text-emerald-600'
                              }`}
                              title="Internal only, never printed"
                            >
                              {lineProfit >= 0 ? `+${money(lineProfit)}` : money(lineProfit)} profit
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Discount, VAT & Notes Section */}
              {items.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Discount ({currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={meta.discount}
                        onChange={(e) =>
                          onMetaChange({ discount: Math.max(0, parseFloat(e.target.value) || 0) })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        VAT Settings
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={meta.vatEnabled}
                            onChange={(e) => onMetaChange({ vatEnabled: e.target.checked })}
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          />
                          <span>Add VAT</span>
                        </label>
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            disabled={!meta.vatEnabled}
                            value={meta.vatRate}
                            onChange={(e) =>
                              onMetaChange({ vatRate: Math.max(0, parseFloat(e.target.value) || 0) })
                            }
                            className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none"
                          />
                          <span className="text-slate-500 font-semibold">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Notes / Extra Terms (printed)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Optional payment terms, warranty or delivery remarks..."
                      value={meta.notes}
                      onChange={(e) => onMetaChange({ notes: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            {items.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Quantity</span>
                    <span className="font-mono font-bold text-slate-900">
                      {totals.totalQty} tyres
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums text-slate-900">
                      {money(totals.subtotal)} {currency}
                    </span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Discount</span>
                      <span className="font-mono tabular-nums text-slate-900">
                        - {money(totals.discount)} {currency}
                      </span>
                    </div>
                  )}
                  {meta.vatEnabled && (
                    <div className="flex justify-between text-slate-600">
                      <span>VAT ({meta.vatRate}%)</span>
                      <span className="font-mono tabular-nums text-slate-900">
                        {money(totals.vat)} {currency}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex justify-between font-medium ${
                      totals.totalProfit < 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                    title="Internal only, never printed"
                  >
                    <span className="flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                      <span>Profit (internal)</span>
                    </span>
                    <span className="font-mono font-bold tabular-nums">
                      {totals.totalProfit >= 0
                        ? `+${money(totals.totalProfit)}`
                        : money(totals.totalProfit)}{' '}
                      {currency} ({profitPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-bold text-slate-900">
                    <span>
                      Grand Total{!meta.vatEnabled ? ' (excl. VAT)' : ''}
                    </span>
                    <span className="font-mono text-lg font-black tabular-nums text-slate-900">
                      {money(totals.grandTotal)} {currency}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="px-3 py-2 bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:opacity-60 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    {isGeneratingPdf ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="px-3 py-2 bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
