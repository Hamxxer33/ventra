import { cn } from "@/lib/utils";

function pad2(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1 border-2 border-border bg-bg px-1 py-2">
      <span className="font-display text-pixel-lg tabular-nums text-accent">{value}</span>
      <span className="font-display text-micro uppercase text-muted">{label}</span>
    </div>
  );
}

/** Countdown to `target` (ms). `now` is null during SSR / first render. */
export function ClaimCountdown({
  target,
  now,
  className,
}: {
  target: number;
  now: number | null;
  className?: string;
}) {
  const total = now === null ? null : Math.max(0, Math.floor((target - now) / 1000));
  const parts =
    total === null
      ? ["--", "--", "--", "--"]
      : [
          pad2(Math.floor(total / 86400)),
          pad2(Math.floor((total % 86400) / 3600)),
          pad2(Math.floor((total % 3600) / 60)),
          pad2(total % 60),
        ];
  return (
    <div className={cn("flex gap-2", className)} role="timer" aria-live="off">
      <Unit value={parts[0]} label="Days" />
      <Unit value={parts[1]} label="Hrs" />
      <Unit value={parts[2]} label="Min" />
      <Unit value={parts[3]} label="Sec" />
    </div>
  );
}
