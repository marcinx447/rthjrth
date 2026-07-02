import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type Json = string | number | boolean | null | { [k: string]: Json | undefined } | Json[];

export type BackupRow = {
  id: string;
  product_id: string | null;
  reason: string;
  created_at: string;
  snapshot: Json;
};

export const listBackups = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./gate.server");
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("product_backups")
    .select("id,product_id,reason,created_at,snapshot")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as BackupRow[];
});

export const exportProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { requirePermission } = await import("./gate.server");
  await requirePermission("products.export");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("products").select("*");
  if (error) throw new Error(error.message);
  return { exported_at: new Date().toISOString(), products: data ?? [] };
});

const importSchema = z.object({
  items: z.array(z.record(z.string(), z.any())),
  mode: z.enum(["merge", "replace"]).default("merge"),
});

export const importProducts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => importSchema.parse(d))
  .handler(async ({ data }) => {
    const { requirePermission } = await import("./gate.server");
    await requirePermission("products.import");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cleaned = data.items.map((p) => {
      const { id: _id, created_at: _c, updated_at: _u, ...rest } = p as Record<string, unknown>;
      return rest;
    });
    if (data.mode === "replace") {
      await supabaseAdmin
        .from("products")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
    }
    let inserted = 0;
    let failed = 0;
    for (const item of cleaned) {
      const { error } = await supabaseAdmin.from("products").insert(item as never);
      if (error) failed++;
      else inserted++;
    }
    await supabaseAdmin
      .from("product_backups")
      .insert({
        snapshot: { import: cleaned, at: new Date().toISOString() } as never,
        reason: "import",
      });
    return { ok: true as const, inserted, failed };
  });