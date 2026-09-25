/**
 * Ventran ($VENT) airdrop configuration: the single place to wire the claim page.
 *
 * STATUS: CLAIMS CLOSED. No VentAirdrop contract is deployed yet, so every pool has
 * `contract: null` and the claim button stays disabled ("Claims open soon"). No
 * transaction can be sent from this page until a contract address is set here.
 *
 * Contract: one `VentAirdrop` deployment per pool (ABI: `src/lib/abi/VentAirdrop.json`).
 *   claim(uint256 amount, bytes32[] proof)                       msg.sender claims for itself
 *   isClaimed(address) view returns (bool)
 *   canClaim(address, uint256 amount, bytes32[] proof) view returns (bool)
 *   token() / merkleRoot() / claimStart() / claimEnd()
 *
 * Proofs (~558 MB, NOT in this repo): `${proofsBaseUrl}/<pool.id>/meta.json` and
 * `${proofsBaseUrl}/<pool.id>/<xx>.json`, xx = lowercase address.slice(2, 4). See `proofs.ts`.
 *
 * To open a pool:
 *   1. Host that pool's proofs (CDN / Vercel Blob) and set `VITE_PROOFS_BASE_URL`.
 *   2. Deploy + fund its VentAirdrop contract with the root from that pool's meta.json.
 *   3. Set the pool's `contract` and `proofsPublished: true` below (and `opensAt` if it moved).
 */
import { formatUnits, type Abi, type Address } from "viem";
import ventAirdropAbi from "@/lib/abi/VentAirdrop.json";

/** Official claim domain shown in all copy. Owner still choosing ventran.xyz vs wl.ventran.xyz. */
export const CLAIM_DOMAIN = "ventran.xyz";
export const CLAIM_URL = `https://${CLAIM_DOMAIN}`;

export const VENT = {
  name: "Ventran",
  symbol: "VENT",
  address: "0xB67C6b8471d73009EbBa8A6a895674aEeBe5af26" as Address,
  decimals: 18,
  totalSupply: 10_000_000_000,
  chainId: 42161,
  chainName: "Arbitrum One",
  explorerTokenUrl: "https://arbiscan.io/token/0xB67C6b8471d73009EbBa8A6a895674aEeBe5af26",
  explorerAddressUrl: (address: string) => `https://arbiscan.io/address/${address}`,
  explorerTxUrl: (hash: string) => `https://arbiscan.io/tx/${hash}`,
} as const;

/** VentAirdrop ABI, copied verbatim from the contract repo (`abi/VentAirdrop.json`). */
export const VENT_AIRDROP_ABI = ventAirdropAbi as Abi;

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
}

/** Community claims open 5 Oct 2026. Exact time TBD, default 12:00 UTC. */
export const COMMUNITY_OPENS_AT = Date.UTC(2026, 9, 5, 12, 0, 0);

export const POOLS: readonly AirdropPool[] = [
  {
    id: "community",
    name: "Pool 1 · Community airdrop",
    shortName: "the Community airdrop",
    description:
      "3.5B VENT for waitlist wallets, weighted by each wallet's Arbitrum transaction count at a fixed snapshot block. Opens first.",
    totalTokens: 3_500_000_000,
    // Per-wallet amounts are computed off-chain and shipped in the proof files.
    // The page only ever displays the amount from the proof file; it never computes one.
    allocationSource: "Waitlist wallets × Arbitrum transactions at the snapshot block",
    eligibleNote: "Based on your Arbitrum transactions at the snapshot",
    status: "upcoming",
    statusLabel: "Claims open soon",
    opensAt: COMMUNITY_OPENS_AT,
    contract: null,
    proofsPublished: false,
  },
  {
    id: "nft",
    name: "Pool 2 · Ventra NFT holders",
    shortName: "the NFT holder pool",
    description:
      "1.5B VENT for Ventra NFT holders, from a holder snapshot taken after the mint closes. Opens after Pool 1.",
    totalTokens: 1_500_000_000,
    allocationSource: "Ventra NFT holder snapshot (after mint closes)",
    status: "snapshot-pending",
    statusLabel: "After NFT mint snapshot",
    opensAt: null,
    contract: null,
    proofsPublished: false,
  },
];

/**
 * MOCK pool for demos (`/?demo=1`). Reads `public/proofs/mock/{meta,de}.json`: a
 * 2-leaf tree built with the contract repo's build-merkle.mjs from fake addresses.
 * Not a real allocation, never shown by default.
 */
export const DEMO_ADDRESS = "0xde0000000000000000000000000000000000c0de" as Address;

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

export function formatCompactTokens(n: number): string {
  if (n >= 1_000_000_000) return `${n / 1_000_000_000}B`;
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  return n.toLocaleString("en-US");
}

export function formatOpensAt(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  })
    .format(new Date(ms))
    .concat(" UTC");
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
