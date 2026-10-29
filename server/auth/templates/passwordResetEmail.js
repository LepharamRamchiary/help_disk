import { escapeHtml, appName, button, layout } from "./emailLayout.js";

export const passwordResetTemplate = ({
  name,
  resetUrl,
  expiresInMinutes,
}) => ({
  subject: `Reset your ${appName()} password`,
  html: layout(
    "Reset your password",
    `
    <p>Hi ${escapeHtml(name || "there")},</p>
    <p>We received a request to reset your password. Click the button below to choose a new one.</p>
    ${button(resetUrl, "Reset password")}
    <p>This link expires in ${expiresInMinutes} minutes and can only be used once.</p>
    <p style="font-size:13px;color:#64748b;">
      If the button doesn't work, copy this link into your browser:<br />
      ${escapeHtml(resetUrl)}
    </p>
    <p>If you didn't request this, you can safely ignore this email. Your password won't change.</p>
  `,
  ),
});

export const passwordChangedTemplate = ({ name }) => ({
  subject: `Your ${appName()} password was changed`,
  html: layout(
    "Password changed",
    `
    <p>Hi ${escapeHtml(name || "there")},</p>
    <p>Your password was just changed successfully.</p>
    <p>If this wasn't you, please reset your password again immediately and contact support.</p>
  `,
  ),
});
