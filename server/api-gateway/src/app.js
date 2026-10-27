import "dotenv/config";
import express from "express";
import http from "node:http";
import https from "node:https";

const app = express();
const allowedOrigins = new Set(
  (process.env.CORS_ALLOWED_ORIGINS)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const authServiceUrl = new URL(
  process.env.AUTH_SERVICE_URL,
);

if (!["http:", "https:"].includes(authServiceUrl.protocol)) {
  throw new Error("AUTH_SERVICE_URL must use http or https");
}

const transport = authServiceUrl.protocol === "https:" ? https : http;
const hopByHopHeaders = new Set([
  "connection",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const getForwardedHeaders = (headers) =>
  Object.fromEntries(
    Object.entries(headers).filter(
      ([name]) => !hopByHopHeaders.has(name.toLowerCase()),
    ),
  );

app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.vary("Origin");

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
  }

  if (req.method === "OPTIONS") {
    if (!origin || !allowedOrigins.has(origin)) {
      return res.status(403).end();
    }
    return res.status(204).end();
  }

  return next();
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "api-gateway",
  });
});

app.use("/api/v1/auth", (req, res) => {
  const authPath = req.originalUrl.replace(/^\/api\/v1(?=\/|$)/, "");
  const upstreamUrl = new URL(authPath, authServiceUrl);
  const upstreamRequest = transport.request(
    upstreamUrl,
    {
      method: req.method,
      headers: getForwardedHeaders(req.headers),
    },
    (upstreamResponse) => {
      res.writeHead(
        upstreamResponse.statusCode || 502,
        getForwardedHeaders(upstreamResponse.headers),
      );
      upstreamResponse.pipe(res);
    },
  );

  upstreamRequest.on("error", (error) => {
    console.error("Auth service proxy failed:", {
      message: error.message || String(error),
      code: error.code,
      address: error.address,
      port: error.port,
      upstream: `${authServiceUrl.origin}${authPath}`,
    });

    if (res.headersSent) {
      res.destroy(error);
      return;
    }

    res.status(502).json({
      success: false,
      message: "Auth service is unavailable",
    });
  });

  req.on("aborted", () => upstreamRequest.destroy());
  res.on("close", () => {
    if (!res.writableEnded) {
      upstreamRequest.destroy();
    }
  });

  req.pipe(upstreamRequest);
});

export { app };
