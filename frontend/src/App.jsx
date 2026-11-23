import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import ExcelUploader from './components/ExcelUploader';
import ResumeUploader from './components/ResumeUploader';
import TemplateEditor from './components/TemplateEditor';
import SendControls from './components/SendControls';
import ContactsTable from './components/ContactsTable';
import TestMailModal from './components/TestMailModal';
import ConfirmSendModal from './components/ConfirmSendModal';
import { personalizeTemplate } from './utils/templateHelper';

export default function App() {
  // Backend & Gmail status
  const [backendStatus, setBackendStatus] = useState({
    loading: true,
    connected: false,
    configured: false,
    gmailUser: null,
    hasResume: false,
  });

  // State: Excel file and contacts
  const [excelFile, setExcelFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [excelStats, setExcelStats] = useState(null);

  // State: Uploaded resume
  const [resume, setResume] = useState(null);

  // State: Template (MUST START COMPLETELY EMPTY per requirements)
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // State: Sending loop
  const [isSending, setIsSending] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [currentSendingIndex, setCurrentSendingIndex] = useState(-1);
  const stopRequestedRef = useRef(false);

  // Modals
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Check backend status on mount
  const checkBackendStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setBackendStatus({
          loading: false,
          connected: true,
          configured: data.configured,
          gmailUser: data.gmailUser,
          hasResume: data.hasResume,
        });
        if (data.hasResume && data.resume && !resume) {
          setResume(data.resume);
        }
      } else {
        setBackendStatus({
          loading: false,
          connected: false,
          configured: false,
          gmailUser: null,
          hasResume: false,
        });
      }
    } catch {
      setBackendStatus({
        loading: false,
        connected: false,
        configured: false,
        gmailUser: null,
        hasResume: false,
      });
    }
  };

  useEffect(() => {
    checkBackendStatus();
  }, []);

  // Handlers for Excel
  const handleExcelParsed = (file, parsedRows, stats) => {
    setExcelFile(file);
    setRows(parsedRows);
    setExcelStats(stats);
    setIsStopped(false);
  };

  const handleClearExcel = () => {
    setExcelFile(null);
    setRows([]);
    setExcelStats(null);
    setIsStopped(false);
  };

  // Handlers for Resume
  const handleResumeUploaded = (uploadedResume) => {
    setResume(uploadedResume);
  };

  const handleResumeRemoved = () => {
    setResume(null);
  };

  // Helper delay that halts quickly if stop is requested
  const sleepWithCancel = async (ms) => {
    const start = Date.now();
    while (Date.now() - start < ms) {
      if (stopRequestedRef.current) return false;
      await new Promise((r) => setTimeout(r, 100));
    }
    return !stopRequestedRef.current;
  };

  // Send single test email
  const handleSendTestMail = async (toEmail, testSubject, testBody) => {
    try {
      const response = await fetch('/api/send-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          subject: testSubject,
          body: testBody,
        }),
      });

      const data = await response.json();
      return data;
    } catch (err) {
      return { ok: false, error: err.message || 'Network error' };
    }
  };

  // Main sending loop for rows
  const runSendingLoop = async (rowsToProcess) => {
    setIsSending(true);
    setIsStopped(false);
    stopRequestedRef.current = false;

    // Work with latest copy of rows
    const updatedRows = [...rows];
    let successfullySentInSession = 0;

    for (let i = 0; i < updatedRows.length; i++) {
      // Check if user clicked Stop
      if (stopRequestedRef.current) {
        setIsStopped(true);
        break;
      }

      const row = updatedRows[i];

      // Only process rows that are currently "Pending"
      if (row.status !== 'Pending') {
        continue;
      }

      // Mark row as Sending...
      row.status = 'Sending...';
      setCurrentSendingIndex(i);
      setRows([...updatedRows]);

      // Personalize subject & body
      const personalizedSubject = personalizeTemplate(subject, row);
      const personalizedBody = personalizeTemplate(body, row);

      try {
        const response = await fetch('/api/send-one', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: row.email,
            subject: personalizedSubject,
            body: personalizedBody,
          }),
        });

        const data = await response.json();

        if (response.ok && data.ok) {
          row.status = 'Sent ✅';
          row.errorMessage = '';
          successfullySentInSession++;
        } else {
          row.status = 'Failed ❌';
          row.errorMessage = data.error || 'Failed to send';
        }
      } catch (err) {
        row.status = 'Failed ❌';
        row.errorMessage = err.message || 'Network error';
      }

      // Update table state after this row finishes
      setRows([...updatedRows]);

      // If stop was requested while API request was in-flight
      if (stopRequestedRef.current) {
        setIsStopped(true);
        break;
      }

      // Check if there are more pending rows remaining
      const hasMorePending = updatedRows.slice(i + 1).some((r) => r.status === 'Pending');

      if (hasMorePending) {
        // Enforce 3-second delay between emails to avoid Gmail spam flags
        const continueSending = await sleepWithCancel(3000);
        if (!continueSending) {
          setIsStopped(true);
          break;
        }
      }
    }

    setIsSending(false);
    setCurrentSendingIndex(-1);

    // If all valid rows were sent and no failures, celebrate with confetti!
    const remainingPending = updatedRows.filter((r) => r.status === 'Pending').length;
    const totalFailed = updatedRows.filter((r) => r.status.startsWith('Failed')).length;

    if (remainingPending === 0 && totalFailed === 0 && successfullySentInSession > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Start sending to all HRs
  const handleStartSending = () => {
    runSendingLoop(rows);
  };

  // Stop sending loop
  const handleStopSending = () => {
    stopRequestedRef.current = true;
    setIsSending(false);
    setIsStopped(true);
  };

  // Resume sending stopped pending rows
  const handleResumeSending = () => {
    runSendingLoop(rows);
  };

  // Retry only failed rows
  const handleRetryFailed = () => {
    const updated = rows.map((r) => {
      if (r.status.startsWith('Failed')) {
        return { ...r, status: 'Pending', errorMessage: '' };
      }
      return r;
    });
    setRows(updated);
    setTimeout(() => {
      runSendingLoop(updated);
    }, 50);
  };

  // Calculations for counters & validation
  const validContacts = rows.filter(
    (r) => !r.status.startsWith('Skipped')
  );
  const pendingCount = rows.filter(
    (r) => r.status === 'Pending' || r.status === 'Sending...'
  ).length;
  const sentCount = rows.filter((r) => r.status.startsWith('Sent')).length;
  const failedCount = rows.filter((r) => r.status.startsWith('Failed')).length;
  const skippedCount = rows.filter((r) => r.status.startsWith('Skipped')).length;

  const firstValidContact = validContacts[0] || null;

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        backendStatus={backendStatus}
        isSending={isSending}
      />

      {/* Main Grid: Excel Uploader + Resume Uploader */}
      <div className="layout-grid">
        <ExcelUploader
          excelFile={excelFile}
          stats={excelStats}
          rowsCount={rows.length}
          onExcelParsed={handleExcelParsed}
          onClearExcel={handleClearExcel}
          disabled={isSending}
        />

        <ResumeUploader
          resume={resume}
          onResumeUploaded={handleResumeUploaded}
          onResumeRemoved={handleResumeRemoved}
          disabled={isSending}
        />
      </div>

      {/* Template Editor (Subject & Body with live preview) */}
      <div style={{ marginBottom: 24 }}>
        <TemplateEditor
          subject={subject}
          setSubject={setSubject}
          body={body}
          setBody={setBody}
          firstContact={firstValidContact}
          resume={resume}
          disabled={isSending}
        />
      </div>

      {/* Send Controls & Live Progress Bar */}
      <SendControls
        hasExcel={Boolean(excelFile && validContacts.length > 0)}
        hasResume={Boolean(resume)}
        hasSubject={Boolean(subject.trim())}
        hasBody={Boolean(body.trim())}
        validCount={validContacts.length}
        pendingCount={pendingCount}
        sentCount={sentCount}
        failedCount={failedCount}
        isSending={isSending}
        isStopped={isStopped}
        currentSendingIndex={currentSendingIndex}
        onOpenTestModal={() => setIsTestModalOpen(true)}
        onOpenConfirmModal={() => setIsConfirmModalOpen(true)}
        onStopSending={handleStopSending}
        onResumeSending={handleResumeSending}
        onRetryFailed={handleRetryFailed}
        backendConnected={backendStatus.connected}
        gmailConfigured={backendStatus.configured}
      />

      {/* Real-time Contacts Table */}
      <ContactsTable
        rows={rows}
        currentSendingIndex={currentSendingIndex}
      />

      {/* Modals */}
      <TestMailModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onSendTest={handleSendTestMail}
        firstContact={firstValidContact}
        subject={subject}
        body={body}
        resume={resume}
      />

      <ConfirmSendModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleStartSending}
        pendingCount={pendingCount}
        skippedCount={skippedCount}
        resume={resume}
      />

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Placement Mailer • Built with React, Vite, Node.js &amp; Nodemailer • Respects Gmail rate limits with a 3-second throttle.
        </p>
      </footer>
    </div>
  );
}
