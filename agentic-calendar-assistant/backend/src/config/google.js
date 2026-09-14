import { google } from "googleapis";

export const CALENDAR_CONNECTION_PROVIDER = "calendar";
export const CALENDAR_CONNECTION_LABEL = "Google Calendar";

export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

export function getGoogleConfig() {
  const configuredCalendarId = process.env.GOOGLE_CALENDAR_ID?.trim();

  return {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? "",
    calendarId:
      configuredCalendarId && configuredCalendarId !== "google-calendar"
        ? configuredCalendarId
        : "primary",
  };
}

export function isGoogleConfigured() {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig();

  return Boolean(clientId && clientSecret && redirectUri);
}

export function createOAuthClient() {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig();

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}
