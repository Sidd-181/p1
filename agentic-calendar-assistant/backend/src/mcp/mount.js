import { Router } from "express";
import { findUserById } from "../repositories/user.repository.js";
import { verifyAuthToken } from "../services/auth.service.js";
import { calendarToolDefinitions, callCalendarTool } from "./calendar-tools.js";

const PROTOCOL_VERSION = "2024-11-05";
const SERVER_INFO = { name: "agentic-calendar", version: "1.0.0" };

function bearerToken(req) {
  const header = req.headers.authorization;

  return header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length).trim()
    : null;
}

function jsonRpcError(res, status, id, code, message) {
  res.status(status).json({
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message },
  });
}

export function mountMcpServer(app) {
  const router = Router();

  router.get("/", (_req, res) => {
    res.status(405).set("Allow", "POST").send("Method not allowed");
  });

  router.post("/", async (req, res) => {
    const token = bearerToken(req);

    if (!token) {
      jsonRpcError(res, 401, req.body?.id, -32001, "Unauthorized");
      return;
    }

    let claims;
    try {
      claims = verifyAuthToken(token);
    } catch {
      jsonRpcError(res, 401, req.body?.id, -32001, "Unauthorized");
      return;
    }

    const user = await findUserById(String(claims.userId ?? ""));

    if (!user) {
      jsonRpcError(res, 401, req.body?.id, -32001, "Unauthorized");
      return;
    }

    const { id = null, method, params } = req.body ?? {};

    if (method === "initialize") {
      res.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          serverInfo: SERVER_INFO,
          capabilities: { tools: {} },
        },
      });
      return;
    }

    if (method === "tools/list") {
      res.json({
        jsonrpc: "2.0",
        id,
        result: { tools: calendarToolDefinitions() },
      });
      return;
    }

    if (method === "tools/call") {
      try {
        const result = await callCalendarTool(
          params?.name,
          params?.arguments ?? {},
          user.id,
        );

        res.json({ jsonrpc: "2.0", id, result });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Tool failed";

        res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify({ error: message }) }],
            isError: true,
          },
        });
      }
      return;
    }

    if (method === "notifications/initialized") {
      res.status(202).end();
      return;
    }

    jsonRpcError(res, 200, id, -32601, "Method not found");
  });

  app.use("/mcp", router);

  console.log("MCP endpoint: POST /mcp (Bearer JWT required)");
}
