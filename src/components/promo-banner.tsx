import { X } from "lucide-react";
import { useState } from "react";
import usfindsLogo from "@/assets/usfinds-logo.jpg.asset.json";
import usfansLogo from "@/assets/usfans.png.asset.json";
import kakobuyLogo from "@/assets/kakobuy.png.asset.json";
import litbuyLogo from "@/assets/litbuy.png.asset.json";

const LOGO_MAP = {
  usfinds: { src: usfindsLogo.url, alt: "USFinds", bg: "bg-white/95" },
  usfans: { src: usfansLogo.url, alt: "USFans", bg: "bg-white" },
  kakobuy: { src: kakobuyLogo.url, alt: "Kakobuy", bg: "bg-white" },
  litbuy: { src: litbuyLogo.url, alt: "Litbuy", bg: "bg-white" },
} as const;

export type PromoLogo = keyof typeof LOGO_MAP;

export function PromoBanner({
  title,
  message,
  cta,
  link,
  logo = "usfinds",
}: {
  title: string;
  message: string;
  cta: string;
  link: string;
  logo?: PromoLogo;
}) {
  // Reset on every page load — user requested banner reappears after refresh.
  const [closed, setClosed] = useState(false);
  if (closed) return null;
  const l = LOGO_MAP[logo] ?? LOGO_MAP.usfinds;
  return (
    <div className="w-full bg-[#0b0b0b] border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center gap-3 md:gap-4 px-4 py-2.5">
        <div className={`w-9 h-9 rounded-md p-1 flex items-center justify-center flex-shrink-0 overflow-hidden ${l.bg}`}>
          <img src={l.src} alt={l.alt} className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-sm font-bold text-foreground truncate">{title}</div>
          <div className="text-xs text-muted-foreground truncate md:whitespace-normal">
            {message}
          </div>
        </div>
        <a
          href={link || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center bg-white text-black text-sm font-semibold px-4 py-2 rounded-full hover:bg-white/90 transition flex-shrink-0"
        >
          {cta}
        </a>
        <button
          type="button"
          aria-label="Zamknij"
          onClick={() => setClosed(true)}
          className="text-muted-foreground hover:text-foreground p-1 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}