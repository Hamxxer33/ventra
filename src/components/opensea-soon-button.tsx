import { useState } from "react";
import { OpenSeaLogo } from "@/components/pixel-logo";
import { Button } from "@/components/ui/button";

export function OpenSeaSoonButton({
  label,
  variant = "primary",
  className,
}: {
  label: string;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const [soon, setSoon] = useState(false);

  return (
    <div className="flex w-full max-w-xl flex-col gap-2">
      <Button
        type="button"
        variant={variant}
        className={className}
        onClick={() => setSoon(true)}
        aria-expanded={soon}
      >
        <OpenSeaLogo />
        {soon ? "Not live yet" : label}
      </Button>
      {soon ? (
        <p className="font-sans text-base text-muted" role="status">
          Collection is not listed yet. Mint drops 25 September 2026.
        </p>
      ) : null}
    </div>
  );
}
