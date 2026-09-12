import test, { after } from "node:test";
import assert from "node:assert/strict";
import {
  closePool,
  createApp,
  registerUser,
  request,
} from "./helpers.js";

const app = createApp();

after(async () => {
  await closePool();
});

test("the MCP endpoint rejects requests without a token", async () => {
  const res = await request(app)
    .post("/mcp")
    .send({ jsonrpc: "2.0", id: 1, method: "initialize" });

  assert.equal(res.status, 401);
});

test("the MCP endpoint rejects a forged token", async () => {
  const res = await request(app)
    .post("/mcp")
    .set("Authorization", "Bearer forged.token.value")
    .send({ jsonrpc: "2.0", id: 1, method: "initialize" });

  assert.equal(res.status, 401);
});

test("the MCP endpoint handles initialize and tools/list for a valid token", async () => {
  const { token } = await registerUser(app);

  const init = await request(app)
    .post("/mcp")
    .set("Authorization", `Bearer ${token}`)
    .send({ jsonrpc: "2.0", id: 1, method: "initialize" });

  assert.equal(init.status, 200);
  assert.equal(init.body.jsonrpc, "2.0");
  assert.equal(init.body.result.serverInfo.name, "agentic-calendar");

  const list = await request(app)
    .post("/mcp")
    .set("Authorization", `Bearer ${token}`)
    .send({ jsonrpc: "2.0", id: 2, method: "tools/list" });

  assert.equal(list.status, 200);
  assert.equal(list.body.result.tools[0].name, "listUpcomingMeetings");
});

test("the MCP endpoint reports unknown tools without touching Google", async () => {
  const { token } = await registerUser(app);

  const res = await request(app)
    .post("/mcp")
    .set("Authorization", `Bearer ${token}`)
    .send({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "doesNotExist", arguments: {} },
    });

  assert.equal(res.status, 200);
  assert.equal(res.body.result.isError, true);
});

test("the MCP endpoint returns 405 for GET", async () => {
  const res = await request(app).get("/mcp");

  assert.equal(res.status, 405);
});
