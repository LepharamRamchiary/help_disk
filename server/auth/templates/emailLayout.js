export const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const appName = () => process.env.APP_NAME || "Our Platform";
export const appUrl = () => process.env.APP_URL || "#";

export const button = (href, label) => `
  <p>
    <a href="${escapeHtml(href)}"
       style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">
      ${escapeHtml(label)}
    </a>
  </p>`;

export const layout = (title, body) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#047857;color:#ffffff;padding:24px;font-size:20px;font-weight:bold;">
                ${escapeHtml(title)}
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:#111827;font-size:15px;line-height:1.6;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px;">
                &copy; ${new Date().getFullYear()} ${escapeHtml(appName())}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
