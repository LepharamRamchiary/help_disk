const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const appName = () => process.env.APP_NAME || "Our Platform";
const appUrl = () => process.env.APP_URL || "#";

const layout = (title, body) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#2563eb;color:#ffffff;padding:24px;font-size:20px;font-weight:bold;">
                ${escapeHtml(title)}
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:#333333;font-size:15px;line-height:1.6;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#f9fafb;color:#888888;font-size:12px;">
                &copy; ${new Date().getFullYear()} ${escapeHtml(appName())}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const welcomeUserTemplate = ({ name }) => ({
  subject: `Welcome to ${appName()}!`,
  html: layout(
    `Welcome to ${appName()}`,
    `
    <p>Hi ${escapeHtml(name)},</p>
    <p>Your account has been created successfully. We're glad to have you on board.</p>
    <p>
      <a href="${escapeHtml(appUrl())}"
         style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;">
        Go to dashboard
      </a>
    </p>
    <p>If you didn't create this account, please contact support.</p>
  `,
  ),
  text: `Hi ${name},\n\nYour account on ${appName()} has been created successfully.\n${appUrl()}\n`,
});

export const newUserAdminTemplate = ({ name, email, method }) => ({
  subject: `New user registered: ${name}`,
  html: layout(
    "New user registered",
    `
    <p>A new user just signed up.</p>
    <table cellpadding="6" style="font-size:14px;">
      <tr><td><b>Name</b></td><td>${escapeHtml(name)}</td></tr>
      <tr><td><b>Email</b></td><td>${escapeHtml(email)}</td></tr>
      <tr><td><b>Method</b></td><td>${escapeHtml(method)}</td></tr>
    </table>
  `,
  ),
  text: `New user registered\nName: ${name}\nEmail: ${email}\nMethod: ${method}\n`,
});
