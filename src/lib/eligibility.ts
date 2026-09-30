/**
 * Eligibility lookup for community + NFT pools.
 *
 * Community: `/eligibility/community.json` (flat map from checker-pack).
 * NFT: `/eligibility/nft-holders.json` (tokenCount + amountWei).
 * `?demo=1` still uses `/eligibility/community-demo.json` for community.
 */
import { formatVentExact } from "@/lib/airdrop";

export type CommunityLookup =
  | { status: "not-yet-published" }
  | { status: "eligible"; amountWei: bigint; note?: string }
  | { status: "not-eligible" }
  | { status: "error"; message: string };

export type NftLookup =
  | { status: "eligible"; owner: string; tokenCount: number; amountWei?: bigint }
  | { status: "not-eligible" }
  | { status: "error"; message: string };

type CommunityEntry = { amountWei: string; txCount?: number; amount?: string; note?: string };
type CommunityDemoEntry = { amountWei: string; note?: string };
type NftEntry = { owner: string; tokenCount: number; amountWei?: string };

let communityCache: Record<string, CommunityEntry> | null = null;
let communityLoad: Promise<Record<string, CommunityEntry>> | null = null;
let communityDemoCache: Record<string, CommunityDemoEntry> | null = null;
let nftCache: Record<string, NftEntry> | null = null;
let nftLoad: Promise<Record<string, NftEntry>> | null = null;

async function loadCommunity(): Promise<Record<string, CommunityEntry>> {
  if (communityCache) return communityCache;
  if (!communityLoad) {
    communityLoad = (async () => {
      const res = await fetch("/eligibility/community.json");
      if (!res.ok) throw new Error(`community.json HTTP ${res.status}`);
      const data = (await res.json()) as
        | Record<string, CommunityEntry>
        | { status?: string; holders?: Record<string, { amount: string; txCount?: number }> };
      // Support flat map or checker wrapper
      if (data && typeof data === "object" && "holders" in data && data.holders) {
        const flat: Record<string, CommunityEntry> = {};
        for (const [addr, h] of Object.entries(data.holders)) {
          const amount = BigInt(h.amount);
          if (amount <= 0n) continue;
          flat[addr.toLowerCase()] = {
            amountWei: (amount * 10n ** 18n).toString(),
            txCount: h.txCount,
            amount: h.amount,
          };
        }
        communityCache = flat;
      } else if (data && typeof data === "object" && "status" in data && (data as { status?: string }).status === "not-yet-published") {
        communityCache = {};
      } else {
        communityCache = data as Record<string, CommunityEntry>;
      }
      return communityCache;
    })();
  }
  return communityLoad;
}

async function loadCommunityDemo(): Promise<Record<string, CommunityDemoEntry>> {
  if (communityDemoCache) return communityDemoCache;
  const res = await fetch("/eligibility/community-demo.json");
  if (!res.ok) throw new Error(`community-demo.json HTTP ${res.status}`);
  communityDemoCache = (await res.json()) as Record<string, CommunityDemoEntry>;
  return communityDemoCache;
}

async function loadNftHolders(): Promise<Record<string, NftEntry>> {
  if (nftCache) return nftCache;
  if (!nftLoad) {
    nftLoad = (async () => {
      const res = await fetch("/eligibility/nft-holders.json");
      if (!res.ok) throw new Error(`nft-holders.json HTTP ${res.status}`);
      nftCache = (await res.json()) as Record<string, NftEntry>;
      return nftCache;
    })();
  }
  return nftLoad;
}

export async function lookupCommunity(
  address: string,
  opts: { demo?: boolean } = {},
): Promise<CommunityLookup> {
  const key = address.trim().toLowerCase();
  try {
    if (opts.demo) {
      const data = await loadCommunityDemo();
      const entry = data[key];
      if (!entry) return { status: "not-eligible" };
      return {
        status: "eligible",
        amountWei: BigInt(entry.amountWei),
        note: entry.note,
      };
    }
    const data = await loadCommunity();
    if (Object.keys(data).length === 0) return { status: "not-yet-published" };
    const entry = data[key];
    if (!entry) return { status: "not-eligible" };
    const note =
      entry.txCount !== undefined
        ? `${entry.txCount.toLocaleString("en-US")} Arb txs × 180 VENT`
        : undefined;
    return {
      status: "eligible",
      amountWei: BigInt(entry.amountWei),
      note,
    };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Failed to load community list",
    };
  }
}

export async function lookupNft(address: string): Promise<NftLookup> {
  const key = address.trim().toLowerCase();
  try {
    const data = await loadNftHolders();
    const entry = data[key];
    if (!entry) return { status: "not-eligible" };
    return {
      status: "eligible",
      owner: entry.owner,
      tokenCount: entry.tokenCount,
      amountWei: entry.amountWei ? BigInt(entry.amountWei) : undefined,
    };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Failed to load NFT holder list",
    };
  }
}

export type CombinedEligibility = {
  address: string;
  community: CommunityLookup;
  nft: NftLookup;
  anyEligible: boolean;
};

export async function lookupBoth(
  address: string,
  opts: { demo?: boolean } = {},
): Promise<CombinedEligibility> {
  const [community, nft] = await Promise.all([
    lookupCommunity(address, opts),
    lookupNft(address),
  ]);
  const anyEligible =
    community.status === "eligible" || nft.status === "eligible";
  return { address: address.toLowerCase(), community, nft, anyEligible };
}

export function formatCommunityAmount(lookup: CommunityLookup): string | null {
  if (lookup.status !== "eligible") return null;
  return `${formatVentExact(lookup.amountWei)} VENT`;
}

export function nftAmountCopy(tokenCount: number, amountWei?: bigint): string {
  const nfts = `${tokenCount.toLocaleString("en-US")} NFT${tokenCount === 1 ? "" : "s"}`;
  if (amountWei !== undefined) {
    return `${formatVentExact(amountWei)} VENT · ${nfts}`;
  }
  return `Eligible · ${nfts} held · amount shown when claim opens`;
}
