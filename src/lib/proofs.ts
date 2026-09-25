/**
 * Merkle proof loader.
 *
 * Each pool's proofs are split into 256 JSON shards keyed by the first byte of the
 * wallet address: `${PROOFS_BASE_URL}/<poolId>/<xx>.json`, xx = "00".."ff" (the two
 * lowercase hex chars after 0x). We fetch only the connected wallet's shard.
 *
 * Addresses are lowercased before picking the shard and before the lookup; the
 * shard files are assumed to use lowercase address keys too.
 *
 * "Shard missing" (404) or "address not in shard" both mean NOT ELIGIBLE.
 * Other failures (network, 5xx, bad JSON) surface as errors so the user can retry.
 */
import { PROOFS_BASE_URL } from "@/lib/airdrop";

export interface ProofEntry {
  index: number;
  /** Raw token amount (18 decimals). */
  amount: bigint;
  proof: `0x${string}`[];
}

export type ProofLookup = { eligible: false } | { eligible: true; entry: ProofEntry };

export function shardKey(address: string): string {
  const lower = address.toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(lower)) throw new Error(`Invalid address: ${address}`);
  return lower.slice(2, 4);
}

export function shardUrl(poolId: string, address: string, base = PROOFS_BASE_URL): string {
  return `${base}/${encodeURIComponent(poolId)}/${shardKey(address)}.json`;
}

/**
 * TODO(proof-format): the final shard JSON shape isn't fixed yet. This adapter is the
 * ONLY place that knows it. Currently accepted (address keys lowercase):
 *
 *   { "0xabc…": { "index": 12, "amount": "<wei as decimal string>", "proof": ["0x…"] } }
 *   { "claims": { "0xabc…": { … same … } } }        // Uniswap merkle-distributor style
 *
 * `amount` may be a decimal string, a 0x-hex string, or a number (whole wei).
 */
export function parseProofShard(json: unknown, addressLower: string): ProofEntry | null {
  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;
  const map =
    root.claims && typeof root.claims === "object"
      ? (root.claims as Record<string, unknown>)
      : root;
  const raw = map[addressLower];
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { index?: unknown; amount?: unknown; proof?: unknown };

  const index = typeof r.index === "string" ? Number(r.index) : r.index;
  if (typeof index !== "number" || !Number.isSafeInteger(index) || index < 0) return null;

  let amount: bigint;
  try {
    if (typeof r.amount === "string" || typeof r.amount === "number") amount = BigInt(r.amount);
    else return null;
  } catch {
    return null;
  }
  if (amount <= 0n) return null;

  if (!Array.isArray(r.proof)) return null;
  const proof = r.proof.filter(
    (p): p is `0x${string}` => typeof p === "string" && /^0x[0-9a-fA-F]{64}$/.test(p),
  );
  if (proof.length !== r.proof.length) return null;

  return { index, amount, proof };
}

export async function loadProof(
  poolId: string,
  address: string,
  opts: { base?: string; signal?: AbortSignal } = {},
): Promise<ProofLookup> {
  const addressLower = address.toLowerCase();
  const res = await fetch(shardUrl(poolId, addressLower, opts.base), {
    signal: opts.signal,
    headers: { accept: "application/json" },
  });
  if (res.status === 404) return { eligible: false };
  if (!res.ok) throw new Error(`Proof shard request failed (${res.status})`);
  // Some static hosts answer a missing file with an HTML fallback page + 200.
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("json")) return { eligible: false };
  const json: unknown = await res.json();
  const entry = parseProofShard(json, addressLower);
  return entry ? { eligible: true, entry } : { eligible: false };
}
