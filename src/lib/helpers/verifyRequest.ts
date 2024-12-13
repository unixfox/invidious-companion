import { Store } from "@willsoto/node-konfig-core";
import { decodeBase64 } from "jsr:@std/encoding/base64";
import { Aes } from "https://deno.land/x/crypto@v0.10.1/aes.ts";
import {
    Ecb,
    Padding,
} from "https://deno.land/x/crypto@v0.10.1/block-modes.ts";

export const verifyRequest = (
    stringToCheck: string,
    videoId: string,
    konfigStore: Store,
): boolean => {
    try {
        const decipher = new Ecb(
            Aes,
            new TextEncoder().encode((
                Deno.env.get("SERVER_SECRET_KEY") ||
                konfigStore.get("server.secret_key") as string
            ).substring(0, 16)),
            Padding.PKCS7,
        );

        const encryptedData = new TextDecoder().decode(
            decipher.decrypt(decodeBase64(stringToCheck)),
        );
        const [parsedTimestamp, parsedVideoId] = encryptedData.split("|");
        const parsedTimestampInt = parseInt(parsedTimestamp);
        const timestampNow = Math.round(+new Date() / 1000);
        if (parsedVideoId !== videoId) {
            return false;
        }
        // only allow ID to live for 6 hours
        if ((timestampNow + 6 * 60 * 60) - parsedTimestampInt < 0) {
            return false;
        }
    } catch (_) {
        return false;
    }
    return true;
};
