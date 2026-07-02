export function MaintenanceScreen({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.72_0.2_45/0.18),transparent_55%),radial-gradient(circle_at_80%_80%,oklch(0.72_0.2_45/0.1),transparent_50%)]" />
      <div className="relative max-w-lg text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-xs uppercase tracking-widest text-primary mb-6">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> USFinds
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-[0.95]">
          Przerwa<br />techniczna
        </h1>
        <p className="mt-6 text-lg text-muted-foreground whitespace-pre-line">{message}</p>
        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
          <span className="w-8 h-px bg-border" />
          Wracamy wkrótce
          <span className="w-8 h-px bg-border" />
        </div>
      </div>
    </div>
  );
}