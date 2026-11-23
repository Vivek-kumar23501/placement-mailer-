import React from 'react';
import { Send, AlertTriangle, Clock, X, Paperclip } from 'lucide-react';

export default function ConfirmSendModal({
  isOpen,
  onClose,
  onConfirm,
  pendingCount,
  skippedCount,
  resume,
}) {
  if (!isOpen) return null;

  // Calculate estimated duration with 3s delay
  const totalSeconds = pendingCount * 3;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const durationText =
    minutes > 0 ? `~${minutes}m ${seconds > 0 ? `${seconds}s` : ''}` : `~${totalSeconds} seconds`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="card-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <Send size={18} />
            </div>
            <h3 className="modal-title">Confirm Outreach Campaign</h3>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: 14, color: 'var(--text-main)', marginBottom: 16 }}>
          You are about to start sending personalized emails to all valid HR contacts in your sheet.
        </div>

        {/* Campaign Metrics */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>Emails to send:</span>
            <strong>{pendingCount} personalized emails</strong>
          </div>

          {skippedCount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Skipped rows (invalid / duplicate):</span>
              <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{skippedCount} rows excluded</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>Delay between emails:</span>
            <span>3 seconds per email</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>Estimated total duration:</span>
            <span>
              <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
              <strong>{durationText}</strong>
            </span>
          </div>

          {resume && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                paddingTop: 8,
                marginTop: 8,
                borderTop: '1px solid var(--border)',
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              <Paperclip size={13} />
              Attached to every email: <strong>{resume.filename}</strong>
            </div>
          )}
        </div>

        {/* Gmail Advisory */}
        <div className="alert alert-warning" style={{ fontSize: 13, marginBottom: 20 }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div className="alert-content">
            <strong>Gmail Daily Limit Advisory:</strong> To keep your personal Gmail account safe from spam flags, keep total daily emails under <strong>~100–150 emails per day</strong>.
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={() => {
              onClose();
              onConfirm();
            }}
          >
            <Send size={15} />
            Yes, Start Sending ({pendingCount})
          </button>
        </div>
      </div>
    </div>
  );
}
