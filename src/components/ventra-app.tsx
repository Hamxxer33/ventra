import { useEffect, useState, type ReactNode } from "react";
import { CountdownClock } from "@/components/countdown-clock";
import { OpenSeaSoonButton } from "@/components/opensea-soon-button";
import { PixelLogo } from "@/components/pixel-logo";
import { useCountdown } from "@/hooks/use-countdown";
import { SUPPLY_LABEL } from "@/lib/drop";
import { getTicketCount } from "@/lib/ticket-claim";
import { readIssuedCount } from "@/lib/ticket-ledger";
import { loadProfile, type Profile } from "@/lib/ticket";
import { cn } from "@/lib/utils";

function SectionFrame({
  n,
  title,
  children,
  id,
}: {
  n: string;
  title: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="border-2 border-accent bg-surface p-5 shadow-pixel sm:p-8">
        <header className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-pixel text-fg sm:text-pixel-lg">{title}</h2>
          <span className="font-display text-pixel text-muted">{n}</span>
        </header>
        {children}
      </div>
    </section>
  );
}

export function VentraApp() {
  const countdown = useCountdown();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [issued, setIssued] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchIssued(): Promise<number> {
      try {
        const count = await getTicketCount();
        if (typeof count.issued === "number") return count.issued;
      } catch {
        /* no Postgres on the live host */
      }
      return readIssuedCount();
    }

    async function boot() {
      const local = loadProfile();
      if (!cancelled) setProfile(local);
      try {
        const count = await fetchIssued();
        if (!cancelled) setIssued(count);
      } catch {
        /* count is decorative */
      }
    }

    void boot();
    const timer = window.setInterval(() => {
      fetchIssued()
        .then((count) => {
          if (!cancelled) setIssued(count);
        })
        .catch(() => {
          /* ignore */
        });
    }, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="relative min-h-dvh">
      <div className="ventra-scanlines" aria-hidden="true" />
      <div className="ventra-vignette" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-6 sm:gap-14 sm:px-6 sm:py-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PixelLogo className="size-10 border-2 border-accent" />
            <div>
              <p className="font-display text-pixel text-accent">VENTRA</p>
              <p className="font-sans text-base text-muted">ventran.xyz</p>
            </div>
          </div>
          {profile ? (
            <p className="font-display text-micro text-fg sm:text-pixel">#{profile.ticket}</p>
          ) : (
            <p className="font-display text-micro text-muted sm:text-pixel">WL CLOSED</p>
          )}
        </header>

        <section className="flex flex-col gap-6">
          <p className="font-display text-pixel text-accent">WHITELIST CLOSED</p>
          <h1 className="max-w-3xl font-display text-pixel-hero leading-tight text-fg">
            Thank you
            <span className="ventra-caret ml-1 inline-block h-[0.9em] w-3 bg-accent align-baseline" />
          </h1>
          <p className="max-w-xl font-sans text-xl leading-snug text-muted">
            Wallet intake is closed. Thank you to everyone who claimed a ticket and showed up for
            Ventra. Mint on OpenSea 25 September 2026, 12:00 UTC.
          </p>
          <CountdownClock countdown={countdown} className="max-w-xl" />
          <OpenSeaSoonButton
            className="w-fit whitespace-nowrap"
            label={countdown?.done ? "Mint on OpenSea" : "OpenSea mint"}
          />
          <p className="font-display text-micro uppercase leading-relaxed text-muted sm:text-pixel">
            {issued !== null
              ? `${issued.toLocaleString("en-US")} / ${SUPPLY_LABEL} claimed`
              : `${SUPPLY_LABEL} supply`}{" "}
            · opensea drop · sept 25 2026 · 12:00 utc
          </p>
        </section>

        <SectionFrame n="01" id="thanks" title="THANK YOU">
          <div className="flex flex-col gap-4">
            <p className="max-w-lg font-sans text-lg text-fg">
              New wallets are not being accepted. If you already have a ticket, you're in.
            </p>
            <p className="max-w-lg font-sans text-lg text-muted">
              Thank you for following, reposting, and joining. See you at the mint.
            </p>
            {profile ? (
              <p className={cn("font-display text-pixel text-accent")}>
                Your ticket #{profile.ticket}
              </p>
            ) : null}
          </div>
        </SectionFrame>

        <footer className="flex flex-col gap-3 border-t-2 border-border pt-6 pb-8">
          <p className="font-display text-micro leading-relaxed text-muted sm:text-pixel">
            ventra@mainnet: ~/whitelist · closed
            {issued !== null ? ` · ${issued.toLocaleString("en-US")} claimed` : ""} · supply{" "}
            {SUPPLY_LABEL} · mint on opensea 2026-09-25
          </p>
          <p className="font-sans text-base text-muted">Thank you for everyone.</p>
        </footer>
      </div>
    </div>
  );
}
