import { createHash, randomBytes } from "node:crypto";
import { pool } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { hashPassword } from "../utils/password.js";
import { sendEmail } from "../utils/nodemailer.js";
import {
  passwordResetTemplate,
  passwordChangedTemplate,
} from "../../templates/passwordResetEmail.js";

const RESET_TOKEN_MINUTES = 15;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_REGEX = /^[a-f0-9]{64}$/i;

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const isValidEmail = (email) => email.length <= 191 && EMAIL_REGEX.test(email);

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

const sendResetEmail = async (user, token) => {
  try {
    const baseUrl = (
      process.env.APP_URL
    ).replace(/\/$/, "");
    const mail = passwordResetTemplate({
      name: user.name,
      resetUrl: `${baseUrl}/reset-password?token=${token}`,
      expiresInMinutes: RESET_TOKEN_MINUTES,
    });

    await sendEmail({
      email: user.email,
      subject: mail.subject,
      message: mail.html,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error.message);
  }
};

const sendPasswordChangedEmail = async (user) => {
  try {
    const mail = passwordChangedTemplate({ name: user.name });
    await sendEmail({
      email: user.email,
      subject: mail.subject,
      message: mail.html,
    });
  } catch (error) {
    console.error("Failed to send password changed email:", error.message);
  }
};

const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);

  if (!isValidEmail(email)) {
    throw new ApiError(400, "A valid email address is required");
  }

  const [users] = await pool.execute(
    "SELECT id, name, email, passwordHash FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  const user = users[0];

  // Google-only account: no password to reset
  if (user && !user.passwordHash) {
    throw new ApiError(
      400,
      "You registered with Google. Please log in with Google instead.",
    );
  }

  if (user) {
    const token = randomBytes(32).toString("hex");

    await pool.execute(
      `UPDATE users
       SET resetPasswordTokenHash = ?,
           resetPasswordExpires = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL ${RESET_TOKEN_MINUTES} MINUTE),
           updatedAt = CURRENT_TIMESTAMP(3)
       WHERE id = ?`,
      [hashToken(token), user.id],
    );

    // fire-and-forget so response time doesn't reveal whether the email exists
    void sendResetEmail(user, token);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "If an account exists for this email, a password reset link has been sent.",
      ),
    );
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body ?? {};

  if (typeof token !== "string" || !TOKEN_REGEX.test(token)) {
    throw new ApiError(400, "Invalid or expired reset link");
  }

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  ) {
    throw new ApiError(400, "Password must be between 8 and 128 characters");
  }

  const tokenHash = hashToken(token);

  const [rows] = await pool.execute(
    `SELECT id, name, email FROM users
     WHERE resetPasswordTokenHash = ? AND resetPasswordExpires > CURRENT_TIMESTAMP(3)
     LIMIT 1`,
    [tokenHash],
  );
  const user = rows[0];

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset link");
  }

  const passwordHash = await hashPassword(password);

  // Atomic: if two requests race with the same token, only one wins
  const [result] = await pool.execute(
    `UPDATE users
     SET passwordHash = ?,
         resetPasswordTokenHash = NULL,
         resetPasswordExpires = NULL,
         updatedAt = CURRENT_TIMESTAMP(3)
     WHERE id = ?
       AND resetPasswordTokenHash = ?
       AND resetPasswordExpires > CURRENT_TIMESTAMP(3)`,
    [passwordHash, user.id, tokenHash],
  );

  if (result.affectedRows === 0) {
    throw new ApiError(400, "Invalid or expired reset link");
  }

  void sendPasswordChangedEmail(user);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Password reset successful. You can now log in.",
      ),
    );
});

export { forgotPassword, resetPassword };