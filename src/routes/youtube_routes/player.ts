import { Hono } from "hono";
import { Innertube, YT } from "youtubei.js";
import { compress, decompress } from "https://deno.land/x/brotli/mod.ts";
import { HonoVariables } from "../../lib/types/HonoVariables.ts";
import { youtubePlayerReq } from "../../lib/helpers/youtubePlayerReq.ts";
import Config from "node-config";

const player = new Hono<{ Variables: HonoVariables }>();

const kv = await Deno.openKv();

player.post("/player", async (c) => {
  const jsonReq = await c.req.json();
  if (jsonReq.videoId) {
    const reqVideoId = jsonReq.videoId;
    const innertubeClient: Innertube = await c.get("innertubeClient");
    // @ts-ignore Do not understand how to fix this error.
    const config: Config = await c.get("config") as Config;
    const videoCached = (await kv.get(["video_cache", reqVideoId]))
      .value as Uint8Array;

    if (videoCached != null) {
      return c.json(
        JSON.parse(new TextDecoder().decode(decompress(videoCached))),
      );
    } else {
      const youtubePlayerResponse = await youtubePlayerReq(
        innertubeClient,
        reqVideoId,
      );
      const videoData = youtubePlayerResponse.data;

      const video = new YT.VideoInfo(
        [youtubePlayerResponse],
        innertubeClient.actions,
        "",
      );

      const streamingData = video.streaming_data;

      if (streamingData && videoData && videoData.streamingData) {
        streamingData.adaptive_formats;
        for (const [index, format] of streamingData.formats.entries()) {
          videoData.streamingData.formats[index].url = format.decipher(
            innertubeClient.session.player,
          );
          if (
            videoData.streamingData.formats[index].signatureCipher !== undefined
          ) {
            delete videoData.streamingData.formats[index].signatureCipher;
          }
        }
        for (
          const [index, adaptive_format] of streamingData.adaptive_formats
            .entries()
        ) {
          videoData.streamingData.adaptiveFormats[index].url = adaptive_format
            .decipher(
              innertubeClient.session.player,
            );
          if (
            videoData.streamingData.adaptiveFormats[index].signatureCipher !==
              undefined
          ) {
            delete videoData.streamingData.adaptiveFormats[index]
              .signatureCipher;
          }
        }
      }
      const videoOnlyNecessaryInfo = ((
        {
          captions,
          playabilityStatus,
          storyboards,
          streamingData,
          videoDetails,
          microformat,
        },
      ) => ({
        captions,
        playabilityStatus,
        storyboards,
        streamingData,
        videoDetails,
        microformat,
      }))(videoData);
      if (config.get("cache.enabled") == true) {
        (async () => {
          await kv.set(
            ["video_cache", reqVideoId],
            compress(
              new TextEncoder().encode(JSON.stringify(videoOnlyNecessaryInfo)),
            ),
            {
              expireIn: 1000 * 60 * 60,
            },
          );
        })();
      }
      return c.json(videoOnlyNecessaryInfo);
    }
  }
});

export default player;
