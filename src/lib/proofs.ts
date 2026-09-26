/**
 * Merkle proof loader for VentAirdrop pools.
 *
 *   <base>/<pool>/meta.json   { pool, root, token, decimals, total, totalVent, count, prefixLen, shards }
 *   <base>/<pool>/<xx>.json   { "<lowercase addr>": { index, amount: "<wei>", proof: ["0x…"] } }
 *
 * xx = lowercase address.slice(2, 4). Only the connected wallet's shard is fetched.
 * The address is lowercased before picking the shard and before the lookup.
 *
 * "Shard missing" (404) or "address not in shard" → NOT ELIGIBLE.
 * meta.token ≠ VENT, or a proof that doesn't verify against meta.root → hard error.
 * Network / 5xx / bad JSON → error with retry.
 */
import { concat, encodeAbiParameters, keccak256, type Hex } from "viem";
import { VENT } from "@/lib/airdrop";

export interface PoolMeta {
  pool: string;
  root: Hex;
  token: string;
  decimals: number;
  total: string;
  totalVent: string;
  count: number;
  prefixLen: number;
  shards: number;
  /**
   * Optional list of shard keys that exist. When present, an address whose shard isn't
   * listed is NOT ELIGIBLE without a request (used by the same-origin mock pool, whose
   * app server answers unknown paths with an error page rather than a clean 404).
   */
  shardKeys?: string[];
}

export interface ProofEntry {
  /** Position in the source list. Informational only; `claim()` takes no index. */
  index: number;
  /** Wei (18 decimals). */
  amount: bigint;
  proof: Hex[];
}

export type ProofLookup = { eligible: false } | { eligible: true; entry: ProofEntry };

export class ProofDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProofDataError";
  }
}

const HEX32 = /^0x[0-9a-fA-F]{64}$/;

export function shardKey(address: string): string {
  const lower = address.toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(lower)) throw new Error(`Invalid address: ${address}`);
  return lower.slice(2, 4);
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown | null> {
  const res = await fetch(url, { signal, headers: { accept: "application/json" } });
  if (res.status === 404 || res.status === 403) return null; // S3/Blob answer missing keys with 403/404
  if (!res.ok) throw new Error(`Request failed (${res.status}) for ${url}`);
  const text = await res.text();
  // Some static hosts answer a missing file with an HTML fallback + 200.
  if (/^\s*</.test(text)) return null;
  return JSON.parse(text) as unknown;
}

export function parseMeta(json: unknown): PoolMeta {
  if (!json || typeof json !== "object") throw new ProofDataError("meta.json is not an object");
  const m = json as Record<string, unknown>;
  if (typeof m.root !== "string" || !HEX32.test(m.root))
    throw new ProofDataError("meta.json has no valid root");
  if (typeof m.token !== "string") throw new ProofDataError("meta.json has no token");
  return {
    pool: String(m.pool ?? ""),
    root: m.root as Hex,
    token: m.token,
    decimals: Number(m.decimals ?? 18),
    total: String(m.total ?? "0"),
    totalVent: String(m.totalVent ?? ""),
    count: Number(m.count ?? 0),
    prefixLen: Number(m.prefixLen ?? 2),
    shards: Number(m.shards ?? 0),
    shardKeys:
      Array.isArray(m.shardKeys) && m.shardKeys.every((k) => typeof k === "string")
        ? (m.shardKeys as string[]).map((k) => k.toLowerCase())
        : undefined,
  };
}

export async function loadPoolMeta(
  base: string,
  poolId: string,
  signal?: AbortSignal,
): Promise<PoolMeta> {
  const json = await fetchJson(`${base}/${encodeURIComponent(poolId)}/meta.json`, signal);
  if (json === null) throw new ProofDataError(`meta.json for pool "${poolId}" not found`);
  const meta = parseMeta(json);
  if (meta.token.toLowerCase() !== VENT.address.toLowerCase()) {
    throw new ProofDataError(
      `Proof data is for token ${meta.token}, not VENT ${VENT.address}. Do not claim.`,
    );
  }
  if (meta.decimals !== VENT.decimals) {
    throw new ProofDataError(
      `Proof data uses ${meta.decimals} decimals, expected ${VENT.decimals}`,
    );
  }
  if (meta.prefixLen !== 2) {
    throw new ProofDataError(`Unsupported shard prefixLen ${meta.prefixLen} (expected 2)`);
  }
  return meta;
}

/**
 * Shard adapter: the only place that knows the shard entry shape
 * `{ "<lowercase addr>": { index, amount: "<wei>", proof: [...] } }`.
 */
export function parseShardEntry(json: unknown, addressLower: string): ProofEntry | null {
  if (!json || typeof json !== "object") return null;
  const raw = (json as Record<string, unknown>)[addressLower];
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { index?: unknown; amount?: unknown; proof?: unknown };
  if (typeof r.amount !== "string" || !/^\d+$/.test(r.amount)) return null;
  const amount = BigInt(r.amount);
  if (amount <= 0n) return null;
  if (!Array.isArray(r.proof) || !r.proof.every((p) => typeof p === "string" && HEX32.test(p)))
    return null;
  const index = typeof r.index === "number" ? r.index : -1;
  return { index, amount, proof: r.proof as Hex[] };
}

/** OZ StandardMerkleTree leaf for ["address","uint256"], as in VentAirdrop. */
export function leafHash(account: string, amount: bigint): Hex {
  return keccak256(
    keccak256(
      encodeAbiParameters(
        [{ type: "address" }, { type: "uint256" }],
        [account as `0x${string}`, amount],
      ),
    ),
  );
}

/** Sorted-pair Merkle verification (OpenZeppelin MerkleProof). */
export function verifyProof(account: string, amount: bigint, proof: Hex[], root: Hex): boolean {
  let h = leafHash(account, amount);
  for (const p of proof) {
    h = BigInt(h) <= BigInt(p) ? keccak256(concat([h, p])) : keccak256(concat([p, h]));
  }
  return h.toLowerCase() === root.toLowerCase();
}

export async function loadProof(
  base: string,
  poolId: string,
  address: string,
  meta: PoolMeta,
  signal?: AbortSignal,
): Promise<ProofLookup> {
  const addressLower = address.toLowerCase();
  const key = shardKey(addressLower);
  if (meta.shardKeys && !meta.shardKeys.includes(key)) return { eligible: false };
  const url = `${base}/${encodeURIComponent(poolId)}/${key}.json`;
  const json = await fetchJson(url, signal);
  if (json === null) return { eligible: false };
  const entry = parseShardEntry(json, addressLower);
  if (!entry) return { eligible: false };
  if (!verifyProof(addressLower, entry.amount, entry.proof, meta.root)) {
    throw new ProofDataError("Your proof does not match this pool's Merkle root. Do not claim.");
  }
  return { eligible: true, entry };
}
