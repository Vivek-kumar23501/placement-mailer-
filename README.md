# 📬 Placement Mailer

A modern, full-stack web application designed for students and job seekers to automate personalized cold email outreach to HRs, recruiters, and hiring managers with attached resume PDFs.

---

## 🌟 Features

- **Excel Sheet Parsing in Browser (`.xlsx`, `.xls`, `.csv`)**:
  - Automatically reads the first sheet and detects `Company | Email | HRName` headers (case-insensitive & trimmed).
  - Defaults missing or empty `HRName` to **"Hiring Manager"**.
  - Automatically flags and skips **invalid email addresses** (`Skipped: invalid email`).
  - Automatically detects and skips **duplicate emails** (`Skipped: duplicate`).
  - Displays a clean preview table with real-time status badges and Excel report export.

- **One-time Resume Upload**:
  - PDF documents only (strictly validated).
  - Maximum file size: **5 MB**.
  - Uploaded once to the backend and automatically attached to every outgoing personalized email.

- **Dynamic Template Editor**:
  - Starts completely empty (no hardcoded prefill) so you write or paste your own message.
  - Interactive placeholder insertion for `{{company}}` and `{{hr}}`.
  - Live side-by-side preview with real data from row 1 of your sheet.

- **Safety & Rate Limiting Controls**:
  - **Readiness Checklist**: Sending buttons remain disabled until all 4 criteria are fulfilled (Excel parsed, Resume attached, Subject non-empty, Body non-empty).
  - **Send Test Mail**: Send a single test email with resume attached to your own personal email address before sending to recruiters.
  - **Confirmation Dialog**: Shows exact email count, excluded skipped count, and estimated time before sending.
  - **3-Second Throttle**: Automatically waits 3 seconds between emails to respect Gmail SMTP rate limits and avoid spam flags.
  - **Instant Stop & Resume**: Stop button immediately halts the sending loop.
  - **Retry Failed Rows**: Retry only the rows that experienced network or SMTP errors without re-sending to already delivered contacts.

---

## 📂 Project Structure

```text
placement-mailer/
├── backend/
│   ├── uploads/               # Uploaded resume directory (ignored by git)
│   │   └── .gitkeep
│   ├── .env.example           # Template for Gmail credentials & port
│   ├── .gitignore             # Ignores .env and uploads/
│   ├── package.json           # Backend dependencies (express, nodemailer, multer, cors, dotenv)
│   └── server.js              # Express API server with /api/resume & /api/send-one
├── frontend/
│   ├── public/
│   │   ├── sample_placement_contacts.xlsx   # Sample contacts workbook
│   │   └── sample_resume.pdf                # Sample resume PDF
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx                   # App bar with live backend & Gmail status
│   │   │   ├── ExcelUploader.jsx            # Drag-and-drop Excel parser
│   │   │   ├── ResumeUploader.jsx           # PDF uploader with 5MB limit
│   │   │   ├── TemplateEditor.jsx           # Subject & body editor with placeholders & live preview
│   │   │   ├── SendControls.jsx             # Readiness checklist, test mail, stop & retry
│   │   │   ├── ContactsTable.jsx            # Live status table with search & Excel export
│   │   │   ├── TestMailModal.jsx            # Test email prompt & dispatch
│   │   │   └── ConfirmSendModal.jsx         # Pre-flight confirmation dialog
│   │   ├── utils/
│   │   │   ├── excelParser.js               # SheetJS browser parser & sample generator
│   │   │   └── templateHelper.js            # Placeholder replace & regex validator
│   │   ├── App.jsx                          # Main controller and 3s sending loop
│   │   ├── index.css                        # Modern responsive design system
│   │   └── main.jsx                         # React 18 DOM root
│   ├── index.html                           # HTML template with Google Fonts
│   ├── package.json                         # Frontend dependencies (react, vite, xlsx, lucide-react)
│   ├── vite.config.js                       # Vite config with /api reverse proxy to port 5000
│   └── .gitignore                           # Ignores node_modules and dist/
├── sample_placement_contacts.xlsx           # Sample Excel file for instant testing
├── sample_resume.pdf                        # Sample resume PDF for instant testing
├── .gitignore                               # Root gitignore
├── package.json                             # Root workspace scripts
└── README.md                                # Setup & usage documentation
```

---

## 🚀 Step-by-Step Run Instructions

### Prerequisites
- **Node.js** (v18.x or newer, e.g. v20 or v22)
- **A Gmail Account** with **2-Step Verification enabled**

---

### Step 1: Set Up Gmail App Password

> [!IMPORTANT]
> **Do NOT use your normal Gmail account password.** Google requires a 16-character **App Password** for third-party SMTP access.

1. Go to your [Google Account](https://myaccount.google.com/).
2. In the left navigation, select **Security**.
3. Under **"How you sign in to Google"**, ensure **2-Step Verification** is turned **ON**.
4. Search for **"App passwords"** in the top search bar (or go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
5. Enter an app name, for example: `Placement Mailer`.
6. Click **Create**.
7. Google will display a **16-character password** (e.g. `abcd efgh ijkl mnop`).
8. Copy this 16-character code.

---

### Step 2: Configure the Backend Environment

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*

3. Open `.env` in any text editor and fill in your details:
   ```env
   # Your Gmail address used to send emails
   GMAIL_USER=your_email@gmail.com

   # 16-character Google App Password (spaces will be automatically removed)
   GMAIL_APP_PASSWORD=abcd efgh ijkl mnop

   # Your full name as shown in the "From:" header
   SENDER_NAME=Alex Smith

   # Server port
   PORT=5000
   ```
4. Save the file.

---

### Step 3: Install Dependencies

From the project root:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 4: Start the Application

You will run the backend and frontend in two separate terminal windows:

#### Terminal 1 — Start Backend Server:
```bash
cd backend
npm start
```
*The backend will run on `http://localhost:5000`.*

#### Terminal 2 — Start Frontend Application:
```bash
cd frontend
npm run dev
```
*The Vite development server will open on `http://localhost:5173`.*

Open your browser to: **[http://localhost:5173](http://localhost:5173)**.

---

## 📋 How to Use the App

1. **Upload Excel**:
   - Drag and drop your `.xlsx`, `.xls`, or `.csv` file into the upload box.
   - Alternatively, click **"Sample Excel"** at the top right of Card 1 to download our template with sample companies and edge cases (empty HR name, invalid email, duplicate email).
2. **Attach Resume**:
   - Drag and drop your resume PDF (maximum 5 MB).
   - *(A sample PDF `sample_resume.pdf` is also included in the repository).*
3. **Write Your Template**:
   - Enter your email Subject (e.g., `Application for Software Engineer - {{company}}`).
   - Enter your email Body (e.g., `Dear {{hr}},\n\nI am reaching out to explore open roles at {{company}}...`).
   - Click the `{{company}}` or `{{hr}}` chips to insert variables anywhere in your text.
   - Review the **Live Email Preview** below the editor.
4. **Send Test Mail**:
   - Click **"Send Test Mail"**, enter your own personal email address, and verify that the email arrives formatted correctly with your resume attached.
5. **Send to All HRs**:
   - Click **"Send to all HRs"**.
   - Review the confirmation popup (total recipients, skipped recipients, estimated time).
   - Click **"Yes, Start Sending"**.
   - Watch real-time row-by-row updates in the table with the 3-second delay between emails.
   - Use the **"Stop"** button anytime to pause, or **"Retry Failed"** if any row encounters an error.

---

## ⚠️ Important Note on Gmail Limits & Deliverability

> [!WARNING]
> Personal free Gmail accounts have an official sending limit of **500 emails per 24 hours** (or **2,000 emails per day** for Google Workspace accounts).
>
> However, for cold outreach and placement emails, **NEVER send hundreds of emails rapidly**:
> - **Recommended Daily Volume**: Keep your outreach to **100 – 150 emails per day maximum**.
> - **Spam Filter Protection**: The 3-second throttle built into this app prevents rapid SMTP burst flags.
> - **Email Deliverability**: Avoid spam trigger keywords in your subject, write honest and personalized copy, and do not send unsolicited high-frequency follow-ups.
