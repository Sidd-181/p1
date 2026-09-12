import { apiFetch } from "./api";

export async function fetchCalendarConnection(token) {
  const data = await apiFetch("/api/connections", { token });

  return data.connection;
}

export async function connectCalendar(token) {
  const result = await apiFetch("/api/connections/connect", {
    method: "POST",
    token,
    body: {
      redirectUrl: `${window.location.origin}/dashboard`,
    },
  });

  window.location.href = result.url;
}

export async function refreshCalendarConnection(token) {
  await apiFetch("/api/connections/refresh-status", {
    method: "POST",
    token,
  });
}
