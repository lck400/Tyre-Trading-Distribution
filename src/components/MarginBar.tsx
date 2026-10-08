import React from 'react';
import { Percent, TrendingUp, DollarSign, Calculator, HelpCircle, ArrowRight, MapPin } from 'lucide-react';
import { MarginMethod, formatCurrency } from '../utils/calculations';
import { RegionConfig } from '../types/tire';

interface MarginBarProps {
  marginPercent: number;
  onMarginChange: (margin: number) => void;
  marginMethod: MarginMethod;
  onMarginMethodChange: (method: MarginMethod) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  totalSkus: number;
  pricedSkus: number;
  avgBestPrice: number;
  avgProfit: number;
  selectedRegionConfig: RegionConfig;
}

export const MarginBar: React.FC<MarginBarProps> = ({
  marginPercent,
  onMarginChange,
  marginMethod,
  onMarginMethodChange,
  currency,
  onCurrencyChange,
  totalSkus,
  pricedSkus,
  avgBestPrice,
  avgProfit,
  selectedRegionConfig,
}) => {
  // Configurable markup presets highlighting 5% default, 6%, 8%, 10%, etc.
  const PRESET_MARGINS = [3, 5, 6, 8, 10, 15, 20];

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Main Margin & Offer Price Controls - 7 Cols */}
          <div className="lg:col-span-7 bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/90">
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Automatic Offer Price Markup
                    </h3>
                    <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                      {marginPercent}% Active
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Calculates customer Offer Price alongside minimum Best Price
                  </span>
                </div>
              </div>

              {/* Margin Method Toggle */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => onMarginMethodChange('markup')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    marginMethod === 'markup'
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Formula: Best Price × (1 + Markup%)"
                >
                  Markup on Cost
                </button>
                <button
                  type="button"
                  onClick={() => onMarginMethodChange('grossMargin')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    marginMethod === 'grossMargin'
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Formula: Best Price ÷ (1 - Margin%)"
                >
                  Gross Margin
                </button>
              </div>
            </div>

            {/* Slider & Presets & Number Input */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              {/* Numeric input with % */}
              <div className="relative w-full sm:w-28 shrink-0">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Percent className="w-3.5 h-3.5" />
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={marginPercent}
                  onChange={(e) => onMarginChange(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
                  aria-label="Markup Percentage"
                />
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap">
                {PRESET_MARGINS.map((p) => (
                  <button
                    key={p}
                    onClick={() => onMarginChange(p)}
                    className={`px-2 py-1 text-xs font-mono font-semibold rounded transition-colors ${
                      marginPercent === p
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {p}% {p === 5 ? '(Std)' : ''}
                  </button>
                ))}
              </div>

              {/* Range slider */}
              <div className="w-full flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="0.5"
                  value={Math.min(marginPercent, 40)}
                  onChange={(e) => onMarginChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
              </div>
            </div>

            {/* Sub-bar with regional routing indicator */}
            <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-1.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>
                  Delivery Region: <strong className="text-slate-800">{selectedRegionConfig.name}</strong>
                  {selectedRegionConfig.logisticsSurcharge > 0 && (
                    <span className="text-rose-600 font-mono font-medium ml-1">
                      (+{selectedRegionConfig.logisticsSurcharge} {currency} logistics included in Offer)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Currency:</span>
                <select
                  value={currency}
                  onChange={(e) => onCurrencyChange(e.target.value)}
                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="AED">AED (Dirham)</option>
                  <option value="SAR">SAR (Riyal)</option>
                  <option value="USD">USD ($)</option>
                  <option value="QAR">QAR (Riyal)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="OMR">OMR (Rial)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar - 5 Cols */}
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-medium text-slate-500">Active SKUs</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
                  {pricedSkus}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ {totalSkus}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">With Market Quotes</div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-medium text-slate-500">Avg Best Cost</div>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-slate-900">
                {avgBestPrice > 0 ? `${Math.round(avgBestPrice)}` : '—'}
                <span className="text-xs font-normal text-slate-500 ml-1">{currency}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Lowest vendor avg</div>
            </div>

            <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200/90 shadow-2xs col-span-2 sm:col-span-1">
              <div className="text-[11px] font-semibold text-emerald-800">Offer Margin Return</div>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-emerald-700">
                +{Math.round(avgProfit)}
                <span className="text-xs font-normal text-emerald-600 ml-1">{currency}</span>
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">
                @{marginPercent}% Markup per tyre
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
