const configuredOrigins = process.env.FRONTEND_ORIGINS ?? "http://localhost:4200,http://10.122.72.63:4200";

export const FRONTEND_ORIGINS = new Set(
  configuredOrigins.split(",").map((origin) => origin.trim()).filter(Boolean),
);
