import { Hono } from "hono";
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
            // @ts-ignore URL is the same type as URLTransformer
            (url: URL) => {
                const selectedItagFormat = videoInfo.streaming_data
                    ?.adaptive_formats?.filter((i) => {
                        if (
                            i.itag == Number(url.searchParams.get("itag")) &&
                            i.is_drc === undefined
                        ) {
                            return true;
                        } else if (
                            url.searchParams.has("xtags")
                        ) {
                            if (
                                i.itag ==
                                    Number(url.searchParams.get("itag")) &&
                                url.searchParams.get("xtags")?.includes(
                                    i.language || "",
                                ) &&
                                i.is_drc === url.search.includes("drc")
                            ) {
                                return true;
                            } else if (
                                i.itag ==
                                    Number(url.searchParams.get("itag")) &&
                                i.is_drc === url.search.includes("drc")
                            ) {
                                return true;
                            } else {
                                return true;
                            }
                        } else if (
                            i.itag ==
                                Number(url.searchParams.get("itag")) &&
                            i.is_drc === url.search.includes("drc")
                        ) {
                            return true;
                        }
                    });
                if (selectedItagFormat) {
                    let dashUrl = new URL(selectedItagFormat[0].url as string);
                    if (url.toString().includes("140")) {
                        console.log(url.toString());
                        console.log(dashUrl.toString());
                        console.log(selectedItagFormat[0]);
                    }
                    if (local) {
                        // Can't create URL type without host part
                        dashUrl =
                            (dashUrl.pathname + dashUrl.search + "&host=" +
                                dashUrl.host) as unknown as URL;
                        if (konfigStore.get("networking.ump") as boolean) {
                            dashUrl = dashUrl + "&ump=1" as unknown as URL;
                        }
                        return dashUrl;
                    } else {
                        return dashUrl;
                    }
                }
            },
        );
        return c.text(dashFile.replaceAll("&amp;", "&"));
    }
});

export default dashManifest;
