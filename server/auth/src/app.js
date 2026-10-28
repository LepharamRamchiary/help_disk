import express from "express";
import cors from "cors";
import "dotenv/config";
import {
  notFoundHandler,
  errorHandler,
} from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

import authRoutes from "./routes/auth.routes.js";

app.use("/auth", authRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "auth",
  });
});

// Must be last, in this order
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
