import usfansLogo from "@/assets/usfans.png.asset.json";
import kakobuyLogo from "@/assets/kakobuy.png.asset.json";
import litbuyLogo from "@/assets/litbuy.png.asset.json";
import { trackLinkClick } from "@/lib/stats.functions";

type AgentLinks = { usfans?: string; kakobuy?: string; litbuy?: string };

const AGENTS: { key: keyof AgentLinks; label: string; logo: string; preferred?: boolean }[] = [
  { key: "usfans", label: "USFans", logo: usfansLogo.url, preferred: true },
  { key: "kakobuy", label: "Kakobuy", logo: kakobuyLogo.url },
  { key: "litbuy", label: "Litbuy", logo: litbuyLogo.url },
];

export function AgentLinks({ links, productId }: { links: AgentLinks; productId?: string | null }) {
  const has = AGENTS.some((a) => links?.[a.key]);
  if (!has) return null;
  return (
    <div className="grid gap-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Kup u agenta
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        {AGENTS.map((a) => {
          const url = links?.[a.key];
          if (!url) return null;
          const isPref = a.preferred;
          return (
            <a
              key={a.key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackLinkClick({ data: { productId: productId ?? null, agent: a.key } }).catch(() => {});
              }}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border transition group ${
                isPref
                  ? "border-primary bg-primary/10 hover:bg-primary/20"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              {isPref && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Polecany
                </span>
              )}
              <span className="w-9 h-9 rounded-md bg-white p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src={a.logo} alt={a.label} className="w-full h-full object-contain" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm leading-tight">{a.label}</span>
                <span className="text-[11px] text-muted-foreground group-hover:text-primary transition">
                  Kup teraz →
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}