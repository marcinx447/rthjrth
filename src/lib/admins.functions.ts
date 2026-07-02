import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AdminRow = {
  id: string;
  discord_id: string;
  username: string;
  role: "super" | "editor";
  permissions: string[];
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
  created_at: string;
};

export const listAdmins = createServerFn({ method: "GET" }).handler(async (): Promise<AdminRow[]> => {
  const { requireSuperAdmin, adminDb } = await import("./gate.server");
  await requireSuperAdmin();
  const db = adminDb();
  const { data, error } = await db
    .from("admins")
    .select("id, discord_id, username, role, permissions, is_banned, ban_reason, banned_at, created_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminRow[];
});

const createSchema = z.object({
  discordId: z.string().min(3).max(64),
  username: z.string().min(1).max(64),
  password: z.string().min(4).max(128),
  role: z.enum(["super", "editor"]).default("editor"),
  permissions: z.array(z.string()).default([]),
});

export const createAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data }) => {
    const { requireSuperAdmin, adminDb } = await import("./gate.server");
    await requireSuperAdmin();
    const db = adminDb();
    const { error } = await db.from("admins").insert({
      discord_id: data.discordId.trim(),
      username: data.username.trim(),
      password: data.password,
      role: data.role,
      permissions: data.permissions,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1).max(64).optional(),
  password: z.string().min(4).max(128).optional(),
  role: z.enum(["super", "editor"]).optional(),
  permissions: z.array(z.string()).optional(),
});

export const updateAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data }) => {
    const { requireSuperAdmin, adminDb } = await import("./gate.server");
    await requireSuperAdmin();
    const db = adminDb();
    const payload: Record<string, unknown> = {};
    if (data.username !== undefined) payload.username = data.username.trim();
    if (data.password !== undefined && data.password.length > 0) payload.password = data.password;
    if (data.role !== undefined) payload.role = data.role;
    if (data.permissions !== undefined) payload.permissions = data.permissions;
    if (Object.keys(payload).length === 0) return { ok: true as const };
    const { error } = await db.from("admins").update(payload).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

const banSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1).max(500).default("Złamanie regulaminu"),
});

export const banAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => banSchema.parse(d))
  .handler(async ({ data }) => {
    const { requireSuperAdmin, adminDb } = await import("./gate.server");
    const session = await requireSuperAdmin();
    if (session.data.adminId === data.id) {
      throw new Error("Nie możesz zbanować samego siebie.");
    }
    const db = adminDb();
    const { error } = await db
      .from("admins")
      .update({
        is_banned: true,
        ban_reason: data.reason || "Złamanie regulaminu",
        banned_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const unbanAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { requireSuperAdmin, adminDb } = await import("./gate.server");
    await requireSuperAdmin();
    const db = adminDb();
    const { error } = await db
      .from("admins")
      .update({ is_banned: false, ban_reason: null, banned_at: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { requireSuperAdmin, adminDb } = await import("./gate.server");
    const session = await requireSuperAdmin();
    if (session.data.adminId === data.id) {
      throw new Error("Nie możesz usunąć samego siebie.");
    }
    const db = adminDb();
    const { error } = await db.from("admins").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });