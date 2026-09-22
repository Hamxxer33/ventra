import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpenSeaLogo, XLogo } from "@/components/pixel-logo";
import { CARD_H, CARD_W, canvasToPngBlob, renderCard, renderLockedCard } from "@/lib/card-render";
import { OPENSEA_MINT_URL } from "@/lib/drop";
import { type Countdown } from "@/lib/countdown";
import { faceById } from "@/lib/faces";
import { downloadBlob, shareCard } from "@/lib/share";
import { type Profile } from "@/lib/ticket";
import { cn } from "@/lib/utils";

export function CardStage({
  profile,
  countdown,
  locked,
}: {
  profile: Profile | null;
  countdown: Countdown | null;
  locked: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceImg, setFaceImg] = useState<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const face = faceById(profile?.faceId);

  useEffect(() => {
    if (!face) {
      setFaceImg(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!cancelled) setFaceImg(img);
    };
    img.onerror = () => {
      if (!cancelled) setFaceImg(null);
    };
    img.src = face.src;
    return () => {
      cancelled = true;
    };
  }, [face]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!profile) {
      renderLockedCard(ctx, "GET A TICKET");
      return;
    }
    if (!faceImg || !countdown) {
      renderLockedCard(ctx, "PICK A FACE");
      return;
    }
    renderCard(ctx, {
      ticket: profile.ticket,
      handle: profile.handle,
      face: faceImg,
      countdown,
    });
  }, [profile, faceImg, countdown]);

  async function exportBlob(): Promise<Blob> {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Card is not ready");
    return canvasToPngBlob(canvas);
  }

  async function onDownload() {
    if (!profile) return;
    setBusy(true);
    setStatus(null);
    try {
      const blob = await exportBlob();
      downloadBlob(blob, `ventra-ticket-${profile.ticket}.png`);
      setStatus("PNG saved. Post it with your ticket.");
    } catch {
      setStatus("Could not export the card.");
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    if (!profile) return;
    setBusy(true);
    setStatus(null);
    try {
      const blob = await exportBlob();
      const result = await shareCard(profile.ticket, blob);
      if (result.openedIntent) {
        setStatus(
          result.copied
            ? "Card copied and downloaded. Paste it into the X post that just opened."
            : "Card downloaded. Attach the PNG to the X post that just opened.",
        );
      } else {
        setStatus("Shared.");
      }
    } catch {
      setStatus("Could not share the card.");
    } finally {
      setBusy(false);
    }
  }

  const ready = Boolean(profile && faceImg && countdown && !locked);

  return (
    <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-start lg:gap-10">
      <div className="mx-auto w-full max-w-[360px] shrink-0">
        <div
          className={cn(
            "border-2 border-border bg-surface p-2 shadow-pixel",
            locked && "opacity-40",
          )}
        >
          <canvas
            ref={canvasRef}
            width={CARD_W}
            height={CARD_H}
            className="pixelated h-auto w-full bg-bg"
            aria-label={
              profile ? `Ventra whitelist card ticket ${profile.ticket}` : "Ventra whitelist card"
            }
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {locked ? (
          <p className="font-display text-pixel text-muted">LOCKED · COMPLETE THE FLOW</p>
        ) : (
          <>
            <p className="font-display text-pixel text-accent">YOUR CARD</p>
            <p className="font-sans text-lg text-muted">
              Ticket #{profile?.ticket} is baked in. The countdown ticks live on the image.
              Download the PNG, post it on X, then mint on OpenSea.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button onClick={onDownload} disabled={!ready || busy} variant="secondary">
                <Download className="size-4" strokeWidth={2} />
                Download PNG
              </Button>
              <Button onClick={onShare} disabled={!ready || busy}>
                <XLogo />
                Post on X
              </Button>
              <Button asChild variant="secondary">
                <a href={OPENSEA_MINT_URL} target="_blank" rel="noreferrer">
                  <OpenSeaLogo />
                  Mint on OpenSea
                </a>
              </Button>
            </div>
            {status ? (
              <p className="font-sans text-base text-fg" role="status">
                {status}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
