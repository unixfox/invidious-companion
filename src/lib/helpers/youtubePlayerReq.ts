import { Innertube } from "youtubei.js";

export const youtubePlayerReq = async (innertubeClient: Innertube, videoId: string) => {
    return await innertubeClient.actions.execute("/player", {
        videoId: videoId,
    });
};
