// Pure link-converter logic shared by client and server.
// Source patterns recognized: usfans, kakobuy, litbuy, weidian, taobao, 1688.
// Outputs links for usfans / kakobuy / litbuy with our ref codes applied.

export const REFS = {
  usfans: "JCWKHX",
  kakobuy: "ogprzecin3k",
  // litbuy: brak ref
} as const;

export type AgentKey = "usfans" | "kakobuy" | "litbuy";

export type ParsedLink = {
  source: "usfans" | "kakobuy" | "litbuy" | "weidian" | "taobao" | "1688" | "unknown";
  /** Underlying upstream URL (weidian/taobao/1688) if available */
  underlying?: string;
  /** USFans internal product id + type ('1','2','3' itp.) when source is usfans */
  usfans?: { type: string; id: string };
  raw: string;
};

function safeUrl(u: string): URL | null {
  try {
    const trimmed = u.trim();
    return new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
}

export function parseLink(input: string): ParsedLink {
  const raw = input.trim();
  const url = safeUrl(raw);
  if (!url) return { source: "unknown", raw };
  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  // USFans: usfans.com/product/<type>/<id>
  if (host.endsWith("usfans.com")) {
    const m = url.pathname.match(/\/product\/(\d+)\/(\d+)/);
    if (m) return { source: "usfans", usfans: { type: m[1], id: m[2] }, raw };
    return { source: "usfans", raw };
  }

  // Kakobuy / Litbuy: ?url=<encoded original>
  if (host.endsWith("kakobuy.com") || host.endsWith("litbuy.com")) {
    const inner = url.searchParams.get("url");
    if (inner) {
      try {
        return {
          source: host.endsWith("kakobuy.com") ? "kakobuy" : "litbuy",
          underlying: decodeURIComponent(inner),
          raw,
        };
      } catch {
        return {
          source: host.endsWith("kakobuy.com") ? "kakobuy" : "litbuy",
          underlying: inner,
          raw,
        };
      }
    }
    return { source: host.endsWith("kakobuy.com") ? "kakobuy" : "litbuy", raw };
  }

  if (host.endsWith("weidian.com")) return { source: "weidian", underlying: raw, raw };
  if (host.endsWith("taobao.com") || host.endsWith("tmall.com")) {
    return { source: "taobao", underlying: raw, raw };
  }
  if (host.endsWith("1688.com")) return { source: "1688", underlying: raw, raw };

  return { source: "unknown", raw };
}

function setOrReplaceParam(url: URL, key: string, value: string) {
  url.searchParams.set(key, value);
}

/** Rewrite ref/affcode on already-built agent links (used in admin panel "fix refs"). */
export function rewriteRef(link: string): string {
  const url = safeUrl(link);
  if (!url) return link;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host.endsWith("usfans.com")) {
    setOrReplaceParam(url, "ref", REFS.usfans);
    return url.toString();
  }
  if (host.endsWith("kakobuy.com")) {
    setOrReplaceParam(url, "affcode", REFS.kakobuy);
    return url.toString();
  }
  if (host.endsWith("litbuy.com")) {
    url.searchParams.delete("affcode");
    url.searchParams.delete("ref");
    return url.toString();
  }
  return link;
}

export type ConvertedLinks = {
  usfans?: string;
  kakobuy?: string;
  litbuy?: string;
};

/** Build a fully-formed link for each agent from a parsed source. */
export function buildLinks(parsed: ParsedLink): ConvertedLinks {
  const out: ConvertedLinks = {};

  // USFans output requires usfans internal id, otherwise we can't make a direct product link.
  if (parsed.source === "usfans" && parsed.usfans) {
    out.usfans = `https://www.usfans.com/product/${parsed.usfans.type}/${parsed.usfans.id}?ref=${REFS.usfans}`;
  }

  const underlying = parsed.underlying;
  if (underlying) {
    const enc = encodeURIComponent(underlying);
    out.kakobuy = `https://www.kakobuy.com/item/details?url=${enc}&affcode=${REFS.kakobuy}`;
    out.litbuy = `https://www.litbuy.com/item/details?url=${enc}`;
  }

  return out;
}

/** Combine 1+ input links and return the best per-agent links we can construct. */
export function convertLinks(inputs: string[]): ConvertedLinks {
  const merged: ConvertedLinks = {};
  for (const input of inputs) {
    if (!input || !input.trim()) continue;
    const parsed = parseLink(input);
    const built = buildLinks(parsed);
    if (built.usfans && !merged.usfans) merged.usfans = built.usfans;
    if (built.kakobuy && !merged.kakobuy) merged.kakobuy = built.kakobuy;
    if (built.litbuy && !merged.litbuy) merged.litbuy = built.litbuy;
  }
  // Always rewrite refs on any existing field (covers when user pasted only one agent link
  // that maps to its own slot).
  if (merged.usfans) merged.usfans = rewriteRef(merged.usfans);
  if (merged.kakobuy) merged.kakobuy = rewriteRef(merged.kakobuy);
  if (merged.litbuy) merged.litbuy = rewriteRef(merged.litbuy);
  // If usfans wasn't extractable from underlying, but a usfans input was given, keep that one.
  for (const input of inputs) {
    const p = parseLink(input);
    if (p.source === "usfans" && !merged.usfans) {
      merged.usfans = rewriteRef(p.raw);
    }
    if (p.source === "kakobuy" && !merged.kakobuy) merged.kakobuy = rewriteRef(p.raw);
    if (p.source === "litbuy" && !merged.litbuy) merged.litbuy = rewriteRef(p.raw);
  }
  return merged;
}