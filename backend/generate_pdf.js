const fs = require('fs');
const path = require('path');

const minimalPdf = `%PDF-1.4
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj
2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 612 792]
  /Contents 4 0 R
  /Resources <<
    /Font <<
      /F1 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica-Bold
      >>
      /F2 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica
      >>
    >>
  >>
>>
endobj
4 0 obj
<<
  /Length 210
>>
stream
BT
/F1 24 Tf
50 720 Td
(CANDIDATE RESUME) Tj
/F2 12 Tf
0 -36 Td
(Software Engineer / Technical Specialist) Tj
0 -24 Td
(Sample resume for testing Placement Mailer application.) Tj
0 -20 Td
(Education: Bachelor of Technology in Computer Science) Tj
0 -20 Td
(Skills: JavaScript, React, Node.js, Express, Python, SQL) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000325 00000 n 
trailer
<<
  /Size 5
  /Root 1 0 R
>>
startxref
586
%%EOF`;

const rootPdf = path.resolve(__dirname, '..', 'sample_resume.pdf');
fs.writeFileSync(rootPdf, minimalPdf);

const publicDir = path.resolve(__dirname, '..', 'frontend', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'sample_resume.pdf'), minimalPdf);

console.log('Sample PDF created at:', rootPdf);
