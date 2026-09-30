import { ExternalLink, ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { TelegramLogo } from "@/components/pixel-logo";
import { ClaimProviders } from "@/components/claim/claim-providers";
import { ClaimWizard } from "@/components/claim/claim-wizard";
import { CopyAddress } from "@/components/claim/copy-address";
import {
  CLAIM_DOMAIN,
  COMMUNITY_OPENS_AT,
  DISTRIBUTION,
  VENT,
  formatCompactTokens,
  formatOpensAt,
} from "@/lib/airdrop";
import { registrationFeeUsd } from "@/lib/register";
import { OPENSEA_URL, TELEGRAM_URL, WEBSITE_URL } from "@/lib/drop";

export function ClaimApp({ demo = false }: { demo?: boolean }) {
  const total =
    DISTRIBUTION.liquidity + DISTRIBUTION.community + DISTRIBUTION.nft;

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
            <a
              href="#register"
              className="inline-flex h-9 items-center border border-border bg-surface px-4 font-sans text-sm text-fg hover:bg-surface-2"
            >
              Connect Wallet
            </a>
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
                Supply{" "}
                <strong className="font-semibold">{formatCompactTokens(total)}</strong>
              </span>
              <span>
                Community{" "}
                <strong className="font-semibold">
                  {formatCompactTokens(DISTRIBUTION.community)}
                </strong>
              </span>
              <span>
                NFT{" "}
                <strong className="font-semibold">
                  {formatCompactTokens(DISTRIBUTION.nft)}
                </strong>
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
              Register for your claim
            </h1>
            <p className="max-w-xl font-sans text-base leading-relaxed text-fg/80 sm:text-lg">
              Check eligibility, see both allocations, then register for about{" "}
              <strong className="font-semibold text-fg">
                ${registrationFeeUsd} in ETH on Arbitrum
              </strong>
              .
            </p>
            <p className="max-w-xl font-sans text-base leading-relaxed text-fg/80 sm:text-lg">
              Community claims open {formatOpensAt(COMMUNITY_OPENS_AT)}. NFT claim window
              announced separately.
            </p>
          </section>

          {/* Wizard = claim cards */}
          <div id="register" className="border-t border-border pt-8 pb-4">
            <ClaimWizard demo={demo} />
          </div>

          {/* Resources */}
          <section className="border-t border-border py-10">
            <h2 className="mb-5 text-xl font-semibold text-fg">Resources</h2>
            <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-start">
              <ul className="divide-y divide-border border border-border bg-surface">
                <li>
                  <a
                    href={VENT.explorerTokenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 px-4 py-3.5 font-sans text-sm text-fg hover:bg-surface-2"
                  >
                    <span className="flex items-center gap-3">
                      <span className="inline-flex size-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-fg">
                        V
                      </span>
                      Arbiscan {VENT.address.slice(0, 5)}…{VENT.address.slice(-5)}
                    </span>
                    <ExternalLink className="size-3.5 text-muted" />
                  </a>
                </li>
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
                <li className="px-4 py-3.5">
                  <p className="mb-2 font-sans text-xs uppercase tracking-wider text-muted">
                    Token CA
                  </p>
                  <CopyAddress address={VENT.address} href={VENT.explorerTokenUrl} />
                </li>
              </ul>
              <div className="hidden border border-border bg-surface p-6 lg:block">
                <p className="mb-4 font-sans text-xs font-medium uppercase tracking-wider text-muted">
                  Distribution
                </p>
                <ul className="flex flex-col gap-3 font-sans text-sm text-fg">
                  <li className="flex justify-between border-b border-border pb-2">
                    <span>Liquidity</span>
                    <strong>{formatCompactTokens(DISTRIBUTION.liquidity)}</strong>
                  </li>
                  <li className="flex justify-between border-b border-border pb-2">
                    <span>Community</span>
                    <strong>{formatCompactTokens(DISTRIBUTION.community)}</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>NFT holders</span>
                    <strong>{formatCompactTokens(DISTRIBUTION.nft)}</strong>
                  </li>
                </ul>
                <p className="mt-4 font-sans text-xs text-muted">
                  No team share · {VENT.chainName}
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
                    Only register / claim at <strong className="text-fg">{CLAIM_DOMAIN}</strong>.
                    Links in DMs or replies are scams.
                  </li>
                  <li>Never share your seed phrase or private key.</li>
                  <li>
                    The only fee is about{" "}
                    <strong className="text-fg">
                      ${registrationFeeUsd} in ETH on Arbitrum
                    </strong>
                    , paid on this site when you register.
                  </li>
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
              About ${registrationFeeUsd} in ETH on Arbitrum to register · claims{" "}
              {formatOpensAt(COMMUNITY_OPENS_AT)} · {CLAIM_DOMAIN}
            </p>
          </footer>
        </div>
      </div>
    </ClaimProviders>
  );
}
