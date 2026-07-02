import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { Copy, Check, ArrowRight, Link2, Wrench, Settings2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { convertLinks } from "@/lib/converter";
import { toast } from "sonner";
import { useSettings, type Agent } from "@/lib/user-settings";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Tools — USFinds" },
      { name: "description", content: "Narzędzia dla replikerów: link converter dla Kakobuy, USFans, Litbuy, Weidian, Taobao i 1688." },
    ],
  }),
  component: ToolsPage,
});

const AGENT_LABEL: Record<string, string> = {
  usfans: "USFans",
  kakobuy: "Kakobuy",
  litbuy: "LitBuy",
  oopbuy: "Oopbuy",
  acbuy: "ACBuy",
};

function toConverterKey(a: Agent): "usfans" | "kakobuy" | "litbuy" {
  if (a === "usfans" || a === "kakobuy" || a === "litbuy") return a;
  return "kakobuy"; // fallback for oopbuy/acbuy (unsupported target)
}

function ToolsPage() {
  const { agent, openSettings } = useSettings();
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const target = toConverterKey(agent);
  const converted = useMemo(() => convertLinks([input]), [input]);
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
    <div className="min-h-screen flex flex-col bg-background text-neutral-200">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-6 py-14 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/60 text-neutral-400 text-[11px] font-semibold uppercase tracking-[0.2em] mb-5">
              <Wrench className="w-3 h-3" /> Tools
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-white">
              Link <span className="text-primary">Converter</span>
            </h1>
            <p className="mt-3 text-neutral-400 max-w-lg mx-auto text-sm">
              Wklej link z <span className="text-neutral-200">1688 / Taobao / Weidian / Kakobuy / USFans / Litbuy</span>{" "}
              — automatycznie przekonwertujemy go na Twojego agenta.
            </p>
          </div>

          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 md:p-7 backdrop-blur">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-2 block">
                Surowy link
              </span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="https://..."
                className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-primary rounded-xl px-4 py-3.5 text-sm font-mono text-neutral-100 placeholder:text-neutral-600 outline-none transition"
              />
            </label>

            <div className="mt-5 flex items-center justify-between p-3 rounded-xl border border-neutral-800 bg-neutral-950/60">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-0.5">Twój agent</div>
                <div className="text-white font-bold flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  {AGENT_LABEL[agent] ?? agent}
                  {(agent === "oopbuy" || agent === "acbuy") && (
                    <span className="text-[10px] text-neutral-500 font-normal">(używam Kakobuy)</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={openSettings}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-600 rounded-lg px-3 py-1.5 transition"
              >
                <Settings2 className="w-3.5 h-3.5" /> Zmień
              </button>
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
                    className="px-4 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center gap-2 text-sm"
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
                  className="inline-flex items-center gap-1.5 mt-3 text-xs text-neutral-400 hover:text-primary transition"
                >
                  Otwórz link <ArrowRight className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </main>
      <SiteFooter />
    </div>
  );
}