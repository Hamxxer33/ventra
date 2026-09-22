import { cn } from "@/lib/utils";

export function PixelLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("pixelated", className)}
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <rect width="16" height="16" className="fill-bg" />
      <rect x="1" y="1" width="14" height="14" className="fill-accent-dim" />
      <rect x="2" y="2" width="12" height="12" className="fill-bg" />
      <rect x="3" y="4" width="2" height="2" className="fill-accent" />
      <rect x="11" y="4" width="2" height="2" className="fill-accent" />
      <rect x="4" y="6" width="2" height="2" className="fill-accent" />
      <rect x="10" y="6" width="2" height="2" className="fill-accent" />
      <rect x="5" y="8" width="2" height="2" className="fill-accent" />
      <rect x="9" y="8" width="2" height="2" className="fill-accent" />
      <rect x="6" y="10" width="4" height="2" className="fill-accent" />
    </svg>
  );
}

export function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function OpenSeaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} fill="currentColor" aria-hidden="true">
      <path d="M12 2.2 3.6 7.1v9.8L12 21.8l8.4-4.9V7.1L12 2.2Zm0 2.4 6.4 3.7v7.4L12 19.4 5.6 15.7V8.3L12 4.6Z" />
      <path d="M8.4 13.3 12 7.2l3.6 6.1H8.4Zm7.1.9 1.6 2.7H6.9l1.6-2.7h7Z" />
    </svg>
  );
}

export function TelegramLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} fill="currentColor" aria-hidden="true">
      <path d="M21.7 4.3 2.9 11.6c-1.3.5-1.3 1.3-.2 1.6l4.8 1.5 1.8 5.6c.2.7.1 1 .8 1 .5 0 .7-.2 1-.6l2.7-3.6 5.6 4.1c1 .6 1.8.3 2-.9l3.7-17.3c.4-1.5-.5-2.2-1.6-1.7Z" />
    </svg>
  );
}

export function BellLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} fill="currentColor" aria-hidden="true">
      <path d="M12 3c-3.3 0-6 2.4-6 6v3.2L4 16h16l-2-3.8V9c0-3.6-2.7-6-6-6Zm0 18c1.7 0 3-1 3-2H9c0 1 1.3 2 3 2Z" />
    </svg>
  );
}

export function RepostLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} fill="currentColor" aria-hidden="true">
      <path d="M7 7h8.2L13.6 5.4 15 4l4 4-4 4-1.4-1.4L15.2 9H7v4H5V9c0-1.1.9-2 2-2Zm10 10H8.8l1.6 1.6L9 20l-4-4 4-4 1.4 1.4L8.8 15H17v-4h2v4c0 1.1-.9 2-2 2Z" />
    </svg>
  );
}
