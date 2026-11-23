import React, { useRef, useState } from 'react';
import { FileSpreadsheet, Upload, Download, Check, AlertCircle, Trash2 } from 'lucide-react';
import { parseExcelFile, downloadSampleExcel } from '../utils/excelParser';

export default function ExcelUploader({
  excelFile,
  stats,
  rowsCount,
  onExcelParsed,
  onClearExcel,
  disabled,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValidExt) {
      setParseError('Please upload an Excel spreadsheet (.xlsx, .xls) or a CSV file.');
      return;
    }

    setParseError(null);
    setIsLoading(true);

    try {
      const result = await parseExcelFile(file);
      if (result.error) {
        setParseError(result.error);
      } else {
        onExcelParsed(file, result.rows, result.stats);
      }
    } catch (err) {
      setParseError(`Error parsing file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <h3 className="card-title">1. Upload Contacts Excel</h3>
            <span className="card-subtitle">Expected headers: Company | Email | HRName</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={downloadSampleExcel}
          title="Download a pre-formatted Excel template"
        >
          <Download size={13} /> Sample Excel
        </button>
      </div>

      {!excelFile ? (
        <>
          <div
            className={`dropzone ${isDragging ? 'drag-active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
                e.target.value = '';
              }}
              disabled={disabled}
            />
            <Upload className="dropzone-icon" />
            <p className="dropzone-text">
              {isLoading ? 'Parsing Excel in browser...' : 'Click or drag Excel sheet here'}
            </p>
            <span className="dropzone-hint">Supports .xlsx, .xls, and .csv files</span>
          </div>

          {parseError && (
            <div className="alert alert-danger" style={{ marginTop: 12, marginBottom: 0 }}>
              <AlertCircle size={16} />
              <div className="alert-content">{parseError}</div>
            </div>
          )}
        </>
      ) : (
        <div>
          <div className="file-card">
            <div className="file-info">
              <div className="file-icon excel">
                <FileSpreadsheet size={20} />
              </div>
              <div className="file-details">
                <p className="file-name">{excelFile.name}</p>
                <p className="file-meta">
                  {stats?.totalRows || rowsCount} total rows found in sheet
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClearExcel}
              disabled={disabled}
              title="Remove sheet"
            >
              <Trash2 size={16} color="#ef4444" />
            </button>
          </div>

          {stats && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginTop: 12,
                fontSize: 12,
              }}
            >
              <span className="badge badge-success">
                <Check size={12} /> {stats.validPendingCount} Valid Recipients
              </span>
              {stats.invalidEmailCount > 0 && (
                <span className="badge badge-warning">
                  {stats.invalidEmailCount} Skipped (Invalid Email)
                </span>
              )}
              {stats.duplicateCount > 0 && (
                <span className="badge badge-purple">
                  {stats.duplicateCount} Skipped (Duplicate)
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
