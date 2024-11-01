import { Innertube, ApiResponse } from "youtubei.js";
import { PlayerEndpoint } from "youtubei.js/endpoints";
import { Store } from "@willsoto/node-konfig-core";

export const youtubePlayerReq = async (innertubeClient: Innertube, videoId: string, konfigStore: Store): Promise<ApiResponse> => {
    const innertubeClientOauthEnabled = konfigStore.get(
        "youtube_session.oauth_enabled",
      ) as boolean;
    
    let innertubeClientUsed = "WEB";
    if (innertubeClientOauthEnabled)
        innertubeClientUsed = "TV";
    
    return await innertubeClient.actions.execute(
        PlayerEndpoint.PATH, PlayerEndpoint.build({
          video_id: videoId,
          // @ts-ignore Unable to import type InnerTubeClient
          client: innertubeClientUsed,
          sts: innertubeClient.session.player?.sts,
          po_token: innertubeClient.session.po_token
        })
      );
};
