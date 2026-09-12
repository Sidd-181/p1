import jwt from "jsonwebtoken";
import {
  CALENDAR_CONNECTION_LABEL,
  CALENDAR_CONNECTION_PROVIDER,
  CALENDAR_SCOPES,
  createOAuthClient,
  isGoogleConfigured,
} from "../config/google.js";
import { getJwtConfig } from "../config/jwt.js";
import {
  getCalendarConnectionRow,
  upsertCalendarConnection,
} from "../repositories/connection.repository.js";
import { upsertCredentials } from "../repositories/credential.repository.js";
import { getCalendarAccessToken } from "./token.service.js";

const STATE_TTL = "10m";

function signState(payload) {
  const { jwtSecret } = getJwtConfig();

  return jwt.sign(payload, jwtSecret, { expiresIn: STATE_TTL });
}

function verifyState(state) {
  const { jwtSecret } = getJwtConfig();

  return jwt.verify(state, jwtSecret);
}

export async function getCalendarConnection(userId) {
  const row = await getCalendarConnectionRow(userId);

  return {
    label: CALENDAR_CONNECTION_LABEL,
    status: row?.status ?? "disconnected",
  };
}

export async function createCalendarConnectUrl(input) {
  if (!isGoogleConfigured()) {
    throw Object.assign(new Error("Google Calendar is not configured"), {
      status: 503,
    });
  }

  const client = createOAuthClient();
  const state = signState({
    userId: input.userId,
    redirectUrl: input.redirectUrl ?? null,
  });

  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: CALENDAR_SCOPES,
    state,
  });

  await upsertCalendarConnection({ userId: input.userId, status: "pending" });

  return { url };
}

export async function completeCalendarConnection({ code, state }) {
  const claims = verifyState(state);
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);

  await upsertCredentials({
    userId: claims.userId,
    provider: CALENDAR_CONNECTION_PROVIDER,
    refreshToken: tokens.refresh_token ?? null,
    accessToken: tokens.access_token ?? null,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    scope: tokens.scope ?? null,
  });

  await upsertCalendarConnection({ userId: claims.userId, status: "connected" });

  return {
    userId: claims.userId,
    redirectUrl: claims.redirectUrl ?? null,
  };
}

export async function refreshCalendarConnection({ userId }) {
  try {
    await getCalendarAccessToken(userId);

    const row = await upsertCalendarConnection({
      userId,
      status: "connected",
    });

    return { label: CALENDAR_CONNECTION_LABEL, status: row.status };
  } catch {
    const row = await upsertCalendarConnection({
      userId,
      status: "disconnected",
    });

    return { label: CALENDAR_CONNECTION_LABEL, status: row.status };
  }
}
