import { listUpcomingMeetings } from "../services/calendar.service.js";

export const listUpcomingMeetingsTool = {
  name: "listUpcomingMeetings",
  description:
    "List Google Calendar events. Set todayOnly=true for today's agenda only.",
  inputSchema: {
    type: "object",
    properties: {
      maxResults: {
        type: "integer",
        minimum: 1,
        maximum: 20,
        description: "Maximum number of events to return",
      },
      todayOnly: {
        type: "boolean",
        description: "If true, only return events for today",
      },
    },
  },
};

export function calendarToolDefinitions() {
  return [listUpcomingMeetingsTool];
}

export async function callCalendarTool(name, args, userId) {
  if (name !== listUpcomingMeetingsTool.name) {
    throw new Error(`Unknown tool: ${name}`);
  }

  const meetings = await listUpcomingMeetings({
    userId,
    maxResults:
      typeof args?.maxResults === "number" ? args.maxResults : undefined,
    todayOnly: typeof args?.todayOnly === "boolean" ? args.todayOnly : undefined,
  });

  return {
    content: [{ type: "text", text: JSON.stringify({ meetings }, null, 2) }],
  };
}
