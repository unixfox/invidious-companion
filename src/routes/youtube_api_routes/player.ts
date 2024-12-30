import { Hono } from "hono";
import { youtubePlayerParsing } from "../../lib/helpers/youtubePlayerHandling.ts";
import { HonoVariables } from "../../lib/types/HonoVariables.ts";
import { Innertube } from "youtubei.js";
import { Store } from "@willsoto/node-konfig-core";

const player = new Hono<{ Variables: HonoVariables }>();

player.post("/player", async (c) => {
    const jsonReq = await c.req.json();
    const innertubeClient = await c.get("innertubeClient") as Innertube;
    // @ts-ignore Do not understand how to fix this error.
    const konfigStore = await c.get("konfigStore") as Store<
        Record<string, unknown>
    >;
    if (jsonReq.videoId) {
        return c.json(
            await youtubePlayerParsing(
                innertubeClient,
                jsonReq.videoId,
                konfigStore,
            ),
        );
    }
});

export default player;
