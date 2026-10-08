export type TireCategory = 'All' | 'PCR (Passenger)' | 'UHP (Performance)' | 'SUV / 4x4' | 'Commercial & Van' | 'TBR (Truck & Bus)';

export type SheetType = 'china' | 'hunter' | 'uhp_tbr' | 'all';

export type UaeRegion = 'all' | 'rak' | 'fujairah' | 'ajman' | 'abudhabi' | 'alain' | 'dubai_sharjah';

export interface CompanyProfile {
  companyName: string;
  address: string;
  salesExecutive: string;
  contactNumber: string;
  routeSegment: string;
}

export interface RegionConfig {
  id: UaeRegion;
  name: string;
  shortName: string;
  logisticsSurcharge: number; // e.g. +5 AED per tyre for Abu Dhabi / Al Ain
  transitTime: string;
  notes: string;
}

export interface PriceHistoryEntry {
  id: string;
  date: string;
  collectionBatch: string;
  supplier: string;
  oldPrice: number | null;
  newPrice: number;
  recordedBy?: string;
  notes?: string;
}

export interface TireRow {
  id: string;
  sr: number;
  size: string;
  origin: string; // e.g. "China"
  category?: TireCategory;
  pattern?: string;
  sheet?: SheetType;
  prices: Record<string, number | null>; // supplierName -> price
  notes?: string;
  customMargin?: number | null; // optional row override %
  lastUpdated?: string;
  previousBestPrice?: number | null; // For trend indicator
  history?: PriceHistoryEntry[];
}

export interface SupplierInfo {
  id: string;
  name: string;
  color: string;
  contact?: string;
  phone?: string;
}

export interface QuoteItem {
  tireId: string;
  size: string;
  pattern?: string;
  origin: string;
  bestSupplier: string;
  costPrice: number;
  regionalSurcharge?: number; // per-tyre logistics surcharge already included in unitPrice
  marginPercent: number;
  unitPrice: number; // Customer unit price = Best Price * (1 + margin%) + regionalSurcharge
  quantity: number;
  region?: string;
}

export interface QuoteMeta {
  quoteNo: string;
  date: string; // ISO yyyy-mm-dd
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  vehicleNote: string;
  validityDays: number; // default 7
  vatEnabled: boolean; // default false
  vatRate: number; // default 5
  discount: number; // flat amount off subtotal, before VAT, default 0
  notes: string;
}

export interface PriceCollectionBatch {
  id: string;
  title: string;
  date: string;
  supplier: string;
  updatesCount: number;
  notes?: string;
}
