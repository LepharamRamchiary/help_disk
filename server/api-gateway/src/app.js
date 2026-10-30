import "dotenv/config";
import express from "express";
import http from "node:http";
import https from "node:https";

const app = express();
const allowedOrigins = new Set(
  (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const serviceConfigs = [
  {
    prefix: "/api/v1/auth",
    envVar: "AUTH_SERVICE_URL",
    serviceName: "Auth",
  },
  {
    prefix: "/api/v1/support",
    envVar: "SUPPORT_SERVICE_URL",
    serviceName: "Support",
  },
];

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

const createProxyHandler = (serviceName, serviceUrl) => (req, res) => {
  const servicePath = req.originalUrl.replace(/^\/api\/v1(?=\/|$)/, "");
  const upstreamUrl = new URL(servicePath, serviceUrl);
  const transport = serviceUrl.protocol === "https:" ? https : http;

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
    console.error(`${serviceName} service proxy failed:`, {
      message: error.message || String(error),
      code: error.code,
      address: error.address,
      port: error.port,
      upstream: `${serviceUrl.origin}${servicePath}`,
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

  req.on("aborted", () => upstreamRequest.destroy());
  res.on("close", () => {
    if (!res.writableEnded) {
      upstreamRequest.destroy();
    }
  });

  req.pipe(upstreamRequest);
};

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

for (const { prefix, envVar, serviceName } of serviceConfigs) {
  const serviceUrl = process.env[envVar];

  if (!serviceUrl) {
    console.warn(`${envVar} is not configured; skipping ${serviceName} proxy route.`);
    continue;
  }

  const parsedUrl = new URL(serviceUrl);

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error(`${envVar} must use http or https`);
  }

  app.use(prefix, createProxyHandler(serviceName, parsedUrl));
}

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "api-gateway",
    route: "/health",
  });
});

export { app };
