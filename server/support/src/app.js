import express from "express";
import cors from "cors";
import "dotenv/config";
import {
  notFoundHandler,
  errorHandler,
} from "./middlewares/error.middleware.js";
import { globalLimiter } from "./middlewares/rateLimit.middleware.js";

const app = express();

app.set("trust proxy", 1);

app.use(cors());

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(globalLimiter);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "support",
    route: "/health",
  });
});

// Must be last, in this order
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
