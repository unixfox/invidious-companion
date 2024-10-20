import { Innertube, ApiResponse } from "youtubei.js";

export const youtubePlayerReq = async (innertubeClient: Innertube, videoId: string): Promise<ApiResponse> => {
    return await innertubeClient.actions.execute("/player", {
        videoId: videoId,
    });
};
