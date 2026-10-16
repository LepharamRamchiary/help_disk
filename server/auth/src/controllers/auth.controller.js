import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { pool } from "../db/index.js";

const scrypt = promisify(scryptCallback);

const register = async (req, res) => {
  const { name, email, password } = req.body ?? {};
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedName || normalizedName.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Name is required and must be 100 characters or fewer",
    });
  }

  if (
    normalizedEmail.length > 191 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid email address is required",
    });
  }

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  ) {
    return res.status(400).json({
      success: false,
      message: "Password must be between 8 and 128 characters",
    });
  }

  const salt = randomBytes(16).toString("hex");
  const passwordHash = `scrypt$${salt}$${(
    await scrypt(password, salt, 64)
  ).toString("hex")}`;

  try {
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))",
      [normalizedName, normalizedEmail, passwordHash],
    );
    const [users] = await pool.execute(
      "SELECT id, name, email, createdAt FROM users WHERE id = ?",
      [result.insertId],
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: users[0],
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    throw error;
  }
};

export { register };
