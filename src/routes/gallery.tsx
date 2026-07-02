import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { listProducts } from "@/lib/products.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { CATEGORIES, BATCHES } from "@/lib/categories";

type GallerySearch = { category?: string };

const productsOptions = () =>
  queryOptions({
    queryKey: ["products", "list", "all"],
    queryFn: () => listProducts({ data: {} }),
  });

export const Route = createFileRoute("/gallery")({
  validateSearch: (search: Record<string, unknown>): GallerySearch => ({
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsOptions()),
  head: () => ({
    meta: [
      { title: "Katalog — USFinds" },
      {
        name: "description",
        content:
          "Cały katalog finds: sneakersy, bluzy, t-shirty, akcesoria. Filtry po kategorii, batchu, agentcie i cenie.",
      },
    ],
  }),
  component: Gallery,
  errorComponent: ({ error }) => <div className="p-10 text-center">{error.message}</div>,
  notFoundComponent: () => <div className="p-10 text-center">Nie znaleziono.</div>,
});

type Sort = "newest" | "price-asc" | "price-desc" | "featured";

function Gallery() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/gallery" });
  const { data: all } = useSuspenseQuery(productsOptions());

  const activeCategory = search.category ?? "all";
  const [batch, setBatch] = useState<string>("all");
  const [agent, setAgent] = useState<"all" | "usfans" | "kakobuy" | "litbuy">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  const filtered = useMemo(() => {
    const list = all.filter((p) => {
      if (activeCategory !== "all" && p.category !== activeCategory) return false;
      if (batch !== "all" && p.batch !== batch) return false;
      if (agent !== "all" && !p.agent_links?.[agent]) return false;
      if (q.trim() && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (typeof maxPrice === "number" && Number(p.price) > maxPrice) return false;
      return true;
    });
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        list.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "newest":
        list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
        break;
      case "featured":
        list.sort((a, b) => Number(b.featured) - Number(a.featured) || a.sort_order - b.sort_order);
        break;
    }
    return list;
  }, [all, activeCategory, batch, agent, q, sort, maxPrice]);

  const hasFilters =
    activeCategory !== "all" || batch !== "all" || agent !== "all" || q || maxPrice !== "";

  function clearAll() {
    setBatch("all");
    setAgent("all");
    setQ("");
    setMaxPrice("");
    setSort("featured");
    navigate({ search: {} });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold">Katalog</h1>
          <p className="text-muted-foreground mt-2">
            {filtered.length} z {all.length} produkt{all.length === 1 ? "" : "ów"}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:sticky lg:top-24 lg:h-fit space-y-5"
          >
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 text-sm font-bold mb-3">
                <SlidersHorizontal className="w-4 h-4 text-primary" /> Filtry
                {hasFilters && (
                  <button onClick={clearAll} className="ml-auto text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                    <X className="w-3 h-3" /> wyczyść
                  </button>
                )}
              </div>

              <label className="block mb-3">
                <span className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">Szukaj</span>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-9" placeholder="np. jordan, travis…" />
                </div>
              </label>

              <Block title="Kategoria">
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => {
                    const isActive = activeCategory === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => navigate({ search: c.id === "all" ? {} : { category: c.id } })}
                        className={`text-xs px-2.5 py-1 rounded-full border transition ${
                          isActive ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/60"
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </Block>

              <Block title="Batch">
                <div className="flex flex-wrap gap-1.5">
                  <ChipBtn active={batch === "all"} onClick={() => setBatch("all")}>Wszystkie</ChipBtn>
                  {BATCHES.map((b) => (
                    <ChipBtn key={b.id} active={batch === b.id} onClick={() => setBatch(b.id)}>{b.label}</ChipBtn>
                  ))}
                </div>
              </Block>

              <Block title="Agent">
                <div className="flex flex-wrap gap-1.5">
                  <ChipBtn active={agent === "all"} onClick={() => setAgent("all")}>Wszyscy</ChipBtn>
                  <ChipBtn active={agent === "usfans"} onClick={() => setAgent("usfans")}>USFans ★</ChipBtn>
                  <ChipBtn active={agent === "kakobuy"} onClick={() => setAgent("kakobuy")}>Kakobuy</ChipBtn>
                  <ChipBtn active={agent === "litbuy"} onClick={() => setAgent("litbuy")}>Litbuy</ChipBtn>
                </div>
              </Block>

              <Block title="Max cena (zł)">
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="np. 500"
                  className="input"
                />
              </Block>

              <Block title="Sortowanie">
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input">
                  <option value="featured">Polecane najpierw</option>
                  <option value="newest">Najnowsze</option>
                  <option value="price-asc">Cena: rosnąco</option>
                  <option value="price-desc">Cena: malejąco</option>
                </select>
              </Block>
            </div>
          </motion.aside>

          <div>
            {filtered.length === 0 ? (
              <div className="py-24 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                Brak wyników.{" "}
                <button onClick={clearAll} className="text-primary underline">
                  Wyczyść filtry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {filtered.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}

function ChipBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition ${
        active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/60"
      }`}
    >
      {children}
    </button>
  );
}