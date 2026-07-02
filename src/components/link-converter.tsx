import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Sparkles } from "lucide-react";
import { convertLinks, type ConvertedLinks } from "@/lib/converter";
import { toast } from "sonner";

const AGENT_META: { key: keyof ConvertedLinks; label: string; color: string }[] = [
  { key: "usfans", label: "USFans (polecany)", color: "border-primary bg-primary/10" },
  { key: "kakobuy", label: "Kakobuy", color: "border-border bg-card" },
  { key: "litbuy", label: "Litbuy", color: "border-border bg-card" },
];

export function LinkConverter({
  allowMultiInput = true,
  initialInputs,
  onApply,
}: {
  allowMultiInput?: boolean;
  initialInputs?: string[];
  onApply?: (out: ConvertedLinks) => void;
}) {
  const [inputs, setInputs] = useState<string[]>(initialInputs ?? [""]);
  const [copied, setCopied] = useState<string | null>(null);

  const out: ConvertedLinks = useMemo(() => convertLinks(inputs), [inputs]);
  const hasAny = out.usfans || out.kakobuy || out.litbuy;

  function copy(k: string, v: string) {
    navigator.clipboard.writeText(v).then(() => {
      setCopied(k);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {inputs.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={v}
              onChange={(e) =>
                setInputs((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))
              }
              placeholder="Wklej link (kakobuy / usfans / litbuy / weidian / taobao / 1688)"
              className="input flex-1 font-mono text-xs"
            />
            {allowMultiInput && inputs.length > 1 && (
              <button
                type="button"
                onClick={() => setInputs((prev) => prev.filter((_, j) => j !== i))}
                className="px-3 rounded-md border border-border text-muted-foreground hover:border-destructive hover:text-destructive"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {allowMultiInput && inputs.length < 3 && (
          <button
            type="button"
            onClick={() => setInputs((prev) => [...prev, ""])}
            className="text-xs text-primary hover:underline"
          >
            + dodaj kolejny link
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-2">
        {AGENT_META.map((a) => {
          const v = out[a.key];
          return (
            <motion.div
              key={a.key}
              layout
              className={`rounded-xl border p-3 ${a.color} ${!v ? "opacity-50" : ""}`}
            >
              <div className="text-[11px] font-bold uppercase tracking-widest mb-2">{a.label}</div>
              <div className="text-[11px] font-mono text-muted-foreground break-all line-clamp-3 min-h-[36px]">
                {v ?? "—"}
              </div>
              <div className="mt-2 flex gap-1">
                <button
                  type="button"
                  disabled={!v}
                  onClick={() => v && copy(a.key, v)}
                  className="flex-1 text-xs bg-background/60 hover:bg-background border border-border rounded-md px-2 py-1 disabled:opacity-40 inline-flex items-center justify-center gap-1"
                >
                  {copied === a.key ? (
                    <>
                      <Check className="w-3 h-3" /> skopiowano
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> kopiuj
                    </>
                  )}
                </button>
                {v && (
                  <a
                    href={v}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-background/60 hover:bg-background border border-border rounded-md px-2 py-1"
                  >
                    ↗
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {onApply && (
        <button
          type="button"
          disabled={!hasAny}
          onClick={() => {
            onApply(out);
            toast.success("Linki agentów uzupełnione");
          }}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-2 hover:opacity-90 transition"
        >
          <Sparkles className="w-4 h-4" /> Wstaw przekonwertowane linki do formularza
        </button>
      )}
    </div>
  );
}