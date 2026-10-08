import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { TireRow, SupplierInfo, TireCategory } from '../types/tire';
import { categorizeTireSize } from '../data/initialData';

interface AddTireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newTire: Omit<TireRow, 'id'>) => void;
  nextSr: number;
  suppliers: SupplierInfo[];
}

export const AddTireModal: React.FC<AddTireModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  nextSr,
  suppliers,
}) => {
  const [size, setSize] = useState('');
  const [origin, setOrigin] = useState('China');
  const [category, setCategory] = useState<TireCategory>('PCR (Passenger)');
  const [pattern, setPattern] = useState('');
  const [notes, setNotes] = useState('');
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [customMargin, setCustomMargin] = useState<string>('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSizeChange = (val: string) => {
    setSize(val);
    if (val.trim()) {
      setCategory(categorizeTireSize(val));
    }
  };

  const handlePriceChange = (supplierName: string, val: string) => {
    setPrices((prev) => ({ ...prev, [supplierName]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!size.trim()) {
      setError('Please provide a valid tire size (e.g., 205/55R16).');
      return;
    }

    const parsedPrices: Record<string, number | null> = {};
    suppliers.forEach((s) => {
      const valStr = prices[s.name]?.trim();
      const num = valStr ? parseFloat(valStr) : NaN;
      parsedPrices[s.name] = !isNaN(num) && num > 0 ? num : null;
    });

    const parsedMargin = customMargin.trim() ? parseFloat(customMargin) : null;

    onAdd({
      sr: nextSr,
      size: size.trim().toUpperCase(),
      origin: origin.trim() || 'China',
      category,
      pattern: pattern.trim() || undefined,
      notes: notes.trim() || undefined,
      prices: parsedPrices,
      customMargin: parsedMargin !== null && !isNaN(parsedMargin) ? parsedMargin : null,
    });

    // Reset
    setSize('');
    setPattern('');
    setNotes('');
    setPrices({});
    setCustomMargin('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">Add New Tire Size</h3>
            <p className="text-xs text-slate-500">
              Assign sequence #{nextSr} with initial supplier quotation prices
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tire Size <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 215/60R16"
                value={size}
                onChange={(e) => handleSizeChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Origin
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="China"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
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
                Pattern / Tread (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ECO-600, All-Terrain"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Margin % (Optional)
              </label>
              <input
                type="number"
                placeholder="Leave blank for global margin"
                value={customMargin}
                onChange={(e) => setCustomMargin(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Supplier Market Prices
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
                    onChange={(e) => handlePriceChange(s.name, e.target.value)}
                    className="w-16 px-1.5 py-1 text-right bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
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
              <Plus className="w-4 h-4" />
              <span>Create Row</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
