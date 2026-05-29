import "dotenv/config";
import express from "express";
import cors from "cors";
import { recommendationsRouter } from "./routes/recommendations";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { doctorsRouter } from "./routes/doctors";
import { appointmentsRouter } from "./routes/appointments";
import { profileRouter } from "./routes/profile";

const app = express();
const PORT = process.env.PORT ?? 8080;

// ── Middleware ────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://frontend:3000",
      process.env.FRONTEND_URL ?? "",
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────
app.use("/health", healthRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/auth", authRouter);
app.use("/api/doctors", doctorsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api", profileRouter);

// ── 404 catch-all ─────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ──────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[ERROR]", err.message);
    res.status(500).json({ error: err.message ?? "Internal server error" });
  }
);

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Curis backend listening on http://0.0.0.0:${PORT}`);
});

export default app;
