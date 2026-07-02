import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "pl" | "en";
export type Agent = "usfans" | "kakobuy" | "litbuy" | "oopbuy" | "acbuy";

type Settings = { lang: Lang; agent: Agent };
type Ctx = Settings & {
  setLang: (l: Lang) => void;
  setAgent: (a: Agent) => void;
  openSettings: () => void;
  closeSettings: () => void;
  isOpen: boolean;
};

const DEFAULT: Settings = { lang: "pl", agent: "usfans" };
const KEY = "usfinds:settings";

const SettingsCtx = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Settings>(DEFAULT);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  return (
    <SettingsCtx.Provider
      value={{
        ...state,
        setLang: (lang) => setState((s) => ({ ...s, lang })),
        setAgent: (agent) => setState((s) => ({ ...s, agent })),
        openSettings: () => setOpen(true),
        closeSettings: () => setOpen(false),
        isOpen,
      }}
    >
      {children}
    </SettingsCtx.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error("useSettings outside SettingsProvider");
  return ctx;
}