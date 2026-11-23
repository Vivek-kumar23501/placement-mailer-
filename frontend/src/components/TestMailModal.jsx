import React, { useState, useEffect } from 'react';
import { Mail, Send, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { isValidEmail, personalizeTemplate } from '../utils/templateHelper';

export default function TestMailModal({
  isOpen,
  onClose,
  onSendTest,
  firstContact,
  subject,
  body,
  resume,
}) {
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);

  // Restore remembered test email from localStorage
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('placement_mailer_test_email');
      if (saved) setTestEmail(saved);
      setResultMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const contactSample = firstContact || {
    company: 'Google',
    hrName: 'Hiring Team',
    email: 'test@example.com',
  };

  const sampleSubject = personalizeTemplate(subject, contactSample);
  const sampleBody = personalizeTemplate(body, contactSample);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!testEmail || !isValidEmail(testEmail)) {
      setResultMessage({
        type: 'error',
        text: 'Please enter a valid recipient email address for your test.',
      });
      return;
    }

    localStorage.setItem('placement_mailer_test_email', testEmail.trim());
    setIsSending(true);
    setResultMessage(null);

    const result = await onSendTest(testEmail.trim(), sampleSubject, sampleBody);

    setIsSending(false);
    if (result.ok) {
      setResultMessage({
        type: 'success',
        text: `Test email sent successfully to ${testEmail}! Check your inbox and spam folder.`,
      });
    } else {
      setResultMessage({
        type: 'error',
        text: result.error || 'Failed to send test email.',
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="card-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Mail size={18} />
            </div>
            <h3 className="modal-title">Send Test Email</h3>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={isSending}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Send a single sample email with your resume attached to verify your template, formatting, and Gmail SMTP setup.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Send Test Email To:</label>
            <input
              type="email"
              className="form-input"
              placeholder="your.email@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              disabled={isSending}
              autoFocus
            />
          </div>

          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ marginBottom: 4 }}>
              <strong>Subject Preview:</strong> {sampleSubject}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              <strong>Using Contact:</strong> {contactSample.company} ({contactSample.hrName})
            </div>
            {resume && (
              <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                <strong>Attached:</strong> {resume.filename}
              </div>
            )}
          </div>

          {resultMessage && (
            <div
              className={`alert ${resultMessage.type === 'success' ? 'alert-info' : 'alert-danger'}`}
              style={{ marginBottom: 16 }}
            >
              {resultMessage.type === 'success' ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <div className="alert-content">{resultMessage.text}</div>
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSending || !testEmail.trim()}
            >
              {isSending ? (
                <>
                  <Loader2 size={15} className="spin" />
                  Sending Test Mail...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Send Test Mail
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
