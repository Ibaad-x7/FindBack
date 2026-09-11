import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { env } from "./config/env";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import itemsRouter from "./routes/items";
import matchesRouter from "./routes/matches";
import uploadRouter from "./routes/upload";
import contactRequestsRouter from "./routes/contactRequests";
import notificationsRouter from "./routes/notifications";
import adminRouter from "./routes/admin";
import { UPLOADS_ROOT } from "./utils/fileUtils";

const app: Application = express();

// --- Global middleware ---
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Static assets ---
app.use("/uploads", express.static(UPLOADS_ROOT));

// --- Routes ---
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/items", itemsRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/contact-requests", contactRequestsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/admin", adminRouter);

// --- Root ---
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Welcome to the FindBack API" });
});

// --- 404 handler ---
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// --- Central error handler ---
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
