import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function getIpFromHeaders(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") || headers.get("cf-connecting-ip") || "unknown";
}

async function hashIp(ip: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  const salt = process.env.SESSION_SECRET ?? "usfinds-stats-salt";
  return createHash("sha256").update(ip + "|" + salt).digest("hex");
}

async function getRequestIpHash(): Promise<string> {
  try {
    const server = (await import("@tanstack/react-start/server")) as unknown as {
      getRequestIP?: (opts?: { xForwardedFor?: boolean }) => string | undefined;
      getRequest?: () => Request;
    };
    let ip: string | undefined = server.getRequestIP?.({ xForwardedFor: true });
    if (!ip && server.getRequest) {
      try {
        ip = getIpFromHeaders(server.getRequest().headers);
      } catch { /* ignore */ }
    }
    return await hashIp(ip || "unknown");
  } catch {
    return await hashIp("unknown");
  }
}

export const trackPageVisit = createServerFn({ method: "POST" })
  .inputValidator((d: { path?: string }) =>
    z.object({ path: z.string().max(500).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    try {
      const { adminDb } = await import("./gate.server");
      const db = adminDb();
      const ipHash = await getRequestIpHash();
      await db.from("page_visits").insert({ ip_hash: ipHash, path: data.path ?? null });
      return { ok: true as const };
    } catch {
      return { ok: false as const };
    }
  });

export const trackLinkClick = createServerFn({ method: "POST" })
  .inputValidator((d: { productId?: string | null; agent: string }) =>
    z
      .object({
        productId: z.string().uuid().nullable().optional(),
        agent: z.string().min(1).max(40),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    try {
      const { adminDb } = await import("./gate.server");
      const db = adminDb();
      const ipHash = await getRequestIpHash();
      await db.from("link_clicks").insert({
        product_id: data.productId ?? null,
        agent: data.agent,
        ip_hash: ipHash,
      });
      return { ok: true as const };
    } catch {
      return { ok: false as const };
    }
  });

export type StatsSummary = {
  totalVisits: number;
  uniqueVisitors: number;
  visitors24h: number;
  visitors7d: number;
  totalClicks: number;
  clicksByAgent: Record<string, number>;
  topProducts: Array<{
    productId: string | null;
    name: string;
    clicks: number;
    byAgent: Record<string, number>;
  }>;
};

export const getStatsSummary = createServerFn({ method: "GET" }).handler(
  async (): Promise<StatsSummary> => {
    const { requirePermission, adminDb } = await import("./gate.server");
    await requirePermission("stats.view");
    const db = adminDb();

    const [{ count: totalVisits }, visitsAll, { count: totalClicks }, clicksAll, productsRes] =
      await Promise.all([
        db.from("page_visits").select("*", { count: "exact", head: true }),
        db.from("page_visits").select("ip_hash,created_at").limit(50000),
        db.from("link_clicks").select("*", { count: "exact", head: true }),
        db.from("link_clicks").select("agent,product_id").limit(50000),
        db.from("products").select("id,name"),
      ]);

    const uniq = new Set<string>();
    const now = Date.now();
    const d1 = new Set<string>();
    const d7 = new Set<string>();
    for (const v of visitsAll.data ?? []) {
      uniq.add(v.ip_hash as string);
      const t = new Date(v.created_at as string).getTime();
      if (now - t < 24 * 3600 * 1000) d1.add(v.ip_hash as string);
      if (now - t < 7 * 24 * 3600 * 1000) d7.add(v.ip_hash as string);
    }

    const nameById = new Map<string, string>(
      (productsRes.data ?? []).map((p) => [p.id as string, p.name as string]),
    );

    const clicksByAgent: Record<string, number> = {};
    const perProduct = new Map<
      string | null,
      { total: number; byAgent: Record<string, number> }
    >();
    for (const c of clicksAll.data ?? []) {
      const agent = c.agent as string;
      clicksByAgent[agent] = (clicksByAgent[agent] ?? 0) + 1;
      const pid = (c.product_id as string | null) ?? null;
      const entry = perProduct.get(pid) ?? { total: 0, byAgent: {} };
      entry.total += 1;
      entry.byAgent[agent] = (entry.byAgent[agent] ?? 0) + 1;
      perProduct.set(pid, entry);
    }

    const topProducts = Array.from(perProduct.entries())
      .map(([pid, v]) => ({
        productId: pid,
        name: pid ? nameById.get(pid) ?? "(usunięty)" : "(nieprzypisane)",
        clicks: v.total,
        byAgent: v.byAgent,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 50);

    return {
      totalVisits: totalVisits ?? 0,
      uniqueVisitors: uniq.size,
      visitors24h: d1.size,
      visitors7d: d7.size,
      totalClicks: totalClicks ?? 0,
      clicksByAgent,
      topProducts,
    };
  },
);