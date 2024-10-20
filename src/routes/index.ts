import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { logger } from "hono/logger";
import config from 'node-config';

import youtube_route_player from "./youtube_routes/player.ts";

export const routes = (app: Hono) => {
  app.use("*", logger());

  app.use(
    "/youtubei/v1/*",
    bearerAuth({
      token: config.get("server.hmac_key"),
    }),
  );

  app.route("/youtubei/v1", youtube_route_player);
};
