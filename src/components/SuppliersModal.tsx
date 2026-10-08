import React, { useState } from 'react';
import { X, Plus, Check, Eye, EyeOff, Building, Phone } from 'lucide-react';
import { SupplierInfo } from '../types/tire';

interface SuppliersModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: SupplierInfo[];
  activeSuppliers: string[];
  onToggleSupplier: (supplierName: string) => void;
  onAddSupplier: (name: string, color: string, phone?: string) => void;
}

const PALETTE = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626', '#0891B2', '#4F46E5', '#EA580C', '#0D9488'];

export const SuppliersModal: React.FC<SuppliersModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  activeSuppliers,
  onToggleSupplier,
  onAddSupplier,
}) => {
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierColor, setNewSupplierColor] = useState(PALETTE[0]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSupplierName.trim();
    if (!trimmed) {
      setError('Supplier name cannot be empty.');
      return;
    }
    if (suppliers.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A supplier with this name already exists.');
      return;
    }

    onAddSupplier(trimmed, newSupplierColor, newSupplierPhone.trim() || undefined);
    setNewSupplierName('');
    setNewSupplierPhone('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">Manage Tyre Suppliers</h3>
            <p className="text-xs text-slate-500">
              Configure active quotation partners and add new suppliers to the index
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Suppliers List */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Supplier Comparison Directory ({suppliers.length})
          </label>
          <div className="space-y-2 max-h-56 overflow-y-auto p-1">
            {suppliers.map((s) => {
              const isActive = activeSuppliers.includes(s.name);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: s.color }}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{s.name}</div>
                      {s.phone && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{s.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleSupplier(s.name)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-white text-slate-900 border-slate-300 shadow-2xs'
                        : 'bg-slate-200/60 text-slate-500 border-slate-200'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Visible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        <span>Hidden</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add New Supplier Section */}
        <div className="mt-5 pt-4 border-t border-slate-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span>Add New Supplier</span>
          </h4>

          {error && <p className="mb-2 text-xs text-rose-600 font-medium">{error}</p>}

          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Supplier Name (e.g. LingLong, Westlake)"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <input
                type="text"
                placeholder="Sales Phone / Contact"
                value={newSupplierPhone}
                onChange={(e) => setNewSupplierPhone(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Color:</span>
                <div className="flex items-center gap-1">
                  {PALETTE.slice(0, 6).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewSupplierColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        newSupplierColor === c ? 'scale-110 ring-2 ring-slate-900 ring-offset-1' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Supplier</span>
              </button>
            </div>
          </form>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
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
