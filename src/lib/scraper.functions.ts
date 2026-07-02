import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ScrapedProduct = {
  ok: boolean;
  title?: string;
  description?: string;
  image?: string;
  images: string[];
  price?: number;
  currency?: string;
  source_url: string;
  error?: string;
};

function pickMeta(html: string, names: string[]): string | undefined {
  for (const n of names) {
    // <meta property|name="X" content="Y">
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*content=["']([^"']+)["']`,
      "i",
    );
    const m = html.match(re);
    if (m) return decodeEntities(m[1]);
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
      "i",
    );
    const m2 = html.match(re2);
    if (m2) return decodeEntities(m2[1]);
  }
  return undefined;
}

function pickAllMeta(html: string, name: string): string[] {
  const out: string[] = [];
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`,
    "gi",
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(decodeEntities(m[1]));
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractPrice(html: string): { value?: number; currency?: string } {
  const og = pickMeta(html, ["og:price:amount", "product:price:amount", "twitter:data1"]);
  if (og) {
    const num = parseFloat(og.replace(/[^\d.,]/g, "").replace(",", "."));
    if (!Number.isNaN(num)) {
      return {
        value: num,
        currency: pickMeta(html, ["og:price:currency", "product:price:currency"]),
      };
    }
  }
  // Best-effort regex
  const m = html.match(/(?:￥|¥|CNY|RMB|\$|USD|EUR|PLN|zł)\s*([\d.,]+)/i);
  if (m) {
    const num = parseFloat(m[1].replace(/[^\d.]/g, ""));
    if (!Number.isNaN(num)) return { value: num };
  }
  return {};
}

export const scrapeProductInfo = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) =>
    z.object({ url: z.string().url().max(2000) }).parse(d),
  )
  .handler(async ({ data }): Promise<ScrapedProduct> => {
    const { requireAdmin } = await import("./gate.server");
    await requireAdmin();
    try {
      const res = await fetch(data.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9,pl;q=0.8",
        },
        redirect: "follow",
      });
      if (!res.ok) {
        return { ok: false, images: [], source_url: data.url, error: `HTTP ${res.status}` };
      }
      const html = (await res.text()).slice(0, 1_500_000);
      const title =
        pickMeta(html, ["og:title", "twitter:title"]) ??
        html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
      const description = pickMeta(html, ["og:description", "twitter:description", "description"]);
      const images = pickAllMeta(html, "og:image");
      // For usfans / usfinds product pages: try to also collect QC / gallery images
      // by scanning the HTML for their CDN patterns.
      try {
        const host = new URL(data.url).hostname;
        if (/usfans\.com|usfinds\./i.test(host)) {
          const extra = new Set<string>();
          const cdnRe = /https?:\/\/[^"'\s)]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s)]*)?/gi;
          let m: RegExpExecArray | null;
          while ((m = cdnRe.exec(html))) {
            const u = m[0];
            // filter icons / very small assets, prefer product / QC-ish
            if (/icon|favicon|sprite|logo|placeholder/i.test(u)) continue;
            extra.add(u);
            if (extra.size > 24) break;
          }
          for (const u of extra) if (!images.includes(u)) images.push(u);
        }
      } catch { /* ignore */ }
      const image = images[0];
      const { value, currency } = extractPrice(html);
      return {
        ok: true,
        title: title ? decodeEntities(title).trim() : undefined,
        description,
        image,
        images,
        price: value,
        currency,
        source_url: data.url,
      };
    } catch (e) {
      return {
        ok: false,
        images: [],
        source_url: data.url,
        error: e instanceof Error ? e.message : "Fetch failed",
      };
    }
  });