import { escapeHtml, appName, appUrl, button, layout } from "./emailLayout.js";

export const welcomeUserTemplate = ({ name }) => ({
  subject: `Welcome to ${appName()}!`,
  html: layout(
    `Welcome to ${appName()}`,
    `
    <p>Hi ${escapeHtml(name || "there")},</p>
    <p>Your account has been created successfully. We're glad to have you on board.</p>
    ${button(appUrl(), "Go to dashboard")}
    <p style="font-size:13px;color:#64748b;">If you didn't create this account, please contact support.</p>
  `,
  ),
});

export const newUserAdminTemplate = ({ name, email, method }) => ({
  subject: `New user registered: ${name || email}`,
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
});