import { Store } from "@willsoto/node-konfig-core";

export const getFetchClient = (konfigStore: Store): {
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    (input: Request | URL | string, init?: RequestInit & {
        client: Deno.HttpClient;
    }): Promise<Response>;
} => {
    if (Deno.env.get("PROXY") || konfigStore.get("networking.proxy")) {
        return async (
            input: RequestInfo | URL,
            init?: RequestInit,
        ) => {
            const client = Deno.createHttpClient({
                proxy: {
                    url: Deno.env.get("PROXY") || konfigStore.get("networking.proxy") as string,
                },
            });
            const fetchRes = await fetch(input, {
                client,
                headers: init?.headers,
                method: init?.method,
                body: init?.body,
            });
            return new Response(fetchRes.body, {
                status: fetchRes.status,
                headers: fetchRes.headers,
            });
        };
    }

    return globalThis.fetch;
};
