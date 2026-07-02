import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rewriteRef } from "./converter";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category: string;
  sizes: string[];
  image_url: string | null;
  images: string[];
  quality: string | null;
  batch: string | null;
  contact_url: string | null;
  featured: boolean;
  is_verified: boolean;
  sort_order: number;
  agent_links: { usfans?: string; kakobuy?: string; litbuy?: string };
  created_at: string;
  updated_at: string;
};

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function getPublic() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((data: { category?: string; featuredOnly?: boolean } | undefined) => data ?? {})
  .handler(async ({ data }) => {
    const db = await getPublic();
    let q = db.from("products").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    if (data.category && data.category !== "all") q = q.eq("category", data.category);
    if (data.featuredOnly) q = q.eq("featured", true);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as Product[];
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => z.object({ slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const db = await getPublic();
    const { data: row, error } = await db.from("products").select("*").eq("slug", data.slug).maybeSingle();
    if (error) throw new Error(error.message);
    return row as Product | null;
  });

const productInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase, dashes, no spaces"),
  description: z.string().optional().nullable(),
  price: z.number().nonnegative(),
  original_price: z.number().nonnegative().optional().nullable(),
  category: z.string().min(1),
  sizes: z.array(z.string()).default([]),
  image_url: z.string().url().optional().nullable().or(z.literal("")),
  images: z.array(z.string().url()).default([]),
  quality: z.string().optional().nullable(),
  batch: z.string().optional().nullable(),
  contact_url: z.string().url().optional().nullable().or(z.literal("")),
  featured: z.boolean().default(false),
  is_verified: z.boolean().default(false).optional(),
  sort_order: z.number().int().default(0),
  agent_links: z
    .object({
      usfans: z.string().url().or(z.literal("")).optional(),
      kakobuy: z.string().url().or(z.literal("")).optional(),
      litbuy: z.string().url().or(z.literal("")).optional(),
    })
    .default({}),
});

function normalizeAgentLinks(links: { usfans?: string; kakobuy?: string; litbuy?: string } | undefined) {
  if (!links) return {};
  const out: { usfans?: string; kakobuy?: string; litbuy?: string } = {};
  if (links.usfans) out.usfans = rewriteRef(links.usfans);
  if (links.kakobuy) out.kakobuy = rewriteRef(links.kakobuy);
  if (links.litbuy) out.litbuy = rewriteRef(links.litbuy);
  return out;
}

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => productInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { requirePermission } = await import("./gate.server");
    await requirePermission("products.create");
    const admin = await getAdmin();
    const payload = {
      ...data,
      image_url: data.image_url || null,
      contact_url: data.contact_url || null,
      agent_links: normalizeAgentLinks(data.agent_links),
    };
    const { data: row, error } = await admin.from("products").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return row as Product;
  });

export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).and(productInputSchema).parse(data))
  .handler(async ({ data }) => {
    const { requirePermission } = await import("./gate.server");
    await requirePermission("products.edit");
    const admin = await getAdmin();
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      image_url: rest.image_url || null,
      contact_url: rest.contact_url || null,
      agent_links: normalizeAgentLinks(rest.agent_links),
    };
    const { data: row, error } = await admin.from("products").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return row as Product;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { requirePermission } = await import("./gate.server");
    await requirePermission("products.delete");
    const admin = await getAdmin();
    const { error } = await admin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setProductVerified = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), verified: z.boolean() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { requirePermission } = await import("./gate.server");
    await requirePermission("content.verify");
    const admin = await getAdmin();
    const { error } = await admin
      .from("products")
      .update({ is_verified: data.verified })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });