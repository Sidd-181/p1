import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";

config({
  path: resolve(fileURLToPath(new URL("../.env", import.meta.url))),
  override: true,
});

const port = Number(process.env.PORT) || 4000;
const app = createApp();

app.listen(port, () => {
  console.log(`Agentic Calendar App is running on port: ${port}`);
});
