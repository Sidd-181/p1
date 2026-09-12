import test, { after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { getJwtConfig } from "../src/config/jwt.js";
import {
  closePool,
  createApp,
  getPool,
  registerUser,
  request,
  uniqueEmail,
} from "./helpers.js";

const app = createApp();

after(async () => {
  await closePool();
});

test("register hashes the password and returns the user timezone", async () => {
  const email = uniqueEmail("register");
  const res = await request(app).post("/api/auth/register").send({
    name: "Alice",
    email,
    password: "password123",
    timezone: "Asia/Tokyo",
  });

  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, email);
  assert.equal(res.body.user.timezone, "Asia/Tokyo");
  assert.equal(res.body.user.passwordHash, undefined);

  const { rows } = await getPool().query(
    "SELECT password_hash, timezone FROM users WHERE email = $1",
    [email],
  );

  assert.match(rows[0].password_hash, /^\$2[aby]\$/);
  assert.notEqual(rows[0].password_hash, "password123");
  assert.equal(rows[0].timezone, "Asia/Tokyo");
});

test("register defaults the timezone to UTC when omitted", async () => {
  const { res } = await registerUser(app, { timezone: null });

  assert.equal(res.status, 201);
  assert.equal(res.body.user.timezone, "UTC");
});

test("register rejects duplicate emails", async () => {
  const email = uniqueEmail("dupe");

  const first = await request(app)
    .post("/api/auth/register")
    .send({ name: "One", email, password: "password123" });
  assert.equal(first.status, 201);

  const second = await request(app)
    .post("/api/auth/register")
    .send({ name: "Two", email, password: "password123" });
  assert.equal(second.status, 409);
});

test("login returns a token and the persisted timezone", async () => {
  const email = uniqueEmail("login");
  await request(app).post("/api/auth/register").send({
    name: "Bob",
    email,
    password: "password123",
    timezone: "Europe/Berlin",
  });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "password123" });

  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.timezone, "Europe/Berlin");
});

test("login rejects invalid credentials", async () => {
  const email = uniqueEmail("invalid");
  await request(app)
    .post("/api/auth/register")
    .send({ name: "Cara", email, password: "password123" });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "wrong-password" });

  assert.equal(res.status, 401);
  assert.equal(res.body.error, "Invalid email or password");
});

test("/me returns the authenticated user and timezone", async () => {
  const { token, user } = await registerUser(app, {
    timezone: "Australia/Sydney",
  });

  const res = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.user.id, user.id);
  assert.equal(res.body.user.timezone, "Australia/Sydney");
  assert.equal(res.body.user.passwordHash, undefined);
});

test("/me rejects requests without a token", async () => {
  const res = await request(app).get("/api/auth/me");

  assert.equal(res.status, 401);
});

test("/me rejects a token with a tampered signature", async () => {
  const { token } = await registerUser(app);
  const tampered = `${token.split(".").slice(0, 2).join(".")}.not-a-valid-signature`;

  const res = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${tampered}`);

  assert.equal(res.status, 401);
});

test("/me rejects an expired token", async () => {
  const { user } = await registerUser(app);
  const { jwtSecret } = getJwtConfig();
  const expired = jwt.sign({ userId: user.id }, jwtSecret, {
    expiresIn: "-1s",
  });

  const res = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${expired}`);

  assert.equal(res.status, 401);
});
