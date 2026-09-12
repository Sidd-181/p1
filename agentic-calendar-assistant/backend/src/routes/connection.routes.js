import { Router } from "express";
import { requireSession } from "../middleware/requireSession.js";
import {
  completeCalendarConnection,
  createCalendarConnectUrl,
  getCalendarConnection,
  refreshCalendarConnection,
} from "../services/connection.service.js";

export const connectionRouter = Router();

function appendCalendarStatus(redirectUrl, status) {
  try {
    const url = new URL(redirectUrl);
    url.searchParams.set("calendar", status);
    return url.toString();
  } catch {
    return null;
  }
}

connectionRouter.get("/callback", async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";

  if (!code || !state) {
    res.status(400).json({ error: "Invalid calendar callback" });
    return;
  }

  try {
    const result = await completeCalendarConnection({ code, state });
    const redirectUrl = result.redirectUrl
      ? appendCalendarStatus(result.redirectUrl, "connected")
      : null;

    if (redirectUrl) {
      res.redirect(redirectUrl);
      return;
    }

    res.json({ connection: { label: "Google Calendar", status: "connected" } });
  } catch (error) {
    console.error("calendar callback failed", error);
    res.status(400).json({ error: "Could not connect Google Calendar" });
  }
});

connectionRouter.use(requireSession);

connectionRouter.get("/", async (req, res) => {
  try {
    const connection = await getCalendarConnection(req.auth.userId);

    res.json({ connection });
  } catch {
    res.status(500).json({ error: "could not load connections" });
  }
});

connectionRouter.post("/connect", async (req, res) => {
  try {
    const redirectUrl =
      typeof req.body?.redirectUrl === "string"
        ? req.body.redirectUrl
        : `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard`;

    const result = await createCalendarConnectUrl({
      userId: req.auth.userId,
      redirectUrl,
    });

    res.json(result);
  } catch (error) {
    res.status(error.status ?? 500).json({
      error: error.message ?? "could not start connection",
    });
  }
});

connectionRouter.post("/refresh-status", async (req, res) => {
  try {
    const connection = await refreshCalendarConnection({
      userId: req.auth.userId,
    });

    res.json({ connection });
  } catch {
    res.status(500).json({ error: "failed to refresh the status" });
  }
});
