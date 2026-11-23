import React, { useRef, useState } from 'react';
import { FileText, Upload, Check, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { formatFileSize } from '../utils/templateHelper';

export default function ResumeUploader({
  resume,
  onResumeUploaded,
  onResumeRemoved,
  disabled,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleUpload = async (file) => {
    if (!file) return;

    // Check PDF extension or MIME
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setErrorMessage('Only PDF documents (.pdf) are allowed.');
      return;
    }

    // 5MB limit check (5 * 1024 * 1024 = 5242880 bytes)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        `File is too large (${formatFileSize(file.size)}). Max allowed resume size is 5 MB.`
      );
      return;
    }

    setErrorMessage(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/resume', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to upload resume to backend.');
      }

      onResumeUploaded({
        filename: data.filename || file.name,
        size: data.size || file.size,
      });
    } catch (err) {
      setErrorMessage(err.message || 'Network error while uploading resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      await fetch('/api/resume', { method: 'DELETE' });
    } catch (err) {
      console.warn('Error deleting resume from server:', err);
    }
    onResumeRemoved();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
            <FileText size={18} />
          </div>
          <div>
            <h3 className="card-title">2. Attach Resume PDF</h3>
            <span className="card-subtitle">PDF format only, maximum 5 MB</span>
          </div>
        </div>
      </div>

      {!resume ? (
        <>
          <div
            className={`dropzone ${isDragging ? 'drag-active' : ''}`}
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled && !uploading) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pdf,application/pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) handleUpload(e.target.files[0]);
                e.target.value = '';
              }}
              disabled={disabled || uploading}
            />
            {uploading ? (
              <>
                <Loader2 className="dropzone-icon spin" style={{ color: '#3b82f6' }} />
                <p className="dropzone-text">Uploading resume to backend...</p>
              </>
            ) : (
              <>
                <Upload className="dropzone-icon" />
                <p className="dropzone-text">Click or drag your Resume PDF here</p>
                <span className="dropzone-hint">PDF will be attached to every email sent</span>
              </>
            )}
          </div>

          {errorMessage && (
            <div className="alert alert-danger" style={{ marginTop: 12, marginBottom: 0 }}>
              <AlertCircle size={16} />
              <div className="alert-content">{errorMessage}</div>
            </div>
          )}
        </>
      ) : (
        <div>
          <div className="file-card">
            <div className="file-info">
              <div className="file-icon pdf">
                <FileText size={20} />
              </div>
              <div className="file-details">
                <p className="file-name">{resume.filename}</p>
                <p className="file-meta">{formatFileSize(resume.size)} • PDF Ready</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleRemove}
              disabled={disabled}
              title="Remove resume"
            >
              <Trash2 size={16} color="#ef4444" />
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <span className="badge badge-success">
              <Check size={12} /> Ready to attach to all outbound emails
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
