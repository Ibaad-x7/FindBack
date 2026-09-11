import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthTokenPayload {
  userId: string;
  role: string;
}

/**
 * Returns the configured JWT secret, or throws if it hasn't been set.
 * There is deliberately no hardcoded fallback secret — signing or
 * verifying tokens with a guessable default would be worse than refusing
 * to do it at all. Callers should catch this and respond with a generic
 * 500 rather than leak the underlying reason to the client.
 */
function getJwtSecret(): string {
  if (!env.jwtSecret) {
    throw new Error(
      "JWT_SECRET is not configured. Set it in your .env file before using authentication."
    );
  }
  return env.jwtSecret;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  const secret = getJwtSecret();
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, secret, options);
}

/**
 * Verifies a JWT and returns its decoded payload.
 * Throws (TokenExpiredError, JsonWebTokenError, or the "missing secret"
 * error above) on any failure — callers are expected to catch and map all
 * of these to a 401 without echoing the raw error back to the client.
 */
export function verifyAuthToken(token: string): AuthTokenPayload & JwtPayload {
  const secret = getJwtSecret();
  const decoded = jwt.verify(token, secret);
  if (typeof decoded === "string") {
    throw new Error("Malformed token payload");
  }
  return decoded as AuthTokenPayload & JwtPayload;
}
