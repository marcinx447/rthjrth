import { AnimatePresence, motion } from "framer-motion";
import { Check, Globe, ShoppingBag, X } from "lucide-react";
import { useSettings, type Agent, type Lang } from "@/lib/user-settings";

const LANGS: { key: Lang; label: string; flag: string }[] = [
  { key: "pl", label: "Polski", flag: "🇵🇱" },
  { key: "en", label: "English", flag: "🇬🇧" },
];

const AGENTS: { key: Agent; label: string; badge?: string }[] = [
  { key: "kakobuy", label: "Kakobuy" },
  { key: "oopbuy", label: "Oopbuy" },
  { key: "usfans", label: "USFans", badge: "Polecany" },
  { key: "acbuy", label: "ACBuy" },
  { key: "litbuy", label: "LitBuy" },
];

export function SettingsModal() {
  const { isOpen, closeSettings, lang, setLang, agent, setAgent } = useSettings();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeSettings}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-[0_30px_80px_-20px_black]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <div>
                <h2 className="text-lg font-bold text-white">Ustawienia</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Preferencje zapisywane w tej przeglądarce</p>
              </div>
              <button
                onClick={closeSettings}
                className="w-8 h-8 rounded-lg border border-neutral-800 hover:border-neutral-600 flex items-center justify-center text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <section>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500 mb-3">
                  <Globe className="w-3 h-3" /> Język wyświetlania
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {LANGS.map((l) => {
                    const active = lang === l.key;
                    return (
                      <button
                        key={l.key}
                        onClick={() => setLang(l.key)}
                        className={`px-4 py-3 rounded-xl border text-sm font-semibold flex items-center gap-2 transition ${
                          active
                            ? "border-primary bg-primary/10 text-white"
                            : "border-neutral-800 text-neutral-300 hover:border-neutral-600"
                        }`}
                      >
                        <span className="text-lg">{l.flag}</span>
                        {l.label}
                        {active && <Check className="w-4 h-4 ml-auto text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500 mb-3">
                  <ShoppingBag className="w-3 h-3" /> Agent zakupowy
                </div>
                <div className="space-y-1.5">
                  {AGENTS.map((a) => {
                    const active = agent === a.key;
                    return (
                      <button
                        key={a.key}
                        onClick={() => setAgent(a.key)}
                        className={`w-full px-4 py-3 rounded-xl border flex items-center gap-3 text-sm font-semibold transition text-left ${
                          active
                            ? "border-primary bg-primary/10 text-white"
                            : "border-neutral-800 text-neutral-300 hover:border-neutral-600"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                            active ? "border-primary bg-primary" : "border-neutral-700"
                          }`}
                        >
                          {active && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                        </span>
                        <span className="flex-1">{a.label}</span>
                        {a.badge && (
                          <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
                            {a.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}