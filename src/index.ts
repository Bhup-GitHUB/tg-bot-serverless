import { webhookCallback } from "grammy";
import { buildBot } from "./bot";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/webhook") {
      const bot = buildBot(env);
      const handler = webhookCallback(bot, "cloudflare-mod", {
        secretToken: env.WEBHOOK_SECRET,
      });
      return handler(request);
    }

    return new Response("ok");
  },
};
