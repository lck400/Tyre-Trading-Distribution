import React from 'react';
import { createPortal } from 'react-dom';
import { QuoteItem, QuoteMeta, CompanyProfile } from '../types/tire';
import {
  computeQuoteTotals,
  validUntil,
  formatDate,
  money,
  amountInWords,
} from '../utils/quotation';

interface QuotePrintDocumentProps {
  items: QuoteItem[];
  meta: QuoteMeta;
  company: CompanyProfile;
  currency: string;
  regionName: string;
}

export const QuotePrintDocument: React.FC<QuotePrintDocumentProps> = ({
  items,
  meta,
  company,
  currency,
  regionName,
}) => {
  if (typeof document === 'undefined') return null;

  const totals = computeQuoteTotals(items, meta);
  const untilIso = validUntil(meta);
  const quoteNo = meta.quoteNo || 'DRAFT';
  const noteLines = meta.notes
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return createPortal(
    <div id="quote-print-root" className="text-slate-900 font-sans bg-white text-xs">
      <div className="max-w-[190mm] mx-auto flex flex-col min-h-[265mm] justify-between">
        <div>
          {/* Dark Slate Header Band + Amber Rule */}
          <div className="bg-slate-900 text-white px-6 py-5 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                {company.companyName}
              </h1>
              <p className="text-xs text-slate-300 mt-1">{company.address}</p>
              <p className="text-xs text-slate-300 mt-0.5">
                {company.salesExecutive} | {company.contactNumber}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold tracking-wide text-amber-400">
                QUOTATION
              </div>
              <div className="text-xs font-mono text-slate-200 mt-1">{quoteNo}</div>
            </div>
          </div>
          <div className="h-1 bg-amber-500 w-full mb-6" />

          {/* Two Columns: QUOTED TO & DETAILS */}
          <div className="grid grid-cols-2 gap-8 mb-6 px-1">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                QUOTED TO
              </div>
              <div className="text-sm font-bold text-slate-900">
                {meta.customerName.trim() || 'Valued Customer'}
              </div>
              {meta.customerPhone.trim() && (
                <div className="text-xs text-slate-700 mt-0.5">{meta.customerPhone.trim()}</div>
              )}
              {meta.customerAddress.trim() && (
                <div className="text-xs text-slate-700 mt-0.5 whitespace-pre-line">
                  {meta.customerAddress.trim()}
                </div>
              )}
              {meta.vehicleNote.trim() && (
                <div className="text-xs text-slate-700 mt-0.5">
                  Ref: {meta.vehicleNote.trim()}
                </div>
              )}
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                DETAILS
              </div>
              <div className="space-y-1 text-xs">
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Date</span>
                  <span className="col-span-2 text-slate-900 font-medium">
                    {formatDate(meta.date)}
                  </span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Valid Until</span>
                  <span className="col-span-2 text-slate-900 font-medium">
                    {formatDate(untilIso)}
                  </span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Delivery</span>
                  <span className="col-span-2 text-slate-900 font-medium">{regionName}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Currency</span>
                  <span className="col-span-2 text-slate-900 font-medium">{currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse text-xs mb-6">
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-b border-slate-200">
                <th className="py-2.5 px-2.5 text-center font-bold w-10">#</th>
                <th className="py-2.5 px-2.5 text-left font-bold">Tyre Size</th>
                <th className="py-2.5 px-2.5 text-left font-bold">Pattern</th>
                <th className="py-2.5 px-2.5 text-left font-bold">Origin</th>
                <th className="py-2.5 px-2.5 text-center font-bold w-16">Qty</th>
                <th className="py-2.5 px-2.5 text-right font-bold w-28">Unit Price</th>
                <th className="py-2.5 px-2.5 text-right font-bold w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const lineAmount = Math.round((item.unitPrice * item.quantity + Number.EPSILON) * 100) / 100;
                return (
                  <tr
                    key={item.tireId}
                    className={`border-b border-slate-200 break-inside-avoid ${
                      idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'
                    }`}
                  >
                    <td className="py-2.5 px-2.5 text-center text-slate-600">{idx + 1}</td>
                    <td className="py-2.5 px-2.5 font-bold font-mono text-slate-900">
                      {item.size}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-700">
                      {item.pattern && item.pattern.trim() ? item.pattern.trim() : '-'}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-700">{item.origin || 'China'}</td>
                    <td className="py-2.5 px-2.5 text-center font-mono">{item.quantity}</td>
                    <td className="py-2.5 px-2.5 text-right font-mono tabular-nums">
                      {money(item.unitPrice)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-bold font-mono tabular-nums">
                      {money(lineAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Right-aligned Totals Block */}
          <div className="flex justify-end mb-5 break-inside-avoid">
            <div className="w-72 space-y-1.5 text-xs">
              <div className="flex justify-between px-2 py-0.5">
                <span className="text-slate-500">Total Quantity</span>
                <span className="font-mono text-slate-900">{totals.totalQty} tyres</span>
              </div>
              <div className="flex justify-between px-2 py-0.5">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-mono tabular-nums text-slate-900">
                  {money(totals.subtotal)} {currency}
                </span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between px-2 py-0.5">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    - {money(totals.discount)} {currency}
                  </span>
                </div>
              )}
              {meta.vatEnabled && (
                <div className="flex justify-between px-2 py-0.5">
                  <span className="text-slate-500">VAT {meta.vatRate}%</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    {money(totals.vat)} {currency}
                  </span>
                </div>
              )}
              <div className="bg-slate-900 text-white px-3 py-2 flex justify-between items-center font-bold text-sm">
                <span>{meta.vatEnabled ? 'Grand Total' : 'Grand Total (excl. VAT)'}</span>
                <span className="font-mono tabular-nums">
                  {money(totals.grandTotal)} {currency}
                </span>
              </div>
            </div>
          </div>

          {/* Amount in words */}
          <p className="italic text-slate-600 text-xs mb-5 break-inside-avoid">
            Amount in words: {amountInWords(totals.grandTotal, currency)}
          </p>

          {/* Terms & Conditions */}
          <div className="break-inside-avoid mb-8">
            <h3 className="font-bold text-slate-900 text-xs mb-1.5">Terms &amp; Conditions</h3>
            <ul className="space-y-1 text-[11px] text-slate-600">
              <li>
                - Prices are valid until {formatDate(untilIso)}, subject to stock availability.
              </li>
              <li>
                {meta.vatEnabled
                  ? `- Prices include VAT at ${meta.vatRate}%.`
                  : '- Prices are exclusive of VAT.'}
              </li>
              <li>- Delivery: {regionName}.</li>
              {noteLines.map((line, i) => (
                <li key={i}>{line.startsWith('-') ? line : `- ${line}`}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Signature & Page Footer */}
        <div className="break-inside-avoid pt-8">
          <div className="flex justify-end mb-8">
            <div className="w-56 border-t border-slate-300 pt-1.5 text-center text-[11px] text-slate-500">
              For {company.companyName}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[10px] text-slate-500">
            <span>
              {company.companyName} | {company.contactNumber}
            </span>
            <span>{quoteNo} | Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
