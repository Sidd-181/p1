import { google } from "googleapis";
import { randomUUID } from "node:crypto";
import { getGoogleConfig } from "../config/google.js";
import { getCalendarAccessToken } from "./token.service.js";

function calendarClient(accessToken) {
  const auth = new google.auth.OAuth2();

  auth.setCredentials({
    access_token: accessToken,
  });

  return google.calendar({
    version: "v3",
    auth,
  });
}

async function calendarForUser(userId) {
  if (!userId) {
    throw new Error("Calendar user identity is missing");
  }

  const accessToken = await getCalendarAccessToken(userId);
  return calendarClient(accessToken);
}

function getCalendarId() {
  return getGoogleConfig().calendarId;
}

function formatEvent(event) {
  return {
    id: event.id,
    title: event.summary ?? "(no title)",
    description: event.description?.trim() || null,
    location: event.location?.trim() || null,
    start: event.start?.dateTime ?? event.start?.date ?? null,
    end: event.end?.dateTime ?? event.end?.date ?? null,
    htmlLink: event.htmlLink ?? null,
    meetLink: event.hangoutLink ?? null,
    attendees: (event.attendees ?? [])
      .map((person) => person.email || person.displayName)
      .filter(Boolean),
  };
}

function assertDateRange(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid start or end datetime");
  }

  if (end <= start) {
    throw new Error("Meeting end time must be after the start time");
  }
}

export async function listUpcomingMeetings(input) {
  const calendar = await calendarForUser(input.userId);
  const now = new Date();
  let timeMin = now.toISOString();
  let timeMax;

  if (input.todayOnly) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    timeMin = start.toISOString();
    timeMax = end.toISOString();
  }

  const response = await calendar.events.list({
    calendarId: getCalendarId(),
    timeMin,
    ...(timeMax ? { timeMax } : {}),
    maxResults: input.maxResults ?? 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  return (response.data.items ?? []).map(formatEvent);
}

export async function createMeeting(input) {
  assertDateRange(input.startIso, input.endIso);

  const calendar = await calendarForUser(input.userId);
  const withMeet = input.addGoogleMeet !== false;

  const response = await calendar.events.insert({
    calendarId: getCalendarId(),
    sendUpdates: "all",
    ...(withMeet ? { conferenceDataVersion: 1 } : {}),
    requestBody: {
      summary: input.title,
      ...(input.description ? { description: input.description } : {}),
      start: { dateTime: input.startIso },
      end: { dateTime: input.endIso },
      attendees: (input.attendeeEmails ?? []).map((email) => ({ email })),
      ...(withMeet
        ? {
            conferenceData: {
              createRequest: {
                requestId: randomUUID(),
                conferenceSolutionKey: { type: "hangoutsMeet" },
              },
            },
          }
        : {}),
    },
  });

  return {
    ...formatEvent(response.data),
    inviteEmailsSent: (input.attendeeEmails ?? []).length > 0,
    googleMeetAdded: withMeet,
  };
}

export async function cancelMeeting(input) {
  const calendar = await calendarForUser(input.userId);

  await calendar.events.delete({
    calendarId: getCalendarId(),
    eventId: input.eventId,
    sendUpdates: "all",
  });

  return { cancelled: true, eventId: input.eventId };
}

export async function rescheduleMeeting(input) {
  assertDateRange(input.startIso, input.endIso);

  const calendar = await calendarForUser(input.userId);

  const response = await calendar.events.patch({
    calendarId: getCalendarId(),
    eventId: input.eventId,
    sendUpdates: "all",
    requestBody: {
      start: { dateTime: input.startIso },
      end: { dateTime: input.endIso },
    },
  });

  return formatEvent(response.data);
}

export async function checkCalendarBusy(input) {
  assertDateRange(input.startIso, input.endIso);

  const calendar = await calendarForUser(input.userId);
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: input.startIso,
      timeMax: input.endIso,
      items: [{ id: getCalendarId() }],
    },
  });

  const busy = response.data?.calendars?.[getCalendarId()]?.busy ?? [];

  return {
    busy: busy.map((item) => ({
      start: item.start ?? null,
      end: item.end ?? null,
    })),
  };
}
