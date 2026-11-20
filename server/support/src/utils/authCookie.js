const COOKIE_NAME = "helpdesk_session";

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

export { getAuthToken };
