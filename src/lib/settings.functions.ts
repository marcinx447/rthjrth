import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type SiteSettings = {
  maintenance_mode: boolean;
  maintenance_message: string;
  announcement: string | null;
  announcement_active: boolean;
  popup_active: boolean;
  popup_title: string;
  popup_message: string;
  promo_active: boolean;
  promo_title: string;
  promo_message: string;
  promo_cta_label: string;
  promo_link: string;
  promo_logo: "usfinds" | "usfans" | "kakobuy" | "litbuy";
};

async function getPublic() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getPublic();
  const { data } = await db
    .from("site_settings")
    .select("maintenance_mode,maintenance_message,announcement,announcement_active,popup_active,popup_title,popup_message,promo_active,promo_title,promo_message,promo_cta_label,promo_link,promo_logo")
    .eq("id", 1)
    .maybeSingle();
  return (data ?? {
    maintenance_mode: false,
    maintenance_message: "Przerwa techniczna — wracamy wkrótce.",
    announcement: null,
    announcement_active: false,
    popup_active: false,
    popup_title: "Ważne ogłoszenie",
    popup_message: "",
    promo_active: false,
    promo_title: "Claim your -40% code!",
    promo_message: "",
    promo_cta_label: "Register now",
    promo_link: "",
    promo_logo: "usfinds",
  }) as SiteSettings;
});

const settingsSchema = z.object({
  maintenance_mode: z.boolean().optional(),
  maintenance_message: z.string().optional(),
  announcement: z.string().nullable().optional(),
  announcement_active: z.boolean().optional(),
  popup_active: z.boolean().optional(),
  popup_title: z.string().optional(),
  popup_message: z.string().optional(),
  promo_active: z.boolean().optional(),
  promo_title: z.string().optional(),
  promo_message: z.string().optional(),
  promo_cta_label: z.string().optional(),
  promo_link: z.string().optional(),
  promo_logo: z.enum(["usfinds", "usfans", "kakobuy", "litbuy"]).optional(),
});

export const updateSiteSettings = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => settingsSchema.parse(d))
  .handler(async ({ data }) => {
    const { requirePermission, requireAdmin } = await import("./gate.server");
    // Maintenance & announcement are separate permissions. Allow if user has at least one
    // relevant permission OR is super. We require admin first; specific permission check
    // is enforced by which fields are present.
    const session = await requireAdmin();
    if (session.data.role !== "super") {
      if (data.maintenance_mode !== undefined || data.maintenance_message !== undefined) {
        await requirePermission("maintenance.manage");
      }
      if (
        data.announcement !== undefined ||
        data.announcement_active !== undefined ||
        data.popup_active !== undefined ||
        data.popup_title !== undefined ||
        data.popup_message !== undefined ||
        data.promo_active !== undefined ||
        data.promo_title !== undefined ||
        data.promo_message !== undefined ||
        data.promo_cta_label !== undefined ||
        data.promo_link !== undefined ||
        data.promo_logo !== undefined
      ) {
        await requirePermission("announcements.manage");
      }
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });