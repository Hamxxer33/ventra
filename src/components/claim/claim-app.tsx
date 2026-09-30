import { ExternalLink, ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { TelegramLogo, XLogo } from "@/components/pixel-logo";
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
import { OPENSEA_URL, TELEGRAM_URL, WEBSITE_URL, X_URL } from "@/lib/drop";

export function ClaimApp({ demo = false }: { demo?: boolean }) {
  const total =
    DISTRIBUTION.liquidity + DISTRIBUTION.community + DISTRIBUTION.nft;

  return (
    <ClaimProviders demo={demo}>
      <div className="relative min-h-dvh">
        <div className="ventra-scanlines" aria-hidden="true" />
        <div className="ventra-vignette" aria-hidden="true" />

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:gap-12 sm:px-6 sm:py-10">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/vent-logo-192.png"
                alt="Ventran logo"
                width={44}
                height={44}
                className="size-11 rounded-full border-2 border-accent"
              />
              <div>
                <p className="font-display text-pixel text-accent">VENTRAN</p>
                <p className="font-sans text-base text-muted">{CLAIM_DOMAIN}</p>
              </div>
            </div>
            <p className="font-display text-micro text-muted sm:text-pixel">$VENT · ARB</p>
          </header>

          {demo ? (
            <div className="border-2 border-dashed border-danger bg-bg p-4 font-sans text-lg text-danger">
              DEMO MODE: fake community allocations and demo wallet enabled. Not a real airdrop.
            </div>
          ) : null}

          <section className="flex flex-col gap-5">
            <p className="font-display text-pixel text-accent">$VENT REGISTER</p>
            <h1 className="max-w-3xl font-display text-pixel-hero leading-tight text-fg">
              Register for your claim
              <span className="ventra-caret ml-1 inline-block h-[0.9em] w-3 bg-accent align-baseline" />
            </h1>
            <p className="max-w-2xl font-sans text-xl leading-snug text-muted">
              {formatCompactTokens(total)} VENT on {VENT.chainName}:{" "}
              {formatCompactTokens(DISTRIBUTION.liquidity)} liquidity ·{" "}
              {formatCompactTokens(DISTRIBUTION.community)} community ·{" "}
              {formatCompactTokens(DISTRIBUTION.nft)} NFT holders · no team share. Check
              eligibility, remap if needed, then register with a{" "}
              <strong className="text-fg">${registrationFeeUsd} ARB</strong> fee. Claims open{" "}
              {formatOpensAt(COMMUNITY_OPENS_AT)}.
            </p>
          </section>

          <ClaimWizard demo={demo} />

          <section className="flex flex-col gap-4 border-2 border-danger bg-surface p-5 shadow-pixel sm:p-8">
            <h2 className="flex items-center gap-3 font-display text-pixel text-danger sm:text-pixel-lg">
              <ShieldAlert className="size-5 shrink-0" /> OFFICIAL LINKS ONLY
            </h2>
            <ul className="flex list-disc flex-col gap-2 pl-5 font-sans text-lg text-fg">
              <li>
                Only register / claim at <strong className="text-accent">{CLAIM_DOMAIN}</strong>.
                Links in DMs or replies are scams.
              </li>
              <li>Never share your seed phrase or private key. No one from Ventran will ask.</li>
              <li>
                The only fee is <strong>${registrationFeeUsd} in ARB</strong> to register. We never
                ask for unlimited approvals or any other payment.
              </li>
              <li>
                Official NFT collection:{" "}
                <a
                  href={OPENSEA_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline underline-offset-4"
                >
                  opensea.io/collection/ventran
                </a>
                . Trust announcements only from our official X and Telegram.
              </li>
            </ul>
          </section>

          <section className="border-2 border-accent bg-surface p-5 shadow-pixel sm:p-8">
            <header className="mb-5 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-pixel text-fg sm:text-pixel-lg">VENT TOKEN</h2>
              <span className="font-display text-pixel text-muted">CA</span>
            </header>
            <div className="flex flex-col gap-4">
              <p className="font-sans text-lg text-muted">
                {VENT.name} ({VENT.symbol}) · {VENT.chainName} · {VENT.decimals} decimals ·{" "}
                {VENT.totalSupply.toLocaleString("en-US")} supply
              </p>
              <p className="font-display text-micro uppercase text-muted">Contract address</p>
              <CopyAddress address={VENT.address} href={VENT.explorerTokenUrl} />
            </div>
          </section>

          <footer className="flex flex-col gap-4 border-t-2 border-border pt-6 pb-8">
            <nav className="flex flex-wrap gap-x-6 gap-y-3 font-sans text-lg">
              <a
                href={WEBSITE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-accent underline underline-offset-4"
              >
                <ExternalLink className="size-4" /> ventran.xyz
              </a>
              <a
                href={X_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-accent underline underline-offset-4"
              >
                <XLogo /> @Ventranxyz
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-accent underline underline-offset-4"
              >
                <TelegramLogo /> Telegram
              </a>
              <a
                href={OPENSEA_URL}
                target="_blank"
                rel="noreferrer"
                className="text-muted underline underline-offset-4 hover:text-fg"
              >
                OpenSea
              </a>
              <Link
                to="/whitelist"
                className="text-muted underline underline-offset-4 hover:text-fg"
              >
                Ventra NFT whitelist
              </Link>
            </nav>
            <p className="font-display text-micro leading-relaxed text-muted sm:text-pixel">
              ventran@arbitrum: ~/register · ${registrationFeeUsd} ARB fee · claim{" "}
              {formatOpensAt(COMMUNITY_OPENS_AT)} · {CLAIM_DOMAIN}
            </p>
          </footer>
        </div>
      </div>
    </ClaimProviders>
  );
}
