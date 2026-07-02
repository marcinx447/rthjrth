import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { queryOptions, useSuspenseQuery, useQueryClient, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Box,
  Database,
  Megaphone,
  Settings as SettingsIcon,
  Shield,
  Link as LinkIcon,
  LogOut,
  ExternalLink,
  Wand2,
  Plus,
  Pencil,
  Trash2,
  Ban,
  ShieldCheck,
  KeyRound,
  X,
  Check,
  UserPlus,
  Sparkles,
  BarChart3,
  Eye,
  MousePointerClick,
  BadgeCheck,
  Shirt,
} from "lucide-react";
import {
  checkAdminSession,
  loginAdmin,
  logoutAdmin,
} from "@/lib/gate.functions";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  setProductVerified,
  type Product,
} from "@/lib/products.functions";
import {
  getSiteSettings,
  updateSiteSettings,
} from "@/lib/settings.functions";
import {
  exportProducts,
  importProducts,
  listBackups,
} from "@/lib/backups.functions";
import {
  listAdmins,
  createAdmin,
  updateAdmin,
  banAdmin,
  unbanAdmin,
  deleteAdmin,
  type AdminRow,
} from "@/lib/admins.functions";
import { scrapeProductInfo } from "@/lib/scraper.functions";
import { getStatsSummary } from "@/lib/stats.functions";
import {
  listOutfitsAdmin,
  setOutfitVerified,
  deleteOutfit,
  type Outfit,
} from "@/lib/outfits.functions";
import { ADMIN_CATEGORIES, BATCHES } from "@/lib/categories";
import { LinkConverter } from "@/components/link-converter";
import { DiscordIcon, DISCORD_URL } from "@/components/site-header";
import logoAsset from "@/assets/usfinds-logo.jpg.asset.json";
import { toast } from "sonner";

const ALL_PERMS: { id: string; label: string; desc: string }[] = [
  { id: "products.create", label: "Dodawanie produktów", desc: "Może dodawać nowe finds" },
  { id: "products.edit", label: "Edycja produktów", desc: "Może modyfikować istniejące" },
  { id: "products.delete", label: "Usuwanie produktów", desc: "Może kasować pozycje" },
  { id: "products.import", label: "Import produktów", desc: "Może importować JSON" },
  { id: "products.export", label: "Export produktów", desc: "Może pobierać backup JSON" },
  { id: "announcements.manage", label: "Ogłoszenia / popup", desc: "Pasek + wyskakujące okno" },
  { id: "maintenance.manage", label: "Tryb maintenance", desc: "Włącza przerwę techniczną" },
  { id: "stats.view", label: "Statystyki", desc: "Podgląd wejść i kliknięć" },
  { id: "content.verify", label: "Weryfikacja treści", desc: "Może oznaczać produkty i outfity jako Verified" },
];

const sessionOptions = queryOptions({
  queryKey: ["admin", "session"],
  queryFn: () => checkAdminSession(),
});

const adminProductsOptions = queryOptions({
  queryKey: ["admin", "products"],
  queryFn: () => listProducts({ data: {} }),
});

type SessionData = Extract<Awaited<ReturnType<typeof checkAdminSession>>, { authenticated: true }>;

function hasPerm(s: SessionData, perm: string): boolean {
  return s.role === "super" || s.permissions.includes(perm);
}

export const Route = createFileRoute("/ff")({
  loader: ({ context }) => context.queryClient.ensureQueryData(sessionOptions),
  head: () => ({
    meta: [
      { title: "USFinds — Panel" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: FFRoute,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-muted-foreground">{error.message}</div>
  ),
});

function FFRoute() {
  const { data } = useSuspenseQuery(sessionOptions);
  if (!data.authenticated) {
    if (data.banned) return <BannedScreen reason={data.banned.reason} />;
    return <LoginScreen />;
  }
  return <AdminPanel session={data} />;
}

function BannedScreen({ reason }: { reason: string }) {
  const router = useRouter();
  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,oklch(0.6_0.22_25/0.25),transparent_60%)]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        className="relative max-w-lg w-full text-center"
      >
        <motion.div
          initial={{ rotate: -8, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 14 }}
          className="w-24 h-24 mx-auto rounded-3xl bg-destructive/15 border-2 border-destructive/40 flex items-center justify-center mb-6"
        >
          <Ban className="w-12 h-12 text-destructive" />
        </motion.div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/15 border border-destructive/40 text-destructive text-[11px] font-bold uppercase tracking-widest mb-4">
          Konto zbanowane
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight">
          Dostęp <span className="text-destructive">zablokowany</span>
        </h1>
        <p className="mt-4 text-muted-foreground">Twoje konto administratora zostało zablokowane przez super admina.</p>
        <div className="mt-8 bg-card border border-border rounded-2xl p-6 text-left">
          <div className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Powód</div>
          <div className="text-lg font-semibold">{reason}</div>
        </div>
        <button
          onClick={() => router.invalidate()}
          className="mt-8 inline-flex items-center gap-2 border border-border px-5 py-2.5 rounded-full text-sm font-semibold hover:border-primary transition"
        >
          Spróbuj ponownie
        </button>
      </motion.div>
    </div>
  );
}

function LoginScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const login = useServerFn(loginAdmin);
  const [discordId, setDiscordId] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = (await login({ data: { discordId, password } })) as
        | { ok: true }
        | { ok: false; banned?: boolean; reason?: string };
      if (res.ok) {
        await qc.invalidateQueries({ queryKey: ["admin"] });
        router.invalidate();
      } else if ("banned" in res && res.banned) {
        setErr(`Konto zbanowane: ${res.reason ?? "Złamanie regulaminu"}`);
      } else {
        setErr("Nieprawidłowy Discord ID lub hasło");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.72_0.2_45/0.25),transparent_55%),radial-gradient(circle_at_80%_80%,oklch(0.6_0.22_25/0.15),transparent_50%)]" />
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl shadow-primary/10"
      >
        <div className="text-center mb-7">
          <img src={logoAsset.url} alt="USFinds" className="h-12 w-auto rounded-lg bg-white/95 p-1.5 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Panel USFinds</h1>
          <p className="text-sm text-muted-foreground mt-1">Zaloguj się przez Discord ID i hasło.</p>
        </div>
        <label className="block mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Discord ID</span>
          <input
            value={discordId}
            onChange={(e) => setDiscordId(e.target.value)}
            autoFocus
            placeholder="np. 1508998046414016603"
            className="input font-mono text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Hasło</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="input"
          />
        </label>
        <AnimatePresence>
          {err && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-destructive mt-3 bg-destructive/10 border border-destructive/30 px-3 py-2 rounded-lg"
            >
              {err}
            </motion.p>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || !discordId || !password}
          className="mt-6 w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold disabled:opacity-50 hover:opacity-90 transition"
        >
          {loading ? "Sprawdzam..." : "Zaloguj"}
        </motion.button>
      </motion.form>
    </div>
  );
}

type ProductForm = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  category: string;
  sizes: string;
  image_url: string;
  images: string;
  quality: string;
  batch: string;
  contact_url: string;
  featured: boolean;
  is_verified: boolean;
  sort_order: number;
  agent_usfans: string;
  agent_kakobuy: string;
  agent_litbuy: string;
};

const empty: ProductForm = {
  id: null,
  name: "",
  slug: "",
  description: "",
  price: 0,
  original_price: null,
  category: "shoes",
  sizes: "",
  image_url: "",
  images: "",
  quality: "",
  batch: "good",
  contact_url: "",
  featured: false,
  is_verified: false,
  sort_order: 0,
  agent_usfans: "",
  agent_kakobuy: "",
  agent_litbuy: "",
};

function AdminPanel({
  session,
}: {
  session: SessionData;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const logout = useServerFn(logoutAdmin);
  const create = useServerFn(createProduct);
  const update = useServerFn(updateProduct);
  const remove = useServerFn(deleteProduct);
  const exportFn = useServerFn(exportProducts);
  const importFn = useServerFn(importProducts);
  const scrape = useServerFn(scrapeProductInfo);
  const { data: products } = useSuspenseQuery(adminProductsOptions);
  const [form, setForm] = useState<ProductForm>(empty);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [tab, setTab] = useState<"products" | "outfits" | "backups" | "site" | "admins" | "converter" | "stats">("products");
  const isSuper = session.role === "super";
  const can = (p: string) => hasPerm(session, p);

  function set<K extends keyof ProductForm>(k: K, v: ProductForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function edit(p: Product) {
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      price: Number(p.price),
      original_price: p.original_price != null ? Number(p.original_price) : null,
      category: p.category,
      sizes: p.sizes.join(", "),
      image_url: p.image_url ?? "",
      images: p.images.join(", "),
      quality: p.quality ?? "",
      batch: p.batch ?? "good",
      contact_url: p.contact_url ?? "",
      featured: p.featured,
      is_verified: p.is_verified,
      sort_order: p.sort_order,
      agent_usfans: p.agent_links?.usfans ?? "",
      agent_kakobuy: p.agent_links?.kakobuy ?? "",
      agent_litbuy: p.agent_links?.litbuy ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["admin", "products"] });
    await qc.invalidateQueries({ queryKey: ["products"] });
    await qc.invalidateQueries({ queryKey: ["product"] });
    await qc.invalidateQueries({ queryKey: ["admin", "backups"] });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        description: form.description || null,
        price: Number(form.price),
        original_price:
          form.original_price != null && !Number.isNaN(form.original_price)
            ? Number(form.original_price)
            : null,
        category: form.category,
        sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
        image_url: form.image_url || null,
        images: form.images.split(",").map((s) => s.trim()).filter(Boolean),
        quality: form.quality || null,
        batch: form.batch || null,
        contact_url: form.contact_url || null,
        featured: form.featured,
        is_verified: form.is_verified,
        sort_order: Number(form.sort_order) || 0,
        agent_links: {
          usfans: form.agent_usfans || undefined,
          kakobuy: form.agent_kakobuy || undefined,
          litbuy: form.agent_litbuy || undefined,
        },
      };
      if (form.id) {
        await update({ data: { id: form.id, ...payload } });
        toast.success("Zaktualizowano");
      } else {
        await create({ data: payload });
        toast.success("Dodano produkt (auto-backup utworzony)");
      }
      setForm(empty);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  }

  async function onScrape() {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    try {
      const res = await scrape({ data: { url: scrapeUrl.trim() } });
      if (!res.ok) {
        toast.error(res.error ?? "Nie udało się pobrać");
        return;
      }
      setForm((f) => {
        // If URL is usfans/usfinds, prefill the usfans agent link + auto-rewrite ref
        let agent_usfans = f.agent_usfans;
        try {
          const host = new URL(scrapeUrl.trim()).hostname;
          if (/usfans\.com|usfinds\./i.test(host) && !agent_usfans) {
            agent_usfans = scrapeUrl.trim();
          }
        } catch { /* ignore */ }
        return {
          ...f,
          name: f.name || res.title || "",
          description: f.description || res.description || "",
          image_url: f.image_url || res.image || "",
          images: f.images || res.images.slice(1, 12).join(", "),
          price: f.price || (typeof res.price === "number" ? res.price : 0),
          quality: f.quality || (res.images.length > 3 ? "QC" : f.quality),
          agent_usfans,
        };
      });
      toast.success("Dane pobrane z linka");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd scrappera");
    } finally {
      setScraping(false);
    }
  }

  async function onDelete(p: Product) {
    if (!confirm(`Usunąć "${p.name}"? (backup zostanie zachowany)`)) return;
    try {
      await remove({ data: { id: p.id } });
      toast.success("Usunięto");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd usuwania");
    }
  }

  async function onLogout() {
    await logout({});
    await qc.invalidateQueries({ queryKey: ["admin"] });
    router.invalidate();
  }

  async function onExport() {
    try {
      const data = await exportFn({});
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `usfinds-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Eksport: ${data.products.length} produktów`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd eksportu");
    }
  }

  async function onImport(file: File, mode: "merge" | "replace") {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : parsed.products ?? [];
      if (mode === "replace" && !confirm("REPLACE skasuje wszystkie obecne produkty. Kontynuować?")) return;
      const res = await importFn({ data: { items, mode } });
      toast.success(`Import OK: ${res.inserted} dodanych, ${res.failed} błędów`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd importu");
    }
  }

  useEffect(() => {
    if (!form.id && form.name && !form.slug) {
      set(
        "slug",
        form.name
          .toLowerCase()
          .replace(/[ąćęłńóśźż]/g, (c) => ({ ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" }[c] ?? c))
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name]);

  const tabs: { id: typeof tab; label: string; icon: React.ComponentType<{ className?: string }>; show: boolean }[] = [
    { id: "products", label: "Produkty", icon: Box, show: true },
    { id: "outfits", label: "Outfits", icon: Shirt, show: true },
    { id: "backups", label: "Backupy", icon: Database, show: true },
    { id: "converter", label: "Link converter", icon: LinkIcon, show: true },
    { id: "stats", label: "Statystyki", icon: BarChart3, show: isSuper || can("stats.view") },
    { id: "site", label: "Ogłoszenia & maintenance", icon: Megaphone, show: isSuper || can("announcements.manage") || can("maintenance.manage") },
    { id: "admins", label: "Administratorzy", icon: Shield, show: isSuper },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 lg:border-r border-b lg:border-b-0 border-border bg-card/40 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen flex lg:flex-col">
        <div className="p-5 border-b border-border hidden lg:flex items-center gap-3">
          <img src={logoAsset.url} alt="USFinds" className="h-9 w-auto rounded-md bg-white/95 p-1" />
          <div>
            <div className="font-bold text-sm">Panel</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">USFinds Admin</div>
          </div>
        </div>
        <nav className="flex lg:flex-col gap-1 p-3 overflow-x-auto lg:overflow-visible flex-1">
          {tabs.filter((t) => t.show).map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="ff-tab-active"
                    className="absolute inset-0 bg-primary rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 text-primary border border-primary/40 flex items-center justify-center font-bold">
              {session.username.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{session.username}</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                {isSuper ? <ShieldCheck className="w-3 h-3 text-primary" /> : <Shield className="w-3 h-3" />}
                {isSuper ? "Super Admin" : "Editor"}
              </div>
            </div>
          </div>
          <a href="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition px-2 py-1.5">
            <ExternalLink className="w-3 h-3" /> Otwórz stronę
          </a>
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-[#aab2ff] transition px-2 py-1.5">
            <DiscordIcon className="w-3 h-3" /> Discord
          </a>
          <button onClick={onLogout} className="w-full flex items-center gap-2 text-xs bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 px-3 py-2 rounded-lg transition">
            <LogOut className="w-3 h-3" /> Wyloguj
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="p-6 md:p-10"
          >
        {tab === "products" && (
          <div className="grid xl:grid-cols-[1fr_1.2fr] gap-8">
            <section className="bg-card border border-border rounded-2xl p-6 h-fit lg:sticky lg:top-32">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                {form.id ? <Pencil className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                {form.id ? "Edytuj produkt" : "Dodaj produkt"}
              </h2>

              {/* Scraper */}
              {!form.id && can("products.create") && (
                <div className="mb-5 bg-primary/5 border border-primary/30 rounded-xl p-3">
                  <div className="text-[11px] uppercase tracking-widest font-bold text-primary mb-2 flex items-center gap-1">
                    <Wand2 className="w-3 h-3" /> Auto-uzupełnij z linka
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                      placeholder="https://usfans.com/... (albo kakobuy / weidian / taobao / 1688)"
                      className="input flex-1 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={onScrape}
                      disabled={scraping || !scrapeUrl.trim()}
                      className="bg-primary text-primary-foreground px-3 py-2 rounded-md text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      {scraping ? "…" : <><Sparkles className="w-3 h-3" /> Pobierz</>}
                    </button>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1.5">
                    Wystarczy link z USFans / USFinds — spróbujemy pobrać tytuł, opis, cenę i zdjęcia QC.
                  </div>
                </div>
              )}

              <form onSubmit={save} className="space-y-4">
                <Field label="Nazwa">
                  <input required value={form.name} onChange={(e) => set("name", e.target.value)} className="input" />
                </Field>
                <Field label="Slug (URL)">
                  <input
                    required
                    value={form.slug}
                    onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    className="input font-mono text-sm"
                    placeholder="jordan-1-travis-scott"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cena (zł)">
                    <input required type="number" step="0.01" value={form.price} onChange={(e) => set("price", Number(e.target.value))} className="input" />
                  </Field>
                  <Field label="Cena przed (opcj.)">
                    <input
                      type="number"
                      step="0.01"
                      value={form.original_price ?? ""}
                      onChange={(e) => set("original_price", e.target.value === "" ? null : Number(e.target.value))}
                      className="input"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Kategoria">
                    <select value={form.category} onChange={(e) => set("category", e.target.value)} className="input">
                      {ADMIN_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Batch">
                    <select value={form.batch} onChange={(e) => set("batch", e.target.value)} className="input">
                      {BATCHES.map((b) => (
                        <option key={b.id} value={b.id}>{b.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Quality">
                    <input value={form.quality} onChange={(e) => set("quality", e.target.value)} className="input" placeholder="9/10" />
                  </Field>
                  <Field label="Sort order">
                    <input type="number" value={form.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} className="input" />
                  </Field>
                </div>
                <Field label="Rozmiary (oddzielone przecinkami)">
                  <input value={form.sizes} onChange={(e) => set("sizes", e.target.value)} className="input" placeholder="38, 39, 40, 41" />
                </Field>
                <Field label="URL głównego zdjęcia">
                  <input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} className="input" placeholder="https://..." />
                </Field>
                <Field label="Dodatkowe zdjęcia (URL-e oddzielone przecinkami)">
                  <input value={form.images} onChange={(e) => set("images", e.target.value)} className="input" placeholder="https://..., https://..." />
                </Field>

                <div className="pt-2 border-t border-border">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" /> Linki agentów (auto-konwerter)
                  </div>
                  <div className="mb-3 bg-card border border-border rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground mb-2">
                      Wklej 1–3 linki (dowolny agent) — wygenerujemy wszystkie 3 z naszymi ref-kodami.
                    </div>
                    <LinkConverter
                      initialInputs={[form.agent_usfans, form.agent_kakobuy, form.agent_litbuy].filter(Boolean)}
                      onApply={(out) => {
                        if (out.usfans) set("agent_usfans", out.usfans);
                        if (out.kakobuy) set("agent_kakobuy", out.kakobuy);
                        if (out.litbuy) set("agent_litbuy", out.litbuy);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Field label="USFans (polecany) — link">
                      <input value={form.agent_usfans} onChange={(e) => set("agent_usfans", e.target.value)} className="input" placeholder="https://usfans.com/..." />
                    </Field>
                    <Field label="Kakobuy — link">
                      <input value={form.agent_kakobuy} onChange={(e) => set("agent_kakobuy", e.target.value)} className="input" placeholder="https://kakobuy.com/..." />
                    </Field>
                    <Field label="Litbuy — link">
                      <input value={form.agent_litbuy} onChange={(e) => set("agent_litbuy", e.target.value)} className="input" placeholder="https://litbuy.com/..." />
                    </Field>
                  </div>
                </div>

                <Field label="Opis">
                  <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="input min-h-[100px]" />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
                  Wyróżniony (pokaż na stronie głównej)
                </label>
                {can("content.verify") && (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_verified} onChange={(e) => set("is_verified", e.target.checked)} />
                    <span className="inline-flex items-center gap-1">
                      Zweryfikowany <BadgeCheck className="w-4 h-4 text-primary" />
                    </span>
                  </label>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving || (form.id ? !can("products.edit") : !can("products.create"))}
                    className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold disabled:opacity-50 hover:opacity-90 transition"
                  >
                    {saving ? "Zapisywanie..." : form.id ? "Zapisz zmiany" : "Dodaj produkt"}
                  </button>
                  {form.id && (
                    <button type="button" onClick={() => setForm(empty)} className="px-4 border border-border rounded-lg">
                      Anuluj
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <h2 className="text-xl font-bold">Produkty ({products.length})</h2>
                <div className="flex gap-2">
                  {can("products.export") && (
                    <button onClick={onExport} className="text-sm bg-card border border-border px-3 py-2 rounded-lg hover:border-primary/60">
                      ⬇ Eksport
                    </button>
                  )}
                  {can("products.import") && (
                    <label className="text-sm bg-card border border-border px-3 py-2 rounded-lg hover:border-primary/60 cursor-pointer">
                      ⬆ Import (merge)
                      <input
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0], "merge")}
                      />
                    </label>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {products.length === 0 && (
                  <div className="border border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground">
                    Brak produktów. Dodaj pierwszy w formularzu obok.
                  </div>
                )}
                {products.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 bg-card border border-border rounded-xl p-3 hover:border-primary/60 transition"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {Number(p.price).toFixed(2)} zł • {p.category} • {p.batch ?? "—"} {p.featured && "• ★"}
                      </div>
                    </div>
                    {can("products.edit") && (
                      <button onClick={() => edit(p)} className="text-sm bg-secondary px-3 py-2 rounded-lg hover:border-primary/60 border border-transparent inline-flex items-center gap-1">
                        <Pencil className="w-3 h-3" /> Edytuj
                      </button>
                    )}
                    {can("content.verify") && (
                      <VerifyProductBtn product={p} onDone={refresh} />
                    )}
                    {can("products.delete") && (
                      <button onClick={() => onDelete(p)} className="text-sm bg-destructive/10 text-destructive px-3 py-2 rounded-lg border border-destructive/30 hover:bg-destructive/20 inline-flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Usuń
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === "backups" && <BackupsPanel />}
        {tab === "outfits" && <OutfitsAdminPanel canVerify={can("content.verify")} />}
        {tab === "site" && (isSuper || can("announcements.manage") || can("maintenance.manage")) && (
          <SitePanel canAnnouncement={isSuper || can("announcements.manage")} canMaintenance={isSuper || can("maintenance.manage")} />
        )}
        {tab === "admins" && isSuper && <AdminsPanel currentId={session.discordId} />}
        {tab === "stats" && (isSuper || can("stats.view")) && <StatsPanel />}
        {tab === "converter" && (
          <section className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" /> Link converter
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Wklej dowolny link agenta / chińskiego sklepu — wygenerujemy linki USFans / Kakobuy / Litbuy z naszymi
              ref-kodami.
            </p>
            <div className="bg-card border border-border rounded-2xl p-6">
              <LinkConverter allowMultiInput />
            </div>
          </section>
        )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function BackupsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "backups"],
    queryFn: () => listBackups(),
  });
  return (
    <section>
      <h2 className="text-xl font-bold mb-2">Backupy</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Każdy dodany produkt jest automatycznie zapisywany. Backupów nie można usunąć (zabezpieczone na poziomie bazy).
      </p>
      {isLoading && <div className="text-muted-foreground">Ładowanie...</div>}
      <div className="space-y-2">
        {(data ?? []).map((b) => {
          const snap = b.snapshot as { name?: string } | null;
          return (
            <div key={b.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">{b.reason}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{snap?.name ?? "(import bulk)"}</div>
                <div className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString("pl-PL")}</div>
              </div>
              <span className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">{b.product_id ?? "—"}</span>
            </div>
          );
        })}
        {(data ?? []).length === 0 && !isLoading && (
          <div className="border border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground">
            Brak backupów.
          </div>
        )}
      </div>
    </section>
  );
}

function VerifyProductBtn({ product, onDone }: { product: Product; onDone: () => Promise<void> | void }) {
  const fn = useServerFn(setProductVerified);
  const [busy, setBusy] = useState(false);
  const active = product.is_verified;
  return (
    <button
      onClick={async () => {
        setBusy(true);
        try {
          await fn({ data: { id: product.id, verified: !active } });
          toast.success(active ? "Odznaczono weryfikację" : "Oznaczono jako Verified");
          await onDone();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Błąd");
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
      className={`text-sm px-3 py-2 rounded-lg border inline-flex items-center gap-1 transition disabled:opacity-50 ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-secondary border-transparent hover:border-primary/60"
      }`}
      title={active ? "Odznacz Verified" : "Oznacz jako Verified"}
    >
      <BadgeCheck className="w-3 h-3" /> {active ? "Verified" : "Verify"}
    </button>
  );
}

const outfitsAdminOptions = queryOptions({
  queryKey: ["admin", "outfits"],
  queryFn: () => listOutfitsAdmin(),
});

function OutfitsAdminPanel({ canVerify }: { canVerify: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(outfitsAdminOptions);
  const verify = useServerFn(setOutfitVerified);
  const remove = useServerFn(deleteOutfit);

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["admin", "outfits"] });
    await qc.invalidateQueries({ queryKey: ["outfits", "list"] });
  }

  async function onToggle(o: Outfit) {
    try {
      await verify({ data: { id: o.id, verified: !o.is_verified } });
      toast.success(o.is_verified ? "Odznaczono weryfikację" : "Outfit zweryfikowany");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd");
    }
  }

  async function onDelete(o: Outfit) {
    if (!confirm(`Usunąć outfit "${o.title}"?`)) return;
    try {
      await remove({ data: { id: o.id } });
      toast.success("Usunięto outfit");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd");
    }
  }

  return (
    <section className="max-w-5xl">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Shirt className="w-5 h-5 text-primary" /> Outfits społeczności
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        {canVerify
          ? "Oznaczaj outfity jako Verified, aby wyróżnić najlepsze."
          : "Brak uprawnienia do weryfikacji — poproś super admina o content.verify."}
      </p>
      {isLoading && <div className="text-sm text-muted-foreground">Ładowanie…</div>}
      {data && data.length === 0 && (
        <div className="border border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground">
          Brak outfitów.
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((o) => (
          <div key={o.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="aspect-[4/5] bg-secondary relative">
              {o.image_url && <img src={o.image_url} alt={o.title} className="w-full h-full object-cover" />}
              {o.is_verified && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <div className="p-3">
              <div className="font-semibold text-sm truncate">{o.title}</div>
              <div className="text-[11px] text-muted-foreground">@{o.author} • ❤ {o.likes} • 👁 {o.views}</div>
              <div className="mt-3 flex gap-2">
                {canVerify && (
                  <button
                    onClick={() => onToggle(o)}
                    className={`flex-1 text-xs px-3 py-2 rounded-lg border inline-flex items-center justify-center gap-1 transition ${
                      o.is_verified
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary border-transparent hover:border-primary/60"
                    }`}
                  >
                    <BadgeCheck className="w-3 h-3" /> {o.is_verified ? "Verified" : "Verify"}
                  </button>
                )}
                {canVerify && (
                  <button
                    onClick={() => onDelete(o)}
                    className="text-xs bg-destructive/10 text-destructive px-3 py-2 rounded-lg border border-destructive/30 hover:bg-destructive/20 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SitePanel({ canAnnouncement, canMaintenance }: { canAnnouncement: boolean; canMaintenance: boolean }) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateSiteSettings);
  const { data, isLoading } = useQuery({
    queryKey: ["site-settings", "admin"],
    queryFn: () => getSiteSettings(),
  });
  const [maint, setMaint] = useState(false);
  const [maintMsg, setMaintMsg] = useState("");
  const [ann, setAnn] = useState("");
  const [annActive, setAnnActive] = useState(false);
  const [popupActive, setPopupActive] = useState(false);
  const [popupTitle, setPopupTitle] = useState("Ważne ogłoszenie");
  const [popupMessage, setPopupMessage] = useState("");
  const [promoActive, setPromoActive] = useState(false);
  const [promoTitle, setPromoTitle] = useState("Claim your -40% code!");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoCta, setPromoCta] = useState("Register now");
  const [promoLink, setPromoLink] = useState("");
  const [promoLogo, setPromoLogo] = useState<"usfinds" | "usfans" | "kakobuy" | "litbuy">("usfinds");

  useEffect(() => {
    if (data) {
      setMaint(data.maintenance_mode);
      setMaintMsg(data.maintenance_message);
      setAnn(data.announcement ?? "");
      setAnnActive(data.announcement_active);
      setPopupActive(data.popup_active);
      setPopupTitle(data.popup_title);
      setPopupMessage(data.popup_message);
      setPromoActive(data.promo_active);
      setPromoTitle(data.promo_title);
      setPromoMessage(data.promo_message);
      setPromoCta(data.promo_cta_label);
      setPromoLink(data.promo_link);
      setPromoLogo(data.promo_logo ?? "usfinds");
    }
  }, [data]);

  async function save() {
    try {
      const payload: Record<string, unknown> = {};
      if (canMaintenance) {
        payload.maintenance_mode = maint;
        payload.maintenance_message = maintMsg;
      }
      if (canAnnouncement) {
        payload.announcement = ann || null;
        payload.announcement_active = annActive;
        payload.popup_active = popupActive;
        payload.popup_title = popupTitle;
        payload.popup_message = popupMessage;
        payload.promo_active = promoActive;
        payload.promo_title = promoTitle;
        payload.promo_message = promoMessage;
        payload.promo_cta_label = promoCta;
        payload.promo_link = promoLink;
        payload.promo_logo = promoLogo;
      }
      await updateFn({ data: payload } as Parameters<typeof updateFn>[0]);
      toast.success("Zapisano");
      await qc.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd");
    }
  }

  if (isLoading) return <div className="text-muted-foreground">Ładowanie...</div>;

  return (
    <section className="max-w-3xl space-y-6">
      {canAnnouncement && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> Reklama linku (górny baner)</h2>
          <p className="text-sm text-muted-foreground mb-4">Baner z logo + przyciskiem CTA na samej górze strony. Zastępuje zwykłe ogłoszenie wizualnie — możesz włączyć oba.</p>
          <Field label="Tytuł (pogrubiony)">
            <input value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} className="input" placeholder="Claim your -40% code!" />
          </Field>
          <div className="mt-3">
            <Field label="Treść">
              <textarea value={promoMessage} onChange={(e) => setPromoMessage(e.target.value)} className="input min-h-[70px]" />
            </Field>
          </div>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <Field label="Etykieta przycisku">
              <input value={promoCta} onChange={(e) => setPromoCta(e.target.value)} className="input" placeholder="Register now" />
            </Field>
            <Field label="Link (po kliknięciu w przycisk)">
              <input value={promoLink} onChange={(e) => setPromoLink(e.target.value)} className="input font-mono text-xs" placeholder="https://..." />
            </Field>
          </div>
          <label className="flex items-center gap-2 mt-3 text-sm">
            <input type="checkbox" checked={promoActive} onChange={(e) => setPromoActive(e.target.checked)} />
            Pokazuj baner reklamowy
          </label>
          <div className="mt-4">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Logo w banerze</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["usfinds", "usfans", "kakobuy", "litbuy"] as const).map((k) => {
                const active = promoLogo === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPromoLogo(k)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold uppercase tracking-wider transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40"}`}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {canAnnouncement && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> Pasek z ogłoszeniem</h2>
          <p className="text-sm text-muted-foreground mb-4">Wąski pasek na górze każdej strony.</p>
          <Field label="Treść">
            <input value={ann} onChange={(e) => setAnn(e.target.value)} className="input" placeholder="np. Promocja -20%!" />
          </Field>
          <label className="flex items-center gap-2 mt-3 text-sm">
            <input type="checkbox" checked={annActive} onChange={(e) => setAnnActive(e.target.checked)} />
            Pokazuj pasek
          </label>
        </div>
      )}

      {canAnnouncement && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Wyskakujący popup</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Wyświetla się raz na sesję na stronie głównej, na środku ekranu.
          </p>
          <Field label="Tytuł">
            <input value={popupTitle} onChange={(e) => setPopupTitle(e.target.value)} className="input" />
          </Field>
          <div className="mt-3">
            <Field label="Treść">
              <textarea value={popupMessage} onChange={(e) => setPopupMessage(e.target.value)} className="input min-h-[110px]" placeholder="Treść ogłoszenia — wsparcie nowych linii." />
            </Field>
          </div>
          <label className="flex items-center gap-2 mt-3 text-sm">
            <input type="checkbox" checked={popupActive} onChange={(e) => setPopupActive(e.target.checked)} />
            Włącz popup
          </label>
        </div>
      )}

      {canMaintenance && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-primary" /> Przerwa techniczna</h2>
          <p className="text-sm text-muted-foreground mb-4">Zamyka stronę dla wszystkich (poza /ff).</p>
          <Field label="Wiadomość">
            <textarea value={maintMsg} onChange={(e) => setMaintMsg(e.target.value)} className="input min-h-[80px]" />
          </Field>
          <label className="flex items-center gap-2 mt-3 text-sm">
            <input type="checkbox" checked={maint} onChange={(e) => setMaint(e.target.checked)} />
            Włącz przerwę techniczną
          </label>
        </div>
      )}

      <button onClick={save} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition">
        Zapisz ustawienia
      </button>
    </section>
  );
}

function AdminsPanel({ currentId }: { currentId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "admins"], queryFn: () => listAdmins() });
  const createFn = useServerFn(createAdmin);
  const updateFn = useServerFn(updateAdmin);
  const banFn = useServerFn(banAdmin);
  const unbanFn = useServerFn(unbanAdmin);
  const delFn = useServerFn(deleteAdmin);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<AdminRow | null>(null);
  const [banning, setBanning] = useState<AdminRow | null>(null);

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["admin", "admins"] });
  }

  async function onUnban(a: AdminRow) {
    try {
      await unbanFn({ data: { id: a.id } });
      toast.success(`Odbanowano ${a.username}`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd");
    }
  }

  async function onDelete(a: AdminRow) {
    if (!confirm(`Usunąć konto ${a.username}? Tej akcji nie można cofnąć.`)) return;
    try {
      await delFn({ data: { id: a.id } });
      toast.success("Usunięto");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd");
    }
  }

  return (
    <section className="max-w-4xl">
      <div className="flex items-end justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-primary" /> Administratorzy</h2>
          <p className="text-sm text-muted-foreground mt-1">Zarządzaj kontami, permisjami i banami.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold inline-flex items-center gap-2 hover:opacity-90 transition">
          <UserPlus className="w-4 h-4" /> Dodaj admina
        </button>
      </div>

      {isLoading && <div className="text-muted-foreground">Ładowanie…</div>}

      <div className="space-y-3">
        {(data ?? []).map((a) => {
          const isMe = a.discord_id === currentId;
          return (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-card border rounded-2xl p-5 ${a.is_banned ? "border-destructive/50" : "border-border"}`}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${a.role === "super" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                  {a.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{a.username}</span>
                    {a.role === "super" ? (
                      <span className="text-[10px] uppercase tracking-widest font-bold bg-primary/15 text-primary border border-primary/40 px-2 py-0.5 rounded-full">Super</span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest font-bold bg-secondary text-muted-foreground border border-border px-2 py-0.5 rounded-full">Editor</span>
                    )}
                    {isMe && <span className="text-[10px] uppercase font-bold text-primary">(to ty)</span>}
                    {a.is_banned && (
                      <span className="text-[10px] uppercase tracking-widest font-bold bg-destructive/15 text-destructive border border-destructive/40 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Ban className="w-3 h-3" /> Zbanowany
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{a.discord_id}</div>
                  {a.is_banned && a.ban_reason && (
                    <div className="mt-2 text-xs bg-destructive/10 border border-destructive/30 text-destructive px-3 py-1.5 rounded-lg">
                      Powód banu: <strong>{a.ban_reason}</strong>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setEditing(a)} className="text-xs border border-border px-3 py-2 rounded-lg hover:border-primary/60 inline-flex items-center gap-1">
                    <Pencil className="w-3 h-3" /> Edytuj
                  </button>
                  {a.is_banned ? (
                    <button onClick={() => onUnban(a)} className="text-xs bg-primary/10 text-primary border border-primary/40 px-3 py-2 rounded-lg hover:bg-primary/20 inline-flex items-center gap-1">
                      <Check className="w-3 h-3" /> Odbanuj
                    </button>
                  ) : (
                    !isMe && (
                      <button onClick={() => setBanning(a)} className="text-xs bg-destructive/10 text-destructive border border-destructive/30 px-3 py-2 rounded-lg hover:bg-destructive/20 inline-flex items-center gap-1">
                        <Ban className="w-3 h-3" /> Banuj
                      </button>
                    )
                  )}
                  {!isMe && (
                    <button onClick={() => onDelete(a)} className="text-xs bg-destructive/10 text-destructive border border-destructive/30 px-3 py-2 rounded-lg hover:bg-destructive/20 inline-flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Usuń
                    </button>
                  )}
                </div>
              </div>
              {a.role !== "super" && (
                <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-1.5">
                  {a.permissions.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Brak uprawnień</span>
                  ) : (
                    a.permissions.map((p) => (
                      <span key={p} className="text-[10px] font-mono bg-secondary px-2 py-1 rounded">{p}</span>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showCreate && (
          <AdminEditModal
            mode="create"
            onClose={() => setShowCreate(false)}
            onSubmit={async (vals) => {
              await createFn({ data: vals });
              toast.success(`Utworzono konto ${vals.username}`);
              setShowCreate(false);
              await refresh();
            }}
          />
        )}
        {editing && (
          <AdminEditModal
            mode="edit"
            initial={editing}
            onClose={() => setEditing(null)}
            onSubmit={async (vals) => {
              await updateFn({
                data: {
                  id: editing.id,
                  username: vals.username,
                  role: vals.role,
                  permissions: vals.permissions,
                  ...(vals.password ? { password: vals.password } : {}),
                },
              });
              toast.success(`Zapisano ${vals.username}`);
              setEditing(null);
              await refresh();
            }}
          />
        )}
        {banning && (
          <BanModal
            admin={banning}
            onClose={() => setBanning(null)}
            onConfirm={async (reason) => {
              await banFn({ data: { id: banning.id, reason } });
              toast.success(`Zbanowano ${banning.username}`);
              setBanning(null);
              await refresh();
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function AdminEditModal({
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial?: AdminRow;
  onClose: () => void;
  onSubmit: (v: { discordId: string; username: string; password: string; role: "super" | "editor"; permissions: string[] }) => Promise<void>;
}) {
  const [discordId, setDiscordId] = useState(initial?.discord_id ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"super" | "editor">(initial?.role ?? "editor");
  const [permissions, setPermissions] = useState<string[]>(initial?.permissions ?? ["products.create", "products.edit"]);
  const [busy, setBusy] = useState(false);

  function togglePerm(id: string) {
    setPermissions((cur) => (cur.includes(id) ? cur.filter((p) => p !== id) : [...cur, id]));
  }

  return (
    <ModalShell onClose={onClose} title={mode === "create" ? "Nowe konto admina" : `Edytuj: ${initial?.username}`} icon={mode === "create" ? UserPlus : Pencil}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSubmit({ discordId, username, password, role, permissions });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Błąd");
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-4"
      >
        <Field label="Discord ID">
          <input value={discordId} onChange={(e) => setDiscordId(e.target.value)} required disabled={mode === "edit"} className="input font-mono text-sm disabled:opacity-50" />
        </Field>
        <Field label="Nazwa wyświetlana">
          <input value={username} onChange={(e) => setUsername(e.target.value)} required className="input" />
        </Field>
        <Field label={mode === "create" ? "Hasło" : "Nowe hasło (zostaw puste żeby nie zmieniać)"}>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required={mode === "create"} className="input pl-9 font-mono" />
          </div>
        </Field>
        <Field label="Rola">
          <select value={role} onChange={(e) => setRole(e.target.value as "super" | "editor")} className="input">
            <option value="editor">Editor</option>
            <option value="super">Super Admin (pełne uprawnienia)</option>
          </select>
        </Field>
        {role !== "super" && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Uprawnienia</div>
            <div className="space-y-1.5">
              {ALL_PERMS.map((p) => {
                const active = permissions.includes(p.id);
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => togglePerm(p.id)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 ${active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${active ? "bg-primary text-primary-foreground" : "border border-border"}`}>
                      {active && <Check className="w-3 h-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={busy} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold disabled:opacity-50">
            {busy ? "Zapisywanie…" : mode === "create" ? "Utwórz konto" : "Zapisz zmiany"}
          </button>
          <button type="button" onClick={onClose} className="px-4 border border-border rounded-xl">Anuluj</button>
        </div>
      </form>
    </ModalShell>
  );
}

function BanModal({ admin, onClose, onConfirm }: { admin: AdminRow; onClose: () => void; onConfirm: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState("Złamanie regulaminu");
  const [busy, setBusy] = useState(false);
  return (
    <ModalShell onClose={onClose} title={`Banuj: ${admin.username}`} icon={Ban} tone="destructive">
      <p className="text-sm text-muted-foreground mb-4">
        Zbanowany admin nie będzie mógł się zalogować ani wykonywać żadnych akcji. Otrzyma ekran z powodem banu.
      </p>
      <Field label="Powód banu">
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="input min-h-[90px]" />
      </Field>
      <div className="flex gap-2 mt-5">
        <button
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm(reason || "Złamanie regulaminu");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Błąd");
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
          className="flex-1 bg-destructive text-destructive-foreground py-2.5 rounded-xl font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          <Ban className="w-4 h-4" /> {busy ? "Banowanie…" : "Zbanuj"}
        </button>
        <button onClick={onClose} className="px-4 border border-border rounded-xl">Anuluj</button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  onClose,
  title,
  icon: Icon,
  tone = "primary",
  children,
}: {
  onClose: () => void;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "primary" | "destructive";
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-start md:items-center justify-center p-4 md:p-8 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl my-auto"
      >
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tone === "destructive" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg flex-1">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function StatsPanel() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => getStatsSummary(),
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div className="text-muted-foreground">Ładowanie statystyk…</div>;
  if (!data) return <div className="text-muted-foreground">Brak danych.</div>;

  const agentColors: Record<string, string> = {
    usfans: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    kakobuy: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    litbuy: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };

  const cards = [
    { label: "Wejścia (łącznie)", value: data.totalVisits, icon: Eye },
    { label: "Unikalne IP", value: data.uniqueVisitors, icon: Eye },
    { label: "Unikalne IP (24h)", value: data.visitors24h, icon: Eye },
    { label: "Unikalne IP (7 dni)", value: data.visitors7d, icon: Eye },
    { label: "Kliknięcia w linki", value: data.totalClicks, icon: MousePointerClick },
  ];

  return (
    <section className="max-w-5xl">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Statystyki
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Ruch na stronie i kliknięcia w linki agentów.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-xs border border-border px-3 py-2 rounded-lg hover:border-primary/60 disabled:opacity-50"
        >
          {isFetching ? "Odświeżam…" : "Odśwież"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-3xl font-bold">{c.value.toLocaleString("pl-PL")}</div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">{c.label}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-8">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <MousePointerClick className="w-4 h-4 text-primary" /> Kliknięcia wg agenta
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.keys(data.clicksByAgent).length === 0 && (
            <div className="text-sm text-muted-foreground">Brak kliknięć.</div>
          )}
          {Object.entries(data.clicksByAgent).map(([agent, n]) => (
            <div
              key={agent}
              className={`px-3 py-2 rounded-xl border text-sm font-semibold ${agentColors[agent] ?? "bg-secondary border-border text-foreground"}`}
            >
              <span className="uppercase tracking-wider text-[10px] opacity-80">{agent}</span>
              <span className="ml-2 font-mono">{n}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Top produkty (najwięcej kliknięć)
        </h3>
        {data.topProducts.length === 0 && (
          <div className="text-sm text-muted-foreground">Brak kliknięć per produkt.</div>
        )}
        <div className="space-y-2">
          {data.topProducts.map((p, i) => (
            <div
              key={(p.productId ?? "none") + i}
              className="flex items-center gap-3 bg-background/40 border border-border rounded-xl p-3"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-[11px] text-muted-foreground flex flex-wrap gap-2 mt-1">
                  {Object.entries(p.byAgent).map(([a, n]) => (
                    <span key={a} className="font-mono">
                      {a}: <strong className="text-foreground">{n}</strong>
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-lg font-bold">{p.clicks}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}