import { getSession } from "./auth";

export async function handleModeration(request: Request, env: Env) {
  const session = await getSession(request);
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return new Response("Unauthorized", { status: 403 });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  // BAN USER
  if (path.startsWith("/api/admin/ban/") && request.method === "POST") {
    const targetUserId = path.split("/").pop();
    const { reason } = await request.json() as any;

    await env.DB.batch([
      env.DB.prepare("INSERT INTO moderation_logs (id, target_user_id, actor_user_id, action, reason) VALUES (?, ?, ?, 'ban', ?)")
        .bind(crypto.randomUUID(), targetUserId, session.id, reason),
      env.DB.prepare("UPDATE users SET role = 'user' WHERE id = ?").bind(targetUserId) // Example de-privilege
    ]);

    return Response.json({ success: true });
  }

  // DELETE MESSAGE
  if (path.startsWith("/api/admin/message/") && request.method === "DELETE") {
    const msgId = path.split("/").pop();
    await env.DB.prepare("DELETE FROM messages WHERE id = ?").bind(msgId).run();
    return Response.json({ success: true });
  }

  // AUDIT LOGS
  if (path === "/api/admin/audit") {
    const { results } = await env.DB.prepare("SELECT * FROM moderation_logs ORDER BY created_at DESC LIMIT 100").all();
    return Response.json(results);
  }

  return new Response("Not Found", { status: 404 });
}
