import React from 'react';
import { X, TrendingDown, TrendingUp, History, Calendar, CheckCircle } from 'lucide-react';
import { TireRow } from '../types/tire';

interface TireHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tire: TireRow | null;
  currency: string;
}

export const TireHistoryModal: React.FC<TireHistoryModalProps> = ({
  isOpen,
  onClose,
  tire,
  currency,
}) => {
  if (!isOpen || !tire) return null;

  const history = tire.history || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Price Evolution History
            </div>
            <h3 className="text-lg font-mono font-extrabold text-slate-900 mt-0.5">
              {tire.size}
            </h3>
            {tire.pattern && (
              <p className="text-xs text-slate-500 italic">{tire.pattern}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Supplier Quote Snapshot */}
        <div className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-600 mb-2">
            Active Supplier Quotes
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(tire.prices).map(([supplier, price]) => {
              if (price === null) return null;
              return (
                <div key={supplier} className="flex justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-slate-600 truncate mr-2">{supplier}</span>
                  <span className="font-mono font-bold text-slate-900">{price} {currency}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline Log */}
        <div className="space-y-2 mt-4">
          <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Survey Records & Price Adjustments</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {history.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                No past price survey updates recorded for this size yet. Changes logged in the Periodic Survey will appear here.
              </div>
            ) : (
              history.map((h) => {
                const diff = h.oldPrice !== null ? h.newPrice - h.oldPrice : null;
                return (
                  <div key={h.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{h.supplier}</span>
                      <span className="font-mono text-[11px] text-slate-400">{h.date}</span>
                    </div>

                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-500">
                        {h.oldPrice !== null ? `${h.oldPrice} → ${h.newPrice} ${currency}` : `Initial quote: ${h.newPrice} ${currency}`}
                      </span>

                      {diff !== null && (
                        diff < 0 ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                            <TrendingDown className="w-3.5 h-3.5" />
                            {diff} {currency}
                          </span>
                        ) : diff > 0 ? (
                          <span className="text-rose-600 font-bold flex items-center gap-0.5">
                            <TrendingUp className="w-3.5 h-3.5" />
                            +{diff} {currency}
                          </span>
                        ) : (
                          <span className="text-slate-400">Unchanged</span>
                        )
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 font-sans">
                      {h.collectionBatch} {h.notes ? `· ${h.notes}` : ''}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
