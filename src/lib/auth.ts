/**
 * Generate a deterministic auth token from the app password and secret.
 * Uses a simple encoding since this is basic password protection,
 * not a security-critical authentication system.
 */
export function generateAuthToken(password: string, secret: string): string {
  return Buffer.from(`${password}:${secret}`).toString("base64");
}
