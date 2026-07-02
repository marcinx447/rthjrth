import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function ImportantPopup({
  active,
  title,
  message,
}: {
  active: boolean;
  title: string;
  message: string;
}) {
  const [open, setOpen] = useState(false);
  const key = `usfinds-popup-dismiss-${title}-${message.slice(0, 30)}`;

  useEffect(() => {
    if (!active || !message.trim()) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(key)) return;
    const t = setTimeout(() => setOpen(true), 300);
    return () => clearTimeout(t);
  }, [active, message, key]);

  function close() {
    setOpen(false);
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg rounded-2xl border border-primary/40 bg-card shadow-2xl shadow-primary/20 overflow-hidden"
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
          >
            <div className="h-1.5 bg-gradient-to-r from-primary via-orange-400 to-primary animate-pulse" />
            <div className="p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/40 text-primary text-[11px] font-bold uppercase tracking-widest mb-4">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                Ważne ogłoszenie
              </div>
              <h2 className="text-3xl font-bold font-display leading-tight">{title}</h2>
              <p className="mt-4 text-base text-muted-foreground whitespace-pre-line leading-relaxed">
                {message}
              </p>
              <div className="mt-7 flex justify-end">
                <button
                  onClick={close}
                  className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-full hover:opacity-90 transition"
                >
                  Rozumiem
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}