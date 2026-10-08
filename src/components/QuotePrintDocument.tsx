import React from 'react';
import { createPortal } from 'react-dom';
import { CompanyProfile, QuoteItem, QuoteMeta } from '../types/tire';
import { amountInWords, computeQuoteTotals, formatDate, money, validUntil } from '../utils/quotation';

interface QuotePrintDocumentProps {
  items: QuoteItem[];
  meta: QuoteMeta;
  company: CompanyProfile;
  currency: string;
  regionName: string;
}

/**
 * Customer-facing A4 quotation. Hidden on screen; shown only while printing (see index.css).
 * Deliberately excludes vendor cost, supplier names and margin.
 */
export const QuotePrintDocument: React.FC<QuotePrintDocumentProps> = ({ items, meta, company, currency, regionName }) => {
  const t = computeQuoteTotals(items, meta);

  return createPortal(
    <div id="quote-print-root" className="text-slate-900 text-[12px] leading-snug">
      <div className="bg-slate-900 text-white px-6 py-4 flex items-start justify-between border-b-4 border-amber-400">
        <div>
          <div className="text-xl font-extrabold tracking-tight">{company.companyName}</div>
          <div className="text-slate-300 text-[11px] mt-1">{company.address}</div>
          <div className="text-slate-300 text-[11px]">
            {company.salesExecutive} | {company.contactNumber}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-amber-400 tracking-wide">QUOTATION</div>
          <div className="font-mono text-[11px] mt-1">{meta.quoteNo}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 px-6 py-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quoted To</div>
          <div className="text-[14px] font-bold mt-1">{meta.customerName || 'Valued Customer'}</div>
          {meta.customerPhone && <div>{meta.customerPhone}</div>}
          {meta.customerAddress && <div className="whitespace-pre-line">{meta.customerAddress}</div>}
          {meta.vehicleNote && <div className="text-slate-600">Ref: {meta.vehicleNote}</div>}
        </div>
        <table className="self-start ml-auto text-[11px]">
          <tbody>
            {[
              ['Date', formatDate(meta.date)],
              ['Valid Until', formatDate(validUntil(meta))],
              ['Delivery', regionName],
              ['Currency', currency],
            ].map(([k, v]) => (
              <tr key={k}>
                <td className="pr-4 py-0.5 text-slate-500">{k}</td>
                <td className="py-0.5 font-semibold">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="py-2 px-2 w-8 text-center">#</th>
              <th className="py-2 px-2">Tyre Size</th>
              <th className="py-2 px-2">Pattern</th>
              <th className="py-2 px-2">Origin</th>
              <th className="py-2 px-2 text-center">Qty</th>
              <th className="py-2 px-2 text-right">Unit Price</th>
              <th className="py-2 px-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={i.tireId} className="border-b border-slate-200 break-inside-avoid">
                <td className="py-1.5 px-2 text-center text-slate-500">{idx + 1}</td>
                <td className="py-1.5 px-2 font-bold font-mono">{i.size}</td>
                <td className="py-1.5 px-2">{i.pattern || '-'}</td>
                <td className="py-1.5 px-2">{i.origin || 'China'}</td>
                <td className="py-1.5 px-2 text-center">{i.quantity}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{money(i.unitPrice)}</td>
                <td className="py-1.5 px-2 text-right font-semibold tabular-nums">{money(i.unitPrice * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-4 break-inside-avoid">
          <table className="w-72 text-[11px]">
            <tbody>
              <tr>
                <td className="py-1 text-slate-500">Total Quantity</td>
                <td className="py-1 text-right">{t.totalQty} tyres</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-500">Subtotal</td>
                <td className="py-1 text-right tabular-nums">{money(t.subtotal)} {currency}</td>
              </tr>
              {t.discount > 0 && (
                <tr>
                  <td className="py-1 text-slate-500">Discount</td>
                  <td className="py-1 text-right tabular-nums">- {money(t.discount)} {currency}</td>
                </tr>
              )}
              {meta.vatEnabled && (
                <tr>
                  <td className="py-1 text-slate-500">VAT {meta.vatRate}%</td>
                  <td className="py-1 text-right tabular-nums">{money(t.vat)} {currency}</td>
                </tr>
              )}
              <tr className="bg-slate-900 text-white font-bold text-[12px]">
                <td className="py-1.5 px-2">{meta.vatEnabled ? 'Grand Total' : 'Grand Total (excl. VAT)'}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{money(t.grandTotal)} {currency}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-3 italic text-slate-600 text-[11px]">Amount in words: {amountInWords(t.grandTotal, currency)}</p>

        <div className="mt-6 flex justify-between items-end gap-8 break-inside-avoid">
          <div className="text-[11px] text-slate-600 max-w-[60%]">
            <div className="font-bold text-slate-900 mb-1">Terms &amp; Conditions</div>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Prices are valid until {formatDate(validUntil(meta))}, subject to stock availability.</li>
              <li>{meta.vatEnabled ? `Prices include VAT at ${meta.vatRate}%.` : 'Prices are exclusive of VAT.'}</li>
              <li>Delivery: {regionName}.</li>
              {meta.notes && <li className="whitespace-pre-line">{meta.notes}</li>}
            </ul>
          </div>
          <div className="text-center text-[11px] text-slate-500 w-56">
            <div className="border-t border-slate-300 pt-1.5">For {company.companyName}</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
