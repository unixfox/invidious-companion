import { assertEquals } from "./deps.ts";

export function latestVersion(baseUrl: string) {
    Deno.test("Check if it can generate a valid URL for latest_version", async () => {
        const resp = await fetch(
            `${baseUrl}/latest_version?id=jNQXAC9IVRw&itag=18&local=true`,
            {
                method: "GET",
                redirect: "manual",
            },
        );

        await resp.body?.cancel();
        assertEquals(resp.status, 302);
    });
}
