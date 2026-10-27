import { createHmac } from "node:crypto";

const TOKEN_LIFETIME_SECONDS = 60 * 60;

const getSecret = () => {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error(
      "AUTH_JWT_SECRET must be configured with at least 32 bytes",
    );
  }
  return secret;
};

export const issueToken = (user) => {
  const encode = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const iat = Math.floor(Date.now() / 1000);

  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    sub: String(user.id),
    email: user.email,
    name: user.name,
    iss: "help-dask-auth",
    iat,
    exp: iat + TOKEN_LIFETIME_SECONDS,
  });
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", getSecret())
    .update(unsigned)
    .digest("base64url");

  return {
    token: `${unsigned}.${signature}`,
    tokenType: "Bearer",
    expiresIn: TOKEN_LIFETIME_SECONDS,
  };
};
