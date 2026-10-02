/**
 * Live ETH/USD quote for the ~$1 registration fee (native ETH on Arbitrum One).
 * Primary: CoinGecko simple price. Falls back to last good cached price with a stale flag.
 */
export type EthUsdQuote = {
  usd: number;
  /** Source label for UI */
  source: "coingecko" | "cache";
  fetchedAt: number;
  stale: boolean;
};

const CACHE_KEY = "ventran:eth-usd";
const CACHE_TTL_MS = 60_000; // refresh preference
const STALE_MAX_MS = 30 * 60_000; // still usable for 30m

type CacheBlob = { usd: number; fetchedAt: number };

function readCache(): CacheBlob | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheBlob;
    if (typeof parsed.usd !== "number" || !Number.isFinite(parsed.usd) || parsed.usd <= 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(usd: number, fetchedAt: number): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ usd, fetchedAt } satisfies CacheBlob));
  } catch {
    /* ignore quota */
  }
}

async function fetchCoinGecko(): Promise<number> {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  const data = (await res.json()) as { ethereum?: { usd?: number } };
  const usd = data.ethereum?.usd;
  if (typeof usd !== "number" || !Number.isFinite(usd) || usd <= 0) {
    throw new Error("CoinGecko returned no ETH/USD");
  }
  return usd;
}

/** Fetch ETH/USD. Prefer live; fall back to session cache with stale warning. */
export async function fetchEthUsd(): Promise<EthUsdQuote> {
  const now = Date.now();
  const cached = readCache();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return { usd: cached.usd, source: "cache", fetchedAt: cached.fetchedAt, stale: false };
  }
  try {
    const usd = await fetchCoinGecko();
    writeCache(usd, now);
    return { usd, source: "coingecko", fetchedAt: now, stale: false };
  } catch (err) {
    if (cached && now - cached.fetchedAt < STALE_MAX_MS) {
      return { usd: cached.usd, source: "cache", fetchedAt: cached.fetchedAt, stale: true };
    }
    throw err instanceof Error ? err : new Error("Failed to fetch ETH/USD");
  }
}

/**
 * Convert USD → ETH wei (18 decimals), rounded to a sensible precision
 * so the displayed amount is stable (6 decimal places of ETH ≈ $0.00x).
 */
export function usdToEthWei(usdAmount: number, ethUsd: number): bigint {
  if (ethUsd <= 0 || usdAmount <= 0) throw new Error("Invalid price inputs");
  const eth = usdAmount / ethUsd;
  // Round to 6 decimal places of ETH, then to wei.
  const ethRounded = Math.round(eth * 1e6) / 1e6;
  // Avoid float wei math: use string with 6 decimals → pad to 18.
  const [whole, frac = ""] = ethRounded.toFixed(6).split(".");
  const frac18 = (frac + "000000000000").slice(0, 18);
  return BigInt(whole + frac18);
}

/** Human ETH string from wei (trim trailing zeros). */
export function formatEthExact(wei: bigint): string {
  const neg = wei < 0n;
  const abs = neg ? -wei : wei;
  const s = abs.toString().padStart(19, "0");
  const whole = s.slice(0, -18) || "0";
  const frac = s.slice(-18).replace(/0+$/, "");
  const out = frac ? `${whole}.${frac}` : whole;
  return neg ? `-${out}` : out;
}

/** Soft-warn helper: true if |a-b| / b > tolerance (e.g. 0.02 = 2%). Never used to block submit. */
export function feeDiffersBeyondTolerance(quoteWei: bigint, onChainWei: bigint, tolerance = 0.02): boolean {
  if (onChainWei === 0n) return true;
  const q = quoteWei > onChainWei ? quoteWei - onChainWei : onChainWei - quoteWei;
  // Compare q / onChain > tolerance without floats: q * 10000 > onChain * (tolerance*10000)
  const bps = BigInt(Math.round(tolerance * 10_000));
  return q * 10_000n > onChainWei * bps;
}
