/**
 * Eligibility lookup for community + NFT pools.
 *
 * Community: real proof/eligibility JSON not published yet → returns
 * `not-yet-published`. With `?demo=1`, loads `/eligibility/community-demo.json`.
 *
 * NFT: loads `/eligibility/nft-holders.json` (bundled from the final holder CSV).
 * No per-wallet VENT amount yet — show token count only.
 */
import { formatVentExact } from "@/lib/airdrop";

export type CommunityLookup =
  | { status: "not-yet-published" }
  | { status: "eligible"; amountWei: bigint; note?: string }
  | { status: "not-eligible" }
  | { status: "error"; message: string };

export type NftLookup =
  | { status: "eligible"; owner: string; tokenCount: number }
  | { status: "not-eligible" }
  | { status: "error"; message: string };

type CommunityDemoEntry = { amountWei: string; note?: string };
type NftEntry = { owner: string; tokenCount: number };

let communityDemoCache: Record<string, CommunityDemoEntry> | null = null;
let nftCache: Record<string, NftEntry> | null = null;
let nftLoad: Promise<Record<string, NftEntry>> | null = null;

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

/** Clean community lookup. Real list unpublished → always `not-yet-published` unless demo. */
export async function lookupCommunity(
  address: string,
  opts: { demo?: boolean } = {},
): Promise<CommunityLookup> {
  const key = address.trim().toLowerCase();
  if (!opts.demo) {
    return { status: "not-yet-published" };
  }
  try {
    const data = await loadCommunityDemo();
    const entry = data[key];
    if (!entry) return { status: "not-eligible" };
    return {
      status: "eligible",
      amountWei: BigInt(entry.amountWei),
      note: entry.note,
    };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Failed to load community demo list",
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
    community.status === "eligible" ||
    nft.status === "eligible" ||
    // Community not published yet: still allow register path if NFT-eligible,
    // or if community is pending (user may still register for later claim).
    community.status === "not-yet-published";
  return { address: address.toLowerCase(), community, nft, anyEligible };
}

export function formatCommunityAmount(lookup: CommunityLookup): string | null {
  if (lookup.status !== "eligible") return null;
  return `${formatVentExact(lookup.amountWei)} VENT`;
}

/** NFT pool: no per-wallet VENT rate yet. */
export function nftAmountCopy(tokenCount: number): string {
  return `Eligible · ${tokenCount.toLocaleString("en-US")} NFT${tokenCount === 1 ? "" : "s"} held · amount shown when claim opens`;
}
