import { pad2, type Countdown } from "@/lib/countdown";
import { cn } from "@/lib/utils";

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-16 flex-1 flex-col items-center gap-2 border-2 border-border bg-surface px-2 py-3 shadow-pixel-sm sm:min-w-20">
      <span className="font-display text-pixel-xl tabular-nums text-accent sm:text-pixel-2xl">
        {value}
      </span>
      <span className="font-display text-micro uppercase text-muted sm:text-pixel">{label}</span>
    </div>
  );
}

export function CountdownClock({
  countdown,
  className,
}: {
  countdown: Countdown | null;
  className?: string;
}) {
  if (!countdown) {
    return (
      <div className={cn("flex gap-2", className)} aria-hidden="true">
        {["DAYS", "HRS", "MIN", "SEC"].map((label) => (
          <Unit key={label} value="--" label={label} />
        ))}
      </div>
    );
  }

  if (countdown.done) {
    return (
      <div
        className={cn(
          "border-2 border-accent bg-accent-dim px-6 py-5 text-center shadow-pixel",
          className,
        )}
      >
        <p className="font-display text-pixel-lg text-accent">MINT LIVE ON OPENSEA</p>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2", className)} role="timer" aria-live="off">
      <Unit value={pad2(countdown.days)} label="DAYS" />
      <Unit value={pad2(countdown.hours)} label="HRS" />
      <Unit value={pad2(countdown.minutes)} label="MIN" />
      <Unit value={pad2(countdown.seconds)} label="SEC" />
    </div>
  );
}
