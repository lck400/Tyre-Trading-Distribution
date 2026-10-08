import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  RefreshCw, 
  TrendingDown, 
  TrendingUp, 
  Check, 
  ArrowRight, 
  History, 
  Sparkles, 
  Search,
  Filter,
  Layers,
  Save,
  Clock
} from 'lucide-react';
import { TireRow, SupplierInfo, PriceHistoryEntry } from '../types/tire';
import { calculateTirePricing } from '../utils/calculations';

interface PeriodicPriceCollectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tires: TireRow[];
  suppliers: SupplierInfo[];
  activeSuppliers: string[];
  currency: string;
  onApplyBatchUpdate: (
    batchTitle: string,
    batchDate: string,
    updates: { tireId: string; supplier: string; newPrice: number | null; oldPrice: number | null; notes?: string }[]
  ) => void;
}

export const PeriodicPriceCollectorModal: React.FC<PeriodicPriceCollectorModalProps> = ({
  isOpen,
  onClose,
  tires,
  suppliers,
  activeSuppliers,
  currency,
  onApplyBatchUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'refresh' | 'audit'>('refresh');
  const [selectedSupplier, setSelectedSupplier] = useState<string>(activeSuppliers[0] || 'Bain AL Nahren');
  const [batchTitle, setBatchTitle] = useState(`Vendor Survey - ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`);
  const [batchDate, setBatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [surveyNotes, setSurveyNotes] = useState('');
  
  // Matrix updates state: tireId -> newPrice string
  const [newPrices, setNewPrices] = useState<Record<string, string>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filter tires for the matrix
  const filteredTires = tires.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return t.size.toLowerCase().includes(q) || (t.pattern || '').toLowerCase().includes(q);
  });

  // Calculate pending changes summary
  const pendingUpdates = useMemo(() => {
    const list: { tireId: string; tireSize: string; oldPrice: number | null; newPrice: number; delta: number | null }[] = [];
    
    Object.entries(newPrices).forEach(([tireId, valStr]) => {
      const trimmed = valStr.trim();
      if (!trimmed) return;
      const num = parseFloat(trimmed);
      if (isNaN(num) || num <= 0) return;

      const tire = tires.find((t) => t.id === tireId);
      if (!tire) return;
      const old = tire.prices[selectedSupplier] ?? null;

      // Only count if different
      if (old !== num) {
        list.push({
          tireId,
          tireSize: tire.size,
          oldPrice: old,
          newPrice: num,
          delta: old !== null ? num - old : null,
        });
      }
    });

    return list;
  }, [newPrices, tires, selectedSupplier]);

  const handlePriceInput = (tireId: string, val: string) => {
    setNewPrices((prev) => ({ ...prev, [tireId]: val }));
  };

  const handleApply = () => {
    if (pendingUpdates.length === 0) {
      alert('No price changes detected. Enter new prices in the matrix before saving.');
      return;
    }

    const payload = pendingUpdates.map((item) => ({
      tireId: item.tireId,
      supplier: selectedSupplier,
      newPrice: item.newPrice,
      oldPrice: item.oldPrice,
      notes: itemNotes[item.tireId] || surveyNotes || undefined,
    }));

    onApplyBatchUpdate(batchTitle, batchDate, payload);
    setNewPrices({});
    setItemNotes({});
    onClose();
  };

  // Compile all past history entries across all tires
  const allAuditLogs = useMemo(() => {
    const logs: { tireSize: string; history: PriceHistoryEntry }[] = [];
    tires.forEach((t) => {
      if (t.history && t.history.length > 0) {
        t.history.forEach((h) => {
          logs.push({ tireSize: t.size, history: h });
        });
      }
    });

    // Sort newest date first
    return logs.sort((a, b) => b.history.date.localeCompare(a.history.date));
  }, [tires]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Periodic Price Collection & Vendor Surveys
              </h3>
              <p className="text-xs text-slate-500">
                Refresh supplier quotations every few days & track historic price movement
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg my-3 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('refresh')}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'refresh'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Batch Vendor Price Survey Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Price Trend Audit Log ({allAuditLogs.length})</span>
          </button>
        </div>

        {activeTab === 'refresh' ? (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* Batch Controls Bar */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs shrink-0">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Target Supplier Being Updated
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => {
                    setSelectedSupplier(e.target.value);
                    setNewPrices({});
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Collection Cycle Title
                </label>
                <input
                  type="text"
                  value={batchTitle}
                  onChange={(e) => setBatchTitle(e.target.value)}
                  placeholder="e.g. Mid-Week Vendor Refresh"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Collection Date
                </label>
                <input
                  type="date"
                  value={batchDate}
                  onChange={(e) => setBatchDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Search in Matrix */}
            <div className="flex items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter sizes in matrix (e.g. 195/65, 225/45, R17)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {pendingUpdates.length > 0 && (
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{pendingUpdates.length} price changes staged</span>
                </div>
              )}
            </div>

            {/* Matrix Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2 px-3 w-12 text-center font-mono">Sr</th>
                    <th className="py-2 px-3 min-w-[140px]">Tire Size</th>
                    <th className="py-2 px-3 text-right">Current {selectedSupplier}</th>
                    <th className="py-2 px-3 text-right">Current Best Market</th>
                    <th className="py-2 px-3 text-right w-36 bg-amber-50/60 font-bold text-slate-900">
                      New Price ({currency})
                    </th>
                    <th className="py-2 px-3 text-center w-24">Change Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTires.map((tire) => {
                    const currentPrice = tire.prices[selectedSupplier] ?? null;
                    const calc = calculateTirePricing(tire, 5, 'markup', activeSuppliers);
                    const enteredStr = newPrices[tire.id] ?? '';
                    const enteredNum = enteredStr.trim() ? parseFloat(enteredStr) : null;
                    const isChanged = enteredNum !== null && !isNaN(enteredNum) && enteredNum !== currentPrice;
                    const diff = isChanged && currentPrice !== null ? enteredNum - currentPrice : null;

                    return (
                      <tr
                        key={tire.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isChanged ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-center font-mono text-slate-400">
                          {tire.sr}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-bold font-mono text-slate-900">{tire.size}</div>
                          <div className="text-[10px] text-slate-400">{tire.pattern || tire.category}</div>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {currentPrice !== null ? `${currentPrice}` : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-800">
                          {calc.bestPrice !== null ? (
                            <span>
                              {calc.bestPrice}{' '}
                              <span className="text-[10px] text-slate-400 font-sans">
                                ({calc.bestSupplier?.slice(0, 6)})
                              </span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-1.5 px-3 text-right bg-amber-50/30">
                          <input
                            type="number"
                            step="0.5"
                            placeholder={currentPrice !== null ? String(currentPrice) : 'Enter'}
                            value={enteredStr}
                            onChange={(e) => handlePriceInput(tire.id, e.target.value)}
                            className="w-24 px-2 py-1 text-right bg-white border border-slate-300 rounded font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[11px]">
                          {isChanged && diff !== null ? (
                            diff < 0 ? (
                              <span className="text-emerald-700 font-bold flex items-center justify-center gap-0.5">
                                <TrendingDown className="w-3 h-3" />
                                {diff}
                              </span>
                            ) : diff > 0 ? (
                              <span className="text-rose-600 font-bold flex items-center justify-center gap-0.5">
                                <TrendingUp className="w-3 h-3" />
                                +{diff}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Matrix Footer */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Staging changes for <strong className="text-slate-800">{selectedSupplier}</strong> · Automatically updates previous best price benchmarks
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={pendingUpdates.length === 0}
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 ${
                    pendingUpdates.length > 0
                      ? 'bg-slate-900 hover:bg-slate-800 shadow-xs'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Apply {pendingUpdates.length} Price Updates</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Audit History Tab */
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <div className="text-xs text-slate-500 flex items-center justify-between shrink-0">
              <span>Historical vendor price movements and collection survey archives:</span>
              <span className="font-mono text-slate-700 font-medium">{allAuditLogs.length} logged events</span>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Date & Survey Batch</th>
                    <th className="py-2.5 px-3">Tire Size</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3 text-right">Price Movement</th>
                    <th className="py-2.5 px-3 text-right">New Price</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {allAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No vendor price updates recorded yet. Apply a survey in the matrix tab.
                      </td>
                    </tr>
                  ) : (
                    allAuditLogs.map((log) => {
                      const diff = log.history.oldPrice !== null ? log.history.newPrice - log.history.oldPrice : null;
                      return (
                        <tr key={log.history.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3">
                            <div className="font-medium text-slate-900 font-mono text-[11px]">
                              {log.history.date}
                            </div>
                            <div className="text-[10px] text-slate-500">{log.history.collectionBatch}</div>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">
                            {log.tireSize}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-700">
                            {log.history.supplier}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {log.history.oldPrice !== null ? (
                              <span className="flex items-center justify-end gap-1 text-[11px]">
                                <span className="text-slate-400">{log.history.oldPrice}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <span className="font-bold text-slate-900">{log.history.newPrice}</span>
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-medium">New Quote</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {log.history.newPrice} {currency}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-500">
                            {diff !== null && diff < 0 && (
                              <span className="text-emerald-700 font-bold mr-1">
                                (Dropped {Math.abs(diff)} {currency})
                              </span>
                            )}
                            {diff !== null && diff > 0 && (
                              <span className="text-rose-600 font-bold mr-1">
                                (+{diff} {currency})
                              </span>
                            )}
                            {log.history.notes || 'Routine vendor rate refresh'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
