const configuredOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean)
const localOrigin = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/

export function isAllowedOrigin(origin?: string) {
  if (!origin)
    return true
  if (configuredOrigins.length)
    return configuredOrigins.includes(origin)
  return process.env.NODE_ENV !== "production" && localOrigin.test(origin)
}
