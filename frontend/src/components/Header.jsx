import React from 'react';
import { Mail, CheckCircle, AlertTriangle, XCircle, Send } from 'lucide-react';

export default function Header({ backendStatus, isSending }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon">
          <Send size={24} />
        </div>
        <div>
          <h1 className="brand-title">Placement Mailer</h1>
          <p className="brand-subtitle">
            Personalized bulk cold emails to HRs with attached resume
          </p>
        </div>
      </div>

      <div className="header-badges">
        {backendStatus.loading ? (
          <span className="badge badge-neutral">Checking backend...</span>
        ) : !backendStatus.connected ? (
          <span className="badge badge-danger">
            <XCircle size={14} /> Backend Offline (Port 5000)
          </span>
        ) : backendStatus.configured ? (
          <span className="badge badge-success" title={`Sender: ${backendStatus.gmailUser}`}>
            <CheckCircle size={14} /> Gmail Ready: {backendStatus.gmailUser}
          </span>
        ) : (
          <span
            className="badge badge-warning"
            title="Configure GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env"
          >
            <AlertTriangle size={14} /> Gmail Credentials Not Set (.env)
          </span>
        )}

        {isSending && (
          <span className="badge badge-info">
            <span className="spin">⏳</span> Sending Campaign in Progress
          </span>
        )}
      </div>
    </header>
  );
}
