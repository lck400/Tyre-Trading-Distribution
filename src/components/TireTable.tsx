import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Edit2, 
  Trash2, 
  PlusCircle, 
  Sparkles, 
  Check, 
  X, 
  CheckSquare, 
  Square,
  TrendingDown,
  TrendingUp,
  History,
  MapPin,
  Clock
} from 'lucide-react';
import { TireRow, SupplierInfo, TireCategory, RegionConfig } from '../types/tire';
import { MarginMethod, calculateTirePricing, formatCurrency } from '../utils/calculations';

interface TireTableProps {
  tires: TireRow[];
  suppliers: SupplierInfo[];
  activeSuppliers: string[];
  globalMargin: number;
  marginMethod: MarginMethod;
  currency: string;
  selectedRegionConfig: RegionConfig;
  onUpdatePrice: (tireId: string, supplierName: string, price: number | null) => void;
  onEditTire: (tire: TireRow) => void;
  onDeleteTire: (tireId: string) => void;
  onAddToQuote: (tire: TireRow, quantity?: number) => void;
  onBatchAddToQuote: (tires: TireRow[], quantity: number) => void;
  onViewHistory: (tire: TireRow) => void;
}

type SortField = 'sr' | 'size' | 'bestPrice' | 'offerPrice' | 'profit' | 'trend';
type SortOrder = 'asc' | 'desc';

export const TireTable: React.FC<TireTableProps> = ({
  tires,
  suppliers,
  activeSuppliers,
  globalMargin,
  marginMethod,
  currency,
  selectedRegionConfig,
  onUpdatePrice,
  onEditTire,
  onDeleteTire,
  onAddToQuote,
  onBatchAddToQuote,
  onViewHistory,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRim, setSelectedRim] = useState<string>('All');
  const [supplierFilter, setSupplierFilter] = useState<string>('All');
  const [onlyPriced, setOnlyPriced] = useState(false);
  const [trendFilter, setTrendFilter] = useState<string>('all'); // all, dropped, rose

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('sr');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ tireId: string; supplier: string } | null>(null);
  const [tempPriceValue, setTempPriceValue] = useState<string>('');

  // Row selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Available rim sizes from data
  const availableRims = useMemo(() => {
    const rims = new Set<string>();
    tires.forEach((t) => {
      const match = t.size.match(/R(\d+(\.\d+)?)/i);
      if (match) {
        rims.add(match[1]);
      }
    });
    return Array.from(rims).sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [tires]);

  // Categories list
  const categories: TireCategory[] = [
    'All',
    'PCR (Passenger)',
    'UHP (Performance)',
    'SUV / 4x4',
    'Commercial & Van',
    'TBR (Truck & Bus)',
  ];

  // Filtering & Sorting
  const processedTires = useMemo(() => {
    return tires
      .filter((tire) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchSize = tire.size.toLowerCase().includes(q);
          const matchPattern = (tire.pattern || '').toLowerCase().includes(q);
          const matchNotes = (tire.notes || '').toLowerCase().includes(q);
          const matchCategory = (tire.category || '').toLowerCase().includes(q);
          if (!matchSize && !matchPattern && !matchNotes && !matchCategory) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'All' && tire.category !== selectedCategory) {
          return false;
        }

        // Rim filter
        if (selectedRim !== 'All') {
          const match = tire.size.match(/R(\d+(\.\d+)?)/i);
          if (!match || match[1] !== selectedRim) {
            return false;
          }
        }

        // Supplier filter (must have price from this supplier)
        if (supplierFilter !== 'All') {
          const val = tire.prices[supplierFilter];
          if (val === null || val === undefined || isNaN(val) || val <= 0) {
            return false;
          }
        }

        const calc = calculateTirePricing(tire, globalMargin, marginMethod, activeSuppliers, selectedRegionConfig);

        // Only priced filter
        if (onlyPriced && calc.bestPrice === null) {
          return false;
        }

        // Trend filter
        if (trendFilter === 'dropped' && calc.trend !== 'down') return false;
        if (trendFilter === 'rose' && calc.trend !== 'up') return false;

        return true;
      })
      .sort((a, b) => {
        const calcA = calculateTirePricing(a, globalMargin, marginMethod, activeSuppliers, selectedRegionConfig);
        const calcB = calculateTirePricing(b, globalMargin, marginMethod, activeSuppliers, selectedRegionConfig);

        let comparison = 0;
        if (sortField === 'sr') {
          comparison = a.sr - b.sr;
        } else if (sortField === 'size') {
          comparison = a.size.localeCompare(b.size);
        } else if (sortField === 'bestPrice') {
          const priceA = calcA.bestPrice ?? 999999;
          const priceB = calcB.bestPrice ?? 999999;
          comparison = priceA - priceB;
        } else if (sortField === 'offerPrice') {
          const pA = calcA.finalOfferPrice ?? 999999;
          const pB = calcB.finalOfferPrice ?? 999999;
          comparison = pA - pB;
        } else if (sortField === 'profit') {
          const prA = calcA.profitAmount ?? -999999;
          const prB = calcB.profitAmount ?? -999999;
          comparison = prA - prB;
        } else if (sortField === 'trend') {
          const dA = calcA.priceDelta ?? 0;
          const dB = calcB.priceDelta ?? 0;
          comparison = dA - dB;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [
    tires,
    searchQuery,
    selectedCategory,
    selectedRim,
    supplierFilter,
    onlyPriced,
    trendFilter,
    sortField,
    sortOrder,
    activeSuppliers,
    globalMargin,
    marginMethod,
    selectedRegionConfig,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleStartEdit = (tireId: string, supplier: string, currentPrice: number | null) => {
    setEditingCell({ tireId, supplier });
    setTempPriceValue(currentPrice !== null ? String(currentPrice) : '');
  };

  const handleSavePrice = () => {
    if (!editingCell) return;
    const trimmed = tempPriceValue.trim();
    const newPrice = trimmed === '' ? null : parseFloat(trimmed);
    onUpdatePrice(editingCell.tireId, editingCell.supplier, isNaN(newPrice as number) ? null : newPrice);
    setEditingCell(null);
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === processedTires.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processedTires.map((t) => t.id)));
    }
  };

  const selectedTiresList = useMemo(() => {
    return tires.filter((t) => selectedIds.has(t.id));
  }, [tires, selectedIds]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Instant Search Bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search tire size (e.g. 195/65R15, 225/45, R18, 7.50R16), pattern, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            {/* Supplier Filter Dropdown */}
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="All">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.name}>
                  Quoted by {s.name}
                </option>
              ))}
            </select>

            {/* Price Trend Filter */}
            <select
              value={trendFilter}
              onChange={(e) => setTrendFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All Trends</option>
              <option value="dropped">▼ Price Dropped</option>
              <option value="rose">▲ Price Increased</option>
            </select>

            {/* Only with prices toggle */}
            <button
              onClick={() => setOnlyPriced((prev) => !prev)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                onlyPriced
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
            >
              <span>Priced Only</span>
            </button>
          </div>
        </div>

        {/* Rim Size Quick Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap mr-1">Rim Diameter:</span>
          <button
            onClick={() => setSelectedRim('All')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              selectedRim === 'All'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Rims
          </button>
          {availableRims.map((rim) => (
            <button
              key={rim}
              onClick={() => setSelectedRim(rim)}
              className={`px-2 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                selectedRim === rim
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {rim}&quot;
            </button>
          ))}
        </div>
      </div>

      {/* Batch Operations Bar (when items selected) */}
      {selectedIds.size > 0 && (
        <div className="mb-4 bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between shadow-md animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
              {selectedIds.size}
            </span>
            <span>sizes selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onBatchAddToQuote(selectedTiresList, 4)}
              className="px-3 py-1.5 bg-amber-400 text-slate-900 hover:bg-amber-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add 4-Sets to Quotation</span>
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-slate-700 focus:outline-none"
                    title="Select all filtered rows"
                  >
                    {selectedIds.size === processedTires.length && processedTires.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-slate-900" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>

                <th className="py-3 px-2 w-12 text-center cursor-pointer hover:bg-slate-100" onClick={() => handleSort('sr')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Sr</span>
                    {sortField === 'sr' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>

                <th className="py-3 px-2 text-center w-16 border-l border-slate-200/60">
                  <span>Origin</span>
                </th>

                <th className="py-3 px-3 cursor-pointer hover:bg-slate-100 min-w-[150px]" onClick={() => handleSort('size')}>
                  <div className="flex items-center gap-1">
                    <span>Size & Pattern</span>
                    {sortField === 'size' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>

                {/* Dynamic Supplier Columns */}
                {activeSuppliers.map((supplierName) => {
                  const sInfo = suppliers.find((s) => s.name === supplierName);
                  return (
                    <th
                      key={supplierName}
                      className="py-3 px-2 text-right min-w-[95px] max-w-[130px] border-l border-slate-200/60"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: sInfo?.color || '#64748B' }}
                        />
                        <span className="truncate" title={supplierName}>
                          {supplierName}
                        </span>
                      </div>
                    </th>
                  );
                })}

                {/* CORE FEATURE: BEST PRICE (COST) COLUMN */}
                <th
                  className="py-3 px-3 text-right min-w-[115px] cursor-pointer hover:bg-slate-100 border-l border-slate-200 bg-amber-50/70"
                  onClick={() => handleSort('bestPrice')}
                >
                  <div className="flex items-center justify-end gap-1 text-slate-900 font-bold">
                    <span>Best Price (Cost)</span>
                    {sortField === 'bestPrice' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>

                {/* CORE FEATURE: AUTOMATIC PRICES PER UNIT (AED) COLUMN (Best Price * 1.05) */}
                <th
                  className="py-3 px-3 text-right min-w-[135px] cursor-pointer hover:bg-slate-100 border-l border-slate-200 bg-emerald-50/70 text-emerald-950 font-black"
                  onClick={() => handleSort('offerPrice')}
                >
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 font-extrabold">
                      <span>Prices Per Unit ({currency})</span>
                      {sortField === 'offerPrice' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </div>
                    <span className="text-[9px] font-mono text-emerald-700 font-bold normal-case">
                      Best Price × {(1 + globalMargin / 100).toFixed(2)} (+{globalMargin}%)
                    </span>
                  </div>
                </th>

                {/* Price Trend Column */}
                <th
                  className="py-3 px-2 text-center w-20 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('trend')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Trend</span>
                    {sortField === 'trend' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>

                {/* Actions */}
                <th className="py-3 px-3 text-center w-28">
                  <span>Actions</span>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 font-sans">
              {processedTires.length === 0 ? (
                <tr>
                  <td colSpan={8 + activeSuppliers.length} className="py-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="font-semibold text-slate-600">No matching tire sizes found</p>
                      <p className="text-xs text-slate-400">
                        Try clearing rim or category filters, or add a new tire sequence.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                processedTires.map((tire) => {
                  const calc = calculateTirePricing(
                    tire,
                    globalMargin,
                    marginMethod,
                    activeSuppliers,
                    selectedRegionConfig
                  );
                  const isSelected = selectedIds.has(tire.id);

                  return (
                    <tr
                      key={tire.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Select checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(tire.id)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                      </td>

                      {/* Sr */}
                      <td className="py-2.5 px-2 text-center font-mono text-slate-400 text-xs tabular-nums">
                        {tire.sr}
                      </td>

                      {/* Origin */}
                      <td className="py-2.5 px-2 text-center border-l border-slate-100 font-semibold">
                        <span className="inline-block bg-slate-100 text-slate-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                          {tire.origin || 'China'}
                        </span>
                      </td>

                      {/* Tire Size & Pattern */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 font-mono text-xs tracking-tight">
                            {tire.size}
                          </span>
                          {tire.sheet && tire.sheet !== 'china' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase bg-purple-100 text-purple-800">
                              {tire.sheet === 'hunter' ? 'Hunter' : 'UHP'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                          {tire.category && <span>{tire.category.split(' ')[0]}</span>}
                          {tire.pattern && (
                            <>
                              <span>·</span>
                              <span className="text-slate-600 italic truncate max-w-[120px]" title={tire.pattern}>
                                {tire.pattern}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Supplier Price Cells */}
                      {activeSuppliers.map((supplierName) => {
                        const price = tire.prices[supplierName];
                        const hasPrice = price !== null && price !== undefined && !isNaN(price);
                        const isBest = hasPrice && calc.bestPrice === price;
                        const isEditingThis =
                          editingCell?.tireId === tire.id && editingCell?.supplier === supplierName;

                        return (
                          <td
                            key={supplierName}
                            className={`py-2 px-2 text-right font-mono tabular-nums border-l border-slate-100 ${
                              isBest ? 'bg-amber-100/60 font-bold text-slate-900' : 'text-slate-700'
                            }`}
                          >
                            {isEditingThis ? (
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  autoFocus
                                  value={tempPriceValue}
                                  onChange={(e) => setTempPriceValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSavePrice();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  className="w-16 px-1.5 py-0.5 bg-white border border-slate-900 rounded text-right font-mono text-xs text-slate-900 focus:outline-none"
                                  placeholder="0"
                                />
                                <button
                                  onClick={handleSavePrice}
                                  className="p-1 text-emerald-600 hover:text-emerald-800"
                                  title="Save price"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-1 text-slate-400 hover:text-slate-600"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(tire.id, supplierName, price)}
                                className={`w-full text-right py-1 px-1 rounded hover:bg-slate-200/60 transition-colors group flex items-center justify-end gap-1 ${
                                  !hasPrice ? 'text-slate-300 hover:text-slate-500' : ''
                                }`}
                                title="Click to edit supplier price"
                              >
                                {isBest && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Lowest market price" />
                                )}
                                <span>{hasPrice ? price : '—'}</span>
                                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 ml-0.5">
                                  ✎
                                </span>
                              </button>
                            )}
                          </td>
                        );
                      })}

                      {/* CORE FEATURE 1: BEST PRICE (COST) COLUMN */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums border-l border-slate-200 bg-amber-50/50 text-slate-900">
                        {calc.bestPrice !== null ? (
                          <div>
                            <div className="text-xs font-extrabold text-slate-900">
                              {calc.bestPrice} <span className="text-[10px] font-normal text-slate-500">{currency}</span>
                            </div>
                            {calc.bestSupplier && (
                              <div className="text-[10px] text-amber-800 font-semibold truncate max-w-[110px] text-right font-sans">
                                {calc.bestSupplier}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>

                      {/* CORE FEATURE: PRICES PER UNIT (AED) COLUMN (Best Price * 1.05) */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums border-l border-slate-200 bg-emerald-50/50 text-emerald-950">
                        {calc.pricesPerUnit !== null ? (
                          <div>
                            <div className="text-xs font-black text-emerald-900">
                              {calc.pricesPerUnit} <span className="text-[10px] font-normal text-emerald-700">{currency}</span>
                            </div>
                            <div className="text-[10px] font-medium text-emerald-700 font-sans">
                              +{calc.profitAmount} margin (+{calc.marginPercent}%)
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>

                      {/* FEATURE 3: TREND INDICATOR */}
                      <td className="py-2.5 px-2 text-center font-mono">
                        {calc.trend === 'down' && calc.priceDelta !== null && (
                          <button
                            onClick={() => onViewHistory(tire)}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                            title={`Best price dropped by ${Math.abs(calc.priceDelta)} ${currency}. Click to view history.`}
                          >
                            <TrendingDown className="w-3 h-3 text-emerald-600" />
                            <span>{calc.priceDelta}</span>
                          </button>
                        )}
                        {calc.trend === 'up' && calc.priceDelta !== null && (
                          <button
                            onClick={() => onViewHistory(tire)}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors"
                            title={`Best price increased by ${calc.priceDelta} ${currency}. Click to view history.`}
                          >
                            <TrendingUp className="w-3 h-3 text-rose-600" />
                            <span>+{calc.priceDelta}</span>
                          </button>
                        )}
                        {calc.trend === 'stable' && (
                          <span className="text-[11px] text-slate-400 font-mono" title="Price unchanged from last survey">
                            =
                          </span>
                        )}
                        {calc.trend === 'new' && (
                          <span className="text-[10px] text-slate-400 font-sans">New</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Quick Add to Quote */}
                          <button
                            onClick={() => onAddToQuote(tire, 4)}
                            disabled={calc.bestPrice === null}
                            className={`p-1.5 rounded-md transition-colors ${
                              calc.bestPrice !== null
                                ? 'text-amber-700 hover:text-amber-900 hover:bg-amber-100'
                                : 'text-slate-200 cursor-not-allowed'
                            }`}
                            title="Add 4 tyres to Customer Quote"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>

                          {/* Price History Button */}
                          <button
                            onClick={() => onViewHistory(tire)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                            title="View price history & survey updates"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Full Edit Modal */}
                          <button
                            onClick={() => onEditTire(tire)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                            title="Edit row details & prices"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteTire(tire.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete tire row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer scannability summary */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-slate-900 font-mono">{processedTires.length}</strong> of <strong className="text-slate-900 font-mono">{tires.length}</strong> sizes</span>
            <span aria-hidden="true">·</span>
            <span>Default 5% markup active on Best Price</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Lowest Vendor Cost</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Calculated Customer Offer</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
