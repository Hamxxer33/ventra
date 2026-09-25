/**
 * Ventran ($VENT) airdrop configuration — the single place to wire the claim page.
 *
 * STATUS: MOCK / CLAIMS CLOSED. No airdrop contract is deployed yet, every pool has
 * `contract: null` and `merkleRoot: null`, so the claim button stays disabled
 * ("Claims open soon") and no transaction can be sent from this page.
 *
 * To go live for a pool:
 *   1. Deploy a Merkle-distributor style contract that exposes
 *      `claim(uint256 index, address account, uint256 amount, bytes32[] proof)` and
 *      `isClaimed(uint256 index) view returns (bool)`, funded with that pool's VENT.
 *   2. Publish that pool's 256 proof shards to `${PROOFS_BASE_URL}/<pool.id>/<xx>.json`
 *      (xx = first byte of the lowercase wallet address, "00".."ff"). See `proofs.ts`.
 *   3. Set `contract`, `merkleRoot` and `proofsPublished: true` below, then flip
 *      `status` to "open". Double-check `MERKLE_DISTRIBUTOR_ABI` against the deployed ABI.
 */
import type { Address, Hex } from "viem";

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

/**
 * Base path of the proof shards. Same-origin by default (`public/proofs/...`);
 * can point at a CDN/bucket via `VITE_PROOFS_BASE_URL` (no trailing slash).
 */
export const PROOFS_BASE_URL: string =
  (import.meta.env.VITE_PROOFS_BASE_URL as string | undefined)?.replace(/\/+$/, "") || "/proofs";

/**
 * - upcoming:         list/contract not live yet → "Claims open soon"
 * - snapshot-pending: waiting on a snapshot (NFT pool) → "After NFT mint snapshot"
 * - open:             claims live (requires `contract` + `proofsPublished`)
 * - closed:           claim window over
 */
export type PoolStatus = "upcoming" | "snapshot-pending" | "open" | "closed";

export interface AirdropPool {
  /** Used in the proof path: `${PROOFS_BASE_URL}/${id}/<xx>.json`. */
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
  /** Snapshot block the allocation is based on (display/audit only). null = not fixed yet. */
  snapshotBlock: number | null;
  status: PoolStatus;
  /** Label on the disabled claim button / status pill while not open. */
  statusLabel: string;
  /** Merkle distributor for this pool. null = not deployed. */
  contract: Address | null;
  /** Root committed on-chain for this pool. null = list not final. */
  merkleRoot: Hex | null;
  /** Proof shards are uploaded and safe to query. */
  proofsPublished: boolean;
  /** Demo-only pool (only shown with `?demo=1`). */
  mock?: boolean;
}

export const POOLS: readonly AirdropPool[] = [
  {
    id: "waitlist",
    name: "Pool 1 · Community airdrop",
    shortName: "the Community airdrop",
    description:
      "3.5B VENT for waitlist wallets, weighted by each wallet's Arbitrum transaction count at a fixed snapshot block. Opens first.",
    totalTokens: 3_500_000_000,
    // Amounts are computed off-chain (3.5B / total capped tx count, per-wallet cap TBD) and
    // shipped in the proof shards. The page only ever displays the amount from the proof file.
    allocationSource: "Waitlist wallets × Arbitrum transactions at the snapshot block",
    eligibleNote: "Based on your Arbitrum transactions at the snapshot",
    snapshotBlock: null,
    status: "upcoming",
    statusLabel: "Claims open soon",
    contract: null,
    merkleRoot: null,
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
    snapshotBlock: null,
    status: "snapshot-pending",
    statusLabel: "After NFT mint snapshot",
    contract: null,
    merkleRoot: null,
    proofsPublished: false,
  },
];

/**
 * MOCK pool for demos (`/?demo=1`). Reads `public/proofs/mock/de.json`, which holds
 * one fake allocation for `DEMO_ADDRESS`. Not a real allocation — never shown by default.
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
  snapshotBlock: null,
  status: "upcoming",
  statusLabel: "Claims open soon",
  contract: null,
  merkleRoot: null,
  proofsPublished: true,
  mock: true,
};

/**
 * Minimal Merkle-distributor ABI (Uniswap MerkleDistributor style).
 * TODO: confirm against the deployed contract before setting any `contract` above.
 */
export const MERKLE_DISTRIBUTOR_ABI = [
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [
      { name: "index", type: "uint256" },
      { name: "account", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "merkleProof", type: "bytes32[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "isClaimed",
    stateMutability: "view",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export function isPoolClaimable(pool: AirdropPool): boolean {
  return pool.status === "open" && pool.contract !== null && pool.proofsPublished;
}

export function formatVent(amount: bigint, decimals = VENT.decimals): string {
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const frac = amount % base;
  const wholeStr = whole.toLocaleString("en-US");
  if (frac === 0n) return wholeStr;
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 2).replace(/0+$/, "");
  return fracStr ? `${wholeStr}.${fracStr}` : wholeStr;
}

export function formatCompactTokens(n: number): string {
  if (n >= 1_000_000_000) return `${n / 1_000_000_000}B`;
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  return n.toLocaleString("en-US");
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
