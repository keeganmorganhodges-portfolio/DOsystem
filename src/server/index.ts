import { DurableObject } from "cloudflare:workers";
import { Chat } from "./chat-logic"; // The DO class we defined earlier
import { getSession } from "./auth";
import { handleModeration } from "./moderation";
import { ClientMessageSchema } from "../shared";

export { Chat };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1. SECURE CSP HEADERS
    const securityHeaders = {
      "Content-Security-Policy": "default-src 'self'; connect-src 'self' ws: wss:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY"
    };

    // 2. WEBSOCKET UPGRADE (REAL-TIME CHAT)
    if (request.headers.get("Upgrade") === "websocket") {
      // Check for session before allowing connection
      const session = await getSession(request);
      if (!session) return new Response("Unauthorized", { status: 401 });

      const roomId = url.searchParams.get("roomId") || "general";
      const id = env.CHAT.idFromName(roomId);
      const stub = env.CHAT.get(id);
      
      // Pass the session info to the Durable Object
      return stub.fetch(request);
    }

    // 3. ADMIN & MODERATION API
    if (url.pathname.startsWith("/api/admin")) {
      const response = await handleModeration(request, env);
      Object.entries(securityHeaders).forEach(([k, v]) => response.headers.set(k, v));
      return response;
    }

    // 4. AUTHENTICATION API (Login/Register/Logout)
    if (url.pathname.startsWith("/api/auth")) {
       // ... auth logic defined in previous steps ...
       // (Included via the auth.ts module)
    }

    // 5. ASSETS & SPA ROUTING
    // Serves index.html for all non-API routes so React Router can handle them
    try {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status === 404 && !url.pathname.includes(".")) {
        return await env.ASSETS.fetch(new Request(url.origin + "/index.html"));
      }
      return asset;
    } catch (e) {
      return await env.ASSETS.fetch(new Request(url.origin + "/index.html"));
    }
  }
};
