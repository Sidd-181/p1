import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function listThreads(token) {
  return apiFetch("/api/agent/threads", { token });
}

export async function loadThread(token, threadId) {
  return apiFetch(`/api/agent/threads/${threadId}`, { token });
}

export async function streamAgentChat(token, input, onEvent) {
  const res = await fetch(`${API_URL}/api/agent/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    let message = "Agent request failed";
    try {
      const data = await res.json();
      message = data.error ?? message;
    } catch {
      // The response was not JSON; keep the generic error.
    }
    throw new Error(message);
  }

  if (!res.body) {
    throw new Error("Agent response did not include a stream");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processBlock = (block) => {
    for (const line of block.split("\n")) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data) continue;

      try {
        onEvent(JSON.parse(data));
      } catch {
        // Ignore malformed SSE records instead of breaking the whole chat.
      }
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      processBlock(block);
    }

    if (done) break;
  }

  if (buffer.trim()) {
    processBlock(buffer);
  }
}
