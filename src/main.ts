import { Hono } from "hono";
import { routes } from "./routes/index.ts";
import { Innertube } from "youtubei.js";
import { poTokenGenerate } from "./lib/jobs/potoken.ts";
import { konfigLoader } from "./lib/helpers/konfigLoader.ts";

const app = new Hono();

const konfigStore = await konfigLoader();

let innertubeClient: Innertube;

if (konfigStore.get("jobs.youtube_session.enabled") as boolean) {
  innertubeClient = await Innertube.create({ retrieve_player: false });
  innertubeClient = await poTokenGenerate(innertubeClient, konfigStore);
  Deno.cron("regenerate poToken", konfigStore.get("jobs.youtube_session.frequency") as string, async () => {
    innertubeClient = await poTokenGenerate(innertubeClient, konfigStore);
  });
} else {
  await Innertube.create();
  Deno.cron("regenerate visitordata", konfigStore.get("jobs.youtube_session.frequency") as string, async () => {
    innertubeClient = await Innertube.create();
  });
}

app.use("*", async (c, next) => {
  // @ts-ignore Do not understand how to fix this error.
  c.set("innertubeClient", innertubeClient);
  // @ts-ignore Do not understand how to fix this error.
  c.set("konfigStore", konfigStore);
  await next();
});

routes(app, konfigStore);

Deno.serve({
  port: konfigStore.get("server.port") as number,
  hostname: konfigStore.get("server.host") as string,
}, app.fetch);
