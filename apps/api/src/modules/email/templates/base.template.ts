export function renderBaseEmailTemplate({
  previewText,
  heading,
  bodyContent,
  footerNote,
}: {
  previewText?: string;
  heading: string;
  bodyContent: string;
  footerNote?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>${heading}</title>
  ${previewText ? `<div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ''}
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #020617;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f8fafc;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #020617;
      padding: 40px 16px;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 32px 32px 24px 32px;
      border-bottom: 1px solid #1e293b;
      text-align: left;
    }
    .brand-logo {
      display: inline-block;
      width: 40px;
      height: 40px;
      background-color: #10b981;
      border-radius: 10px;
      text-align: center;
      line-height: 40px;
      font-size: 20px;
      font-weight: 900;
      color: #020617;
    }
    .brand-name {
      display: inline-block;
      vertical-align: top;
      margin-left: 12px;
      margin-top: 6px;
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px;
      font-size: 15px;
      line-height: 24px;
      color: #cbd5e1;
    }
    .heading {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 16px;
      letter-spacing: -0.3px;
    }
    .code-box {
      background-color: #020617;
      border: 1px solid #059669;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }
    .code-digit {
      font-family: 'Courier New', Courier, monospace;
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #10b981;
    }
    .btn {
      display: inline-block;
      background-color: #10b981;
      color: #020617 !important;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 28px;
      border-radius: 10px;
      text-decoration: none;
      text-align: center;
      margin: 20px 0;
    }
    .footer {
      padding: 24px 32px 32px 32px;
      border-top: 1px solid #1e293b;
      font-size: 12px;
      color: #64748b;
      line-height: 18px;
      text-align: center;
    }
    .footer a {
      color: #10b981;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand-logo">N</div>
        <div class="brand-name">Netify</div>
      </div>
      <div class="content">
        <h1 class="heading">${heading}</h1>
        ${bodyContent}
      </div>
      <div class="footer">
        ${footerNote ? `<p style="margin-bottom: 8px;">${footerNote}</p>` : ''}
        <p>&copy; 2026 Netify Inc. AI Collections & Business Memory for African SMEs.</p>
        <p>If you have any questions, reply to this email or visit <a href="https://netify.africa">netify.africa</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
