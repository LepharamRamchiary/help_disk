import { OAuth2Client } from "google-auth-library";
import { pool } from "../db/index.js";
import { issueToken } from "../utils/token.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notifyRegistration } from "../utils/notifyRegistration.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const EMAIL_ACCOUNT_MESSAGE =
  "This email is registered with a password. Please log in with your email and password instead.";

const findUser = async (column, value) => {
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, passwordHash, createdAt FROM users WHERE ${column} = ? LIMIT 1`,
    [value],
  );
  return rows[0];
};

const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body ?? {};

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new ApiError(503, "Google sign-in is not configured");
  }

  if (
    typeof credential !== "string" ||
    !credential ||
    credential.length > 4096
  ) {
    throw new ApiError(400, "Google credential is required");
  }

  let profile;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    profile = ticket.getPayload();
  } catch {
    throw new ApiError(401, "Invalid Google token");
  }

  if (!profile?.sub || !profile.email || profile.email_verified !== true) {
    throw new ApiError(401, "Google account email is not verified");
  }

  const googleId = profile.sub;
  const email = profile.email.trim().toLowerCase();
  const name = (profile.name || email.split("@")[0]).slice(0, 100);
  const avatarUrl = profile.picture ? profile.picture.slice(0, 500) : null;

  let user = await findUser("googleId", googleId);
  let isNewUser = false;

  if (!user) {
    const existingUser = await findUser("email", email);

    // Registered with email + password: Google login is not allowed
    if (existingUser) {
      throw new ApiError(409, EMAIL_ACCOUNT_MESSAGE);
    }

    try {
      await pool.execute(
        `INSERT INTO users (name, email, passwordHash, googleId, avatarUrl, emailVerified, createdAt, updatedAt)
         VALUES (?, ?, NULL, ?, ?, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
        [name, email, googleId, avatarUrl],
      );
      // Only set after a successful insert, so a duplicate-entry race
      // never sends a second welcome email
      isNewUser = true;
    } catch (error) {
      if (error.code !== "ER_DUP_ENTRY") throw error;
    }

    user = await findUser("email", email);
  }

  if (!user) {
    throw new ApiError(500, "Could not complete Google sign-in");
  }

  // Covers the duplicate-entry race and accounts linked to Google before this rule
  if (user.passwordHash) {
    throw new ApiError(409, EMAIL_ACCOUNT_MESSAGE);
  }

  // Fire-and-forget: email problems must never break sign-in
  if (isNewUser) {
    void notifyRegistration(user, "google");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...issueToken(user),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      "Google login successful",
    ),
  );
});

export { googleAuth };
