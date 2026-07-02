import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AdminSession =
  | { authenticated: false; banned?: { reason: string } }
  | {
      authenticated: true;
      role: "super" | "editor";
      username: string;
      discordId: string;
      permissions: string[];
    };

export const checkAdminSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminSession> => {
    const { openSession, adminDb } = await import("./gate.server");
    const s = await openSession();
    if (!s.data.adminId || !s.data.role) return { authenticated: false };
    const db = adminDb();
    const { data } = await db
      .from("admins")
      .select("is_banned, ban_reason, permissions, role, username, discord_id")
      .eq("id", s.data.adminId)
      .maybeSingle();
    if (!data) {
      await s.clear();
      return { authenticated: false };
    }
    if (data.is_banned) {
      await s.clear();
      return { authenticated: false, banned: { reason: data.ban_reason || "Złamanie regulaminu" } };
    }
    return {
      authenticated: true,
      role: data.role as "super" | "editor",
      username: data.username,
      discordId: data.discord_id,
      permissions: data.permissions ?? [],
    };
  },
);

export const loginAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { discordId: string; password: string }) =>
    z.object({ discordId: z.string().min(1), password: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { openSession, verifyAdminCredentials } = await import("./gate.server");
    const admin = await verifyAdminCredentials(data.discordId.trim(), data.password);
    if (!admin) return { ok: false as const };
    if (admin.is_banned) {
      return {
        ok: false as const,
        banned: true as const,
        reason: admin.ban_reason || "Złamanie regulaminu",
      };
    }
    const session = await openSession();
    await session.update({
      adminId: admin.id,
      discordId: admin.discord_id,
      username: admin.username,
      role: admin.role as "super" | "editor",
      permissions: admin.permissions ?? [],
    });
    return { ok: true as const, role: admin.role, username: admin.username };
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { openSession } = await import("./gate.server");
  const s = await openSession();
  await s.clear();
  return { ok: true as const };
});