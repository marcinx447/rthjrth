export function AnnouncementBar({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="bg-primary text-primary-foreground text-sm font-semibold py-2 px-4 text-center">
      <span className="inline-block mr-2">📣</span>
      {text}
    </div>
  );
}