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
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--<![endif]-->
  <title>${heading}</title>
  ${
    previewText
      ? `
  <!-- Preview Text Spacing Hack for Inboxes -->
  <div style="display:none;font-size:1px;color:#001D31;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
    ${previewText}
    &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
  </div>`
      : ''
  }
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #001220;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #F8FAFC;
      -webkit-font-smoothing: antialiased;
    }
    .btn {
      display: inline-block;
      background-color: #00A581;
      color: #FFFFFF !important;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      text-align: center;
      transition: background-color 0.15s ease;
    }
    .code-box {
      background-color: #002B49;
      border: 1.5px solid #00A581;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .code-digit {
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #00A581;
    }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0 !important; border: none !important; }
      .header { padding: 24px 20px 20px 20px !important; }
      .content { padding: 24px 20px !important; }
      .footer { padding: 20px 20px 28px 20px !important; }
      .code-digit { font-size: 30px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #001220;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #001220;">
    <tr>
      <td align="center" style="padding: 40px 12px;">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="560">
        <tr>
        <td align="center" valign="top" width="560">
        <![endif]-->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 560px; background-color: #001D31; border: 1px solid #0B3C5D; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);">
          <!-- Header -->
          <tr>
            <td class="header" style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #0B3C5D; background-color: #00192B;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 36px; height: 36px; background-color: #00A581; border-radius: 8px; text-align: center; vertical-align: middle; color: #FFFFFF; font-size: 18px; font-weight: 900; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                          N
                        </td>
                        <td style="padding-left: 12px; font-size: 19px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                          Netify
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="font-size: 11px; font-weight: 700; color: #00A581; background-color: rgba(0, 165, 129, 0.15); border: 1px solid rgba(0, 165, 129, 0.4); padding: 3px 9px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
                      AI Collections
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content" style="padding: 32px; font-size: 15px; line-height: 24px; color: #CBD5E1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <h1 style="font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0; letter-spacing: -0.3px;">
                ${heading}
              </h1>
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer" style="padding: 24px 32px 32px 32px; border-top: 1px solid #0B3C5D; background-color: #00192B; font-size: 12px; color: #64748B; line-height: 18px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
              ${footerNote ? `<p style="margin: 0 0 8px 0; color: #94A3B8; font-size: 12px;">${footerNote}</p>` : ''}
              <p style="margin: 0 0 6px 0; color: #64748B;">
                &copy; 2026 Netify Inc. AI Collections & Business Memory for African SMEs.
              </p>
              <p style="margin: 0; color: #475569;">
                Need assistance? Reply directly to this email or visit <a href="https://app.netify.africa" style="color: #00A581; text-decoration: none; font-weight: 600;">app.netify.africa</a>.
              </p>
            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
