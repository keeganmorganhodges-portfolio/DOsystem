import { DurableObject } from "cloudflare:workers";
import { z } from "zod";
import * as jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Validation Schemas
const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(8)
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const WSMsgSchema = z.object({
  type: z.enum(["add", "typing", "delete", "reaction"]),
  content: z.string().max(2000).optional(),
  roomId: z.string(),
  tempId: z.string().optional()
});

export class Chat extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request) {
    if (request.headers.get("Upgrade") !== "websocket") return new Response(null, { status: 400 });
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    return new Response(null, { status: 101, webSocketWait: pair[0] });
  }

  async webSocketMessage(ws: WebSocket, message: string) {
    const data = WSMsgSchema.parse(JSON.parse(message));
    const session = ws.deserialize(); // In production, verify user from DO attachment

    if (data.type === "typing") {
      this.broadcast({ type: "typing", user: session.username }, ws);
      return;
    }

    if (data.type === "add") {
      // Direct D1 write for persistence
      const id = crypto.randomUUID();
      await this.env.DB.prepare(
        "INSERT INTO messages (id, room_id, user_id, content) VALUES (?, ?, ?, ?)"
      ).bind(id, data.roomId, session.userId, data.content).run();

      this.broadcast({
        type: "add",
        id,
        tempId: data.tempId,
        content: data.content,
        user: session.username,
        timestamp: new Date().toISOString()
      });
    }
  }

  broadcast(msg: any, exclude?: WebSocket) {
    this.ctx.getWebSockets().forEach(client => {
      if (client !== exclude) client.send(JSON.stringify(msg));
    });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. WebSocket Routing
    if (request.headers.get("Upgrade") === "websocket") {
      const roomId = url.searchParams.get("roomId") || "general";
      const id = env.CHAT.idFromName(roomId);
      return env.CHAT.get(id).fetch(request);
    }

    // 2. Auth API
    if (url.pathname === "/api/auth/register") {
      const body = RegisterSchema.parse(await request.json());
      const hash = await bcrypt.hash(body.password, 10);
      await env.DB.prepare("INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)")
        .bind(body.email, body.username, hash).run();
      return Response.json({ success: true });
    }

    if (url.pathname === "/api/auth/login") {
      const body = LoginSchema.parse(await request.json());
      const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(body.email).first();
      if (!user || !(await bcrypt.compare(body.password, user.password_hash as string))) {
        return new Response("Invalid credentials", { status: 401 });
      }
      const token = jwt.sign({ userId: user.id, username: user.username }, env.JWT_SECRET);
      return new Response(JSON.stringify({ user }), {
        headers: { "Set-Cookie": `session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/` }
      });
    }

    // 3. Asset Serving (SPA Mode)
    return await env.ASSETS.fetch(request).catch(() => env.ASSETS.fetch(new Request(url.origin + "/index.html")));
  }
};
