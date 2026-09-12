import {
  CALENDAR_CONNECTION_PROVIDER,
  createOAuthClient,
} from "../config/google.js";
import {
  getCredentials,
  upsertCredentials,
} from "../repositories/credential.repository.js";

const EXPIRY_SKEW_MS = 60_000;

export async function getCalendarAccessToken(userId) {
  const credentials = await getCredentials(userId, CALENDAR_CONNECTION_PROVIDER);

  if (!credentials) {
    throw new Error("calendar connection is not configured");
  }

  const expiresAt = credentials.expiresAt
    ? new Date(credentials.expiresAt).getTime()
    : 0;

  if (
    credentials.accessToken &&
    expiresAt - EXPIRY_SKEW_MS > Date.now()
  ) {
    return credentials.accessToken;
  }

  if (!credentials.refreshToken) {
    throw new Error("calendar connection is not configured");
  }

  const client = createOAuthClient();
  client.setCredentials({ refresh_token: credentials.refreshToken });

  const { credentials: refreshed } = await client.refreshAccessToken();
  const accessToken = refreshed.access_token;

  if (!accessToken) {
    throw new Error("could not refresh the calendar access token");
  }

  await upsertCredentials({
    userId,
    provider: CALENDAR_CONNECTION_PROVIDER,
    accessToken,
    expiresAt: refreshed.expiry_date
      ? new Date(refreshed.expiry_date)
      : null,
    scope: refreshed.scope ?? credentials.scope,
  });

  return accessToken;
}
