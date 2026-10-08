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
  FileDown,
  FilePlus2,
  Loader2,
  EyeOff,
} from 'lucide-react';
import { QuoteItem, CompanyProfile, QuoteMeta } from '../types/tire';
import { DEFAULT_COMPANY_PROFILE } from '../data/initialData';
import { buildQuoteText, computeQuoteTotals, downloadQuotePdf, money } from '../utils/quotation';
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

const inputCls =
  'w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900';
const labelCls = 'block text-[11px] font-semibold text-slate-700 mb-1';

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
  const [pdfBusy, setPdfBusy] = useState(false);

  if (!isOpen) return null;

  const t = computeQuoteTotals(items, meta);
  const marginPct = t.totalCost > 0 ? (t.totalProfit / t.totalCost) * 100 : 0;
  const hasItems = items.length > 0;

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = meta.quoteNo || 'Quotation'; // default file name when the user picks "Save as PDF"
    document.body.classList.add('printing-quote');
    const cleanup = () => {
      document.body.classList.remove('printing-quote');
      document.title = prevTitle;
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const handlePdf = async () => {
    setPdfBusy(true);
    try {
      await downloadQuotePdf(items, meta, companyProfile, currency, selectedRegionName);
    } catch (e) {
      console.error('PDF generation failed', e);
      alert('PDF could not be generated. Please try Print instead.');
    } finally {
      setPdfBusy(false);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(buildQuoteText(items, meta, companyProfile, currency, selectedRegionName));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      alert('Clipboard access was blocked by the browser.');
    }
  };

  const handleNewQuote = () => {
    if (!hasItems || confirm('Start a new quotation? The current items and customer details will be cleared.')) {
      onNewQuote();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      {hasItems && (
        <QuotePrintDocument
          items={items}
          meta={meta}
          company={companyProfile}
          currency={currency}
          regionName={selectedRegionName}
        />
      )}

      <div className="bg-white w-full max-w-xl h-full flex flex-col shadow-2xl border-l border-slate-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight">Quotation</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              {meta.quoteNo || 'Number is assigned when the first item is added'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewQuote}
              className="px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-1"
              title="Start a new quotation"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Customer & quote details */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 grid grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className={labelCls}>Customer / Garage Name</label>
              <input
                type="text"
                placeholder="e.g. Al Quoz Auto Center"
                value={meta.customerName}
                onChange={(e) => onMetaChange({ customerName: e.target.value })}
                className={`${inputCls} font-semibold`}
              />
            </div>
            <div>
              <label className={labelCls}>Contact / Mobile</label>
              <input
                type="tel"
                placeholder="050-0000000"
                value={meta.customerPhone}
                onChange={(e) => onMetaChange({ customerPhone: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Address (optional)</label>
              <input
                type="text"
                placeholder="Area, City"
                value={meta.customerAddress}
                onChange={(e) => onMetaChange({ customerAddress: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Vehicle / Fleet / Customer Ref (optional)</label>
              <input
                type="text"
                value={meta.vehicleNote}
                onChange={(e) => onMetaChange({ vehicleNote: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Quote Date</label>
              <input
                type="date"
                value={meta.date}
                onChange={(e) => onMetaChange({ date: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Validity (days)</label>
              <input
                type="number"
                min={1}
                value={meta.validityDays}
                onChange={(e) => onMetaChange({ validityDays: Math.max(1, parseInt(e.target.value) || 1) })}
                className={inputCls}
              />
            </div>
          </div>

          {/* Items */}
          <div className="p-4 space-y-3">
            {!hasItems ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-slate-400">
                <FileText className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Your quotation is empty</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Use the &ldquo;+&rdquo; button in the table, or select rows, to add tyres to this quotation.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const lineProfit = (item.unitPrice - item.costPrice - (item.regionalSurcharge || 0)) * item.quantity;
                return (
                  <div key={item.tireId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 font-mono text-sm">{item.size}</span>
                          <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-1.5 rounded">
                            {item.origin || 'China'}
                          </span>
                          {item.pattern && <span className="text-[11px] text-slate-500 italic">{item.pattern}</span>}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1" title="Internal only, never printed">
                          <EyeOff className="w-3 h-3" />
                          <span>
                            Cost {money(item.costPrice)} ({item.bestSupplier})
                            {item.regionalSurcharge ? ` + ${money(item.regionalSurcharge)} logistics` : ''}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.tireId)}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-2">
                      <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5">
                        <button onClick={() => onUpdateQuantity(item.tireId, -1)} className="p-1 text-slate-500 hover:text-slate-800 rounded" title="Decrease">
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => onSetQuantity(item.tireId, Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-10 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                        />
                        <button onClick={() => onUpdateQuantity(item.tireId, 1)} className="p-1 text-slate-500 hover:text-slate-800 rounded" title="Increase">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <label className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span>Unit</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => onSetUnitPrice(item.tireId, Math.max(0, parseFloat(e.target.value) || 0))}
                          className={`w-24 px-2 py-1 bg-white border rounded-lg font-mono text-right text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 ${
                            lineProfit < 0 ? 'border-rose-400 text-rose-700' : 'border-slate-300 text-slate-900'
                          }`}
                          title={lineProfit < 0 ? 'Below cost' : 'Customer unit price'}
                        />
                      </label>

                      <div className="text-right">
                        <div className="font-black font-mono text-slate-900 text-sm">{money(item.unitPrice * item.quantity)}</div>
                        <div className={`text-[10px] font-mono ${lineProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {lineProfit >= 0 ? '+' : ''}
                          {money(lineProfit)} profit
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pricing adjustments */}
          {hasItems && (
            <div className="px-4 pb-4 grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className={labelCls}>Discount ({currency})</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={meta.discount || ''}
                  placeholder="0.00"
                  onChange={(e) => onMetaChange({ discount: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>VAT</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meta.vatEnabled}
                      onChange={(e) => onMetaChange({ vatEnabled: e.target.checked })}
                      className="accent-slate-900"
                    />
                    <span>Add VAT</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={meta.vatRate}
                    disabled={!meta.vatEnabled}
                    onChange={(e) => onMetaChange({ vatRate: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className={`${inputCls} w-16 disabled:opacity-50`}
                  />
                  <span>%</span>
                </div>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Notes / Extra Terms (printed)</label>
                <textarea
                  rows={2}
                  value={meta.notes}
                  onChange={(e) => onMetaChange({ notes: e.target.value })}
                  placeholder="e.g. 50% advance, balance on delivery"
                  className={`${inputCls} resize-y`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary & actions */}
        {hasItems && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Total Quantity</span>
                <span className="font-mono font-bold text-slate-900">{t.totalQty} tyres</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono text-slate-800">{money(t.subtotal)} {currency}</span>
              </div>
              {t.discount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Discount</span>
                  <span className="font-mono text-slate-800">- {money(t.discount)} {currency}</span>
                </div>
              )}
              {meta.vatEnabled && (
                <div className="flex justify-between text-slate-500">
                  <span>VAT {meta.vatRate}%</span>
                  <span className="font-mono text-slate-800">{money(t.vat)} {currency}</span>
                </div>
              )}
              <div className="flex justify-between text-emerald-700 font-medium" title="Internal only, never printed">
                <span>Profit (internal)</span>
                <span className="font-mono font-bold">
                  {money(t.totalProfit)} {currency} ({marginPct.toFixed(1)}%)
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-slate-900">
                <span className="text-sm">Grand Total{meta.vatEnabled ? '' : ' (excl. VAT)'}</span>
                <span className="font-mono text-lg font-black">
                  {money(t.grandTotal)} {currency}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={handlePdf}
                disabled={pdfBusy}
                className="px-3 py-2 bg-amber-400 text-slate-900 hover:bg-amber-300 disabled:opacity-60 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {pdfBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                <span>Download PDF</span>
              </button>
              <button
                onClick={handleCopyText}
                className="px-3 py-2 bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
