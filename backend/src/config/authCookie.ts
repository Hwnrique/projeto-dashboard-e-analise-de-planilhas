export const REFRESH_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
export const REFRESH_COOKIE_NAME = "refreshToken";

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const refreshCookieOptions = {
  ...baseCookieOptions,
  maxAge: REFRESH_TOKEN_TTL_MS,
};

export const refreshCookieClearOptions = baseCookieOptions;
