import { OpenRouter } from "@openrouter/sdk";
import { createAgentMemory } from "../config/memory.js";
import { getAgentInstructions } from "../config/agent-instructions.js";

function messageText(content) {
  if (typeof content === "string") return content.trim();
  if (!content || typeof content !== "object") return "";

  const record = content;

  if (typeof record.content === "string" && record.content.trim()) {
    return record.content.trim();
  }

  if (!Array.isArray(record.parts)) return "";
  return record.parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

export async function listUserThreads(userId) {
  const memory = createAgentMemory();

  const result = await memory.listThreads({
    filter: { resourceId: userId },
    perPage: 30,
    orderBy: { field: "updatedAt", direction: "DESC" },
  });

  return result.threads.map((thread) => ({
    id: thread.id,
    title: thread.title?.trim() || "Untitled Chat",
    updatedAt:
      thread.updatedAt instanceof Date
        ? thread.updatedAt.toISOString()
        : String(thread.updatedAt),
  }));
}

export async function getThreadMessages(userId, threadId) {
  const memory = createAgentMemory();

  const thread = await memory.getThreadById({
    threadId,
    resourceId: userId,
  });

  if (!thread || thread.resourceId !== userId) {
    throw new Error("Thread not found");
  }

  const recalledMemoryData = await memory.recall({
    threadId,
    resourceId: userId,
    perPage: false,
  });

  const messages = [];

  for (const message of recalledMemoryData.messages) {
    const content = messageText(message.content);

    if (!content) {
      continue;
    }

    const role =
      message.role === "user" || message.role === "assistant"
        ? message.role
        : "system";

    messages.push({
      id: message.id,
      role,
      content,
    });
  }

  return messages;
}

export async function streamAgentReply(input) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set in backend/.env");
  }

  input.onEvent({
    type: "started",
    message: "Agent is planning",
  });

  const memory = createAgentMemory();
  const existingThread = await memory.getThreadById({
    threadId: input.threadId,
    resourceId: input.userId,
  });

  if (!existingThread) {
    await memory.createThread({
      threadId: input.threadId,
      resourceId: input.userId,
      title: "",
    });
  }

  const recalled = await memory.recall({
    threadId: input.threadId,
    resourceId: input.userId,
    perPage: 20,
  });

  const client = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    httpReferer: process.env.OPENROUTER_HTTP_REFERER,
    appTitle: process.env.OPENROUTER_TITLE ?? "Agentic Calendar Assistant",
  });

  const completion = await client.chat.send({
    chatRequest: {
      model: process.env.AI_MODEL ?? "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: getAgentInstructions({ timezone: input.timezone }),
        },
        ...recalled.messages
          .map((message) => ({
            role:
              message.role === "assistant" || message.role === "user"
                ? message.role
                : "user",
            content: messageText(message.content),
          }))
          .filter((message) => message.content),
        { role: "user", content: input.message },
      ],
    },
  });

  if (completion instanceof ReadableStream) {
    throw new Error("OpenRouter returned an unexpected streaming response");
  }

  const text = completion.choices[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("The AI service returned an empty response.");
  }

  input.onEvent({ type: "token", token: text });

  const thread = await memory.getThreadById({
    threadId: input.threadId,
    resourceId: input.userId,
  });

  if (thread && !thread.title?.trim()) {
    await memory.updateThread({
      id: thread.id,
      title: input.message.slice(0, 80),
      metadata: thread.metadata ?? {},
    });
  }

  input.onEvent({
    type: "completed",
    message: "done",
  });
}
