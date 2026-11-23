const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Resume info disk pe save hoti hai, taaki server restart ke baad bhi yaad rahe
const metaPath = path.join(uploadsDir, 'resume.json');
let activeResume = null;
try {
  const saved = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  if (saved && fs.existsSync(saved.path)) activeResume = saved;
} catch {}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    cb(null, `resume_${Date.now()}${ext}`);
  },
});

// Sirf PDF allowed
const fileFilter = (req, file, cb) => {
  const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
  const isPdfMime = file.mimetype === 'application/pdf';
  if (isPdfExt || isPdfMime) cb(null, true);
  else cb(new Error('Only PDF files (.pdf) are allowed'), false);
};

// 5 MB limit
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

// Resume ka public info (path bahar nahi jata)
const resumeInfo = () =>
  activeResume
    ? {
        filename: activeResume.originalName,
        size: activeResume.size,
        uploadedAt: activeResume.uploadedAt,
      }
    : null;

const resumeExists = () => Boolean(activeResume && fs.existsSync(activeResume.path));

// ---------- ROUTES ----------

// Status check
app.get('/api/status', (req, res) => {
  const hasUser = Boolean(process.env.GMAIL_USER && process.env.GMAIL_USER.trim());
  const hasPass = Boolean(process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_APP_PASSWORD.trim());

  res.json({
    ok: true,
    configured: hasUser && hasPass,
    gmailUser: hasUser ? process.env.GMAIL_USER.trim() : null,
    senderName: process.env.SENDER_NAME ? process.env.SENDER_NAME.trim() : null,
    hasResume: resumeExists(),
    resume: resumeExists() ? resumeInfo() : null,
  });
});

// Current resume info
app.get('/api/resume', (req, res) => {
  res.json({ ok: true, resume: resumeExists() ? resumeInfo() : null });
});

// Upload resume
app.post('/api/resume', (req, res) => {
  upload.single('resume')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ ok: false, error: 'File size exceeds 5 MB limit.' });
      }
      return res.status(400).json({ ok: false, error: `Multer upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No resume file uploaded.' });
    }

    // Purana resume file delete karo
    if (activeResume && activeResume.path && activeResume.path !== req.file.path) {
      try {
        if (fs.existsSync(activeResume.path)) fs.unlinkSync(activeResume.path);
      } catch (cleanupErr) {
        console.warn('Failed to clean up old resume:', cleanupErr.message);
      }
    }

    activeResume = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
    };

    // Disk pe save (restart ke baad bhi yaad rahe)
    try {
      fs.writeFileSync(metaPath, JSON.stringify(activeResume));
    } catch (e) {
      console.warn('Could not save resume meta:', e.message);
    }

    console.log(`[Resume Uploaded] ${activeResume.originalName} (${(activeResume.size / 1024).toFixed(1)} KB)`);

    return res.json({
      ok: true,
      message: 'Resume uploaded successfully.',
      filename: activeResume.originalName,
      size: activeResume.size,
      uploadedAt: activeResume.uploadedAt,
    });
  });
});

// Delete resume
app.delete('/api/resume', (req, res) => {
  if (activeResume && activeResume.path) {
    try {
      if (fs.existsSync(activeResume.path)) fs.unlinkSync(activeResume.path);
    } catch (e) {
      console.warn('Error deleting resume:', e.message);
    }
  }
  activeResume = null;
  try { fs.unlinkSync(metaPath); } catch {}
  return res.json({ ok: true, message: 'Resume cleared.' });
});

// Ek email bhejo
app.post('/api/send-one', async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !isValidEmail(to)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid or missing recipient email address: "${to || ''}"`,
      });
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ ok: false, error: 'Email subject cannot be empty.' });
    }

    if (!body || typeof body !== 'string' || !body.trim()) {
      return res.status(400).json({ ok: false, error: 'Email body cannot be empty.' });
    }

    if (!resumeExists()) {
      return res.status(400).json({
        ok: false,
        error: 'Resume PDF is missing or not yet uploaded. Please upload your resume first.',
      });
    }

    const gmailUser = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : '';
    // App password me spaces ho to hata do
    const gmailPass = process.env.GMAIL_APP_PASSWORD
      ? process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '').trim()
      : '';

    if (!gmailUser || !gmailPass) {
      return res.status(500).json({
        ok: false,
        error: 'Gmail credentials not configured in backend .env file. Please define GMAIL_USER and GMAIL_APP_PASSWORD.',
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });

    const senderName = process.env.SENDER_NAME ? process.env.SENDER_NAME.trim() : '';
    const fromAddress = senderName ? `"${senderName}" <${gmailUser}>` : gmailUser;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: to.trim(),
      subject: subject.trim(),
      text: body.trim(),
      attachments: [
        {
          filename: activeResume.originalName,
          path: activeResume.path,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`[Email Sent] To: ${to.trim()} | Subject: "${subject.trim()}" | ID: ${info.messageId}`);

    return res.json({ ok: true, messageId: info.messageId, recipient: to.trim() });
  } catch (error) {
    console.error(`[Email Error] Failed sending to ${req.body?.to}:`, error.message);

    let errorMessage = error.message;
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      errorMessage =
        'Gmail authentication failed. Please check GMAIL_USER and ensure GMAIL_APP_PASSWORD is a valid 16-character Google App Password (not your normal Gmail account password).';
    } else if (error.code === 'EENVELOPE') {
      errorMessage = `Invalid recipient address: ${req.body?.to}`;
    }

    return res.status(500).json({ ok: false, error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log('===============================================');
  console.log(` Placement Mailer Backend running on port ${PORT}`);
  console.log(` API Endpoint: http://localhost:${PORT}/api/`);
  console.log(` Status Check: http://localhost:${PORT}/api/status`);
  console.log(` Resume loaded: ${resumeExists() ? activeResume.originalName : 'none'}`);
  console.log('===============================================');
});