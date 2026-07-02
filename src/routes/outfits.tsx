import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Heart, Plus, Sparkles, X, ExternalLink, Trash2, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createOutfit, likeOutfit, listOutfits, viewOutfit, type Outfit } from "@/lib/outfits.functions";

const outfitsOptions = queryOptions({
  queryKey: ["outfits", "list"],
  queryFn: () => listOutfits(),
});

export const Route = createFileRoute("/outfits")({
  head: () => ({
    meta: [
      { title: "Outfits — USFinds" },
      { name: "description", content: "Galeria outfitów społeczności — dodawaj własne zestawy i lajkuj propozycje innych." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(outfitsOptions),
  component: OutfitsPage,
});

function OutfitsPage() {
  const { data } = useSuspenseQuery(outfitsOptions);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-6 py-10">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Community outfits
            </div>
            <h1 className="text-4xl md:text-6xl font-bold">Outfits</h1>
            <p className="text-neutral-400 mt-2 text-sm">
              {data.length} zestaw{data.length === 1 ? "" : "ów"} od społeczności — dodaj swój i inspiruj innych.
            </p>
          </motion.div>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl font-bold hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> Dodaj Outfit
          </button>
        </div>

        {data.length === 0 ? (
          <div className="border border-dashed border-neutral-800 rounded-2xl py-24 text-center text-neutral-500">
            Brak outfitów — bądź pierwszy i dodaj swój!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {data.map((o, i) => (
              <OutfitCard key={o.id} outfit={o} index={i} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
      <AddOutfitModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function OutfitCard({ outfit, index }: { outfit: Outfit; index: number }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(() => {
    try {
      return localStorage.getItem("usfinds:liked:" + outfit.id) === "1";
    } catch {
      return false;
    }
  });
  const [likes, setLikes] = useState(outfit.likes);
  const [views, setViews] = useState(outfit.views);

  const like = useMutation({
    mutationFn: () => likeOutfit({ data: { id: outfit.id } }),
    onSuccess: (r) => {
      setLikes(r.likes);
      setLiked(true);
      try { localStorage.setItem("usfinds:liked:" + outfit.id, "1"); } catch {}
    },
  });

  function toggleExpand() {
    setExpanded((v) => {
      const next = !v;
      if (next) {
        viewOutfit({ data: { id: outfit.id } })
          .then((r) => setViews(r.views))
          .catch(() => {});
      }
      return next;
    });
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04 }}
      className="group bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden hover:border-primary/50 transition"
    >
      <button onClick={toggleExpand} className="block w-full aspect-[4/5] bg-neutral-900 overflow-hidden relative">
        <img
          src={outfit.image_url}
          alt={outfit.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
        />
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <div className="text-white font-bold text-sm truncate inline-flex items-center gap-1">
            {outfit.title}
            {outfit.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
          </div>
          <div className="text-[11px] text-neutral-300">@{outfit.author}</div>
        </div>
        {outfit.is_verified && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow">
            <BadgeCheck className="w-3 h-3" /> Verified
          </span>
        )}
      </button>
      <div className="p-3 flex items-center gap-3 text-xs">
        <button
          onClick={() => !liked && like.mutate()}
          disabled={liked || like.isPending}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition ${
            liked
              ? "border-primary bg-primary/10 text-primary"
              : "border-neutral-800 text-neutral-400 hover:border-primary hover:text-primary"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} /> {likes}
        </button>
        <div className="inline-flex items-center gap-1.5 text-neutral-500">
          <Eye className="w-3.5 h-3.5" /> {views}
        </div>
        <button
          onClick={toggleExpand}
          className="ml-auto text-neutral-400 hover:text-white text-[11px] font-semibold uppercase tracking-wider"
        >
          {expanded ? "Ukryj" : "Linki"}
        </button>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-neutral-800"
          >
            <div className="p-3 space-y-1.5 max-h-56 overflow-y-auto">
              {outfit.description && (
                <p className="text-xs text-neutral-400 pb-2 border-b border-neutral-900">{outfit.description}</p>
              )}
              {outfit.items.length === 0 ? (
                <div className="text-xs text-neutral-600 text-center py-3">Brak linków</div>
              ) : (
                outfit.items.map((it, i) => (
                  <a
                    key={i}
                    href={it.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 transition"
                  >
                    <span className="flex-1 truncate">{it.name}</span>
                    <ExternalLink className="w-3 h-3 text-neutral-500" />
                  </a>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function AddOutfitModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    author: "",
    title: "",
    description: "",
    image_url: "",
  });
  const [items, setItems] = useState<{ name: string; url: string }[]>([{ name: "", url: "" }]);

  const create = useMutation({
    mutationFn: () =>
      createOutfit({
        data: {
          author: form.author.trim() || "anon",
          title: form.title,
          description: form.description || null,
          image_url: form.image_url,
          items: items.filter((i) => i.name.trim() && i.url.trim()),
        },
      }),
    onSuccess: () => {
      toast.success("Outfit dodany!");
      qc.invalidateQueries({ queryKey: ["outfits", "list"] });
      setForm({ author: "", title: "", description: "", image_url: "" });
      setItems([{ name: "", url: "" }]);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.title.trim() || !form.image_url.trim()) {
                toast.error("Tytuł i URL zdjęcia są wymagane");
                return;
              }
              create.mutate();
            }}
            className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <h2 className="font-bold text-white">Dodaj outfit</h2>
              <button type="button" onClick={onClose} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto">
              <Field label="Twój nick">
                <input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="np. gucci_kid"
                  className="input"
                />
              </Field>
              <Field label="Tytuł outfitu *">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="np. Winter tech fit"
                  className="input"
                />
              </Field>
              <Field label="URL zdjęcia *">
                <input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="input"
                />
                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt=""
                    className="mt-2 h-32 rounded-lg object-cover border border-neutral-800"
                    onError={(e) => ((e.currentTarget.style.display = "none"))}
                  />
                )}
              </Field>
              <Field label="Opis">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="input"
                  placeholder="Krótko o outficie..."
                />
              </Field>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Linki do ubrań</div>
                <div className="space-y-2">
                  {items.map((it, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={it.name}
                        onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                        placeholder="Nazwa"
                        className="input flex-1"
                      />
                      <input
                        value={it.url}
                        onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                        placeholder="https://..."
                        className="input flex-[1.4] font-mono text-xs"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setItems(items.filter((_, j) => j !== i))}
                          className="px-2 rounded-lg border border-neutral-800 text-neutral-500 hover:text-destructive hover:border-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setItems([...items, { name: "", url: "" }])}
                    className="text-xs text-primary hover:underline"
                  >
                    + kolejny link
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-800 flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-neutral-800 text-sm font-semibold hover:bg-neutral-900">
                Anuluj
              </button>
              <button
                type="submit"
                disabled={create.isPending}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
              >
                {create.isPending ? "Wysyłanie..." : "Opublikuj"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}