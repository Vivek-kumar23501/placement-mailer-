import React, { useRef, useState } from 'react';
import { Mail, Tag, Eye, Paperclip, Sparkles } from 'lucide-react';
import { personalizeTemplate } from '../utils/templateHelper';

export default function TemplateEditor({
  subject,
  setSubject,
  body,
  setBody,
  firstContact,
  resume,
  disabled,
}) {
  const [activeField, setActiveField] = useState('body'); // 'subject' or 'body'
  const subjectInputRef = useRef(null);
  const bodyTextareaRef = useRef(null);

  // Insert placeholder tag into whichever field has focus or last focused
  const insertPlaceholder = (tag) => {
    if (disabled) return;

    if (activeField === 'subject' && subjectInputRef.current) {
      const input = subjectInputRef.current;
      const start = input.selectionStart ?? subject.length;
      const end = input.selectionEnd ?? subject.length;
      const newSubject = subject.slice(0, start) + tag + subject.slice(end);
      setSubject(newSubject);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else {
      const textarea = bodyTextareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart ?? body.length;
      const end = textarea.selectionEnd ?? body.length;
      const newBody = body.slice(0, start) + tag + body.slice(end);
      setBody(newBody);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    }
  };

  // Preview data: use first row of Excel, or fallback to realistic mock
  const previewContact = firstContact || {
    company: 'Acme Corp',
    hrName: 'Sarah Jenkins',
    email: 'hr@acmecorp.com',
  };

  const hasContent = Boolean(subject.trim() || body.trim());

  return (
    <div className="card" style={{ gridColumn: 'span 2' }}>
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <Mail size={18} />
          </div>
          <div>
            <h3 className="card-title">3. Email Template Editor</h3>
            <span className="card-subtitle">
              Compose your custom cold email. Personalize dynamically with placeholders.
            </span>
          </div>
        </div>
      </div>

      {/* Placeholder insertion hints */}
      <div className="placeholder-chips">
        <span className="placeholder-hint-label">Insert variable into template:</span>
        <button
          type="button"
          className="chip-btn"
          onClick={() => insertPlaceholder('{{company}}')}
          disabled={disabled}
          title="Inserts company name from Excel"
        >
          <Tag size={12} /> {'{{company}}'}
        </button>
        <button
          type="button"
          className="chip-btn"
          onClick={() => insertPlaceholder('{{hr}}')}
          disabled={disabled}
          title="Inserts HR name from Excel (or 'Hiring Manager' if empty)"
        >
          <Tag size={12} /> {'{{hr}}'}
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>
          (Tip: {'{{hr}}'} defaults to &quot;Hiring Manager&quot; if left empty in sheet)
        </span>
      </div>

      {/* Subject input */}
      <div className="form-group">
        <label className="form-label">Email Subject</label>
        <input
          ref={subjectInputRef}
          type="text"
          className="form-input"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          onFocus={() => setActiveField('subject')}
          placeholder="Write your subject here, e.g. Application for Software Engineer - {{company}}"
          disabled={disabled}
        />
      </div>

      {/* Body textarea */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Email Body (Plain Text)</label>
        <textarea
          ref={bodyTextareaRef}
          className="form-textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setActiveField('body')}
          placeholder={`Write your email body here, e.g.&#10;Dear {{hr}},&#10;&#10;I am writing to express my strong interest in software engineering roles at {{company}}...`}
          disabled={disabled}
        />
      </div>

      {/* Live Preview Box - rendered ONLY when template has content */}
      {hasContent && (
        <div className="live-preview-box">
          <div className="preview-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={14} /> Live Email Preview
            </span>
            <span style={{ fontWeight: 500, fontSize: 11, color: '#64748b' }}>
              Previewing with {firstContact ? `Excel Row 1 (${previewContact.company})` : 'Sample Data'}
            </span>
          </div>

          <div className="preview-field">
            <span className="preview-field-label">To:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#2563eb' }}>
              {previewContact.email || 'hr@company.com'}
            </span>
          </div>

          <div className="preview-field">
            <span className="preview-field-label">Subject:</span>
            <span className="preview-subject">
              {subject ? (
                personalizeTemplate(subject, previewContact)
              ) : (
                <em style={{ color: 'var(--text-subtle)' }}>(Empty subject)</em>
              )}
            </span>
          </div>

          <div className="preview-body">
            {body ? (
              personalizeTemplate(body, previewContact)
            ) : (
              <em style={{ color: 'var(--text-subtle)' }}>(Empty body)</em>
            )}
          </div>

          {resume && (
            <div className="preview-attachment">
              <Paperclip size={13} />
              <span>Attachment: <strong>{resume.filename}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
