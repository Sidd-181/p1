import { Router } from "express";
import { requireSession } from "../middleware/requireSession.js";
import { listUpcomingMeetings } from "../services/calendar.service.js";

export const calendarRouter = Router();

calendarRouter.use(requireSession);

calendarRouter.get("/events", async (req, res) => {
  const requestedMaxResults = Number(req.query.maxResults ?? 10);
  const maxResults = Number.isInteger(requestedMaxResults)
    ? Math.min(Math.max(requestedMaxResults, 1), 50)
    : 10;

  try {
    const events = await listUpcomingMeetings({
      userId: req.auth.userId,
      maxResults,
      todayOnly: req.query.todayOnly === "true",
    });

    res.json({ events });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load Google Calendar";
    res.status(502).json({ error: message });
  }
});
