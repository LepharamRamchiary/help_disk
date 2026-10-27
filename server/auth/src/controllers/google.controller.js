import { OAuth2Client } from "google-auth-library";
import { pool } from "../db/index.js";
import { issueToken } from "../utils/token.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const findUser = async (column, value) => {
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, createdAt FROM users WHERE ${column} = ? LIMIT 1`,
    [value],
  );
  return rows[0];
};

const googleAuth = async (req, res) => {
  const { credential } = req.body ?? {};

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({
      success: false,
      message: "Google sign-in is not configured",
    });
  }

  if (
    typeof credential !== "string" ||
    !credential ||
    credential.length > 4096
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Google credential is required" });
  }

  // 1. Verify the token with Google (signature, expiry, audience)
  let profile;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    profile = ticket.getPayload();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid Google token" });
  }

  // 2. Only trust verified Google emails
  if (!profile?.sub || !profile.email || profile.email_verified !== true) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Google account email is not verified",
      });
  }

  const googleId = profile.sub;
  const email = profile.email.trim().toLowerCase();
  const name = (profile.name || email.split("@")[0]).slice(0, 100);
  const avatarUrl = profile.picture ? profile.picture.slice(0, 500) : null;

  // 3. Find by googleId, then by email (account linking), else create
  let user = await findUser("googleId", googleId);

  if (!user) {
    user = await findUser("email", email);

    if (user) {
      // Existing email/password account: link Google to it
      await pool.execute(
        `UPDATE users
         SET googleId = ?, avatarUrl = COALESCE(avatarUrl, ?), emailVerified = 1,
             updatedAt = CURRENT_TIMESTAMP(3)
         WHERE id = ?`,
        [googleId, avatarUrl, user.id],
      );
    } else {
      try {
        await pool.execute(
          `INSERT INTO users (name, email, passwordHash, googleId, avatarUrl, emailVerified, createdAt, updatedAt)
           VALUES (?, ?, NULL, ?, ?, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
          [name, email, googleId, avatarUrl],
        );
      } catch (error) {
        // Two requests at once for the same new user
        if (error.code !== "ER_DUP_ENTRY") throw error;
      }
      user = await findUser("email", email);
    }
  }

  return res.status(200).json({
    success: true,
    message: "Google login successful",
    data: {
      ...issueToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    },
  });
};

export { googleAuth };