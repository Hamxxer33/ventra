import { ClaimCountdown } from "@/components/claim/claim-countdown";
import { useNow } from "@/components/claim/use-now";
import { CLAIM_ENDS_AT, COMMUNITY_OPENS_AT, formatOpensAt } from "@/lib/airdrop";

/** Hero status: claims are open (on-chain claimStart 14 Oct 2026, 23:37 WAT). */
export function ClaimOpensBanner() {
  const now = useNow();
  const open = now === null || now >= COMMUNITY_OPENS_AT;

  return (
    <div className="mt-2 flex max-w-xl flex-col gap-3 border border-border bg-surface p-4 sm:p-5">
      <p className="font-sans text-xs font-medium uppercase tracking-wider text-muted">
        {open ? "Claims are open" : "Countdown to claim"}
      </p>
      <p className="font-sans text-sm text-fg sm:text-base">
        {open
          ? `Claims are open until ${formatOpensAt(CLAIM_ENDS_AT)}. Registration is closed.`
          : `Claims open ${formatOpensAt(COMMUNITY_OPENS_AT)}.`}
      </p>
      {!open ? <ClaimCountdown target={COMMUNITY_OPENS_AT} now={now} /> : null}
    </div>
  );
}
