import * as XLSX from 'xlsx';
import { isValidEmail } from './templateHelper';

/**
 * Parses an Excel (.xlsx, .xls) or CSV file in the browser.
 * Matches columns case-insensitively: Company | Email | HRName
 * HRName is optional, defaults to "Hiring Manager" if blank.
 * Automatically flags invalid emails and duplicates as "Skipped".
 *
 * @param {File} file - Excel or CSV File object from input
 * @returns {Promise<{ rows: Array, stats: Object, error: string|null }>}
 */
export async function parseExcelFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          return resolve({
            rows: [],
            stats: null,
            error: 'The uploaded file does not contain any sheets.',
          });
        }

        // Always read the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse as array of rows
        const rawRows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false,
        });

        if (!rawRows || rawRows.length === 0) {
          return resolve({
            rows: [],
            stats: null,
            error: 'The sheet appears to be empty.',
          });
        }

        // Extract header row
        const headerRow = rawRows[0];
        if (!Array.isArray(headerRow) || headerRow.length === 0) {
          return resolve({
            rows: [],
            stats: null,
            error: 'Could not find header row in sheet.',
          });
        }

        // Identify column indices case-insensitively and trimmed
        let companyIndex = -1;
        let emailIndex = -1;
        let hrNameIndex = -1;

        headerRow.forEach((colName, idx) => {
          if (typeof colName !== 'string' && typeof colName !== 'number') return;
          const cleanCol = String(colName).trim().toLowerCase();

          // Match Company column
          if (
            companyIndex === -1 &&
            (cleanCol === 'company' ||
              cleanCol === 'company name' ||
              cleanCol === 'companyname' ||
              cleanCol === 'organization' ||
              cleanCol === 'firm' ||
              cleanCol.includes('company'))
          ) {
            companyIndex = idx;
          }

          // Match Email column
          if (
            emailIndex === -1 &&
            (cleanCol === 'email' ||
              cleanCol === 'email address' ||
              cleanCol === 'emailaddress' ||
              cleanCol === 'hr email' ||
              cleanCol === 'hremail' ||
              cleanCol.includes('email'))
          ) {
            emailIndex = idx;
          }

          // Match HRName column
          if (
            hrNameIndex === -1 &&
            (cleanCol === 'hrname' ||
              cleanCol === 'hr name' ||
              cleanCol === 'hr' ||
              cleanCol === 'recruiter' ||
              cleanCol === 'recruiter name' ||
              cleanCol === 'contact person' ||
              cleanCol === 'contact name' ||
              cleanCol === 'hiring manager' ||
              cleanCol === 'name')
          ) {
            hrNameIndex = idx;
          }
        });

        // Company and Email are mandatory columns
        if (companyIndex === -1 && emailIndex === -1) {
          return resolve({
            rows: [],
            stats: null,
            error:
              'Could not find "Company" and "Email" columns in the header row. Expected headers: Company | Email | HRName',
          });
        }

        if (companyIndex === -1) {
          return resolve({
            rows: [],
            stats: null,
            error:
              'Missing "Company" column in header row. Please make sure the first row contains: Company | Email | HRName',
          });
        }

        if (emailIndex === -1) {
          return resolve({
            rows: [],
            stats: null,
            error:
              'Missing "Email" column in header row. Please make sure the first row contains: Company | Email | HRName',
          });
        }

        // Process data rows
        const seenEmails = new Set();
        const rows = [];
        let validPendingCount = 0;
        let invalidEmailCount = 0;
        let duplicateCount = 0;

        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || !Array.isArray(row)) continue;

          // Check if row is completely blank
          const isBlank = row.every((cell) => cell === '' || cell === null || cell === undefined);
          if (isBlank) continue;

          const rawCompany = row[companyIndex] !== undefined ? String(row[companyIndex]).trim() : '';
          const rawEmail = row[emailIndex] !== undefined ? String(row[emailIndex]).trim() : '';
          let rawHRName =
            hrNameIndex !== -1 && row[hrNameIndex] !== undefined
              ? String(row[hrNameIndex]).trim()
              : '';

          // HRName is optional. If empty, use "Hiring Manager"
          const hrName = rawHRName || 'Hiring Manager';
          const company = rawCompany || 'Company';

          // Email validation & status
          let status = 'Pending';
          let errorMessage = '';

          if (!rawEmail || !isValidEmail(rawEmail)) {
            status = 'Skipped: invalid email';
            invalidEmailCount++;
            errorMessage = rawEmail ? 'Invalid email format' : 'Email missing';
          } else {
            const normalizedEmail = rawEmail.toLowerCase();
            if (seenEmails.has(normalizedEmail)) {
              status = 'Skipped: duplicate';
              duplicateCount++;
              errorMessage = 'Duplicate email in sheet';
            } else {
              seenEmails.add(normalizedEmail);
              status = 'Pending';
              validPendingCount++;
            }
          }

          rows.push({
            id: rows.length + 1,
            originalIndex: i + 1,
            company,
            email: rawEmail,
            hrName,
            status,
            errorMessage,
          });
        }

        if (rows.length === 0) {
          return resolve({
            rows: [],
            stats: null,
            error: 'No contact rows found below the header row.',
          });
        }

        resolve({
          rows,
          stats: {
            totalRows: rows.length,
            validPendingCount,
            invalidEmailCount,
            duplicateCount,
          },
          error: null,
        });
      } catch (err) {
        resolve({
          rows: [],
          stats: null,
          error: `Failed to parse Excel file: ${err.message}`,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        rows: [],
        stats: null,
        error: 'Error reading file from disk.',
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Creates and downloads a sample Excel template with realistic dummy data.
 */
export function downloadSampleExcel() {
  const sampleData = [
    ['Company', 'Email', 'HRName'],
    ['Google', 'careers@google.com', 'Sundar Pichai'],
    ['Microsoft', 'recruiting@microsoft.com', 'Satya Nadella'],
    ['Amazon', 'talent-acq@amazon.com', ''], // Empty HRName to demonstrate "Hiring Manager" default
    ['Meta', 'hr-team@meta.com', 'Mark Zuckerberg'],
    ['Apple', 'invalid-email-example', 'Tim Cook'], // Invalid email to demonstrate skipping
    ['Google', 'careers@google.com', 'Duplicate HR'], // Duplicate email to demonstrate skipping
    ['Netflix', 'jobs@netflix.com', 'Reed Hastings'],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sampleData);

  // Set column widths
  worksheet['!cols'] = [{ wch: 18 }, { wch: 28 }, { wch: 20 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Placement Contacts');

  XLSX.writeFile(workbook, 'sample_placement_contacts.xlsx');
}
