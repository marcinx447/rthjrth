import { useSession } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

export type AdminRole = "super" | "editor";
export type AdminPermission =
  | "products.create"
  | "products.edit"
  | "products.delete"
  | "products.import"
  | "products.export"
  | "announcements.manage"
  | "maintenance.manage"
  | "stats.view"
  | "content.verify"
  | "admins.manage";

export const ALL_PERMISSIONS: AdminPermission[] = [
  "products.create",
  "products.edit",
  "products.delete",
  "products.import",
  "products.export",
  "announcements.manage",
  "maintenance.manage",
  "stats.view",
  "content.verify",
];

export type GateSession = {
  adminId?: string;
  discordId?: string;
  username?: string;
  role?: AdminRole;
  permissions?: string[];
};

function getSessionConfig() {
  return {
    password:
      process.env.SESSION_SECRET ??
      "dev-fallback-session-secret-please-change-1234567890",
    name: "usfinds-admin",
    maxAge: 60 * 60 * 24 * 7,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export function openSession() {
  return useSession<GateSession>(getSessionConfig());
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let m = 0;
  for (let i = 0; i < a.length; i++) m |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return m === 0;
}

export function adminDb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export type AdminRowFull = {
  id: string;
  discord_id: string;
  username: string;
  password: string;
  role: AdminRole;
  permissions: string[];
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
  created_at: string;
};

export async function verifyAdminCredentials(discordId: string, password: string) {
  const db = adminDb();
  const { data, error } = await db
    .from("admins")
    .select("id, discord_id, username, password, role, permissions, is_banned, ban_reason, banned_at")
    .eq("discord_id", discordId)
    .maybeSingle();
  if (error || !data) return null;
  if (!constantTimeEqual(data.password, password)) return null;
  return data as AdminRowFull;
}

export async function requireAdmin() {
  const session = await openSession();
  if (!session.data.adminId) throw new Error("UNAUTHORIZED");
  // Re-check ban on every privileged call
  const db = adminDb();
  const { data } = await db
    .from("admins")
    .select("is_banned")
    .eq("id", session.data.adminId)
    .maybeSingle();
  if (!data || data.is_banned) {
    await session.clear();
    throw new Error("BANNED");
  }
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireAdmin();
  if (session.data.role !== "super") throw new Error("FORBIDDEN");
  return session;
}

export async function requirePermission(perm: AdminPermission) {
  const session = await requireAdmin();
  if (session.data.role === "super") return session;
  if (!session.data.permissions?.includes(perm)) {
    throw new Error(`FORBIDDEN: brak uprawnienia ${perm}`);
  }
  return session;
}