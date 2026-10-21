export function readCookie(cookieHeader: string | undefined, cookieName: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");

    if (separator < 0) {
      continue;
    }

    const name = part.slice(0, separator).trim();
    if (name === cookieName) {
      return part.slice(separator + 1).trim() || undefined;
    }
  }

  return undefined;
}
