import dotenv from "dotenv";
import path from "path";

// FindBack keeps a single .env at the project root (see ../../.env.example)
// instead of one per package. Resolve it explicitly so `npm run dev` works
// the same whether invoked from the repo root or from backend/.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    // We don't throw here for PORT/CLIENT_ORIGIN since sensible defaults exist.
    // DATABASE_URL missing is only fatal once Prisma is actually queried (Step 2+).
    return "";
  }
  return value;
}

export const env = {
  port: parseInt(required("PORT", "5000"), 10),
  nodeEnv: required("NODE_ENV", "development"),
  clientOrigin: required("CLIENT_ORIGIN", "http://localhost:5173"),
  databaseUrl: required("DATABASE_URL", ""),
  // No fallback secret on purpose — a hardcoded default would be an
  // insecure trap. Missing JWT_SECRET is caught explicitly wherever a
  // token is signed/verified (see utils/jwt.ts) so auth fails safely
  // instead of silently signing tokens with a guessable secret.
  jwtSecret: required("JWT_SECRET", ""),
  jwtExpiresIn: required("JWT_EXPIRES_IN", "7d"),
};
