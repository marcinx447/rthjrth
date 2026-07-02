import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { listProducts } from "@/lib/products.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";

const featuredOptions = queryOptions({
  queryKey: ["products", "featured"],
  queryFn: () => listProducts({ data: { featuredOnly: true } }),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "USFinds — Sprawdzone finds z USFans, Kakobuy, Litbuy" },
      { name: "description", content: "Najlepsze finds z weryfikowanymi agentami: USFans (polecany), Kakobuy i Litbuy." },
      { property: "og:title", content: "USFinds" },
      { property: "og:description", content: "Najlepsze finds z weryfikowanymi agentami." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(featuredOptions),
  component: Index,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground p-8">
      {error.message}
    </div>
  ),
});

function Index() {
  const { data: featured } = useSuspenseQuery(featuredOptions);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.85_0.18_90/0.15),transparent_55%),radial-gradient(circle_at_80%_80%,oklch(0.65_0.22_25/0.12),transparent_50%)]" />
          <div className="container mx-auto px-6 py-28 md:py-40 relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-xs uppercase tracking-widest text-primary mb-6">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" /> Verified Finds Catalog
              </div>
              <h1 className="text-6xl md:text-8xl font-bold leading-[0.9]">
                US<span className="text-primary">Finds</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Najlepsze finds w jednym miejscu. Sprawdzone batche, zweryfikowana jakość — kup u <span className="text-primary font-semibold">USFans</span>, Kakobuy lub Litbuy.
              </p>
              <div className="mt-10 flex flex-wrap gap-3 justify-center">
                <Link
                  to="/gallery"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full font-semibold hover:opacity-90 transition"
                >
                  Przeglądaj produkty →
                </Link>
                <a
                  href="#featured"
                  className="inline-flex items-center gap-2 border border-border px-7 py-3.5 rounded-full font-semibold hover:bg-card transition"
                >
                  Hot finds
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured */}
        <motion.section
          id="featured"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-6 py-16 md:py-24"
        >
          <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-primary text-sm font-semibold uppercase tracking-wider mb-2">
                <span>★</span> Featured Finds
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">Najgorętsze drops</h2>
              <p className="text-muted-foreground mt-2">Wybrane przez nas perełki — sprawdzone batche, top quality.</p>
            </div>
            <Link to="/gallery" className="text-sm font-semibold hover:text-primary transition flex items-center gap-1">
              Zobacz wszystkie →
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
              Brak wyróżnionych produktów. Dodaj je z panelu admina.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featured.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </motion.section>

        {/* Info strip */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="border-y border-border bg-card/30"
        >
          <div className="container mx-auto px-6 py-12 grid md:grid-cols-3 gap-8 text-center md:text-left">
            {[
              { t: "Sprawdzeni agenci", d: "USFans (polecany), Kakobuy i Litbuy — wybierz gdzie wolisz kupić." },
              { t: "Wszystkie batche", d: "Budget, Good, Poliester i Best Batch — pełne info przy każdym findzie." },
              { t: "Aktualny katalog", d: "Nowe finds regularnie. Backup każdej pozycji w bazie." },
            ].map((f, i) => (
              <motion.div
                key={f.t}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className="text-primary text-2xl mb-2">●</div>
                <h3 className="font-bold text-lg mb-1">{f.t}</h3>
                <p className="text-sm text-muted-foreground">{f.d}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>
      <SiteFooter />
    </div>
  );
}
