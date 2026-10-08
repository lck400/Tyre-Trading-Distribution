import React, { useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { TireRow, SupplierInfo, TireCategory } from '../types/tire';

interface EditTireModalProps {
  isOpen: boolean;
  onClose: () => void;
  tire: TireRow | null;
  suppliers: SupplierInfo[];
  onSave: (updated: TireRow) => void;
  onDelete: (tireId: string) => void;
}

export const EditTireModal: React.FC<EditTireModalProps> = ({
  isOpen,
  onClose,
  tire,
  suppliers,
  onSave,
  onDelete,
}) => {
  const [size, setSize] = useState('');
  const [origin, setOrigin] = useState('China');
  const [category, setCategory] = useState<TireCategory>('PCR (Passenger)');
  const [pattern, setPattern] = useState('');
  const [notes, setNotes] = useState('');
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [customMargin, setCustomMargin] = useState<string>('');

  useEffect(() => {
    if (tire) {
      setSize(tire.size);
      setOrigin(tire.origin || 'China');
      setCategory(tire.category || 'PCR (Passenger)');
      setPattern(tire.pattern || '');
      setNotes(tire.notes || '');
      const strPrices: Record<string, string> = {};
      Object.entries(tire.prices).forEach(([k, v]) => {
        strPrices[k] = v !== null && v !== undefined ? String(v) : '';
      });
      setPrices(strPrices);
      setCustomMargin(tire.customMargin !== null && tire.customMargin !== undefined ? String(tire.customMargin) : '');
    }
  }, [tire]);

  if (!isOpen || !tire) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPrices: Record<string, number | null> = {};
    suppliers.forEach((s) => {
      const valStr = prices[s.name]?.trim();
      const num = valStr ? parseFloat(valStr) : NaN;
      updatedPrices[s.name] = !isNaN(num) && num > 0 ? num : null;
    });

    const parsedMargin = customMargin.trim() ? parseFloat(customMargin) : null;

    onSave({
      ...tire,
      size: size.trim().toUpperCase(),
      origin: origin.trim() || 'China',
      category,
      pattern: pattern.trim() || undefined,
      notes: notes.trim() || undefined,
      prices: updatedPrices,
      customMargin: parsedMargin !== null && !isNaN(parsedMargin) ? parsedMargin : null,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Edit Tire Sequence #{tire.sr}
            </h3>
            <p className="text-xs text-slate-500 font-mono">{tire.size}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tire Size</label>
              <input
                type="text"
                required
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Origin</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="China"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TireCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="PCR (Passenger)">PCR (Passenger)</option>
                <option value="UHP (Performance)">UHP (Performance)</option>
                <option value="SUV / 4x4">SUV / 4x4</option>
                <option value="Commercial & Van">Commercial & Van</option>
                <option value="TBR (Truck & Bus)">TBR (Truck & Bus)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pattern / Tread Description
              </label>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="e.g. Touring A/S"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Row Margin % Override
              </label>
              <input
                type="number"
                placeholder="Global margin if blank"
                value={customMargin}
                onChange={(e) => setCustomMargin(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Supplier Quotation Prices
            </label>
            <div className="grid grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {suppliers.map((s) => (
                <div key={s.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="block text-[11px] font-medium text-slate-700 truncate">
                      {s.name}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="—"
                    value={prices[s.name] || ''}
                    onChange={(e) => setPrices((prev) => ({ ...prev, [s.name]: e.target.value }))}
                    className="w-16 px-1.5 py-1 text-right bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${tire.size}?`)) {
                  onDelete(tire.id);
                  onClose();
                }
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Tire</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
