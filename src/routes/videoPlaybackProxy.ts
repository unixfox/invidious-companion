import { Hono } from "hono";
import { Store } from "@willsoto/node-konfig-core";
import { getFetchClient } from "../lib/helpers/getFetchClient.ts";
import { HTTPException } from "hono/http-exception";

const videoPlaybackProxy = new Hono();

videoPlaybackProxy.get("/", async (c) => {
    const { host, c: client } = c.req.query();
    const urlReq = new URL(c.req.url);

    if (host == undefined || !/[\w-]+.googlevideo.com/.test(host)) {
        throw new HTTPException(400, {
            res: new Response("Host do not match or undefined."),
        });
    }

    // @ts-ignore Do not understand how to fix this error.
    const konfigStore = await c.get("konfigStore") as Store<
        Record<string, unknown>
    >;

    // deno-lint-ignore prefer-const
    let queryParams = new URLSearchParams(urlReq.search);
    queryParams.delete("host");
    queryParams.append("alr", "yes");
    if (c.req.header("range")) {
        queryParams.append(
            "range",
            (c.req.header("range") as string).split("=")[1],
        );
    }

    const headersToSend: HeadersInit = {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-us,en;q=0.5",
        "origin": "https://www.youtube.com",
        "referer": "https://www.youtube.com",
    };

    if (client == "ANDROID") {
        headersToSend["user-agent"] =
            "com.google.android.youtube/1537338816 (Linux; U; Android 13; en_US; ; Build/TQ2A.230505.002; Cronet/113.0.5672.24)";
    } else if (client == "IOS") {
        headersToSend["user-agent"] =
            "com.google.ios.youtube/19.32.8 (iPhone14,5; U; CPU iOS 17_6 like Mac OS X;)";
    } else {
        headersToSend["user-agent"] =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
    }

    const fetchClient = await getFetchClient(konfigStore);

    let googlevideoResponse = await fetchClient.call(
        undefined,
        `https://${host}/videoplayback?${queryParams.toString()}`,
        {
            method: "POST",
            body: new Uint8Array([0x78, 0]), // protobuf: { 15: 0 } (no idea what it means but this is what YouTube uses),
            headers: headersToSend,
        },
    );

    if (googlevideoResponse.headers.has("location")) {
        googlevideoResponse = await fetchClient.call(
            undefined,
            googlevideoResponse.headers.get("location") as string,
            {
                method: "POST",
                body: new Uint8Array([0x78, 0]), // protobuf: { 15: 0 } (no idea what it means but this is what YouTube uses)
                headers: headersToSend,
            },
        );
    }

    return new Response(googlevideoResponse.body, {
        status: googlevideoResponse.status,
        statusText: googlevideoResponse.statusText,
        headers: {
            "content-length":
                googlevideoResponse.headers.get("content-length") || "",
            "access-control-allow-origin": "*",
            "accept-ranges": googlevideoResponse.headers.get("accept-ranges") ||
                "",
            "cache-control": googlevideoResponse.headers.get("cache-control") ||
                "",
            "content-type": googlevideoResponse.headers.get("content-type") ||
                "",
            "expires": googlevideoResponse.headers.get("expires") || "",
            "last-modified": googlevideoResponse.headers.get("last-modified") ||
                "",
        },
    });
});

export default videoPlaybackProxy;
