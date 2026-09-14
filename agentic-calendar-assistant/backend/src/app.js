import cors from "cors";
import express from "express";
import { getPool } from "./db/pool.js";
import { agentRoutes } from "./routes/agent.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { connectionRouter } from "./routes/connection.routes.js";
import { calendarRouter } from "./routes/calendar.routes.js";
import { mountMcpServer } from "./mcp/mount.js";

export function createApp(deps = {}) {
  const app = express();
  const appOrigin = process.env.APP_URL ?? "http://localhost:3000";

  app.locals.streamAgentReply = deps.streamAgentReply ?? null;

  app.use(
    cors({
      origin: appOrigin,
      credentials: true,
    }),
  );

  app.use(express.json());

  app.get("/health", async (_req, res) => {
    try {
      await getPool().query("SELECT 1");
      res.json({ status: "ok", service: "agentic-calendar-app", database: "up" });
    } catch {
      res.status(503).json({
        status: "error",
        service: "agentic-calendar-app",
        database: "down",
      });
    }
  });

  app.use("/api/auth", authRouter);
  app.use("/api/connections", connectionRouter);
  app.use("/api/calendar", calendarRouter);
  app.use("/api/agent", agentRoutes);

  mountMcpServer(app);

  return app;
}
