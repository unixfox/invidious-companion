import { Hono } from "hono";
import { routes } from "./routes/index.ts";
import { Innertube } from "youtubei.js";
import { poTokenGenerate } from "./lib/jobs/potoken.ts";
import config from "node-config";
// deno-lint-ignore no-unused-vars
import toml from "toml";

const app = new Hono();

let innertubeClient = await Innertube.create({ retrieve_player: false });

innertubeClient = await poTokenGenerate(innertubeClient, config);

Deno.cron("regenerate poToken", "*/10 * * * *", async () => {
  innertubeClient = await poTokenGenerate(innertubeClient, config);
});

app.use("*", async (c, next) => {
  // @ts-ignore Do not understand how to fix this error.
  c.set("innertubeClient", innertubeClient);
  // @ts-ignore Do not understand how to fix this error.
  c.set("config", config)
  await next();
});

routes(app);

Deno.serve({ port: config.get("server.port"), hostname: config.get("server.host") }, app.fetch);
