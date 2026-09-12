import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createAgentMemory } from "../src/config/memory.js";
import {
  getThreadMessages,
  listUserThreads,
} from "../src/services/agent.service.js";
import {
  closePool,
  createApp,
  registerUser,
  request,
} from "./helpers.js";

after(async () => {
  await closePool();
});

test("threads are isolated between users", async () => {
  const app = createApp();
  const userA = await registerUser(app, { name: "Thread A" });
  const userB = await registerUser(app, { name: "Thread B" });

  const memory = createAgentMemory();
  const threadId = randomUUID();

  await memory.createThread({
    threadId,
    resourceId: userA.user.id,
    title: "A private thread",
  });

  const threadsA = await listUserThreads(userA.user.id);
  const threadsB = await listUserThreads(userB.user.id);

  assert.ok(threadsA.some((thread) => thread.id === threadId));
  assert.ok(!threadsB.some((thread) => thread.id === threadId));

  await assert.rejects(
    () => getThreadMessages(userB.user.id, threadId),
    /Thread not found/,
  );
});

test("the thread route does not leak another user's thread", async () => {
  const app = createApp();
  const userA = await registerUser(app, { name: "Route A" });
  const userB = await registerUser(app, { name: "Route B" });

  const memory = createAgentMemory();
  const threadId = randomUUID();

  await memory.createThread({
    threadId,
    resourceId: userA.user.id,
    title: "Protected thread",
  });

  const res = await request(app)
    .get(`/api/agent/threads/${threadId}`)
    .set("Authorization", `Bearer ${userB.token}`);

  assert.equal(res.status, 404);
});

test("chat streams SSE events for the authenticated user", async () => {
  const seen = {};
  const app = createApp({
    streamAgentReply: async ({ userId, timezone, onEvent }) => {
      seen.userId = userId;
      seen.timezone = timezone;
      onEvent({ type: "started", message: "planning" });
      onEvent({ type: "token", token: "hello" });
      onEvent({ type: "completed", message: "done" });
    },
  });

  const { token, user } = await registerUser(app, {
    timezone: "Pacific/Auckland",
  });

  const res = await request(app)
    .post("/api/agent/chat")
    .set("Authorization", `Bearer ${token}`)
    .send({ message: "What's on today?", threadId: randomUUID() });

  assert.equal(res.status, 200);
  assert.match(res.headers["content-type"], /text\/event-stream/);
  assert.match(res.text, /"type":"token"/);
  assert.match(res.text, /hello/);
  assert.equal(seen.userId, user.id);
  assert.equal(seen.timezone, "Pacific/Auckland");
});

test("chat rejects unauthenticated requests", async () => {
  const app = createApp();
  const res = await request(app)
    .post("/api/agent/chat")
    .send({ message: "hi", threadId: randomUUID() });

  assert.equal(res.status, 401);
});
