import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";

const createHandler = (message) => (req, res, next) => {
  next(new ApiError(429, message));
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
  handler: createHandler("Too many requests, please try again after 15 minutes"),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createHandler(
    "Too many authentication attempts, please try again after 15 minutes",
  ),
});

export { globalLimiter, authLimiter };