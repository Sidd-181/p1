const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = (await res.json().catch(() => ({})));
  if (!res.ok) throw new Error(data.error ?? "Request failed");

  return data;
}
