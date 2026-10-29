import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { pool } from "../db/index.js";
import { issueToken } from "../utils/token.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PLATFORM_ADMIN_ROLE } from "../constants.js";
import { notifyRegistration } from "../utils/notifyRegistration.js";

const scrypt = promisify(scryptCallback);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_REGEX = /^[1-9]\d*$/;

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const isValidEmail = (email) => email.length <= 191 && EMAIL_REGEX.test(email);

const createUser = async (req, res, message, createSession = false) => {
  const { name, email, password } = req.body ?? {};
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedName || normalizedName.length > 100) {
    throw new ApiError(
      400,
      "Name is required and must be 100 characters or fewer",
    );
  }

  if (!isValidEmail(normalizedEmail)) {
    throw new ApiError(400, "A valid email address is required");
  }

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  ) {
    throw new ApiError(400, "Password must be between 8 and 128 characters");
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
      "SELECT id, name, email, role, createdAt FROM users WHERE id = ?",
      [result.insertId],
    );
    const user = users[0];

    void notifyRegistration(user, createSession ? "email" : "added by admin");

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          createSession ? { ...issueToken(user), user } : user,
          message,
        ),
      );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new ApiError(409, "An account with this email already exists");
    }

    throw error;
  }
};

const register = asyncHandler((req, res) =>
  createUser(req, res, "User created successfully", true),
);

const addUser = asyncHandler((req, res) =>
  createUser(req, res, "User added successfully"),
);

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    throw new ApiError(400, "A valid email address is required");
  }

  if (
    typeof password !== "string" ||
    password.length === 0 ||
    password.length > 128
  ) {
    throw new ApiError(
      400,
      "Password is required and must be 128 characters or fewer",
    );
  }

  const [users] = await pool.execute(
    "SELECT id, name, email, role, passwordHash, createdAt FROM users WHERE email = ? LIMIT 1",
    [normalizedEmail],
  );
  const user = users[0];

  if (user && !user.passwordHash) {
    throw new ApiError(
      400,
      "You registered with Google. Please log in with Google instead.",
    );
  }

  const [scheme, salt, storedHash] = (user?.passwordHash ?? "").split("$");
  const validHash =
    scheme === "scrypt" &&
    /^[a-f0-9]{32}$/i.test(salt) &&
    /^[a-f0-9]{128}$/i.test(storedHash);

  // Always run scrypt so response time doesn't reveal whether the email exists
  const hash = await scrypt(password, validHash ? salt : "0".repeat(32), 64);
  const matches =
    validHash && timingSafeEqual(hash, Buffer.from(storedHash, "hex"));

  if (!user || !matches) {
    throw new ApiError(401, "Invalid email or password");
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
      "Login successful",
    ),
  );
});

const authenticate = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  const [scheme, token, extra] =
    typeof authorization === "string" ? authorization.split(" ") : [];

  if (scheme !== "Bearer" || !token || extra) {
    throw new ApiError(401, "A valid bearer token is required");
  }

  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error(
      "AUTH_JWT_SECRET must be configured with at least 32 bytes",
    );
  }

  const [headerSegment, payloadSegment, signatureSegment, extraSegment] =
    token.split(".");

  const base64url = /^[A-Za-z0-9_-]+$/;
  if (
    !headerSegment ||
    !payloadSegment ||
    !signatureSegment ||
    extraSegment ||
    !base64url.test(headerSegment) ||
    !base64url.test(payloadSegment) ||
    !base64url.test(signatureSegment)
  ) {
    throw new ApiError(401, "Invalid or expired token");
  }

  let header;
  let payload;
  try {
    header = JSON.parse(Buffer.from(headerSegment, "base64url").toString());
    payload = JSON.parse(Buffer.from(payloadSegment, "base64url").toString());
  } catch {
    throw new ApiError(401, "Invalid or expired token");
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
    ID_REGEX.test(payload.sub) &&
    Number.isSafeInteger(Number(payload.sub)) &&
    Number.isInteger(payload?.exp) &&
    payload.exp > Math.floor(Date.now() / 1000) &&
    suppliedSignature.length === expectedSignature.length &&
    timingSafeEqual(expectedSignature, suppliedSignature);

  if (!validToken) {
    throw new ApiError(401, "Invalid or expired token");
  }

  const [users] = await pool.execute(
    "SELECT id, name, email, createdAt, role FROM users WHERE id = ? LIMIT 1",
    [Number(payload.sub)],
  );
  const user = users[0];

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  req.authenticatedUser = user;
  return next();
});

const getMe = asyncHandler(async (req, res) => {
  const { id, name, email, role, createdAt } = req.authenticatedUser;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { id, name, email, role, createdAt },
        "Profile retrieved successfully",
      ),
    );
});

const requireAdmin = asyncHandler(async (req, res, next) => {
  if (req.authenticatedUser.role !== PLATFORM_ADMIN_ROLE) {
    throw new ApiError(403, "Administrator access is required");
  }

  return next();
});

const getAllUsers = asyncHandler(async (req, res) => {
  const [users] = await pool.execute(
    "SELECT id, name, email, createdAt FROM users ORDER BY id",
  );

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users retrieved successfully"));
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!ID_REGEX.test(id) || !Number.isSafeInteger(Number(id))) {
    throw new ApiError(400, "A valid user ID is required");
  }

  const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [
    Number(id),
  ]);

  if (result.affectedRows === 0) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { id: Number(id) }, "User deleted successfully"),
    );
});

const logout = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Logout successful. Remove the bearer token from the client.",
      ),
    );
});

export {
  addUser,
  authenticate,
  deleteUser,
  getAllUsers,
  getMe,
  login,
  logout,
  register,
  requireAdmin,
};
