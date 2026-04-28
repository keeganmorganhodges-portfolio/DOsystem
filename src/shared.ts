import { z } from "zod";

export const UserRole = z.enum(["user", "moderator", "admin"]);
export type UserRole = z.infer<typeof UserRole>;

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
}

export type SocketMessage =
  | { type: "ready"; user: UserProfile; history: any[] }
  | { type: "chat_message"; id: string; tempId?: string; content: string; user: string; userId: string; role: UserRole; timestamp: string }
  | { type: "typing"; user: string; userId: string; isTyping: boolean }
  | { type: "reaction"; messageId: string; emoji: string; userId: string }
  | { type: "delete_message"; messageId: string }
  | { type: "user_banned"; userId: string; reason: string }
  | { type: "error"; message: string };

// Zod validation for incoming client messages
export const ClientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("chat_message"),
    content: z.string().min(1).max(2000),
    tempId: z.string(),
    roomId: z.string()
  }),
  z.object({
    type: z.literal("typing"),
    isTyping: z.boolean(),
    roomId: z.string()
  }),
  z.object({
    type: z.literal("reaction"),
    messageId: z.string(),
    emoji: z.string(),
    roomId: z.string()
  })
]);
