import React from 'react';
import { 
  Plus, 
  Download, 
  Upload, 
  BarChart3, 
  ShoppingCart, 
  RefreshCw, 
  Layers, 
  CalendarClock, 
  MapPin, 
  Phone,
  User,
  Users,
  Truck
} from 'lucide-react';
import { SupplierInfo, SheetType, UaeRegion, CompanyProfile } from '../types/tire';
import { UAE_REGIONS } from '../data/initialData';

interface HeaderProps {
  onAddTire: () => void;
  onOpenImportExport: () => void;
  onOpenAnalytics: () => void;
  onOpenSuppliers: () => void;
  onOpenPriceCollector: () => void;
  onOpenQuote: () => void;
  quoteCount: number;
  onResetData: () => void;
  activeSheet: SheetType;
  onSheetChange: (sheet: SheetType) => void;
  selectedRegion: UaeRegion;
  onRegionChange: (region: UaeRegion) => void;
  suppliers: SupplierInfo[];
  companyProfile: CompanyProfile;
}

export const Header: React.FC<HeaderProps> = ({
  onAddTire,
  onOpenImportExport,
  onOpenAnalytics,
  onOpenSuppliers,
  onOpenPriceCollector,
  onOpenQuote,
  quoteCount,
  onResetData,
  activeSheet,
  onSheetChange,
  selectedRegion,
  onRegionChange,
  companyProfile,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Company Identity & Quotation Meta Bar */}
      <div className="bg-slate-900 text-slate-200 px-4 sm:px-6 lg:px-8 py-1.5 text-[11px] border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <span className="font-extrabold text-amber-400 uppercase tracking-wider">
              {companyProfile.companyName}
            </span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-300 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{companyProfile.address}</span>
            </span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-300 flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              <span>Executive: <strong className="text-white font-medium">{companyProfile.salesExecutive}</strong></span>
            </span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <a
              href={`tel:${companyProfile.contactNumber}`}
              className="text-amber-300 font-mono font-bold hover:underline flex items-center gap-1"
            >
              <Phone className="w-3 h-3 text-amber-400" />
              <span>{companyProfile.contactNumber}</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1">
              <Truck className="w-3 h-3 text-emerald-400" />
              <span>Segment:</span>
              <strong className="text-emerald-300 font-medium">{companyProfile.routeSegment}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4 sm:gap-x-6 py-2.5 sm:py-3 min-h-[4.25rem]">
          {/* Brand Zone & Sheet Navigation Tabs */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap min-w-0">
            {/* Logo & Company Title & Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-base shadow-sm border border-slate-800 shrink-0 select-none">
                <span className="tracking-tighter">TT</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 font-sans whitespace-nowrap">
                    {companyProfile.companyName}
                  </span>
                  <span className="inline-flex items-center shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs whitespace-nowrap">
                    CHINA DIRECT IMPORT
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-normal leading-tight hidden sm:block">
                  Supplier Comparison & 5% Markup Quotation Engine
                </div>
              </div>
            </div>

            {/* Sheet Navigation Tabs (Properly spaced horizontally) */}
            <nav
              aria-label="Catalog Sheet Tabs"
              className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/90 shrink-0 overflow-x-auto max-w-full"
            >
              <button
                type="button"
                onClick={() => onSheetChange('china')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeSheet === 'china'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Sheet 1: China Stock</span>
              </button>
              <button
                type="button"
                onClick={() => onSheetChange('hunter')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeSheet === 'hunter'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <span>Sheet 2: Hunter Tyres</span>
              </button>
              <button
                type="button"
                onClick={() => onSheetChange('uhp_tbr')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeSheet === 'uhp_tbr'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <span>Sheet 3: UHP / TBR</span>
              </button>
              <button
                type="button"
                onClick={() => onSheetChange('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeSheet === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <span>All Master Catalogs</span>
              </button>
            </nav>
          </div>

          {/* Regional Routing & Actions Zone */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap shrink-0">
            {/* Multi-Region Logistics Dropdown */}
            <div className="relative flex items-center">
              <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors text-xs font-semibold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <select
                  value={selectedRegion}
                  onChange={(e) => onRegionChange(e.target.value as UaeRegion)}
                  className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer pr-1"
                  title="Select delivery region to adjust regional logistics routing"
                >
                  {UAE_REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.logisticsSurcharge > 0 ? `(+${r.logisticsSurcharge} AED/tyre)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Periodic Survey / Refresh Button */}
            <button
              onClick={onOpenPriceCollector}
              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Refresh vendor prices & record periodic surveys"
            >
              <CalendarClock className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">Price Survey Log</span>
            </button>

            <button
              onClick={onOpenSuppliers}
              className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
              title="Add new suppliers and choose which ones appear in comparison"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span className="hidden lg:inline">Suppliers</span>
            </button>

            <button
              onClick={onOpenAnalytics}
              className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
              title="Supplier Win-Rate & Pricing Intelligence"
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              <span className="hidden lg:inline">Analytics</span>
            </button>

            <button
              onClick={onOpenImportExport}
              className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
              title="Import or Export CSV & Excel with Company Letterhead"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden lg:inline">Export Excel</span>
            </button>

            <button
              onClick={onResetData}
              className="p-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Reset to default preloaded sheet"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block" />

            {/* Quote Drawer Button */}
            <button
              onClick={onOpenQuote}
              className="relative px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Quotation</span>
              {quoteCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                  {quoteCount}
                </span>
              )}
            </button>

            {/* Add Tyre Button */}
            <button
              onClick={onAddTire}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tyre</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
