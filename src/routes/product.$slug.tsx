import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getProductBySlug } from "@/lib/products.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AgentLinks } from "@/components/agent-links";

const productOptions = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productOptions(params.slug));
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — REPS HUB` },
          { name: "description", content: loaderData.description ?? `${loaderData.name} — replika w sprawdzonej jakości.` },
          { property: "og:title", content: loaderData.name },
          { property: "og:image", content: loaderData.image_url ?? "" },
        ]
      : [{ title: "Produkt — REPS HUB" }],
  }),
  component: ProductPage,
  errorComponent: ({ error }) => <div className="p-10 text-center">{error.message}</div>,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-10 text-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Nie znaleziono produktu</h1>
          <Link to="/gallery" className="text-primary underline">Wróć do katalogu</Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  ),
});

function ProductPage() {
  const params = Route.useParams();
  const { data: p } = useSuspenseQuery(productOptions(params.slug));
  if (!p) return null;

  const discount =
    p.original_price && p.original_price > p.price
      ? Math.round((1 - p.price / p.original_price) * 100)
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-6 py-10">
        <Link to="/gallery" className="text-sm text-muted-foreground hover:text-primary">
          ← Wróć do katalogu
        </Link>
        <div className="mt-6 grid md:grid-cols-2 gap-10 lg:gap-16">
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-secondary border border-border">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">brak zdjęcia</div>
              )}
            </div>
            {p.images.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {p.images.slice(0, 4).map((u, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border bg-secondary">
                    <img src={u} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {p.category}{p.batch ? ` • ${p.batch}` : ""}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">{p.name}</h1>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-3xl font-bold">{Number(p.price).toFixed(2)} zł</span>
              {p.original_price && p.original_price > p.price && (
                <>
                  <span className="text-base text-muted-foreground line-through">
                    {Number(p.original_price).toFixed(2)} zł
                  </span>
                  <span className="bg-accent text-accent-foreground text-sm font-bold px-2.5 py-1 rounded-full">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {p.quality && (
              <div className="mt-3 inline-flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full text-sm">
                <span className="text-primary">★</span> Jakość: <strong>{p.quality}</strong>
              </div>
            )}

            {p.description && (
              <p className="mt-6 text-muted-foreground leading-relaxed whitespace-pre-line">{p.description}</p>
            )}

            {p.sizes.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-semibold mb-2">Dostępne rozmiary</div>
                <div className="flex flex-wrap gap-2">
                  {p.sizes.map((s) => (
                    <span key={s} className="px-3 py-2 border border-border rounded-lg text-sm bg-card">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <AgentLinks links={p.agent_links ?? {}} productId={p.id} />
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}