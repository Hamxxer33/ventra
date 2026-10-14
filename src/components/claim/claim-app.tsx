import { ExternalLink, ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { TelegramLogo } from "@/components/pixel-logo";
import { ClaimProviders } from "@/components/claim/claim-providers";
import { PoolCard } from "@/components/claim/pool-card";
import { HeaderConnect } from "@/components/claim/header-connect";
import { ClaimOpensBanner } from "@/components/claim/claim-opens-banner";
import {
  AIRDROP_RECIPIENTS,
  AIRDROP_REGISTRANTS,
  AIRDROP_TOTAL_VENT,
  CLAIM_DOMAIN,
  CLAIM_ENDS_AT,
  MOCK_POOL,
  POOLS,
  REGISTRATION_CUTOFF_BLOCK,
  VENT,
  VENT_PER_ARB_TX,
  VENT_PER_NFT,
  formatOpensAt,
} from "@/lib/airdrop";
import { OPENSEA_URL, TELEGRAM_URL, WEBSITE_URL } from "@/lib/drop";

export function ClaimApp({ demo = false }: { demo?: boolean }) {
  const pools = demo ? [MOCK_POOL] : POOLS;
  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <ClaimProviders demo={demo}>
      <div className="claim-concrete relative min-h-dvh">
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-0 px-4 sm:px-6">
          {/* Top bar */}
          <header className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center bg-fg text-[10px] font-bold leading-none text-bg">
                V
              </div>
              <span className="sr-only">Ventran</span>
            </div>
            <HeaderConnect />
          </header>

          {demo ? (
            <div className="mt-4 border border-danger bg-[#fdecea] px-4 py-3 font-sans text-sm text-danger">
              DEMO MODE: fake community allocations and demo wallet enabled. Not a real airdrop.
            </div>
          ) : null}

          {/* Hero */}
          <section className="flex flex-col gap-3 py-10 sm:py-14">
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-fg sm:text-5xl">
              Claim your VENT
            </h1>
            <p className="font-sans text-sm font-semibold uppercase tracking-wider text-accent">Claims open</p>
          </section>

          {/* Wizard = claim cards */}
          <div id="register" className="border-t border-border pt-8 pb-4">
            <div className="flex flex-col gap-6">
              {pools.map((p) => (
                <PoolCard key={p.id} pool={p} />
              ))}
            </div>
          </div>

          {/* Footer — no X / Twitter */}
          <footer className="flex flex-col gap-4 border-t border-border py-6 pb-10">
            <nav className="flex flex-wrap gap-x-5 gap-y-2 font-sans text-sm">
              <a
                href={WEBSITE_URL}
                target="_blank"
                rel="noreferrer"
                className="text-fg underline underline-offset-4"
              >
                ventran.xyz
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="text-fg underline underline-offset-4"
              >
                Telegram
              </a>
              <a
                href={OPENSEA_URL}
                target="_blank"
                rel="noreferrer"
                className="text-fg underline underline-offset-4"
              >
                OpenSea
              </a>
              <Link to="/whitelist" className="text-fg underline underline-offset-4">
                NFT whitelist
              </Link>
            </nav>

          </footer>
        </div>
      </div>
    </ClaimProviders>
  );
}
