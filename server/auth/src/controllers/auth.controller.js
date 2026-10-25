import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { pool } from "../db/index.js";

const scrypt = promisify(scryptCallback);
const tokenLifetimeSeconds = 60 * 60;

const createUser = async (req, res, message) => {
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
      message,
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

const register = (req, res) =>
  createUser(req, res, "User created successfully");

const addUser = (req, res) => createUser(req, res, "User added successfully");

const login = async (req, res) => {
  const { email, password } = req.body ?? {};
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

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
    password.length === 0 ||
    password.length > 128
  ) {
    return res.status(400).json({
      success: false,
      message: "Password is required and must be 128 characters or fewer",
    });
  }

  const [users] = await pool.execute(
    "SELECT id, name, email, passwordHash, createdAt FROM users WHERE email = ? LIMIT 1",
    [normalizedEmail],
  );
  const user = users[0];
  const [scheme, salt, storedHash] = (user?.passwordHash ?? "").split("$");
  const validHash =
    scheme === "scrypt" &&
    /^[a-f0-9]{32}$/i.test(salt) &&
    /^[a-f0-9]{128}$/i.test(storedHash);
  const hash = await scrypt(password, validHash ? salt : "0".repeat(32), 64);
  const matches =
    validHash &&
    timingSafeEqual(hash, Buffer.from(storedHash, "hex"));

  if (!user || !matches) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("AUTH_JWT_SECRET must be configured with at least 32 bytes");
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    sub: String(user.id),
    email: user.email,
    name: user.name,
    iss: "help-dask-auth",
    iat: issuedAt,
    exp: issuedAt + tokenLifetimeSeconds,
  });
  const unsignedToken = `${header}.${payload}`;
  const signature = createHmac("sha256", secret)
    .update(unsignedToken)
    .digest("base64url");

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token: `${unsignedToken}.${signature}`,
      tokenType: "Bearer",
      expiresIn: tokenLifetimeSeconds,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    },
  });
};

const authenticate = async (req, res, next) => {
  const authorization = req.headers.authorization;
  const [scheme, token, extra] =
    typeof authorization === "string" ? authorization.split(" ") : [];

  if (scheme !== "Bearer" || !token || extra) {
    return res.status(401).json({
      success: false,
      message: "A valid bearer token is required",
    });
  }

  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("AUTH_JWT_SECRET must be configured with at least 32 bytes");
  }

  const [headerSegment, payloadSegment, signatureSegment, extraSegment] =
    token.split(".");

  if (
    !headerSegment ||
    !payloadSegment ||
    !signatureSegment ||
    extraSegment ||
    !/^[A-Za-z0-9_-]+$/.test(headerSegment) ||
    !/^[A-Za-z0-9_-]+$/.test(payloadSegment) ||
    !/^[A-Za-z0-9_-]+$/.test(signatureSegment)
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  let header;
  let payload;
  try {
    header = JSON.parse(Buffer.from(headerSegment, "base64url").toString());
    payload = JSON.parse(Buffer.from(payloadSegment, "base64url").toString());
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  const unsignedToken = `${headerSegment}.${payloadSegment}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(unsignedToken)
    .digest();
  const suppliedSignature = Buffer.from(signatureSegment, "base64url");
  const validToken =
    header?.alg === "HS256" &&
    header?.typ === "JWT" &&
    payload?.iss === "help-dask-auth" &&
    typeof payload?.sub === "string" &&
    /^[1-9]\d*$/.test(payload.sub) &&
    Number.isSafeInteger(Number(payload.sub)) &&
    Number.isInteger(payload?.exp) &&
    payload.exp > Math.floor(Date.now() / 1000) &&
    suppliedSignature.length === expectedSignature.length &&
    timingSafeEqual(expectedSignature, suppliedSignature);

  if (!validToken) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  const [users] = await pool.execute(
    "SELECT id, name, email, createdAt FROM users WHERE id = ? LIMIT 1",
    [Number(payload.sub)],
  );
  const user = users[0];

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  req.authenticatedUser = user;
  return next();
};

const getMe = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Profile retrieved successfully",
    data: req.authenticatedUser,
  });
};

const getAllUsers = async (req, res) => {
  const [users] = await pool.execute(
    "SELECT id, name, email, createdAt FROM users ORDER BY id",
  );

  return res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data: users,
  });
};

const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful. Remove the bearer token from the client.",
  });
};

export { addUser, authenticate, getAllUsers, getMe, login, logout, register };
