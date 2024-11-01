import { BG } from "bgutils";
import type { BgConfig } from "bgutils";
import { JSDOM } from "jsdom";
import { Innertube, UniversalCache } from "youtubei.js";
import { Store } from "@willsoto/node-konfig-core";
import { getFetchClient } from "../helpers/getFetchClient.ts";

// Adapted from https://github.com/LuanRT/BgUtils/blob/main/examples/node/index.ts
export const poTokenGenerate = async (
    innertubeClient: Innertube,
    konfigStore: Store<Record<string, unknown>>,
    innertubeClientCache: UniversalCache
): Promise<Innertube> => {
    const requestKey = "O43z0dpjhgX20SCx4KAo";

    if (innertubeClient.session.po_token) {
        innertubeClient = await Innertube.create({ retrieve_player: false });
    }

    const visitorData = innertubeClient.session.context.client.visitorData;

    if (!visitorData) {
        throw new Error("Could not get visitor data");
    }

    const dom = new JSDOM();

    Object.assign(globalThis, {
        window: dom.window,
        document: dom.window.document,
    });

    const bgConfig: BgConfig = {
        fetch: (input: string | URL | globalThis.Request, init?: RequestInit) =>
            fetch(input, init),
        globalObj: globalThis,
        identifier: visitorData,
        requestKey,
    };

    const bgChallenge = await BG.Challenge.create(bgConfig);

    if (!bgChallenge) {
        throw new Error("Could not get challenge");
    }

    const interpreterJavascript = bgChallenge.interpreterJavascript
        .privateDoNotAccessOrElseSafeScriptWrappedValue;

    if (interpreterJavascript) {
        new Function(interpreterJavascript)();
    } else throw new Error("Could not load VM");

    const poTokenResult = await BG.PoToken.generate({
        program: bgChallenge.program,
        globalName: bgChallenge.globalName,
        bgConfig,
    });

    await BG.PoToken.generatePlaceholder(visitorData);;

    return (await Innertube.create({
        po_token: poTokenResult.poToken,
        visitor_data: visitorData,
        fetch: getFetchClient(konfigStore),
        cache: innertubeClientCache,
        generate_session_locally: true,
    }));
};
