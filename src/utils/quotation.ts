import { QuoteItem, QuoteMeta, CompanyProfile } from '../types/tire';

const QUOTE_SEQ_STORAGE_KEY = 'marginflow_quote_seq_v1';

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

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

export function nextQuoteNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  let seq = 1;
  try {
    const raw = localStorage.getItem(QUOTE_SEQ_STORAGE_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    if (!isNaN(parsed) && parsed >= 0) {
      seq = parsed + 1;
    }
    localStorage.setItem(QUOTE_SEQ_STORAGE_KEY, String(seq));
  } catch (e) {
    // ignore storage errors
  }
  return `TT-QT-${yyyy}${mm}-${String(seq).padStart(4, '0')}`;
}

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

export function computeQuoteTotals(items: QuoteItem[], meta: QuoteMeta): QuoteTotals {
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const rawSubtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const subtotal = round2(rawSubtotal);

  const rawDiscount = typeof meta.discount === 'number' && !isNaN(meta.discount) ? meta.discount : 0;
  const discount = round2(Math.min(Math.max(0, rawDiscount), subtotal));
  const taxable = round2(subtotal - discount);

  const vatRate = typeof meta.vatRate === 'number' && !isNaN(meta.vatRate) ? Math.max(0, meta.vatRate) : 0;
  const vat = meta.vatEnabled ? round2((taxable * vatRate) / 100) : 0;
  const grandTotal = round2(taxable + vat);

  const rawTotalCost = items.reduce(
    (sum, item) => sum + (item.costPrice + (item.regionalSurcharge || 0)) * item.quantity,
    0
  );
  const totalCost = round2(rawTotalCost);
  const totalProfit = round2(taxable - totalCost);

  return {
    totalQty,
    subtotal,
    discount,
    taxable,
    vat,
    grandTotal,
    totalCost,
    totalProfit,
  };
}

export function validUntil(meta: QuoteMeta): string {
  const baseDate = meta.date && /^\d{4}-\d{2}-\d{2}$/.test(meta.date)
    ? meta.date
    : new Date().toISOString().slice(0, 10);
  const [y, m, d] = baseDate.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  const days = typeof meta.validityDays === 'number' && !isNaN(meta.validityDays) && meta.validityDays >= 1
    ? Math.floor(meta.validityDays)
    : 7;
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return iso;
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function money(n: number): string {
  const val = typeof n === 'number' && !isNaN(n) ? n : 0;
  return val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertBelowThousand(n: number): string {
  if (n === 0) return '';
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rem = n % 100;
  if (hundreds > 0) {
    parts.push(`${ONES[hundreds]} Hundred`);
  }
  if (rem > 0) {
    if (rem < 20) {
      parts.push(ONES[rem]);
    } else {
      const t = Math.floor(rem / 10);
      const o = rem % 10;
      parts.push(o > 0 ? `${TENS[t]}-${ONES[o]}` : TENS[t]);
    }
  }
  return parts.join(' ');
}

function integerToWords(n: number): string {
  if (n === 0) return 'Zero';
  const scales = ['', 'Thousand', 'Million', 'Billion'];
  let num = Math.floor(Math.abs(n));
  const chunks: string[] = [];
  let scaleIdx = 0;

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk > 0) {
      const chunkWords = convertBelowThousand(chunk);
      const scaleName = scales[scaleIdx];
      chunks.unshift(scaleName ? `${chunkWords} ${scaleName}` : chunkWords);
    }
    num = Math.floor(num / 1000);
    scaleIdx++;
  }

  return chunks.join(' ');
}

const CURRENCY_UNITS: Record<string, { major: string; minor: string }> = {
  AED: { major: 'UAE Dirhams', minor: 'Fils' },
  SAR: { major: 'Saudi Riyals', minor: 'Halalas' },
  QAR: { major: 'Qatari Riyals', minor: 'Dirhams' },
  OMR: { major: 'Omani Rials', minor: 'Baisa' },
  USD: { major: 'US Dollars', minor: 'Cents' },
  EUR: { major: 'Euros', minor: 'Cents' },
};

export function amountInWords(amount: number, currency: string = 'AED'): string {
  const units = CURRENCY_UNITS[currency] || { major: currency, minor: 'Cents' };
  const safe = Math.max(0, round2(amount || 0));
  const whole = Math.floor(safe);
  const minor = Math.round((safe - whole) * 100);

  const wholeWords = integerToWords(whole);
  if (minor > 0) {
    const minorWords = convertBelowThousand(minor);
    return `${units.major} ${wholeWords} and ${minorWords} ${units.minor} Only`;
  }
  return `${units.major} ${wholeWords} Only`;
}

export function buildQuoteText(
  items: QuoteItem[],
  meta: QuoteMeta,
  company: CompanyProfile,
  currency: string,
  regionName: string
): string {
  const totals = computeQuoteTotals(items, meta);
  const untilIso = validUntil(meta);
  const quoteNo = meta.quoteNo || 'DRAFT';

  const lines: string[] = [
    company.companyName.toUpperCase(),
    company.address,
    `Sales Executive: ${company.salesExecutive} | Phone: ${company.contactNumber}`,
    '-------------------------------------------',
    `QUOTATION: ${quoteNo}`,
    `Date: ${formatDate(meta.date)} | Valid Until: ${formatDate(untilIso)}`,
    `Customer: ${meta.customerName || 'Valued Customer'}${meta.customerPhone ? ` (${meta.customerPhone})` : ''}`,
  ];

  if (meta.customerAddress.trim()) {
    lines.push(`Address: ${meta.customerAddress.trim()}`);
  }
  if (meta.vehicleNote.trim()) {
    lines.push(`Ref: ${meta.vehicleNote.trim()}`);
  }
  lines.push(`Delivery: ${regionName}`);
  lines.push('-------------------------------------------');
  lines.push('ITEMS:');

  items.forEach((item, idx) => {
    const pat = item.pattern && item.pattern.trim() ? ` ${item.pattern.trim()}` : '';
    const lineTotal = round2(item.unitPrice * item.quantity);
    lines.push(
      `${idx + 1}. ${item.size}${pat} (${item.origin || 'China'})  ${item.quantity} x ${money(item.unitPrice)} = ${money(lineTotal)} ${currency}`
    );
  });

  lines.push('-------------------------------------------');
  lines.push(`Total Quantity: ${totals.totalQty} tyres`);
  lines.push(`Subtotal: ${money(totals.subtotal)} ${currency}`);
  if (totals.discount > 0) {
    lines.push(`Discount: - ${money(totals.discount)} ${currency}`);
  }
  if (meta.vatEnabled) {
    lines.push(`VAT ${meta.vatRate}%: ${money(totals.vat)} ${currency}`);
  }
  const totalLabel = meta.vatEnabled ? 'TOTAL' : 'TOTAL (excl. VAT)';
  lines.push(`${totalLabel}: ${money(totals.grandTotal)} ${currency}`);
  lines.push(`Amount in words: ${amountInWords(totals.grandTotal, currency)}`);

  if (meta.notes.trim()) {
    lines.push('-------------------------------------------');
    lines.push(`Notes: ${meta.notes.trim()}`);
  }

  return lines.join('\n');
}

export async function downloadQuotePdf(
  items: QuoteItem[],
  meta: QuoteMeta,
  company: CompanyProfile,
  currency: string,
  regionName: string
): Promise<void> {
  const jspdfMod = await import('jspdf');
  const JsPDFClass = jspdfMod.jsPDF || jspdfMod.default;
  const autoTableMod = await import('jspdf-autotable');
  const autoTable = autoTableMod.autoTable || autoTableMod.default;

  const doc = new JsPDFClass({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const quoteNo = meta.quoteNo || 'DRAFT';
  const totals = computeQuoteTotals(items, meta);
  const untilIso = validUntil(meta);

  // 1. Dark slate header band (30mm high) + 1.2mm amber rule
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 30, pageWidth, 1.2, 'F');

  // Header Left: Company Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(company.companyName, marginX, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  doc.text(company.address, marginX, 18.2);
  doc.text(`${company.salesExecutive} | ${company.contactNumber}`, marginX, 23.8);

  // Header Right: QUOTATION & Quote Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(245, 158, 11);
  doc.text('QUOTATION', pageWidth - marginX, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(226, 232, 240);
  doc.text(quoteNo, pageWidth - marginX, 21, { align: 'right' });

  // 2. Two columns: QUOTED TO (left) & DETAILS (right)
  const blockTopY = 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('QUOTED TO', marginX, blockTopY);
  doc.text('DETAILS', 115, blockTopY);

  // Left column content
  let leftY = 46;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(meta.customerName.trim() || 'Valued Customer', marginX, leftY);
  leftY += 5.2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  if (meta.customerPhone.trim()) {
    doc.text(meta.customerPhone.trim(), marginX, leftY);
    leftY += 5;
  }
  if (meta.customerAddress.trim()) {
    const addrLines = doc.splitTextToSize(meta.customerAddress.trim(), 90);
    doc.text(addrLines, marginX, leftY);
    leftY += addrLines.length * 4.6 + 0.5;
  }
  if (meta.vehicleNote.trim()) {
    doc.text(`Ref: ${meta.vehicleNote.trim()}`, marginX, leftY);
    leftY += 5;
  }

  // Right column content
  const detailsRows: [string, string][] = [
    ['Date', formatDate(meta.date)],
    ['Valid Until', formatDate(untilIso)],
    ['Delivery', regionName],
    ['Currency', currency],
  ];
  let rightY = 46;
  detailsRows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label, 115, rightY);

    doc.setTextColor(15, 23, 42);
    doc.text(val, 140, rightY);
    rightY += 5.2;
  });

  // 3. Items Table
  const tableStartY = Math.max(leftY, rightY) + 5;

  const tableBody = items.map((item, idx) => [
    String(idx + 1),
    item.size,
    item.pattern && item.pattern.trim() ? item.pattern.trim() : '-',
    item.origin || 'China',
    String(item.quantity),
    money(item.unitPrice),
    money(round2(item.unitPrice * item.quantity)),
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['#', 'Tyre Size', 'Pattern', 'Origin', 'Qty', 'Unit Price', 'Amount']],
    body: tableBody,
    theme: 'plain',
    margin: { left: marginX, right: marginX, bottom: 20 },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3,
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 9.5,
      cellPadding: 3,
      lineColor: [226, 232, 240],
      lineWidth: { bottom: 0.2 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 46 },
      3: { cellWidth: 22 },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'head') {
        if (data.column.index === 0 || data.column.index === 4) {
          data.cell.styles.halign = 'center';
        } else if (data.column.index === 5 || data.column.index === 6) {
          data.cell.styles.halign = 'right';
        }
      }
    },
  });

  const lastTable = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable;
  let cursorY = (lastTable?.finalY ?? tableStartY + 20) + 6;

  // Add new page if fewer than 75mm remain
  if (pageHeight - cursorY < 75) {
    doc.addPage();
    cursorY = 20;
  }

  // 4. Right-aligned totals block
  const totalsLeftX = 114;
  const totalsRightX = pageWidth - marginX;
  const totalsWidth = totalsRightX - totalsLeftX;

  const drawTotalLine = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label, totalsLeftX + 2, cursorY);

    doc.setTextColor(15, 23, 42);
    doc.text(value, totalsRightX - 2, cursorY, { align: 'right' });
    cursorY += 6;
  };

  drawTotalLine('Total Quantity', `${totals.totalQty} tyres`);
  drawTotalLine('Subtotal', `${money(totals.subtotal)} ${currency}`);
  if (totals.discount > 0) {
    drawTotalLine('Discount', `- ${money(totals.discount)} ${currency}`);
  }
  if (meta.vatEnabled) {
    drawTotalLine(`VAT ${meta.vatRate}%`, `${money(totals.vat)} ${currency}`);
  }

  // Grand Total dark bar
  const barY = cursorY - 4;
  const barHeight = 8.5;
  doc.setFillColor(15, 23, 42);
  doc.rect(totalsLeftX, barY, totalsWidth, barHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  const grandLabel = meta.vatEnabled ? 'Grand Total' : 'Grand Total (excl. VAT)';
  doc.text(grandLabel, totalsLeftX + 3, barY + 5.7);
  doc.text(`${money(totals.grandTotal)} ${currency}`, totalsRightX - 3, barY + 5.7, { align: 'right' });

  cursorY = barY + barHeight + 8;

  // 5. Amount in words
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const wordsText = `Amount in words: ${amountInWords(totals.grandTotal, currency)}`;
  const wrappedWords = doc.splitTextToSize(wordsText, pageWidth - marginX * 2);
  doc.text(wrappedWords, marginX, cursorY);
  cursorY += wrappedWords.length * 4.5 + 6;

  // 6. Terms & Conditions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Terms & Conditions', marginX, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const termLines: string[] = [
    `- Prices are valid until ${formatDate(untilIso)}, subject to stock availability.`,
    meta.vatEnabled
      ? `- Prices include VAT at ${meta.vatRate}%.`
      : '- Prices are exclusive of VAT.',
    `- Delivery: ${regionName}.`,
  ];

  if (meta.notes.trim()) {
    meta.notes
      .trim()
      .split(/\r?\n/)
      .forEach((line) => {
        const cleaned = line.trim();
        if (cleaned) {
          termLines.push(cleaned.startsWith('-') ? cleaned : `- ${cleaned}`);
        }
      });
  }

  termLines.forEach((line) => {
    const split = doc.splitTextToSize(line, 120);
    doc.text(split, marginX, cursorY);
    cursorY += split.length * 4.3;
  });

  // 7. Signature line bottom-right
  const sigY = Math.max(cursorY + 14, pageHeight - 32);
  const sigLeftX = 135;
  const sigRightX = pageWidth - marginX;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(sigLeftX, sigY, sigRightX, sigY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`For ${company.companyName}`, (sigLeftX + sigRightX) / 2, sigY + 4.5, {
    align: 'center',
  });

  // 8. Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${company.companyName} | ${company.contactNumber}`, marginX, pageHeight - 9);
    doc.text(`${quoteNo} | Page ${p} of ${pageCount}`, pageWidth - marginX, pageHeight - 9, {
      align: 'right',
    });
  }

  const safeCustomer =
    (meta.customerName || 'Customer')
      .trim()
      .replace(/\W+/g, '_')
      .replace(/^_+|_+$/g, '') || 'Customer';

  doc.save(`${quoteNo}_${safeCustomer}.pdf`);
}
