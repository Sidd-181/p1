import { Router } from "express";
import { z } from "zod";
import { requireSession } from "../middleware/requireSession.js";
import {
  getThreadMessages,
  listUserThreads,
  streamAgentReply,
} from "../services/agent.service.js";

export const agentRoutes = Router();

const chatSchema = z.object({
  message: z.string().trim().min(1).max(5000),
  threadId: z.uuid(),
});

const threadIdSchema = z.uuid();

agentRoutes.use(requireSession);

agentRoutes.get("/threads", async (req, res) => {
  try {
    const threads = await listUserThreads(req.auth.userId);
    res.json({ threads });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "failed to list threads";
    res.status(500).json({ error: message });
  }
});

agentRoutes.get("/threads/:threadId", async (req, res) => {
  const parsed = threadIdSchema.safeParse(req.params.threadId);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid threadId" });
    return;
  }

  try {
    const messages = await getThreadMessages(req.auth.userId, parsed.data);
    res.json({ threadId: parsed.data, messages });
  } catch (error) {
    const status = error instanceof Error && error.message === "Thread not found" ? 404 : 500;
    const message =
      error instanceof Error ? error.message : "failed to load thread";
    res.status(status).json({ error: message });
  }
});

agentRoutes.post("/chat", async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid chat body" });
    return;
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const write = (event) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  };

  try {
    const streamReply = req.app.locals.streamAgentReply ?? streamAgentReply;

    await streamReply({
      userId: req.auth.userId,
      timezone: req.auth.timezone,
      threadId: parsed.data.threadId,
      message: parsed.data.message,
      onEvent: write,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Agent request failed";
    write({ type: "error", message });
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
});
