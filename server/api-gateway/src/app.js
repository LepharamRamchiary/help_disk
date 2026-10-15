import express from "express";
import http from "node:http";
import https from "node:https";

const app = express();
const authServiceUrl = new URL(
  process.env.AUTH_SERVICE_URL || "http://localhost:5000",
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
    console.error("Auth service proxy failed:", error.message);

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
