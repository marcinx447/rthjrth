import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { Copy, Check, ArrowRight, Link2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { convertLinks, type ConvertedLinks } from "@/lib/converter";
import { toast } from "sonner";
import usfansLogo from "@/assets/usfans.png.asset.json";
import kakobuyLogo from "@/assets/kakobuy.png.asset.json";
import litbuyLogo from "@/assets/litbuy.png.asset.json";

export const Route = createFileRoute("/converter")({
  head: () => ({
    meta: [
      { title: "Link Converter — USFinds" },
      {
        name: "description",
        content:
          "Konwerter linków agentów: wklej link z kakobuy, usfans, litbuy, weidian, taobao lub 1688 i otrzymaj przekonwertowane linki ze sprawdzonymi ref-kodami.",
      },
    ],
  }),
  component: ConverterPage,
});

type Target = "usfans" | "kakobuy" | "litbuy";

const TARGETS: { key: Target; label: string; logo: string }[] = [
  { key: "usfans", label: "USFans", logo: usfansLogo.url },
  { key: "kakobuy", label: "Kakobuy", logo: kakobuyLogo.url },
  { key: "litbuy", label: "Litbuy", logo: litbuyLogo.url },
];

function ConverterPage() {
  const [input, setInput] = useState("");
  const [target, setTarget] = useState<Target>("usfans");
  const [copied, setCopied] = useState(false);

  const converted: ConvertedLinks = useMemo(() => convertLinks([input]), [input]);
  const output = converted[target];

  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      toast.success("Skopiowano");
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f10] text-neutral-200">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-6 py-14 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-700/70 bg-neutral-900/60 text-neutral-400 text-[11px] font-semibold uppercase tracking-[0.2em] mb-5">
              <Link2 className="w-3 h-3" /> Link converter
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-white">
              Konwertuj linki agentów
            </h1>
            <p className="mt-3 text-neutral-400 max-w-lg mx-auto text-sm">
              Wklej link z <span className="text-neutral-200">usfans / kakobuy / litbuy / weidian / taobao / 1688</span> i wybierz agenta, na którego chcesz przekonwertować.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 md:p-7 backdrop-blur"
          >
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-2 block">
                Wklej link
              </span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="https://..."
                className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-neutral-600 rounded-xl px-4 py-3.5 text-sm font-mono text-neutral-100 placeholder:text-neutral-600 outline-none transition"
              />
            </label>

            <div className="mt-5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-2 block">
                Przekonwertuj na
              </span>
              <div className="grid grid-cols-3 gap-2">
                {TARGETS.map((t) => {
                  const active = target === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTarget(t.key)}
                      className={`relative flex items-center justify-center gap-2 px-3 py-3 rounded-xl border transition text-sm font-semibold ${
                        active
                          ? "border-neutral-500 bg-neutral-800 text-white"
                          : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                      }`}
                    >
                      <span className="w-5 h-5 bg-white rounded flex items-center justify-center overflow-hidden">
                        <img src={t.logo} alt={t.label} className="w-full h-full object-contain p-0.5" />
                      </span>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-2 block">
                Wynik
              </span>
              <AnimatePresence mode="wait">
                <motion.div
                  key={output ?? "empty"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-2"
                >
                  <div className="flex-1 bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-mono text-neutral-200 break-all min-h-[52px] flex items-center">
                    {output || <span className="text-neutral-600">— wklej link powyżej —</span>}
                  </div>
                  <button
                    type="button"
                    onClick={copy}
                    disabled={!output}
                    className="px-4 rounded-xl border border-neutral-700 bg-neutral-800 text-neutral-100 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center gap-2 text-sm font-semibold"
                  >
                    {copied ? <><Check className="w-4 h-4" /> OK</> : <><Copy className="w-4 h-4" /> Kopiuj</>}
                  </button>
                </motion.div>
              </AnimatePresence>
              {output && (
                <a
                  href={output}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs text-neutral-400 hover:text-white transition"
                >
                  Otwórz link <ArrowRight className="w-3 h-3" />
                </a>
              )}
            </div>
          </motion.div>

          <div className="mt-6 grid sm:grid-cols-3 gap-3 text-xs">
            {[
              { t: "USFans", d: "ref: JCWKHX" },
              { t: "Kakobuy", d: "affcode: ogprzecin3k" },
              { t: "Litbuy", d: "bez ref" },
            ].map((x) => (
              <div key={x.t} className="bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3">
                <div className="font-semibold text-neutral-200">{x.t}</div>
                <div className="text-[11px] text-neutral-500 mt-0.5 font-mono">{x.d}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
      <SiteFooter />
    </div>
  );
}