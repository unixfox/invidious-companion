Deno.env.set("SERVER_SECRET_KEY", "aaaaaaaaaaaaaaaa");
const { run } = await import("../main.ts");

import { dashManifest } from "./dashManifest.ts";
import { youtubePlayer } from "./youtubePlayer.ts";
import { latestVersion } from "./latestVersion.ts";

const baseUrl = "http://localhost:8282";
const headers = { Authorization: "Bearer aaaaaaaaaaaaaaaa" };

await run();
youtubePlayer(baseUrl, headers);
dashManifest(baseUrl);
latestVersion(baseUrl);
