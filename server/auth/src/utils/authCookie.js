const COOKIE_NAME = "helpdesk_session";
const COOKIE_PATH = "/api/v1";
const SESSION_MAX_AGE_SECONDS = 60 * 60;

const cookieAttributes = () => {
  const attributes = [`Path=${COOKIE_PATH}`, "HttpOnly", "SameSite=Lax"];
  if (process.env.NODE_ENV === "production") {
    attributes.push("Secure");
  }
  return attributes;
};

const getAuthToken = (req) => {
  const authorization = req.headers.authorization;
  const [scheme, bearerToken, extra] =
    typeof authorization === "string" ? authorization.split(" ") : [];

  if (scheme === "Bearer" && bearerToken && !extra) {
    return bearerToken;
  }

  const cookieHeader = req.headers.cookie;
  if (typeof cookieHeader !== "string") return null;

  const sessionCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

  if (!sessionCookie) return null;
  return sessionCookie.slice(COOKIE_NAME.length + 1) || null;
};

const setAuthCookie = (res, token, rememberMe = true) => {
  const attributes = cookieAttributes();
  if (rememberMe) {
    attributes.push(`Max-Age=${SESSION_MAX_AGE_SECONDS}`);
  }
  res.append("Set-Cookie", `${COOKIE_NAME}=${token}; ${attributes.join("; ")}`);
};

const clearAuthCookie = (res) => {
  res.append(
    "Set-Cookie",
    `${COOKIE_NAME}=; ${cookieAttributes().join("; ")}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  );
};

export { clearAuthCookie, getAuthToken, setAuthCookie };
