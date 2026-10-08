import { TireRow, RegionConfig, CompanyProfile } from '../types/tire';

export type MarginMethod = 'markup' | 'grossMargin';

export interface PriceCalculationResult {
  bestPrice: number | null;
  bestSupplier: string | null;
  allValidPrices: { supplier: string; price: number }[];
  marginPercent: number;
  baseOfferPrice: number | null; // Price before regional logistics = Best Price * (1 + margin%)
  pricesPerUnit: number | null;  // Final customer price = Best Price * (1 + margin%), default 5%
  finalOfferPrice: number | null; // With any regional freight routing if applicable
  profitAmount: number | null;
  regionalSurcharge: number;
  trend: 'down' | 'up' | 'stable' | 'new';
  priceDelta: number | null; // difference vs previous best price
}

export function calculateTirePricing(
  row: TireRow,
  globalMargin: number = 5,
  marginMethod: MarginMethod = 'markup',
  activeSuppliers: string[],
  selectedRegion?: RegionConfig
): PriceCalculationResult {
  const allValidPrices: { supplier: string; price: number }[] = [];

  for (const supplier of activeSuppliers) {
    const p = row.prices[supplier];
    if (typeof p === 'number' && !isNaN(p) && p > 0) {
      allValidPrices.push({ supplier, price: p });
    }
  }

  // Sort ascending by price
  allValidPrices.sort((a, b) => a.price - b.price);

  const bestPrice = allValidPrices.length > 0 ? allValidPrices[0].price : null;
  const bestSupplier = allValidPrices.length > 0 ? allValidPrices[0].supplier : null;

  // Row custom margin overrides global if specified
  const effectiveMargin = typeof row.customMargin === 'number' ? row.customMargin : globalMargin;

  // Determine trend compared to previous cycle
  let trend: 'down' | 'up' | 'stable' | 'new' = 'stable';
  let priceDelta: number | null = null;

  if (bestPrice !== null) {
    if (typeof row.previousBestPrice === 'number' && !isNaN(row.previousBestPrice)) {
      priceDelta = Math.round((bestPrice - row.previousBestPrice) * 100) / 100;
      if (bestPrice < row.previousBestPrice) {
        trend = 'down';
      } else if (bestPrice > row.previousBestPrice) {
        trend = 'up';
      } else {
        trend = 'stable';
      }
    } else {
      trend = 'new';
    }
  }

  const surcharge = selectedRegion?.logisticsSurcharge || 0;

  if (bestPrice === null) {
    return {
      bestPrice: null,
      bestSupplier: null,
      allValidPrices,
      marginPercent: effectiveMargin,
      baseOfferPrice: null,
      pricesPerUnit: null,
      finalOfferPrice: null,
      profitAmount: null,
      regionalSurcharge: surcharge,
      trend: 'new',
      priceDelta: null,
    };
  }

  let baseOfferPrice = 0;
  if (marginMethod === 'markup') {
    // Formula: Best Price * (1 + margin% / 100) -> for 5%, Best Price * 1.05
    baseOfferPrice = bestPrice * (1 + effectiveMargin / 100);
  } else {
    // Gross margin: Price = Cost / (1 - Margin%)
    const clampedMargin = Math.min(Math.max(effectiveMargin, 0), 95);
    baseOfferPrice = bestPrice / (1 - clampedMargin / 100);
  }

  const roundedBasePrice = Math.round(baseOfferPrice * 100) / 100;
  const finalOfferPrice = Math.round((baseOfferPrice + surcharge) * 100) / 100;
  const profitAmount = Math.round((roundedBasePrice - bestPrice) * 100) / 100;

  return {
    bestPrice,
    bestSupplier,
    allValidPrices,
    marginPercent: effectiveMargin,
    baseOfferPrice: roundedBasePrice,
    pricesPerUnit: roundedBasePrice, // Exact requirement: Best Price * 1.05
    finalOfferPrice,
    profitAmount,
    regionalSurcharge: surcharge,
    trend,
    priceDelta,
  };
}

export function formatCurrency(amount: number | null | undefined, currency: string = 'AED'): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export function exportTiresToCSV(
  tires: TireRow[],
  suppliers: string[],
  globalMargin: number,
  marginMethod: MarginMethod,
  currency: string,
  regionName: string = 'All UAE',
  companyProfile?: CompanyProfile
): void {
  const company = companyProfile || {
    companyName: 'Tyre Trading & Distribution',
    address: 'Deira Dubai, UAE',
    salesExecutive: 'Muhammad Waseem',
    contactNumber: '0581273079',
    routeSegment: 'Road Rice / China Tyres',
  };

  // Header metadata block matching exact quotation format
  const metaLines = [
    `"COMPANY: ${company.companyName}"`,
    `"ADDRESS: ${company.address}"`,
    `"SALES EXECUTIVE: ${company.salesExecutive} | CONTACT: ${company.contactNumber}"`,
    `"ROUTE / SEGMENT: ${company.routeSegment} | DELIVERY ROUTE: ${regionName}"`,
    `"DATE: ${new Date().toLocaleDateString('en-GB')} | MARGIN FORMULA: Best Price × ${(1 + globalMargin / 100).toFixed(2)} (${globalMargin}% Profit Margin)"`,
    '""', // Blank separator line
  ];

  const headers = [
    'Sr',
    'Origin',
    'Tire Size',
    'Category',
    'Pattern / Note',
    ...suppliers,
    'Best Price',
    'Best Supplier',
    'Margin %',
    `Prices Per Unit (${currency})`,
    'Price Trend',
  ];

  const rows = tires.map((tire) => {
    const calc = calculateTirePricing(tire, globalMargin, marginMethod, suppliers);
    const supplierCols = suppliers.map((s) => (tire.prices[s] !== null && tire.prices[s] !== undefined ? tire.prices[s] : ''));
    return [
      tire.sr,
      `"${tire.origin || 'China'}"`,
      `"${tire.size}"`,
      `"${tire.category || ''}"`,
      `"${tire.pattern || tire.notes || ''}"`,
      ...supplierCols,
      calc.bestPrice !== null ? calc.bestPrice : '',
      `"${calc.bestSupplier || ''}"`,
      `${calc.marginPercent}%`,
      calc.pricesPerUnit !== null ? calc.pricesPerUnit : '',
      `"${calc.trend}"`,
    ];
  });

  const csvContent =
    '\uFEFF' +
    [...metaLines, headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Tyre_Trading_Quotation_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseCSVToTires(
  csvText: string,
  existingSuppliers: string[]
): { rows: TireRow[]; detectedSuppliers: string[] } {
  const lines = csvText.trim().split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return { rows: [], detectedSuppliers: [] };

  // Skip any leading company metadata lines until we find the header line with "Size"
  let headerIndex = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('size') && (lower.includes('sr') || lower.includes('best price') || lower.includes('price'))) {
      headerIndex = i;
      break;
    }
  }

  const headerLine = lines[headerIndex].replace(/^\uFEFF/, '');
  const headers = parseCSVLine(headerLine);

  const sizeIdx = headers.findIndex((h) => h.toLowerCase().includes('size'));
  const srIdx = headers.findIndex((h) => h.toLowerCase() === 'sr' || h.toLowerCase() === 'no' || h.toLowerCase() === '#');
  const originIdx = headers.findIndex((h) => h.toLowerCase().includes('origin'));
  const catIdx = headers.findIndex((h) => h.toLowerCase().includes('category'));
  const patIdx = headers.findIndex((h) => h.toLowerCase().includes('pattern') || h.toLowerCase().includes('note'));
  const sheetIdx = headers.findIndex((h) => h.toLowerCase().includes('sheet') || h.toLowerCase().includes('segment'));

  const knownCols = new Set([
    'sr', 'no', '#', 'origin', 'tire size', 'size', 'category', 'pattern / note', 'pattern', 'notes',
    'best price', 'best price (cost)', 'best supplier', 'margin %', 'markup %', 'offer price',
    'prices per unit', 'price per unit', 'final offer', 'price trend', 'last updated', 'sheet / segment'
  ]);
  const detectedSuppliers: string[] = [];
  const supplierIndices: { name: string; idx: number }[] = [];

  headers.forEach((h, idx) => {
    const clean = h.trim().replace(/^"|"$/g, '');
    const lower = clean.toLowerCase();
    const isSpecial = Array.from(knownCols).some((k) => lower.startsWith(k));
    if (!isSpecial && clean.length > 0) {
      detectedSuppliers.push(clean);
      supplierIndices.push({ name: clean, idx });
    }
  });

  const parsedRows: TireRow[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length === 0) continue;

    const size = sizeIdx >= 0 && cols[sizeIdx] ? cols[sizeIdx].trim() : `Size-${i}`;
    if (!size || size.startsWith('COMPANY:')) continue; // Skip any extra comment lines

    const sr = srIdx >= 0 && cols[srIdx] ? parseInt(cols[srIdx], 10) || i : i;
    const origin = originIdx >= 0 && cols[originIdx] ? cols[originIdx].trim() : 'China';
    const category = catIdx >= 0 && cols[catIdx] ? (cols[catIdx].trim() as any) : undefined;
    const pattern = patIdx >= 0 && cols[patIdx] ? cols[patIdx].trim() : undefined;
    const sheet = sheetIdx >= 0 && cols[sheetIdx] ? (cols[sheetIdx].trim().toLowerCase() as any) : 'china';

    const prices: Record<string, number | null> = {};
    supplierIndices.forEach(({ name, idx }) => {
      const valStr = cols[idx]?.trim();
      const num = valStr ? parseFloat(valStr) : NaN;
      prices[name] = !isNaN(num) && num > 0 ? num : null;
    });

    existingSuppliers.forEach((s) => {
      if (!(s in prices)) {
        prices[s] = null;
      }
    });

    parsedRows.push({
      id: `imported-${Date.now()}-${i}`,
      sr,
      size,
      origin: origin || 'China',
      category,
      pattern,
      sheet,
      prices,
      lastUpdated: new Date().toISOString().slice(0, 10),
    });
  }

  return { rows: parsedRows, detectedSuppliers };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
