import { ExternalLink, ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { TelegramLogo, XLogo } from "@/components/pixel-logo";
import { ClaimProviders } from "@/components/claim/claim-providers";
import { CopyAddress } from "@/components/claim/copy-address";
import { PoolCard } from "@/components/claim/pool-card";
import { WalletPanel } from "@/components/claim/wallet-panel";
import {
  CLAIM_DOMAIN,
  COMMUNITY_OPENS_AT,
  MOCK_POOL,
  POOLS,
  VENT,
  formatCompactTokens,
  formatOpensAt,
} from "@/lib/airdrop";
import { TELEGRAM_URL, WEBSITE_URL, X_URL } from "@/lib/drop";

function Frame({ title, n, children }: { title: string; n?: string; children: React.ReactNode }) {
  return (
    <section className="border-2 border-accent bg-surface p-5 shadow-pixel sm:p-8">
      <header className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-pixel text-fg sm:text-pixel-lg">{title}</h2>
        {n ? <span className="font-display text-pixel text-muted">{n}</span> : null}
      </header>
      {children}
    </section>
  );
}

export function ClaimApp({ demo = false }: { demo?: boolean }) {
  const pools = demo ? [...POOLS, MOCK_POOL] : POOLS;
  const total = POOLS.reduce((sum, p) => sum + p.totalTokens, 0);

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
              DEMO MODE: mock pool and demo wallet enabled. Allocations shown here are fake.
            </div>
          ) : null}

          <section className="flex flex-col gap-5">
            <p className="font-display text-pixel text-accent">$VENT AIRDROP</p>
            <h1 className="max-w-3xl font-display text-pixel-hero leading-tight text-fg">
              Claim your VENT
              <span className="ventra-caret ml-1 inline-block h-[0.9em] w-3 bg-accent align-baseline" />
            </h1>
            <p className="max-w-2xl font-sans text-xl leading-snug text-muted">
              {formatCompactTokens(total)} VENT across two pools on {VENT.chainName}. The Community
              airdrop for waitlist wallets opens {formatOpensAt(COMMUNITY_OPENS_AT)}; Ventra NFT
              holders follow after the mint snapshot. Claims stay closed until the airdrop contracts
              are live.
            </p>
          </section>

          <Frame title="WALLET" n="01">
            <WalletPanel />
          </Frame>

          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-pixel text-fg sm:text-pixel-lg">POOLS</h2>
              <span className="font-display text-pixel text-muted">02</span>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {pools.map((pool) => (
                <PoolCard key={pool.id} pool={pool} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4 border-2 border-danger bg-surface p-5 shadow-pixel sm:p-8">
            <h2 className="flex items-center gap-3 font-display text-pixel text-danger sm:text-pixel-lg">
              <ShieldAlert className="size-5 shrink-0" /> OFFICIAL LINKS ONLY
            </h2>
            <ul className="flex list-disc flex-col gap-2 pl-5 font-sans text-lg text-fg">
              <li>
                Only claim at <strong className="text-accent">{CLAIM_DOMAIN}</strong>. Links in DMs
                or replies are scams.
              </li>
              <li>Never share your seed phrase or private key. No one from Ventran will ask.</li>
              <li>
                Claiming is free apart from gas. We never ask you to send tokens or ETH first.
              </li>
              <li>
                Check the contract below and only trust announcements from our official X and
                Telegram.
              </li>
            </ul>
          </section>

          <Frame title="VENT TOKEN" n="03">
            <div className="flex flex-col gap-4">
              <p className="font-sans text-lg text-muted">
                {VENT.name} ({VENT.symbol}) · {VENT.chainName} · {VENT.decimals} decimals ·{" "}
                {VENT.totalSupply.toLocaleString("en-US")} supply
              </p>
              <p className="font-display text-micro uppercase text-muted">Contract address</p>
              <CopyAddress address={VENT.address} href={VENT.explorerTokenUrl} />
            </div>
          </Frame>

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
              <Link
                to="/whitelist"
                className="text-muted underline underline-offset-4 hover:text-fg"
              >
                Ventra NFT whitelist
              </Link>
            </nav>
            <p className="font-display text-micro leading-relaxed text-muted sm:text-pixel">
              ventran@arbitrum: ~/airdrop · claims closed · {formatCompactTokens(total)} VENT · 2
              pools
            </p>
          </footer>
        </div>
      </div>
    </ClaimProviders>
  );
}
