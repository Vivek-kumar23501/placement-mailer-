import React from 'react';
import {
  Send,
  MailCheck,
  Square,
  RotateCcw,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';

export default function SendControls({
  hasExcel,
  hasResume,
  hasSubject,
  hasBody,
  validCount,
  pendingCount,
  sentCount,
  failedCount,
  isSending,
  isStopped,
  currentSendingIndex,
  onOpenTestModal,
  onOpenConfirmModal,
  onStopSending,
  onResumeSending,
  onRetryFailed,
  backendConnected,
  gmailConfigured,
}) {
  // Check completion of all 4 requirements
  const isReady = hasExcel && hasResume && hasSubject && hasBody;

  // Build missing items message
  const missingItems = [];
  if (!hasExcel) missingItems.push('Excel contacts sheet with valid emails');
  if (!hasResume) missingItems.push('Resume PDF attachment');
  if (!hasSubject) missingItems.push('Email Subject');
  if (!hasBody) missingItems.push('Email Body');

  // Overall progress percentage
  const totalActionable = sentCount + failedCount + pendingCount;
  const processed = sentCount + failedCount;
  const progressPercent = totalActionable > 0 ? Math.round((processed / totalActionable) * 100) : 0;

  return (
    <div className="action-bar-card">
      <div className="action-bar-top">
        {/* Requirements Checklist */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-main)' }}>
            Campaign Readiness Checklist:
          </div>
          <div className="requirements-list">
            <span className={`req-item ${hasExcel ? 'met' : 'unmet'}`}>
              {hasExcel ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              Contacts ({validCount} valid)
            </span>
            <span className={`req-item ${hasResume ? 'met' : 'unmet'}`}>
              {hasResume ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              Resume PDF
            </span>
            <span className={`req-item ${hasSubject ? 'met' : 'unmet'}`}>
              {hasSubject ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              Subject
            </span>
            <span className={`req-item ${hasBody ? 'met' : 'unmet'}`}>
              {hasBody ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              Body
            </span>
          </div>

          {!isReady && (
            <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>
              ⚠️ Missing to enable sending: <strong>{missingItems.join(', ')}</strong>
            </p>
          )}

          {isReady && !gmailConfigured && (
            <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: 8 }}>
              ⚠️ Please configure GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env before sending.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons-group">
          {/* Send Test Mail Button */}
          <button
            type="button"
            className="btn btn-outline"
            onClick={onOpenTestModal}
            disabled={!isReady || isSending}
            title={!isReady ? `Complete checklist to enable: ${missingItems.join(', ')}` : 'Send a test email to your own inbox'}
          >
            <MailCheck size={16} color="#3b82f6" />
            Send Test Mail
          </button>

          {/* Sending Active State: Stop Button */}
          {isSending ? (
            <button
              type="button"
              className="btn btn-danger btn-lg"
              onClick={onStopSending}
              title="Halt the campaign immediately"
            >
              <Square size={16} fill="white" />
              Stop Sending
            </button>
          ) : (
            <>
              {/* If halted midway with pending rows, allow Resuming */}
              {isStopped && pendingCount > 0 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onResumeSending}
                  title="Resume sending remaining pending emails"
                >
                  <Play size={16} />
                  Resume ({pendingCount} pending)
                </button>
              )}

              {/* If there are failed rows, allow Retrying only failed rows */}
              {failedCount > 0 && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onRetryFailed}
                  title="Retry sending only to failed contacts"
                  style={{ borderColor: 'var(--danger-border)', color: 'var(--danger)' }}
                >
                  <RotateCcw size={15} />
                  Retry Failed ({failedCount})
                </button>
              )}

              {/* Main "Send to all HRs" button */}
              <button
                type="button"
                className="btn btn-success btn-lg"
                onClick={onOpenConfirmModal}
                disabled={!isReady || pendingCount === 0}
                title={
                  !isReady
                    ? `Complete checklist to enable: ${missingItems.join(', ')}`
                    : pendingCount === 0
                    ? 'No pending contacts to send'
                    : `Send to ${pendingCount} HRs`
                }
              >
                <Send size={16} />
                Send to all HRs {pendingCount > 0 ? `(${pendingCount})` : ''}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Live Progress Section (visible when sending or already sent some) */}
      {(isSending || processed > 0) && (
        <div className="progress-container">
          <div className="progress-header">
            <div>
              <span>
                <strong>Sent {sentCount} / {totalActionable}</strong>
              </span>
              {failedCount > 0 && (
                <span style={{ color: 'var(--danger)', marginLeft: 12 }}>
                  ({failedCount} failed)
                </span>
              )}
              {isSending && (
                <span style={{ color: 'var(--text-muted)', marginLeft: 12, fontSize: 12 }}>
                  <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                  3s delay between emails active
                </span>
              )}
            </div>
            <span>{progressPercent}% Complete</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
