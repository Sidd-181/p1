import { apiFetch } from "./api";

export async function fetchCalendarEvents(token, options = {}) {
  const params = new URLSearchParams({
    maxResults: String(options.maxResults ?? 10),
  });

  if (options.todayOnly) params.set("todayOnly", "true");

  return apiFetch(`/api/calendar/events?${params.toString()}`, { token });
}
