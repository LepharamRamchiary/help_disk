import express from "express";
import cors from "cors";
import "dotenv/config";
import {
  notFoundHandler,
  errorHandler,
} from "./middlewares/error.middleware.js";
import { globalLimiter } from "./middlewares/rateLimit.middleware.js";
import ticketRoutes from "./routes/ticket.routes.js";

const app = express();

app.set("trust proxy", 1);

// CORS configuration
const allowedOrigins = new Set(
  (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Body parsers
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use(globalLimiter);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "support",
    route: "/health",
  });
});

app.use("/tickets", ticketRoutes);

// Must be last, in this order
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
