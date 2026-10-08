import { Diamond } from "lucide-react";

/** Gold-outlined diamond in a rounded square — the Mix Canvas brand mark. */
export function Logomark({ size = 36 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[10px] border"
      style={{
        width: size,
        height: size,
        background: "var(--dg-canvas)",
        borderColor: "rgb(200 160 36 / 0.35)",
      }}
    >
      <Diamond size={Math.round(size * 0.42)} strokeWidth={2} className="text-[var(--dg-accent)]" />
    </div>
  );
}
