import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "crypto";

export type Outfit = {
  id: string;
  author: string;
  title: string;
  description: string | null;
  image_url: string;
  items: { name: string; url: string }[];
  views: number;
  likes: number;
  is_hidden: boolean;
  is_verified: boolean;
  created_at: string;
};

async function getPublic() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

function hashIp(ip: string | null) {
  return createHash("sha256")
    .update((ip ?? "anon") + "|" + (process.env.SESSION_SECRET ?? "s"))
    .digest("hex");
}

async function getIp() {
  try {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const xff = getRequestHeader("x-forwarded-for");
    if (xff) return xff.split(",")[0]!.trim();
    return getRequestHeader("cf-connecting-ip") ?? null;
  } catch {
    return null;
  }
}

export const listOutfits = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getPublic();
  const { data, error } = await db
    .from("outfits")
    .select("*")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as Outfit[];
});

const createSchema = z.object({
  author: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  image_url: z.string().url(),
  items: z
    .array(z.object({ name: z.string().trim().min(1).max(80), url: z.string().url() }))
    .max(20)
    .default([]),
});

export const createOutfit = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data }) => {
    const db = await getPublic();
    const { data: row, error } = await db.from("outfits").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row as Outfit;
  });

export const likeOutfit = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const db = await getPublic();
    const ipHash = hashIp(await getIp());
    const { error } = await db.from("outfit_likes").insert({ outfit_id: data.id, ip_hash: ipHash });
    if (error && !error.message.includes("duplicate")) {
      // Allow duplicate → already liked, silent
    }
    const { data: row } = await db.from("outfits").select("likes").eq("id", data.id).maybeSingle();
    return { ok: true as const, likes: row?.likes ?? 0 };
  });

export const viewOutfit = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const db = await getPublic();
    const { data: row } = await db.from("outfits").select("views").eq("id", data.id).maybeSingle();
    const current = row?.views ?? 0;
    await db.from("outfits").update({ views: current + 1 }).eq("id", data.id);
    return { views: current + 1 };
  });

export const listOutfitsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin, adminDb } = await import("./gate.server");
  await requireAdmin();
  const db = adminDb();
  const { data, error } = await db
    .from("outfits")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as Outfit[];
});

export const setOutfitVerified = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), verified: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { requirePermission, adminDb } = await import("./gate.server");
    await requirePermission("content.verify");
    const db = adminDb();
    const { error } = await db
      .from("outfits")
      .update({ is_verified: data.verified })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteOutfit = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { requirePermission, adminDb } = await import("./gate.server");
    await requirePermission("content.verify");
    const db = adminDb();
    const { error } = await db.from("outfits").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });