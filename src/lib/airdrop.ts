/**
 * Ventran ($VENT) airdrop configuration: the single place to wire the claim page.
 *
 * STATUS: CLAIMS OPEN. Registration closed on-chain (cutoff block 514875489). One merged
 * registrant tree (community 1,200 VENT per Arbitrum tx + 178,784 VENT per Ventra NFT) is
 * live at VentAirdrop 0xc3677bf0c137aebee98e0d9cf23dc28dd52f3b6b (verified on Sourcify).
 * Every claim pays a flat claimFee (0.0002 ETH) as msg.value.
 *
 * Contract: one `VentAirdrop` deployment per pool (ABI: `src/lib/abi/VentAirdrop.json`).
 *   claim(uint256 amount, bytes32[] proof) payable               msg.sender claims for itself
 *   claimFor(address account, uint256 amount, bytes32[] proof) payable  anyone pays gas+fee; VENT always
 *                                                                goes to `account` (same claimed flag)
 *   isClaimed(address) view returns (bool)
 *   canClaim(address, uint256 amount, bytes32[] proof) view returns (bool)
 *   token() / merkleRoot() / claimStart() / claimEnd() / claimFee() / feeRecipient()
 *
 * Proofs (registrants-1200, ~1.5 MB) are committed under public/proofs/; layout: `${proofsBaseUrl}/<pool.id>/meta.json` and
 * `${proofsBaseUrl}/<pool.id>/<xx>.json`, xx = lowercase address.slice(2, 4). See `proofs.ts`.
 *
 * To open a pool:
 *   1. Host that pool's proofs (CDN / Vercel Blob) and set `VITE_PROOFS_BASE_URL`.
 *   2. Deploy + fund its VentAirdrop contract with the root from that pool's meta.json.
 *   3. Set the pool's `contract` and `proofsPublished: true` below (and `opensAt` if it moved).
 */
import { formatUnits, isAddress, type Abi, type Address } from "viem";
import ventAirdropAbi from "@/lib/abi/VentAirdrop.json";

/** Official claim domain shown in all copy (safety notice, header, meta description). */
export const CLAIM_DOMAIN = "claim.ventran.xyz";
export const CLAIM_URL = `https://${CLAIM_DOMAIN}`;

export const VENT = {
  name: "Ventran",
  symbol: "VENT",
  address: "0x8199567313b0667CD7aED073dE8002c69F0cD2Dd" as Address,
  decimals: 18,
  totalSupply: 100_000_000_000,
  chainId: 42161,
  chainName: "Arbitrum One",
  explorerTokenUrl: "https://arbiscan.io/token/0x8199567313b0667CD7aED073dE8002c69F0cD2Dd",
  explorerAddressUrl: (address: string) => `https://arbiscan.io/address/${address}`,
  explorerTxUrl: (hash: string) => `https://arbiscan.io/tx/${hash}`,
} as const;

/** VentAirdrop ABI, verbatim from the Sourcify exact-match verification of the live contract. */
export const VENT_AIRDROP_ABI = ventAirdropAbi as Abi;

/** Live VentAirdrop on Arbitrum One (root 0xb22b…f416, 90-day window). */
export const VENT_AIRDROP_ADDRESS = "0xc3677bf0c137aebee98e0d9cf23dc28dd52f3b6b" as Address;

/** Top-up VentAirdrop for the 123 zero-allocation registrants (root 0x3571…662c). */
export const VENT_TOPUP_AIRDROP_ADDRESS = "0x2d06df35cae219f1aeecdfd51cc56e7e520585f0" as Address;

/** Single-wallet VentAirdrop for NFT #549 holder 0x3c4c…6c5e (root 0xb9b7…de48). */
export const VENT_NFT549_AIRDROP_ADDRESS = "0x090d4c4e3a90298b7311b024450252ebb1c09ecf" as Address;

/** Single-wallet VentAirdrop for appeal 0x7f4c…e61b (2 NFTs + 148 tx, root 0x76fc…a438). */
export const VENT_APPEAL_7F4C_AIRDROP_ADDRESS = "0x029d9992593efe68920e7abbb79b4ae3ff190b0c" as Address;

/**
 * Flat claim fee in wei (immutable `claimFee` on the contract = 0.0002 ETH), sent as msg.value
 * with claim()/claimFor(). The page reads claimFee() on-chain and uses that when available.
 */
export const CLAIM_FEE_WEI = 200_000_000_000_000n;
export const CLAIM_FEE_LABEL = "0.0002 ETH claim fee";

/** Registration is closed on-chain; the snapshot was taken at this block. */
export const REGISTRATION_CLOSED = true;
export const REGISTRATION_CUTOFF_BLOCK = 514_875_489;

/** Final registrant tree totals (from meta.json). */
export const AIRDROP_TOTAL_VENT = 1_831_014_304;
export const AIRDROP_RECIPIENTS = 1_207;
export const AIRDROP_REGISTRANTS = 1_330;
export const VENT_PER_ARB_TX = 1_200;
export const VENT_PER_NFT = 178_784;

/**
 * Where the real proof files are hosted (CDN / Vercel Blob), no trailing slash.
 * Set with `VITE_PROOFS_BASE_URL`. Unset = proofs not hosted yet → pools show
 * "Eligibility list not published yet" and nothing is fetched.
 */
export const PROOFS_BASE_URL: string | null =
  (import.meta.env.VITE_PROOFS_BASE_URL as string | undefined)?.trim().replace(/\/+$/, "") || null;

/**
 * - upcoming:         not open yet (auto-opens at `opensAt` once `contract` + proofs are set)
 * - snapshot-pending: waiting on a snapshot (NFT pool), no date
 * - open:             force open (still needs `contract` + proofs)
 * - closed:           claim window over
 */
export type PoolStatus = "upcoming" | "snapshot-pending" | "open" | "closed";

export interface AirdropPool {
  /** Pool key in the proof path: `${proofsBaseUrl}/${id}/…`. */
  id: string;
  name: string;
  shortName: string;
  description: string;
  /** Total VENT in the pool (whole tokens, display only). */
  totalTokens: number;
  /** Human description of where the allocation list comes from. */
  allocationSource: string;
  /** Short line under an eligible amount explaining where it came from. */
  eligibleNote?: string;
  /** Snapshot block the list is based on (display only). Omit/null until announced. */
  snapshotBlock?: number | null;
  status: PoolStatus;
  /** Label on the disabled claim button / status pill while not open. */
  statusLabel: string;
  /** Planned claim start (ms since epoch, UTC). null = no date yet. The contract's claimStart is authoritative. */
  opensAt: number | null;
  /** VentAirdrop contract for this pool. null = not deployed → claims disabled. */
  contract: Address | null;
  /** Proof files for this pool are uploaded under `proofsBaseUrl`. */
  proofsPublished: boolean;
  /** Override for the proofs base URL (the mock pool uses same-origin `/proofs`). */
  proofsBaseUrl?: string | null;
  /** Demo-only pool (only shown with `?demo=1`). */
  mock?: boolean;
  /**
   * Demo-only: listed addresses treated as already claimed (no chain reads). Also enables
   * a simulated "claim for another wallet" that never sends a transaction.
   */
  demoClaimed?: readonly Address[];
}

/**
 * Claims opened 14 Oct 2026, 23:37:07 WAT = on-chain claimStart 1792017427
 * (2026-10-14T22:37:07Z). claimEnd 1799793247 (2027-01-12T22:34:07Z).
 */
export const COMMUNITY_OPENS_AT = 1_792_017_427_000;
export const CLAIM_ENDS_AT = 1_799_793_247_000;

/** Distribution split (whole VENT tokens, display only). No team share. */
export const DISTRIBUTION = {
  liquidity: 5_000_000_000,
  community: 3_500_000_000,
  nft: 1_500_000_000,
  team: 0,
} as const;

export const POOLS: readonly AirdropPool[] = [
  {
    // One merged tree: each registered wallet has a single allocation that already combines
    // its community share (1,200 VENT per Arbitrum tx) and NFT share (178,784 VENT per NFT).
    id: "registrants-1200",
    name: "VENT airdrop · Registered wallets",
    shortName: "the VENT airdrop",
    description:
      "One claim per registered wallet: 1,200 VENT per Arbitrum One transaction plus 178,784 VENT per Ventra NFT held, combined into a single amount.",
    totalTokens: AIRDROP_TOTAL_VENT,
    allocationSource:
      "Registered wallets at block 514,875,489 · 1,200 VENT × Arbitrum txs + 178,784 VENT × Ventra NFTs",
    eligibleNote: "Community (1,200 VENT per Arbitrum tx) + NFT (178,784 VENT per NFT), combined",
    snapshotBlock: REGISTRATION_CUTOFF_BLOCK,
    status: "open",
    statusLabel: "Claims open",
    opensAt: COMMUNITY_OPENS_AT,
    contract: VENT_AIRDROP_ADDRESS,
    proofsPublished: true,
    // Proofs are static files committed in public/proofs/registrants-1200/ (same origin).
    // VITE_PROOFS_BASE_URL can override this to point at a CDN.
    proofsBaseUrl: PROOFS_BASE_URL ?? "/proofs",
  },
  {
    // Top-up for the 123 registered wallets that had 0 in the main tree: 100,000 VENT each.
    id: "zero-topup-100k",
    name: "VENT airdrop · Registrant top-up",
    shortName: "the registrant top-up",
    description:
      "100,000 VENT for each of the 123 registered wallets that had no allocation in the main airdrop.",
    totalTokens: 12_300_000,
    allocationSource: "Registered wallets with 0 allocation at block 514,875,489 · 100,000 VENT each",
    eligibleNote: "Registrant top-up · 100,000 VENT",
    snapshotBlock: REGISTRATION_CUTOFF_BLOCK,
    status: "open",
    statusLabel: "Claims open",
    opensAt: 1_792_017_592_000, // on-chain claimStart 2026-10-14T22:39:52Z
    contract: VENT_TOPUP_AIRDROP_ADDRESS,
    proofsPublished: true,
    proofsBaseUrl: PROOFS_BASE_URL ?? "/proofs",
  },
  {
    // Single-wallet top-up: NFT #549 holder (unregistered): 62 tx x 1,200 + 1 NFT x 178,784.
    id: "nft549-topup",
    name: "VENT airdrop · NFT holder top-up",
    shortName: "the NFT holder top-up",
    description: "VENT allocation for a Ventra NFT holder.",
    totalTokens: 253_184,
    allocationSource: "1,200 VENT x Arbitrum txs + 178,784 VENT x Ventra NFTs",
    eligibleNote: "Community (1,200 VENT per Arbitrum tx) + NFT (178,784 VENT per NFT), combined",
    snapshotBlock: REGISTRATION_CUTOFF_BLOCK,
    status: "open",
    statusLabel: "Claims open",
    opensAt: 1_792_025_278_000, // on-chain claimStart
    contract: VENT_NFT549_AIRDROP_ADDRESS,
    proofsPublished: true,
    proofsBaseUrl: PROOFS_BASE_URL ?? "/proofs",
  },
  {
    // Single-wallet top-up: appeal 0x7f4c…e61b (unregistered): 148 tx x 1,200 + 2 NFT x 178,784.
    id: "rony-topup",
    name: "VENT airdrop · NFT holder top-up",
    shortName: "the NFT holder top-up",
    description: "VENT allocation for a Ventra NFT holder.",
    totalTokens: 535_168,
    allocationSource: "1,200 VENT x Arbitrum txs + 178,784 VENT x Ventra NFTs",
    eligibleNote: "Community (1,200 VENT per Arbitrum tx) + NFT (178,784 VENT per NFT), combined",
    snapshotBlock: REGISTRATION_CUTOFF_BLOCK,
    status: "open",
    statusLabel: "Claims open",
    opensAt: 1792049715_000, // on-chain claimStart
    contract: VENT_APPEAL_7F4C_AIRDROP_ADDRESS,
    proofsPublished: true,
    proofsBaseUrl: PROOFS_BASE_URL ?? "/proofs",
  },
];

/**
 * MOCK pool for demos (`/?demo=1`). Reads `public/proofs/mock/{meta,de}.json`: a
 * 3-leaf tree built with the contract repo's build-merkle.mjs from fake addresses.
 * Not a real allocation, never shown by default.
 *   DEMO_ADDRESS          the "Demo wallet" connector (12,345.67 mock VENT)
 *   DEMO_LISTED_ADDRESS   another listed wallet, for "claim for another wallet" (1,000)
 *   DEMO_CLAIMED_ADDRESS  listed but shown as already claimed (2,500)
 */
export const DEMO_ADDRESS = "0xde0000000000000000000000000000000000c0de" as Address;
export const DEMO_LISTED_ADDRESS = "0xde00000000000000000000000000000000000001" as Address;
export const DEMO_CLAIMED_ADDRESS = "0xde00000000000000000000000000000000000002" as Address;

export const MOCK_POOL: AirdropPool = {
  id: "mock",
  name: "Demo pool (mock data)",
  shortName: "the demo pool",
  description: "Fake allocation to preview the eligible state. Not a real airdrop.",
  totalTokens: 0,
  allocationSource: "public/proofs/mock/*.json (mock)",
  eligibleNote: "Mock amount from public/proofs/mock/de.json",
  status: "upcoming",
  statusLabel: "Claims open soon",
  opensAt: null,
  contract: null,
  proofsPublished: true,
  proofsBaseUrl: "/proofs",
  mock: true,
  demoClaimed: [DEMO_CLAIMED_ADDRESS],
};

export function poolProofsBase(pool: AirdropPool): string | null {
  return pool.proofsBaseUrl !== undefined ? pool.proofsBaseUrl : PROOFS_BASE_URL;
}

/** Proofs are both marked published and actually have a host configured. */
export function poolProofsReady(pool: AirdropPool): boolean {
  return pool.proofsPublished && poolProofsBase(pool) !== null;
}

/** Page-side gate. The contract's claimStart/claimEnd + canClaim are the final word. */
export function isPoolClaimable(pool: AirdropPool, now: number): boolean {
  if (pool.contract === null || !poolProofsReady(pool)) return false;
  if (pool.status === "closed" || pool.status === "snapshot-pending") return false;
  if (pool.status === "open") return true;
  return pool.opensAt !== null && now >= pool.opensAt;
}

/** Exact token amount from wei (formatUnits), with thousands separators. Never rounds. */
export function formatVentExact(wei: bigint): string {
  const [whole, frac] = formatUnits(wei, VENT.decimals).split(".");
  const grouped = BigInt(whole).toLocaleString("en-US");
  return frac ? `${grouped}.${frac}` : grouped;
}

export function shortAddress(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/**
 * Parse a pasted wallet address for "claim for another wallet". Checksum-insensitive
 * (any casing accepted); returns the lowercase address used for the shard lookup, or null.
 */
export function parseListedAddress(input: string): Address | null {
  const trimmed = input.trim();
  if (!isAddress(trimmed, { strict: false })) return null;
  return trimmed.toLowerCase() as Address;
}

export function formatCompactTokens(n: number): string {
  if (n >= 1_000_000_000) return `${n / 1_000_000_000}B`;
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  return n.toLocaleString("en-US");
}

/** Format claim open time in WAT (Africa/Lagos, UTC+1). */
export function formatOpensAt(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
    hour12: false,
  })
    .format(new Date(ms))
    .concat(" WAT");
}

/** True if a wallet error (or anything in its cause chain) is a user rejection. */
export function isUserRejection(err: unknown): boolean {
  let e: unknown = err;
  for (let i = 0; i < 6 && e && typeof e === "object"; i++) {
    const { name, code, message } = e as { name?: string; code?: number; message?: string };
    if (name === "UserRejectedRequestError" || code === 4001) return true;
    if (typeof message === "string" && /user (rejected|denied)/i.test(message)) return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}
