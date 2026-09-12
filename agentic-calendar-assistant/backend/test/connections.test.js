import test, { after } from "node:test";
import assert from "node:assert/strict";
import { upsertCalendarConnection } from "../src/repositories/connection.repository.js";
import {
  closePool,
  createApp,
  registerUser,
  request,
} from "./helpers.js";

const app = createApp();

after(async () => {
  await closePool();
});

test("connections require authentication", async () => {
  const res = await request(app).get("/api/connections");

  assert.equal(res.status, 401);
});

test("a new user starts disconnected", async () => {
  const { token } = await registerUser(app);
  const res = await request(app)
    .get("/api/connections")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.connection.label, "Google Calendar");
  assert.equal(res.body.connection.status, "disconnected");
  assert.equal(res.body.connection.accessToken, undefined);
  assert.equal(res.body.connection.refreshToken, undefined);
});

test("connect returns a signed Google consent URL", async () => {
  const { token } = await registerUser(app);
  const res = await request(app)
    .post("/api/connections/connect")
    .set("Authorization", `Bearer ${token}`)
    .send({ redirectUrl: "http://localhost:3000/dashboard" });

  assert.equal(res.status, 200);
  assert.match(res.body.url, /^https:\/\/accounts\.google\.com\//);
  assert.match(res.body.url, /client_id=/);
  assert.match(res.body.url, /state=/);

  const url = new URL(res.body.url);
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.ok(url.searchParams.get("state"));
});

test("the callback rejects a missing or forged state", async () => {
  const missing = await request(app).get("/api/connections/callback");
  assert.equal(missing.status, 400);

  const forged = await request(app)
    .get("/api/connections/callback")
    .query({ code: "fake-code", state: "forged-state" });
  assert.equal(forged.status, 400);
});

test("connection status is isolated per user", async () => {
  const userA = await registerUser(app, { name: "User A" });
  const userB = await registerUser(app, { name: "User B" });

  await upsertCalendarConnection({ userId: userA.user.id, status: "connected" });

  const resA = await request(app)
    .get("/api/connections")
    .set("Authorization", `Bearer ${userA.token}`);

  const resB = await request(app)
    .get("/api/connections")
    .set("Authorization", `Bearer ${userB.token}`);

  assert.equal(resA.body.connection.status, "connected");
  assert.equal(resB.body.connection.status, "disconnected");
});
