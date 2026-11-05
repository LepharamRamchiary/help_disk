import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "../utils/ApiError.js";

const ID_REGEX = /^[1-9]\d*$/;
const BASE64URL_REGEX = /^[A-Za-z0-9_-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const authenticate = (req, res, next) => {
  const authorization = req.headers.authorization;
  const [scheme, token, extra] =
    typeof authorization === "string" ? authorization.split(" ") : [];

  if (scheme !== "Bearer" || !token || extra) {
    return next(new ApiError(401, "A valid bearer token is required"));
  }

  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    return next(
      new Error("AUTH_JWT_SECRET must be configured with at least 32 bytes"),
    );
  }

  const [headerSegment, payloadSegment, signatureSegment, extraSegment] =
    token.split(".");
  if (
    !headerSegment ||
    !payloadSegment ||
    !signatureSegment ||
    extraSegment ||
    !BASE64URL_REGEX.test(headerSegment) ||
    !BASE64URL_REGEX.test(payloadSegment) ||
    !BASE64URL_REGEX.test(signatureSegment)
  ) {
    return next(new ApiError(401, "Invalid or expired token"));
  }

  let header;
  let payload;
  try {
    header = JSON.parse(Buffer.from(headerSegment, "base64url").toString());
    payload = JSON.parse(Buffer.from(payloadSegment, "base64url").toString());
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${headerSegment}.${payloadSegment}`)
    .digest();
  const suppliedSignature = Buffer.from(signatureSegment, "base64url");
  const validToken =
    header?.alg === "HS256" &&
    header?.typ === "JWT" &&
    payload?.iss === "help-dask-auth" &&
    typeof payload?.sub === "string" &&
    ID_REGEX.test(payload.sub) &&
    Number.isSafeInteger(Number(payload.sub)) &&
    typeof payload?.email === "string" &&
    EMAIL_REGEX.test(payload.email) &&
    typeof payload?.name === "string" &&
    Number.isInteger(payload?.exp) &&
    payload.exp > Math.floor(Date.now() / 1000) &&
    suppliedSignature.length === expectedSignature.length &&
    timingSafeEqual(expectedSignature, suppliedSignature);

  if (!validToken) {
    return next(new ApiError(401, "Invalid or expired token"));
  }

  req.authenticatedUser = {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
  };
  return next();
};

const requirePlatformAdmin = (req, res, next) => {
  if (req.authenticatedUser?.role !== "PLATFORM_ADMIN") {
    return next(new ApiError(403, "Administrator access is required"));
  }
  return next();
};

export { authenticate, requirePlatformAdmin };
