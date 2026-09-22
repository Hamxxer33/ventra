import { useEffect, useState, type ReactNode } from "react";
import { CardStage } from "@/components/card-stage";
import { CountdownClock } from "@/components/countdown-clock";
import { FacePicker } from "@/components/face-picker";
import { OpenSeaSoonButton } from "@/components/opensea-soon-button";
import { PixelLogo } from "@/components/pixel-logo";
import { WhitelistForm } from "@/components/whitelist-form";
import { useCountdown } from "@/hooks/use-countdown";
import { SUPPLY_LABEL } from "@/lib/drop";
import { loadProfile, setProfileFace, type Profile } from "@/lib/ticket";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: "01", id: "apply", label: "APPLY" },
  { n: "02", id: "face", label: "FACE" },
  { n: "03", id: "card", label: "CARD" },
] as const;

function stepIndex(profile: Profile | null): number {
  if (!profile) return 0;
  if (!profile.faceId) return 1;
  return 2;
}

function SectionFrame({
  n,
  title,
  children,
  active,
  id,
}: {
  n: string;
  title: string;
  children: ReactNode;
  active: boolean;
  id: string;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <div
        className={cn(
          "border-2 bg-surface p-5 shadow-pixel sm:p-8",
          active ? "border-accent" : "border-border",
        )}
      >
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setReady(true);
  }, []);

  const current = stepIndex(profile);

  useEffect(() => {
    if (!ready) return;
    const id = STEPS[current]?.id;
    if (!id || current === 0) return;
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [current, ready]);

  function onAssigned(next: Profile) {
    setProfile(next);
  }

  function onSelectFace(id: string) {
    const next = setProfileFace(id);
    if (next) setProfile(next);
  }

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
            <p className="font-display text-micro text-muted sm:text-pixel">WL OPEN</p>
          )}
        </header>

        <section className="flex flex-col gap-6">
          <p className="font-display text-pixel text-accent">WHITELIST OPEN</p>
          <h1 className="max-w-3xl font-display text-pixel-hero leading-tight text-fg">
            {SUPPLY_LABEL} pixel NFTs
            <span className="ventra-caret ml-1 inline-block h-[0.9em] w-3 bg-accent align-baseline" />
          </h1>
          <p className="max-w-xl font-sans text-xl leading-snug text-muted">
            Get a ticket. Pick a face. Post the card on X. Mint on OpenSea 25 September 2026, 12:00
            UTC. One per wallet.
          </p>
          <CountdownClock countdown={countdown} className="max-w-xl" />
          <OpenSeaSoonButton
            className="w-fit whitespace-nowrap"
            label={countdown?.done ? "Mint on OpenSea" : "OpenSea mint"}
          />
          <p className="font-display text-micro uppercase leading-relaxed text-muted sm:text-pixel">
            {SUPPLY_LABEL} supply · opensea drop · sept 25 2026 · 12:00 utc
          </p>
        </section>

        <ol className="flex flex-wrap items-center gap-2">
          {STEPS.map((step, i) => (
            <li key={step.id} className="flex items-center gap-2">
              <span
                className={cn(
                  "border-2 px-3 py-2 font-display text-micro sm:text-pixel",
                  i === current
                    ? "border-accent bg-accent text-fg"
                    : i < current
                      ? "border-accent-dim bg-accent-dim text-accent"
                      : "border-border bg-surface text-muted",
                )}
              >
                {step.n} {step.label}
              </span>
              {i < STEPS.length - 1 ? (
                <span className="hidden h-0.5 w-6 bg-border sm:block" aria-hidden="true" />
              ) : null}
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-8">
          <SectionFrame n="01" id="apply" title="WHITELIST" active={current === 0}>
            <p className="mb-6 max-w-lg font-sans text-lg text-muted">
              Follow @Ventranxyz, join Telegram, then drop your X handle and wallet. You get the
              next sequential ticket, starting at 00001.
            </p>
            {ready ? (
              <WhitelistForm profile={profile} onAssigned={onAssigned} />
            ) : (
              <p className="font-display text-pixel text-muted">LOADING</p>
            )}
          </SectionFrame>

          <SectionFrame n="02" id="face" title="CHOOSE A FACE" active={current === 1}>
            <FacePicker
              selectedId={profile?.faceId ?? null}
              locked={!profile}
              onSelect={onSelectFace}
            />
          </SectionFrame>

          <SectionFrame n="03" id="card" title="SHARE THE CARD" active={current === 2}>
            <CardStage
              profile={profile}
              countdown={countdown}
              locked={!profile || !profile.faceId}
            />
          </SectionFrame>
        </div>

        <footer className="flex flex-col gap-3 border-t-2 border-border pt-6 pb-8">
          <p className="font-display text-micro leading-relaxed text-muted sm:text-pixel">
            ventra@mainnet: ~/whitelist · supply {SUPPLY_LABEL} · mint on opensea 2026-09-25
          </p>
          <p className="font-sans text-base text-muted">
            A ticket is not a mint. Card image is generated in your browser. No backend.
          </p>
        </footer>
      </div>
    </div>
  );
}
