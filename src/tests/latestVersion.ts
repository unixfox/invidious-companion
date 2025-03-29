import { assertEquals } from "./deps.ts";

export function latestVersion(baseUrl: string) {
    Deno.test("Check if it can generate a valid URL for latest_version", async () => {
        const resp = await fetch(
            `${baseUrl}/latest_version?id=jNQXAC9IVRw&itag=18&local=true`,
            {
                method: "GET",
                headers: {
                    "content-range": "bytes=0-500",
                },
            },
        );

        await resp.body?.cancel();
        assertEquals(resp.status, 200);
    });
}
