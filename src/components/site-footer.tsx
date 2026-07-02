export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="container mx-auto px-6 py-12 text-center max-w-2xl">
        <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-500 mb-5">
          Informacje
        </div>
        <div className="font-display text-lg font-bold mb-4">
          <span className="text-primary">©</span>{" "}
          <span className="text-primary">US</span>
          <span className="text-white">FINDS</span>. 2026
        </div>
        <p className="text-sm text-neutral-400 leading-relaxed">
          USFINDS nie sprzedaje żadnych fizycznych produktów. Ta strona ma charakter wyłącznie edukacyjny.
        </p>
        <p className="text-sm text-neutral-500 mt-2">
          Nie popieramy sprzedaży podrabianych towarów.
        </p>
      </div>
    </footer>
  );
}