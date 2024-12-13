import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Innertube } from "youtubei.js";
import { HonoVariables } from "../../lib/types/HonoVariables.ts";
import { Store } from "@willsoto/node-konfig-core";
import {
    youtubePlayerParsing,
    youtubeVideoInfo,
} from "../../lib/helpers/youtubePlayerHandling.ts";
import {
    verifyRequest
} from "../../lib/helpers/verifyRequest.ts";

const latestVersion = new Hono<{ Variables: HonoVariables }>();

latestVersion.get("/", async (c) => {
    const { check, itag, id, local } = c.req.query();
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

    if (konfigStore.get("server.verify_requests") && check == undefined) {
        throw new HTTPException(400, {
            res: new Response("No check ID."),
        });
    } else if (konfigStore.get("server.verify_requests") && check) {
        if (verifyRequest(check, id, konfigStore) === false) {
            throw new HTTPException(400, {
                res: new Response("ID incorrect."),
            });
        }
    }

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
        const itagUrlParsed = new URL(itagUrl);
        let urlToRedirect = itagUrlParsed.toString();
        if (local) {
            urlToRedirect = itagUrlParsed.pathname + urlToRedirect.search +
                "&host=" + itagUrlParsed.host;
        }
        return c.redirect(urlToRedirect);
    }
});

export default latestVersion;
