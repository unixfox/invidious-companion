import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Innertube } from "youtubei.js";
import { HonoVariables } from "../../lib/types/HonoVariables.ts";
import { Store } from "@willsoto/node-konfig-core";
import {
    youtubePlayerParsing,
    youtubeVideoInfo,
} from "../../lib/helpers/youtubePlayerHandling.ts";

const dashManifest = new Hono<{ Variables: HonoVariables }>();

dashManifest.get("/:videoId", async (c) => {
    const { videoId } = c.req.param();
    const { local } = c.req.query();
    c.header("access-control-allow-origin", "*");

    const innertubeClient = await c.get("innertubeClient") as Innertube;
    // @ts-ignore Do not understand how to fix this error.
    const konfigStore = await c.get("konfigStore") as Store<
        Record<string, unknown>
    >;

    const youtubePlayerResponseJson = await youtubePlayerParsing(
        innertubeClient,
        videoId,
        konfigStore,
    );
    const videoInfo = youtubeVideoInfo(
        innertubeClient,
        youtubePlayerResponseJson,
    );

    if (videoInfo.playability_status?.status !== "OK") {
        throw ("The video can't be played: " + videoId + " due to reason: " +
            videoInfo.playability_status?.reason);
    }

    c.header("content-type", "application/dash+xml");

    if (videoInfo.streaming_data) {
        videoInfo.streaming_data.adaptive_formats = videoInfo
            .streaming_data.adaptive_formats
            .filter((i) => i.mime_type.includes("mp4"));

        const dashFile = await videoInfo.toDash(
            (url) => {
                if (local) {
                    const dashUrl = url.pathname + url.search + "&host=" +
                        url.host;
                    // Can't create URL type without host part
                    return dashUrl as unknown as URL;
                } else {
                    return url;
                }
            },
        );
        return c.text(dashFile);
    }
});

export default dashManifest;
