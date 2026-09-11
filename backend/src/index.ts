import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`🚀 FindBack API listening on http://localhost:${env.port}`);
  console.log(`   Health check: http://localhost:${env.port}/api/health`);
  if (!env.databaseUrl) {
    console.warn(
      "⚠️  DATABASE_URL is not set. Copy .env.example to .env and configure it before running Prisma migrations."
    );
  }
  if (!env.jwtSecret) {
    console.warn(
      "⚠️  JWT_SECRET is not set. /api/auth/register, /api/auth/login, and /api/auth/me will fail safely with a 500 until it's configured in .env."
    );
  }
});
