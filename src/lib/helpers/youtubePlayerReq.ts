import { Innertube, ApiResponse } from "youtubei.js";
import { Store } from "@willsoto/node-konfig-core";
import NavigationEndpoint from "youtubei.js/NavigationEndpoint";

export const youtubePlayerReq = async (innertubeClient: Innertube, videoId: string, konfigStore: Store): Promise<ApiResponse> => {
    const innertubeClientOauthEnabled = konfigStore.get(
        "youtube_session.oauth_enabled",
      ) as boolean;
    
    let innertubeClientUsed = "WEB";
    if (innertubeClientOauthEnabled)
        innertubeClientUsed = "TV";
    
    const watch_endpoint = new NavigationEndpoint({ watchEndpoint: { videoId: videoId } });

    return await watch_endpoint.call(innertubeClient.actions, {
      playbackContext: {
        contentPlaybackContext: {
          vis: 0,
          splay: false,
          lactMilliseconds: '-1',
          signatureTimestamp: innertubeClient.session.player?.sts
        }
      },
      serviceIntegrityDimensions: {
        poToken: innertubeClient.session.po_token
      },
      innertubeClientUsed
    });
};
