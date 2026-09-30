import { ShieldCheck } from "lucide-react";
import { CLAIM_DOMAIN } from "@/lib/airdrop";
import { registrationFeeUsd } from "@/lib/register";

/** Shown near register / claim CTAs. Keep in sync with the Official links section. */
export function SafetyLine() {
  return (
    <p className="flex items-start gap-2 font-sans text-sm text-muted sm:text-base">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-fg" />
      <span>
        Official site only: <strong className="text-fg">{CLAIM_DOMAIN}</strong>. Registration is
        about ${registrationFeeUsd} in ETH on Arbitrum. We never ask for seed phrases or any other
        fee.
      </span>
    </p>
  );
}
