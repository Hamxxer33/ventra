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

          {/* Brand + stats */}
          <div className="flex flex-col gap-4 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              <div className="border border-fg px-2 py-1.5 font-sans text-[11px] font-semibold tracking-[0.18em] text-fg sm:text-xs">
                VENTRAN&nbsp;&nbsp;CLAIM
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm text-fg">
              <span>
                Supply <strong className="font-semibold">100B</strong>
              </span>
              <span>
                Airdrop <strong className="font-semibold">{fmt(AIRDROP_TOTAL_VENT)}</strong>
              </span>
              <span>
                Wallets <strong className="font-semibold">{fmt(AIRDROP_RECIPIENTS)}</strong>
              </span>
            </div>
          </div>

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
            <p className="max-w-xl font-sans text-base leading-relaxed text-fg/80 sm:text-lg">
              Connect the wallet you registered. Each registered wallet has one allocation that
              combines {fmt(VENT_PER_ARB_TX)} VENT per Arbitrum One transaction and{" "}
              {fmt(VENT_PER_NFT)} VENT per Ventra NFT. Registered wallets that had no allocation get
              100,000 VENT from the top-up pool. Your wallet is checked against both pools below;
              each claim costs a 0.0002 ETH fee plus gas.
            </p>
            <p className="max-w-xl font-sans text-base leading-relaxed text-fg/80 sm:text-lg">
              Registration is closed (snapshot at block {fmt(REGISTRATION_CUTOFF_BLOCK)}). There
              is no separate NFT claim.
            </p>
            <ClaimOpensBanner />
          </section>

          {/* Wizard = claim cards */}
          <div id="register" className="border-t border-border pt-8 pb-4">
            <div className="flex flex-col gap-6">
              {pools.map((p) => (
                <PoolCard key={p.id} pool={p} />
              ))}
            </div>
          </div>

          {/* Resources */}
          <section className="border-t border-border py-10">
            <h2 className="mb-5 text-xl font-semibold text-fg">Resources</h2>
            <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-start">
              <ul className="divide-y divide-border border border-border bg-surface">
                <li>
                  <a
                    href={OPENSEA_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 px-4 py-3.5 font-sans text-sm text-fg hover:bg-surface-2"
                  >
                    <span>OpenSea · Ventran NFT</span>
                    <ExternalLink className="size-3.5 text-muted" />
                  </a>
                </li>
                <li>
                  <a
                    href={WEBSITE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 px-4 py-3.5 font-sans text-sm text-fg hover:bg-surface-2"
                  >
                    <span>ventran.xyz</span>
                    <ExternalLink className="size-3.5 text-muted" />
                  </a>
                </li>
                <li>
                  <a
                    href={TELEGRAM_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 px-4 py-3.5 font-sans text-sm text-fg hover:bg-surface-2"
                  >
                    <span className="flex items-center gap-2">
                      <TelegramLogo /> Telegram
                    </span>
                    <ExternalLink className="size-3.5 text-muted" />
                  </a>
                </li>
              </ul>
              <div className="hidden border border-border bg-surface p-6 lg:block">
                <p className="mb-4 font-sans text-xs font-medium uppercase tracking-wider text-muted">
                  Distribution
                </p>
                <ul className="flex flex-col gap-3 font-sans text-sm text-fg">
                  <li className="flex justify-between border-b border-border pb-2">
                    <span>Airdrop total</span>
                    <strong>{fmt(AIRDROP_TOTAL_VENT)}</strong>
                  </li>
                  <li className="flex justify-between border-b border-border pb-2">
                    <span>Per Arbitrum tx</span>
                    <strong>{fmt(VENT_PER_ARB_TX)}</strong>
                  </li>
                  <li className="flex justify-between border-b border-border pb-2">
                    <span>Per Ventra NFT</span>
                    <strong>{fmt(VENT_PER_NFT)}</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Wallets with allocation</span>
                    <strong>
                      {fmt(AIRDROP_RECIPIENTS)} / {fmt(AIRDROP_REGISTRANTS)}
                    </strong>
                  </li>
                </ul>
                <p className="mt-4 break-all font-sans text-xs text-muted">
                  Token{" "}
                  <a href={VENT.explorerTokenUrl} target="_blank" rel="noreferrer" className="underline">
                    {VENT.address}
                  </a>{" "}
                  · {VENT.chainName}
                </p>
              </div>
            </div>
          </section>

          {/* Safety */}
          <section className="border-t border-border py-10">
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-fg">
                  <ShieldAlert className="size-4 text-danger" />
                  Important information
                </h2>
                <ul className="flex list-disc flex-col gap-2 pl-5 font-sans text-sm leading-relaxed text-muted">
                  <li>
                    Only claim at <strong className="text-fg">{CLAIM_DOMAIN}</strong>.
                    Links in DMs or replies are scams.
                  </li>
                  <li>Never share your seed phrase or private key.</li>
                </ul>
              </div>
              <div>
                <h2 className="mb-3 text-base font-semibold text-fg">Official links</h2>
                <p className="font-sans text-sm leading-relaxed text-muted">
                  NFT collection:{" "}
                  <a
                    href={OPENSEA_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-fg underline underline-offset-4"
                  >
                    opensea.io/collection/ventran
                  </a>
                  . Website:{" "}
                  <a
                    href={WEBSITE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-fg underline underline-offset-4"
                  >
                    ventran.xyz
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

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
            <p className="font-sans text-xs text-muted">
              Claims open until {formatOpensAt(CLAIM_ENDS_AT)} · {CLAIM_DOMAIN}
            </p>
          </footer>
        </div>
      </div>
    </ClaimProviders>
  );
}
