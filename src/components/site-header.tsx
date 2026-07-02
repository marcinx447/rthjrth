import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Search, Settings2, LogIn } from "lucide-react";
import logo from "@/assets/usfinds-logo.jpg.asset.json";
import { useSettings } from "@/lib/user-settings";
import { SearchCommand } from "./search-command";

export const DISCORD_URL = "https://discord.gg/pFTD4svkTa";
export const LOGIN_URL = "https://www.usfans.com/register?ref=SE9PXF";

export function SiteHeader() {
  const { openSettings } = useSettings();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border"
    >
      <div className="container mx-auto px-6 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <motion.img
            src={logo.url}
            alt="USFinds"
            className="h-9 w-9 rounded-md bg-white/95 p-1 object-contain"
            whileHover={{ scale: 1.05, rotate: -1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          />
          <span className="font-display text-lg font-bold tracking-tight leading-none">
            <span className="text-primary">US</span>
            <span className="text-white">FINDS</span>
          </span>
        </Link>
        <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold ml-2">
          <NavItem to="/outfits">Outfits</NavItem>
          <NavItem to="/gallery">Finds</NavItem>
          <NavItem to="/tools">Tools</NavItem>
        </nav>

        <button
          onClick={() => setSearchOpen(true)}
          className="flex-1 mx-2 md:mx-4 max-w-md hidden sm:flex items-center gap-2.5 px-3.5 h-9 rounded-lg bg-neutral-900/60 border border-neutral-800 hover:border-neutral-600 text-neutral-500 text-sm transition"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Szukaj produktów...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 border border-neutral-800 rounded text-[10px] font-mono text-neutral-500 bg-neutral-950">
            Ctrl K
          </kbd>
        </button>

        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
          <button
            onClick={() => setSearchOpen(true)}
            className="sm:hidden w-9 h-9 rounded-lg border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition"
            aria-label="Szukaj"
          >
            <Search className="w-4 h-4" />
          </button>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Discord"
            className="w-9 h-9 rounded-lg border border-neutral-800 hover:border-[#5865F2] hover:bg-[#5865F2]/10 flex items-center justify-center text-neutral-300 hover:text-[#aab2ff] transition"
          >
            <DiscordIcon className="w-4 h-4" />
          </a>
          <button
            onClick={openSettings}
            aria-label="Ustawienia"
            className="w-9 h-9 rounded-lg border border-neutral-800 hover:border-neutral-600 flex items-center justify-center text-neutral-300 hover:text-white transition"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <a
            href={LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3.5 h-9 rounded-lg text-sm font-bold hover:opacity-90 transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Zaloguj się</span>
          </a>
        </div>
      </div>

      <nav className="lg:hidden flex items-center gap-1 px-6 pb-2 pt-1 text-xs font-semibold overflow-x-auto">
        <NavItem to="/outfits">Outfits</NavItem>
        <NavItem to="/gallery">Finds</NavItem>
        <NavItem to="/tools">Tools</NavItem>
      </nav>
    </motion.header>
    <SearchCommand open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to as any}
      className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
      activeProps={{ className: "px-3 py-1.5 rounded-lg text-white bg-neutral-900" }}
    >
      {children}
          </Link>
  );
}

export function DiscordIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a13.4 13.4 0 0 0-.617 1.265 18.27 18.27 0 0 0-5.487 0A12.4 12.4 0 0 0 9.837 3a19.74 19.74 0 0 0-3.762 1.369C2.69 9.41 1.85 14.31 2.27 19.13a19.9 19.9 0 0 0 6.073 3.06c.49-.665.927-1.371 1.302-2.114a12.7 12.7 0 0 1-2.05-.985c.172-.127.34-.26.5-.398 3.927 1.83 8.18 1.83 12.06 0 .162.138.33.27.5.398-.654.39-1.34.72-2.052.986.376.742.812 1.448 1.303 2.113a19.85 19.85 0 0 0 6.072-3.06c.5-5.587-.844-10.443-3.66-14.762ZM9.342 16.06c-1.219 0-2.222-1.118-2.222-2.49 0-1.374.984-2.49 2.222-2.49 1.247 0 2.243 1.123 2.222 2.49 0 1.373-.984 2.49-2.222 2.49Zm5.316 0c-1.218 0-2.222-1.118-2.222-2.49 0-1.374.985-2.49 2.222-2.49 1.247 0 2.244 1.123 2.222 2.49 0 1.373-.975 2.49-2.222 2.49Z" />
    </svg>
  );
}