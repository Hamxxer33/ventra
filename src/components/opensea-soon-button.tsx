import { OpenSeaLogo } from "@/components/pixel-logo";
import { Button } from "@/components/ui/button";
import { OPENSEA_URL } from "@/lib/drop";

export function OpenSeaSoonButton({
  label,
  variant = "primary",
  className,
}: {
  label: string;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Button asChild variant={variant} className={className}>
      <a href={OPENSEA_URL} target="_blank" rel="noreferrer">
        <OpenSeaLogo />
        {label}
      </a>
    </Button>
  );
}
