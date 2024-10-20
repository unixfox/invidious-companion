import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Innertube } from "youtubei.js";
import { HonoVariables } from "../../lib/types/HonoVariables.ts";
import { Store } from "@willsoto/node-konfig-core";
import {
    youtubePlayerParsing,
    youtubeVideoInfo,
} from "../../lib/helpers/youtubePlayerHandling.ts";

const latestVersion = new Hono<{ Variables: HonoVariables }>();

latestVersion.get("/", async (c) => {
    const { itag, id, local } = c.req.query();
    c.header("access-control-allow-origin", "*");

    if (!id || !itag) {
        throw new HTTPException(400, {
            res: new Response("Please specify the itag and video ID."),
        });
    }

    const innertubeClient = await c.get("innertubeClient") as Innertube;
    // @ts-ignore Do not understand how to fix this error.
    const konfigStore = await c.get("konfigStore") as Store<
        Record<string, unknown>
    >;

    const youtubePlayerResponseJson = await youtubePlayerParsing(
        innertubeClient,
        id,
        konfigStore,
    );
    const videoInfo = youtubeVideoInfo(
        innertubeClient,
        youtubePlayerResponseJson,
    );

    if (videoInfo.playability_status?.status !== "OK") {
        throw ("The video can't be played: " + id + " due to reason: " +
            videoInfo.playability_status?.reason);
    }
    const streamingData = videoInfo.streaming_data;
    const availableFormats = streamingData?.formats.concat(
        streamingData.adaptive_formats,
    );
    const selectedItagFormat = availableFormats?.filter((i) =>
        i.itag == Number(itag)
    );
    if (selectedItagFormat?.length === 0) {
        throw new HTTPException(400, {
            res: new Response("No itag found."),
        });
    } else if (selectedItagFormat) {
        const itagUrl = selectedItagFormat[0].url as string;
        const urlToRedirect = new URL(itagUrl);
        if (local) {
            return c.redirect(
                urlToRedirect.pathname + urlToRedirect.search + "&host=" +
                    urlToRedirect.host,
            );
        }
        return c.redirect(urlToRedirect.toString());
    }
});

export default latestVersion;
