import React, { useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { TireRow } from '../types/tire';
import { MarginMethod, exportTiresToCSV, parseCSVToTires } from '../utils/calculations';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tires: TireRow[];
  activeSuppliers: string[];
  globalMargin: number;
  marginMethod: MarginMethod;
  currency: string;
  onImportTires: (imported: TireRow[], mode: 'replace' | 'merge') => void;
  companyProfile?: import('../types/tire').CompanyProfile;
  selectedRegionName?: string;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  tires,
  activeSuppliers,
  globalMargin,
  marginMethod,
  currency,
  onImportTires,
  companyProfile,
  selectedRegionName = 'All UAE',
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<{ rows: TireRow[]; detectedSuppliers: string[] } | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleExport = () => {
    exportTiresToCSV(tires, activeSuppliers, globalMargin, marginMethod, currency, selectedRegionName, companyProfile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportText(text);
      try {
        const result = parseCSVToTires(text, activeSuppliers);
        if (result.rows.length === 0) {
          setError('Could not detect valid tire rows in this CSV file.');
          setParsedPreview(null);
        } else {
          setParsedPreview(result);
          setError('');
        }
      } catch (err) {
        setError('Error parsing CSV file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleParseText = () => {
    if (!importText.trim()) {
      setError('Please paste CSV text first.');
      return;
    }
    try {
      const result = parseCSVToTires(importText, activeSuppliers);
      if (result.rows.length === 0) {
        setError('Could not detect valid tire rows from pasted text.');
        setParsedPreview(null);
      } else {
        setParsedPreview(result);
        setError('');
      }
    } catch (err) {
      setError('Error parsing CSV.');
    }
  };

  const handleApplyImport = () => {
    if (!parsedPreview || parsedPreview.rows.length === 0) return;
    onImportTires(parsedPreview.rows, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">Import & Export Dataset</h3>
            <p className="text-xs text-slate-500">
              Exchange catalog data with Microsoft Excel, Google Sheets, or CSV files
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg my-4 text-xs">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Excel / CSV</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'import'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
        </div>

        {activeTab === 'export' ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Ready to Export {tires.length} Tire Sizes</span>
              </div>
              <p className="text-slate-600">
                Your exported CSV will include official quotation headers, Origin (&quot;China&quot;), supplier price breakdown ({activeSuppliers.join(', ')}), dynamically computed minimum Best Price (Cost), and the final &quot;Prices Per Unit ({currency})&quot; column ready for customer quotations.
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                UTF-8 BOM encoded for seamless opening in Microsoft Excel without character corruption.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleExport}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Spreadsheet (.csv)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Or Paste Raw CSV Text
                </label>
                <button
                  type="button"
                  onClick={handleParseText}
                  className="text-xs text-slate-900 font-semibold hover:underline"
                >
                  Analyze Text
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="Sr,Tire Size,Bain AL Nahren,Masar Al Taweel,Double star..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {parsedPreview && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Detected {parsedPreview.rows.length} rows to import</span>
                </div>
                {parsedPreview.detectedSuppliers.length > 0 && (
                  <div className="text-[11px] text-emerald-800">
                    Suppliers in file: <span className="font-semibold">{parsedPreview.detectedSuppliers.join(', ')}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-slate-900"
                    />
                    <span className="font-semibold text-slate-800">Merge & update</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-slate-900"
                    />
                    <span className="font-semibold text-rose-700">Replace current catalog</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!parsedPreview || parsedPreview.rows.length === 0}
                onClick={handleApplyImport}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 ${
                  parsedPreview && parsedPreview.rows.length > 0
                    ? 'bg-slate-900 hover:bg-slate-800 shadow-xs'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Confirm Import</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
