import { CompanyProfile, QuoteItem, QuoteMeta } from '../types/tire';

const QUOTE_SEQ_KEY = 'marginflow_quote_seq_v1';

export interface QuoteTotals {
  totalQty: number;
  subtotal: number;
  discount: number;
  taxable: number;
  vat: number;
  grandTotal: number;
  totalCost: number;
  totalProfit: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function createEmptyQuoteMeta(): QuoteMeta {
  return {
    quoteNo: '',
    date: new Date().toISOString().slice(0, 10),
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    vehicleNote: '',
    validityDays: 7,
    vatEnabled: false,
    vatRate: 5,
    discount: 0,
    notes: '',
  };
}

/** Next sequential quote number, e.g. TT-QT-202610-0007. Sequence is kept per browser until the DB phase. */
export function nextQuoteNumber(date = new Date()): string {
  let seq = 0;
  try {
    seq = parseInt(localStorage.getItem(QUOTE_SEQ_KEY) || '0', 10) || 0;
  } catch (e) {}
  seq += 1;
  try {
    localStorage.setItem(QUOTE_SEQ_KEY, String(seq));
  } catch (e) {}
  const ym = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  return `TT-QT-${ym}-${String(seq).padStart(4, '0')}`;
}

export function computeQuoteTotals(items: QuoteItem[], meta: QuoteMeta): QuoteTotals {
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = round2(items.reduce((s, i) => s + i.unitPrice * i.quantity, 0));
  const discount = round2(Math.min(Math.max(meta.discount || 0, 0), subtotal));
  const taxable = round2(subtotal - discount);
  const vat = meta.vatEnabled ? round2((taxable * (meta.vatRate || 0)) / 100) : 0;
  const grandTotal = round2(taxable + vat);
  // Landed cost: vendor price plus any regional logistics surcharge baked into the unit price
  const totalCost = round2(items.reduce((s, i) => s + (i.costPrice + (i.regionalSurcharge || 0)) * i.quantity, 0));
  return { totalQty, subtotal, discount, taxable, vat, grandTotal, totalCost, totalProfit: round2(taxable - totalCost) };
}

export function validUntil(meta: QuoteMeta): string {
  const d = new Date(meta.date || Date.now());
  d.setDate(d.getDate() + (meta.validityDays || 0));
  return d.toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function money(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const CURRENCY_WORDS: Record<string, [string, string]> = {
  AED: ['UAE Dirhams', 'Fils'],
  SAR: ['Saudi Riyals', 'Halalas'],
  QAR: ['Qatari Riyals', 'Dirhams'],
  OMR: ['Omani Rials', 'Baisa'],
  USD: ['US Dollars', 'Cents'],
  EUR: ['Euros', 'Cents'],
};

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function below1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ''));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(' ');
}

function integerToWords(n: number): string {
  if (n === 0) return 'Zero';
  const scales: [number, string][] = [[1e9, 'Billion'], [1e6, 'Million'], [1e3, 'Thousand']];
  const parts: string[] = [];
  for (const [value, label] of scales) {
    if (n >= value) {
      parts.push(`${below1000(Math.floor(n / value))} ${label}`);
      n %= value;
    }
  }
  if (n > 0) parts.push(below1000(n));
  return parts.join(' ');
}

/** e.g. "UAE Dirhams One Thousand Two Hundred and Fifty Fils Only" */
export function amountInWords(amount: number, currency: string): string {
  const [major, minor] = CURRENCY_WORDS[currency] || [currency, 'Cents'];
  const cents = Math.round(amount * 100);
  const whole = Math.floor(cents / 100);
  const frac = cents % 100;
  let text = `${major} ${integerToWords(whole)}`;
  if (frac > 0) text += ` and ${integerToWords(frac)} ${minor}`;
  return `${text} Only`;
}

/** Plain-text quote for WhatsApp / email. Customer-facing: no vendor cost, supplier or margin. */
export function buildQuoteText(
  items: QuoteItem[],
  meta: QuoteMeta,
  company: CompanyProfile,
  currency: string,
  regionName: string
): string {
  const t = computeQuoteTotals(items, meta);
  const lines = items.map(
    (i, idx) =>
      `${idx + 1}. ${i.size}${i.pattern ? ` ${i.pattern}` : ''} (${i.origin || 'China'})\n   ${i.quantity} x ${money(i.unitPrice)} = ${money(i.unitPrice * i.quantity)} ${currency}`
  );
  const out = [
    company.companyName.toUpperCase(),
    company.address,
    `${company.salesExecutive} | ${company.contactNumber}`,
    '',
    `QUOTATION ${meta.quoteNo}`,
    `Date: ${formatDate(meta.date)} | Valid until: ${formatDate(validUntil(meta))}`,
    `Customer: ${meta.customerName || 'Valued Customer'}${meta.customerPhone ? ` (${meta.customerPhone})` : ''}`,
    meta.vehicleNote ? `Ref / Vehicle: ${meta.vehicleNote}` : '',
    `Delivery: ${regionName}`,
    '',
    ...lines,
    '',
    `Total Qty: ${t.totalQty} tyres`,
    `Subtotal: ${money(t.subtotal)} ${currency}`,
    t.discount > 0 ? `Discount: -${money(t.discount)} ${currency}` : '',
    meta.vatEnabled ? `VAT ${meta.vatRate}%: ${money(t.vat)} ${currency}` : '',
    `TOTAL: ${money(t.grandTotal)} ${currency}${meta.vatEnabled ? '' : ' (excl. VAT)'}`,
    meta.notes ? `\nNote: ${meta.notes}` : '',
  ];
  return out.filter((l, i, arr) => l !== '' || arr[i - 1] !== '').join('\n').trim();
}

/** Generates a vector A4 PDF (selectable text) and triggers the download. */
export async function downloadQuotePdf(
  items: QuoteItem[],
  meta: QuoteMeta,
  company: CompanyProfile,
  currency: string,
  regionName: string
): Promise<void> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const t = computeQuoteTotals(items, meta);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  const ink: [number, number, number] = [15, 23, 42];
  const muted: [number, number, number] = [100, 116, 139];
  const accent: [number, number, number] = [245, 158, 11];

  // Letterhead
  doc.setFillColor(...ink);
  doc.rect(0, 0, W, 30, 'F');
  doc.setFillColor(...accent);
  doc.rect(0, 30, W, 1.2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(company.companyName, M, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(company.address, M, 19);
  doc.text(`${company.salesExecutive}  |  ${company.contactNumber}`, M, 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...accent);
  doc.text('QUOTATION', W - M, 15, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(meta.quoteNo, W - M, 22, { align: 'right' });

  // Customer + quote details
  let y = 41;
  doc.setTextColor(...muted);
  doc.setFontSize(8);
  doc.text('QUOTED TO', M, y);
  doc.text('DETAILS', W / 2 + 10, y);
  doc.setTextColor(...ink);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(meta.customerName || 'Valued Customer', M, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const custLines = [meta.customerPhone, meta.customerAddress, meta.vehicleNote ? `Ref: ${meta.vehicleNote}` : '']
    .filter(Boolean)
    .flatMap((l) => doc.splitTextToSize(l, W / 2 - 10) as string[]);
  custLines.forEach((l, i) => doc.text(l, M, y + 11 + i * 4.5));

  const details: [string, string][] = [
    ['Date', formatDate(meta.date)],
    ['Valid Until', formatDate(validUntil(meta))],
    ['Delivery', regionName],
    ['Currency', currency],
  ];
  details.forEach(([k, v], i) => {
    doc.setTextColor(...muted);
    doc.text(k, W / 2 + 10, y + 6 + i * 5);
    doc.setTextColor(...ink);
    doc.text(doc.splitTextToSize(v, W / 2 - 50)[0], W / 2 + 35, y + 6 + i * 5);
  });
  y = Math.max(y + 11 + custLines.length * 4.5, y + 26) + 4;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, bottom: 20 },
    head: [['#', 'Tyre Size', 'Pattern', 'Origin', 'Qty', `Unit Price`, `Amount`]],
    body: items.map((i, idx) => [
      String(idx + 1),
      i.size,
      i.pattern || '-',
      i.origin || 'China',
      String(i.quantity),
      money(i.unitPrice),
      money(i.unitPrice * i.quantity),
    ]),
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, textColor: ink, cellPadding: { top: 2.6, bottom: 2.6, left: 2, right: 2 } },
    headStyles: { fillColor: [241, 245, 249], textColor: ink, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { fontStyle: 'bold', cellWidth: 38 },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'right', cellWidth: 28 },
      6: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'head' && data.column.index >= 5) data.cell.styles.halign = 'right';
      if (data.section === 'head' && data.column.index === 4) data.cell.styles.halign = 'center';
    },
  });

  // Totals
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  if (y > H - 75) {
    doc.addPage();
    y = 20;
  }
  const rows: [string, string, boolean][] = [
    ['Total Quantity', `${t.totalQty} tyres`, false],
    ['Subtotal', `${money(t.subtotal)} ${currency}`, false],
  ];
  if (t.discount > 0) rows.push(['Discount', `- ${money(t.discount)} ${currency}`, false]);
  if (meta.vatEnabled) rows.push([`VAT ${meta.vatRate}%`, `${money(t.vat)} ${currency}`, false]);
  rows.push([meta.vatEnabled ? 'Grand Total' : 'Grand Total (excl. VAT)', `${money(t.grandTotal)} ${currency}`, true]);

  const bx = W - M - 80;
  rows.forEach(([k, v, strong], i) => {
    const ry = y + i * 6.5;
    if (strong) {
      doc.setFillColor(...ink);
      doc.rect(bx - 2, ry - 4.6, 82, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
    } else {
      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
    }
    doc.text(k, bx, ry);
    if (!strong) doc.setTextColor(...ink);
    doc.text(v, W - M - 2, ry, { align: 'right' });
  });
  y += rows.length * 6.5 + 4;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...muted);
  const words = doc.splitTextToSize(`Amount in words: ${amountInWords(t.grandTotal, currency)}`, W - 2 * M);
  doc.text(words, M, y);
  y += words.length * 4 + 6;

  // Terms
  const terms = [
    `Prices are valid until ${formatDate(validUntil(meta))}, subject to stock availability.`,
    meta.vatEnabled ? `Prices include VAT at ${meta.vatRate}%.` : 'Prices are exclusive of VAT.',
    `Delivery: ${regionName}.`,
    ...(meta.notes ? [meta.notes] : []),
  ];
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ink);
  doc.setFontSize(9);
  doc.text('Terms & Conditions', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  y += 5;
  terms.forEach((term) => {
    const wrapped = doc.splitTextToSize(`- ${term}`, W - 2 * M - 70);
    doc.text(wrapped, M, y);
    y += wrapped.length * 4.2;
  });

  // Signature
  const sy = Math.max(y + 14, H - 42);
  doc.setDrawColor(203, 213, 225);
  doc.line(W - M - 60, sy, W - M, sy);
  doc.setFontSize(8.5);
  doc.setTextColor(...muted);
  doc.text(`For ${company.companyName}`, W - M - 30, sy + 5, { align: 'center' });

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(M, H - 14, W - M, H - 14);
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);
    doc.text(`${company.companyName}  |  ${company.contactNumber}`, M, H - 9);
    doc.text(`${meta.quoteNo}  |  Page ${p} of ${pages}`, W - M, H - 9, { align: 'right' });
  }

  doc.save(`${meta.quoteNo || 'Quotation'}${meta.customerName ? `_${meta.customerName.replace(/[^\w-]+/g, '_')}` : ''}.pdf`);
}
