import { ShieldCheck } from "lucide-react";
import { CLAIM_DOMAIN } from "@/lib/airdrop";
import { registrationFeeUsd } from "@/lib/register";

/** Shown near register / claim CTAs. Keep in sync with the Official links section. */
export function SafetyLine() {
  return (
    <p className="flex items-start gap-2 font-sans text-base text-muted">
      <ShieldCheck className="mt-1 size-4 shrink-0 text-accent" />
      <span>
        Official site only: <strong className="text-fg">{CLAIM_DOMAIN}</strong>. Registration costs $
        {registrationFeeUsd} in ARB token — we never ask for seed phrases, unlimited approvals, or
        any other fee.
      </span>
    </p>
  );
}
