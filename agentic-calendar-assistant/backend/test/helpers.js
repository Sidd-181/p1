import "dotenv/config";
import request from "supertest";
import { createApp } from "../src/app.js";
import { closePool, getPool } from "../src/db/pool.js";

export { closePool, createApp, getPool, request };

let counter = 0;

export function uniqueEmail(prefix = "user") {
  counter += 1;
  return `${prefix}-${Date.now()}-${process.pid}-${counter}@example.com`;
}

export async function registerUser(app, overrides = {}) {
  const email = overrides.email ?? uniqueEmail();
  const payload = {
    name: overrides.name ?? "Test User",
    email,
    password: overrides.password ?? "password123",
    timezone: overrides.timezone ?? "America/New_York",
  };

  if (overrides.timezone === null) {
    delete payload.timezone;
  }

  const res = await request(app).post("/api/auth/register").send(payload);

  return { res, payload, email, token: res.body?.token, user: res.body?.user };
}
