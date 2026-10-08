import React, { useMemo } from 'react';
import { X, Trophy, TrendingDown, Award, CheckCircle, BarChart2, ShieldAlert } from 'lucide-react';
import { TireRow, SupplierInfo } from '../types/tire';
import { calculateTirePricing, MarginMethod, formatCurrency } from '../utils/calculations';

interface SupplierAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tires: TireRow[];
  suppliers: SupplierInfo[];
  activeSuppliers: string[];
  globalMargin: number;
  marginMethod: MarginMethod;
  currency: string;
}

export const SupplierAnalyticsModal: React.FC<SupplierAnalyticsModalProps> = ({
  isOpen,
  onClose,
  tires,
  suppliers,
  activeSuppliers,
  globalMargin,
  marginMethod,
  currency,
}) => {
  if (!isOpen) return null;

  // Calculate statistics per supplier
  const stats = useMemo(() => {
    const supplierCounts: Record<string, { wins: number; totalQuotes: number; sumPrices: number }> = {};

    activeSuppliers.forEach((s) => {
      supplierCounts[s] = { wins: 0, totalQuotes: 0, sumPrices: 0 };
    });

    let totalPricedSizes = 0;
    let totalSavingsVsSecondBest = 0;
    let comparisonsWithMultipleSuppliers = 0;

    tires.forEach((tire) => {
      const calc = calculateTirePricing(tire, globalMargin, marginMethod, activeSuppliers);
      if (calc.bestPrice !== null && calc.bestSupplier) {
        totalPricedSizes++;
        if (supplierCounts[calc.bestSupplier]) {
          supplierCounts[calc.bestSupplier].wins++;
        }
      }

      // Track quotes and price sums
      activeSuppliers.forEach((s) => {
        const p = tire.prices[s];
        if (typeof p === 'number' && !isNaN(p) && p > 0) {
          if (supplierCounts[s]) {
            supplierCounts[s].totalQuotes++;
            supplierCounts[s].sumPrices += p;
          }
        }
      });

      // Price gap analysis vs second lowest
      if (calc.allValidPrices.length >= 2) {
        comparisonsWithMultipleSuppliers++;
        const gap = calc.allValidPrices[1].price - calc.allValidPrices[0].price;
        totalSavingsVsSecondBest += gap;
      }
    });

    const leaderboard = activeSuppliers.map((s) => {
      const data = supplierCounts[s] || { wins: 0, totalQuotes: 0, sumPrices: 0 };
      const winRate = totalPricedSizes > 0 ? (data.wins / totalPricedSizes) * 100 : 0;
      const avgPrice = data.totalQuotes > 0 ? data.sumPrices / data.totalQuotes : 0;
      const sInfo = suppliers.find((sup) => sup.name === s);

      return {
        name: s,
        color: sInfo?.color || '#64748B',
        wins: data.wins,
        totalQuotes: data.totalQuotes,
        winRate: Math.round(winRate * 10) / 10,
        avgPrice: Math.round(avgPrice * 10) / 10,
      };
    });

    leaderboard.sort((a, b) => b.wins - a.wins);

    const avgSavings =
      comparisonsWithMultipleSuppliers > 0
        ? totalSavingsVsSecondBest / comparisonsWithMultipleSuppliers
        : 0;

    return {
      leaderboard,
      totalPricedSizes,
      avgSavings: Math.round(avgSavings * 10) / 10,
    };
  }, [tires, activeSuppliers, suppliers, globalMargin, marginMethod]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Supplier Market Intelligence & Win-Rate
              </h3>
              <p className="text-xs text-slate-500">
                Quantitative benchmark of price leadership across {tires.length} tire sizes
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlights banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Market Price Leader</div>
            <div className="text-base font-bold text-slate-900 truncate mt-0.5">
              {stats.leaderboard[0]?.name || '—'}
            </div>
            <div className="text-[11px] text-amber-700 font-mono mt-0.5 font-semibold">
              {stats.leaderboard[0]?.wins || 0} best price sizes ({stats.leaderboard[0]?.winRate}%)
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <div className="text-[11px] text-emerald-800 font-medium">Avg Smart-Sourcing Saving</div>
            <div className="text-base font-bold font-mono tabular-nums text-emerald-800 mt-0.5">
              {stats.avgSavings} {currency} / tyre
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">
              Cheapest vs 2nd lowest
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-slate-500 font-medium">Priced Coverage</div>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
              {stats.totalPricedSizes} / {tires.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {Math.round((stats.totalPricedSizes / (tires.length || 1)) * 100)}% active SKUs
            </div>
          </div>
        </div>

        {/* Win-rate leaderboard */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Supplier Price Win-Rate Leaderboard
          </h4>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.leaderboard.map((item, idx) => (
              <div
                key={item.name}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 font-bold w-4">#{idx + 1}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-slate-900">{item.name}</span>
                    {idx === 0 && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                        Lowest Price Leader
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-500 text-[11px]">
                      {item.totalQuotes} sizes quoted
                    </span>
                    <span className="font-bold text-slate-900">
                      {item.wins} wins ({item.winRate}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.winRate}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>Avg Quoted Price:</span>
                  <span>{item.avgPrice > 0 ? `${item.avgPrice} ${currency}` : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
