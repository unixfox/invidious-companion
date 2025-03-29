import { assertEquals } from "./deps.ts";

export function dashManifest(baseUrl: string) {
    Deno.test("Check if it can generate a DASH manifest", async () => {
        const resp = await fetch(
            `${baseUrl}/api/manifest/dash/id/jNQXAC9IVRw?local=true&unique_res=1`,
            {
                method: "GET",
            },
        );

        await resp.body?.cancel();
        assertEquals(resp.status, 200);
    });
}
