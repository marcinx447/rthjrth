import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { listProducts, type Product } from "@/lib/products.functions";

export function SearchCommand({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["products", "list", "all"],
    queryFn: () => listProducts({ data: {} }),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const results = useMemo<Product[]>(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    if (!term) return data.slice(0, 12);
    return data
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          (p.batch ?? "").toLowerCase().includes(term),
      )
      .slice(0, 24);
  }, [data, q]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-800">
              <Search className="w-5 h-5 text-neutral-500" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Szukaj produktów..."
                className="flex-1 bg-transparent outline-none text-white placeholder:text-neutral-500 text-sm"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 border border-neutral-800 rounded text-[10px] font-mono text-neutral-500">
                ESC
              </kbd>
              <button onClick={onClose} className="text-neutral-500 hover:text-white transition sm:hidden">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-3">
              {results.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-sm">Brak wyników</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {results.map((p) => (
                    <Link
                      key={p.id}
                      to="/product/$slug"
                      params={{ slug: p.slug }}
                      onClick={onClose}
                      className="group flex flex-col bg-neutral-900/70 border border-neutral-800 rounded-xl overflow-hidden hover:border-primary transition"
                    >
                      <div className="aspect-square bg-neutral-900 overflow-hidden">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        ) : null}
                      </div>
                      <div className="p-2.5">
                        <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {Number(p.price).toFixed(2)} zł
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}