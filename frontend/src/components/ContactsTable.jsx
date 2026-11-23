import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  Users,
  Clock,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ContactsTable({ rows, currentSendingIndex }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // all | pending | sent | failed | skipped

  // Count tallies
  const counts = useMemo(() => {
    let pending = 0;
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    rows.forEach((r) => {
      if (r.status === 'Pending' || r.status === 'Sending...') pending++;
      else if (r.status === 'Sent ✅' || r.status.startsWith('Sent')) sent++;
      else if (r.status.startsWith('Failed')) failed++;
      else if (r.status.startsWith('Skipped')) skipped++;
    });

    return { total: rows.length, pending, sent, failed, skipped };
  }, [rows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // Tab filter
      if (filterTab === 'pending' && !(row.status === 'Pending' || row.status === 'Sending...')) {
        return false;
      }
      if (filterTab === 'sent' && !row.status.startsWith('Sent')) {
        return false;
      }
      if (filterTab === 'failed' && !row.status.startsWith('Failed')) {
        return false;
      }
      if (filterTab === 'skipped' && !row.status.startsWith('Skipped')) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchCompany = (row.company || '').toLowerCase().includes(query);
        const matchEmail = (row.email || '').toLowerCase().includes(query);
        const matchHr = (row.hrName || '').toLowerCase().includes(query);
        return matchCompany || matchEmail || matchHr;
      }

      return true;
    });
  }, [rows, filterTab, searchQuery]);

  // Export current table with status to Excel
  const handleExport = () => {
    if (rows.length === 0) return;

    const exportData = rows.map((r, i) => ({
      '#': i + 1,
      Company: r.company,
      Email: r.email,
      HRName: r.hrName,
      Status: r.status,
      Error: r.errorMessage || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Outreach Results');
    XLSX.writeFile(wb, `placement_mailer_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Status badge renderer
  const renderStatusBadge = (row, index) => {
    const isSending = row.status === 'Sending...';

    if (isSending) {
      return (
        <span className="badge badge-info">
          <Loader2 size={12} className="spin" /> Sending...
        </span>
      );
    }

    if (row.status === 'Sent ✅' || row.status.startsWith('Sent')) {
      return (
        <span className="badge badge-success">
          <CheckCircle size={12} /> Sent ✅
        </span>
      );
    }

    if (row.status.startsWith('Failed')) {
      return (
        <span className="badge badge-danger" title={row.errorMessage || row.status}>
          <XCircle size={12} /> Failed ❌ {row.errorMessage ? `(${row.errorMessage})` : ''}
        </span>
      );
    }

    if (row.status === 'Skipped: invalid email') {
      return (
        <span className="badge badge-warning" title="Invalid email syntax">
          <AlertTriangle size={12} /> Skipped: invalid email
        </span>
      );
    }

    if (row.status === 'Skipped: duplicate') {
      return (
        <span className="badge badge-purple" title="Duplicate email in sheet">
          <AlertTriangle size={12} /> Skipped: duplicate
        </span>
      );
    }

    return (
      <span className="badge badge-neutral">
        <Clock size={12} /> Pending
      </span>
    );
  };

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="table-card">
      <div className="table-toolbar">
        {/* Filter tabs */}
        <div className="table-filter-tabs">
          <button
            type="button"
            className={`filter-tab ${filterTab === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            All ({counts.total})
          </button>
          <button
            type="button"
            className={`filter-tab ${filterTab === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterTab('pending')}
          >
            Pending ({counts.pending})
          </button>
          <button
            type="button"
            className={`filter-tab ${filterTab === 'sent' ? 'active' : ''}`}
            onClick={() => setFilterTab('sent')}
          >
            Sent ({counts.sent})
          </button>
          {counts.failed > 0 && (
            <button
              type="button"
              className={`filter-tab ${filterTab === 'failed' ? 'active' : ''}`}
              onClick={() => setFilterTab('failed')}
            >
              Failed ({counts.failed})
            </button>
          )}
          {counts.skipped > 0 && (
            <button
              type="button"
              className={`filter-tab ${filterTab === 'skipped' ? 'active' : ''}`}
              onClick={() => setFilterTab('skipped')}
            >
              Skipped ({counts.skipped})
            </button>
          )}
        </div>

        {/* Search input & Export */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="table-search-input"
              placeholder="Search company, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExport}
            title="Export contact list and outreach statuses to Excel"
          >
            <Download size={13} /> Export Report
          </button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="contacts-table">
          <thead>
            <tr>
              <th style={{ width: '48px', textAlign: 'center' }}>#</th>
              <th>Company</th>
              <th>Email</th>
              <th>HRName</th>
              <th style={{ width: '220px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => {
              const isCurrentSending = row.status === 'Sending...';

              return (
                <tr key={row.id || index} className={isCurrentSending ? 'row-current-sending' : ''}>
                  <td
                    style={{
                      textAlign: 'center',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                    }}
                  >
                    {row.id}
                  </td>
                  <td>
                    <strong>{row.company}</strong>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {row.email || <em style={{ color: 'var(--danger)' }}>(missing)</em>}
                  </td>
                  <td>
                    {row.hrName === 'Hiring Manager' ? (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Hiring Manager (default)
                      </span>
                    ) : (
                      row.hrName
                    )}
                  </td>
                  <td>{renderStatusBadge(row, index)}</td>
                </tr>
              );
            })}

            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No contacts found matching current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
