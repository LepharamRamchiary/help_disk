import "dotenv/config";
import express from "express";
import http from "node:http";
import https from "node:https";

const app = express();

// ========================================
// CORS CONFIGURATION
// ========================================

const allowedOrigins = new Set(
  (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

// ========================================
// MICROSERVICE CONFIGURATION
// ========================================

const serviceConfigs = [
  {
    prefix: "/api/v1/auth",
    envVar: "AUTH_SERVICE_URL",
    serviceName: "Auth",

    // Auth service routes are mounted at /auth
    rewritePath: (path) =>
      path === "/health" || path.startsWith("/health?") ? path : `/auth${path}`,
  },
  {
    prefix: "/api/v1/support",
    envVar: "SUPPORT_SERVICE_URL",
    serviceName: "Support",

    // Support service routes are mounted directly
    rewritePath: (path) => path,
  },
];

// ========================================
// HOP-BY-HOP HEADERS
// ========================================

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

// ========================================
// PROXY HANDLER
// ========================================

const createProxyHandler =
  (serviceName, serviceUrl, rewritePath) => (req, res) => {
    try {
      // Express removes the mounted prefix from req.url
      const servicePath = rewritePath(req.url);

      // Construct upstream URL
      const upstreamUrl = new URL(servicePath, serviceUrl);

      // Select HTTP or HTTPS
      const transport = serviceUrl.protocol === "https:" ? https : http;

      console.log(`[Gateway] ${req.method} ${req.originalUrl}`);

      console.log(`[Gateway] Forwarding to: ${upstreamUrl.href}`);

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

      // Handle upstream errors
      upstreamRequest.on("error", (error) => {
        console.error(`[Gateway] ${serviceName} proxy failed:`, {
          message: error.message,
          code: error.code,
          address: error.address,
          port: error.port,
          upstream: upstreamUrl.href,
        });

        if (res.headersSent) {
          res.destroy(error);
          return;
        }

        res.status(502).json({
          success: false,
          message: `${serviceName} service is unavailable`,
        });
      });

      // Handle aborted client requests
      req.on("aborted", () => {
        upstreamRequest.destroy();
      });

      // Handle client connection closing
      res.on("close", () => {
        if (!res.writableEnded) {
          upstreamRequest.destroy();
        }
      });

      // Forward request body
      req.pipe(upstreamRequest);
    } catch (error) {
      console.error(
        `[Gateway] ${serviceName} proxy configuration error:`,
        error,
      );

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Internal gateway error",
        });
      }
    }
  };

// ========================================
// CORS MIDDLEWARE
// ========================================

app.use((req, res, next) => {
  const origin = req.headers.origin;

  res.vary("Origin");

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type",
    );

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

// ========================================
// REGISTER MICROSERVICE PROXY ROUTES
// ========================================

for (const { prefix, envVar, serviceName, rewritePath } of serviceConfigs) {
  const serviceUrl = process.env[envVar];

  if (!serviceUrl) {
    console.warn(
      `[Gateway] ${envVar} is not configured. Skipping ${serviceName} proxy.`,
    );

    continue;
  }

  const parsedUrl = new URL(serviceUrl);

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error(`${envVar} must use http or https`);
  }

  console.log(
    `[Gateway] Registering ${serviceName}: ${prefix} -> ${parsedUrl.origin}`,
  );

  app.use(prefix, createProxyHandler(serviceName, parsedUrl, rewritePath));
}

// ========================================
// API GATEWAY HEALTH CHECK
// ========================================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "api-gateway",
    route: "/health",
  });
});

// ========================================
// EXPORT APP
// ========================================

export { app };
