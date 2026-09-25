import { ShieldCheck } from "lucide-react";

/** Shown next to claim buttons. Keep in sync with the "Official links only" section. */
export function SafetyLine() {
  return (
    <p className="flex items-start gap-2 font-sans text-base text-muted">
      <ShieldCheck className="mt-1 size-4 shrink-0 text-accent" />
      <span>
        A real claim is one transaction with a small gas fee. We never ask for a token approval, a
        signature, or your seed phrase.
      </span>
    </p>
  );
}
