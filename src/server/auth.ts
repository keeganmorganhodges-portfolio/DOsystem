import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose"; // Cloudflare prefers 'jose' over 'jsonwebtoken'

const SECRET = new TextEncoder().encode("replace_with_env_variable_secret");

export async function createSession(user: any): Promise<string> {
  return await new SignJWT({ 
      id: user.id, 
      username: user.username, 
      role: user.role 
    })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function getSession(request: Request): Promise<any | null> {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return null;

  const token = cookie.split("; ").find(row => row.startsWith("session="))?.split("=")[1];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch (e) {
    return null;
  }
}

export function authResponse(data: any, token: string) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `session=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`
    }
  });
}
