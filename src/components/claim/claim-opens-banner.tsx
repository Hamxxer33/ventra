import { ClaimCountdown } from "@/components/claim/claim-countdown";
import { useNow } from "@/components/claim/use-now";
import { COMMUNITY_OPENS_AT, formatOpensAt } from "@/lib/airdrop";

/** Hero / top-of-page countdown to community claim open (5 Oct 2026, 12:00 WAT). */
export function ClaimOpensBanner() {
  const now = useNow();
  const open = now !== null && now >= COMMUNITY_OPENS_AT;

  return (
    <div className="mt-2 flex max-w-xl flex-col gap-3 border border-border bg-surface p-4 sm:p-5">
      <p className="font-sans text-xs font-medium uppercase tracking-wider text-muted">
        {open ? "Claims are open" : "Countdown to claim"}
      </p>
      <p className="font-sans text-sm text-fg sm:text-base">
        Community claims open {formatOpensAt(COMMUNITY_OPENS_AT)}.
      </p>
      {!open ? <ClaimCountdown target={COMMUNITY_OPENS_AT} now={now} /> : null}
    </div>
  );
}
