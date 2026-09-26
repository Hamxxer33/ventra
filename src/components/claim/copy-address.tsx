import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyAddress({
  address,
  href,
  className,
}: {
  address: string;
  href?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      const el = document.createElement("textarea");
      el.value = address;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <code className="block break-all border-2 border-border bg-bg px-3 py-3 font-sans text-base leading-snug text-fg sm:text-lg">
        {address}
      </code>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-surface px-4 font-display text-micro uppercase text-fg shadow-pixel-sm hover:border-accent hover:text-accent sm:text-pixel"
          aria-live="polite"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-surface px-4 font-display text-micro uppercase text-fg shadow-pixel-sm hover:border-accent hover:text-accent sm:text-pixel"
          >
            <ExternalLink className="size-4" />
            Arbiscan
          </a>
        ) : null}
      </div>
    </div>
  );
}
