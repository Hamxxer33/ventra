/**
 * Registration ($1 ARB fee) config for the claim.ventran.xyz register flow.
 *
 * STATUS: registration wallet + exact ARB amount + Clanker register contract are
 * still pending from Hamza / Clanker. Do not invent addresses. Until
 * `registrationWalletSet` is true, the pay button stays disabled.
 */
import { parseUnits, type Address, type Abi } from "viem";
import { erc20Abi } from "viem";

/** Official OpenSea collection for Ventra NFT. */
export const VENTRAN_OPENSEA_URL = "https://opensea.io/collection/ventran";

/**
 * ARB — Arbitrum governance ERC-20 on Arbitrum One (NOT native ETH/ARB gas).
 * Fee is paid in this token via a direct `transfer` to the registration wallet.
 */
export const ARB_TOKEN = {
  symbol: "ARB",
  name: "Arbitrum",
  address: "0x912CE59144191C1204E64559FE8253a0e49E6548" as Address,
  decimals: 18,
  chainId: 42161,
  explorerTokenUrl: "https://arbiscan.io/token/0x912CE59144191C1204E64559FE8253a0e49E6548",
} as const;

export const ARB_ERC20_ABI = erc20Abi satisfies Abi;

/**
 * Placeholder until Hamza sends the real registration / fee-receiving wallet.
 * Keep as zero-address + `registrationWalletSet: false` so the UI disables pay.
 */
export const REGISTRATION_WALLET = "0x0000000000000000000000000000000000000000" as Address;
export const registrationWalletSet = false;

/**
 * Fee copy: Hamza said "$1 in ARB". Exact token amount TBD.
 * - `registrationFeeUsd: 1` — display "$1 worth of ARB"
 * - `registrationFeeArbTokens: null` — exact ARB amount not confirmed
 * - Provisional UI amount: 1 ARB (labeled provisional) until confirmed
 */
export const registrationFeeUsd = 1;
export const registrationFeeArbTokens: number | null = null;
/** Provisional human-unit ARB amount used for the transfer when wallet is set. */
export const REGISTRATION_FEE_ARB_PROVISIONAL = "1";

export const REGISTRATION = {
  wallet: REGISTRATION_WALLET,
  walletSet: registrationWalletSet,
  feeUsd: registrationFeeUsd,
  feeArbTokens: registrationFeeArbTokens,
  provisionalArbHuman: REGISTRATION_FEE_ARB_PROVISIONAL,
  /** Clanker register contract — not deployed / not wired yet. */
  contract: null as Address | null,
} as const;

/** Wei amount for the provisional 1 ARB transfer (18 decimals). */
export function registrationFeeWei(): bigint {
  const human =
    REGISTRATION.feeArbTokens !== null
      ? String(REGISTRATION.feeArbTokens)
      : REGISTRATION.provisionalArbHuman;
  return parseUnits(human, ARB_TOKEN.decimals);
}

export function registrationFeeLabel(): string {
  if (REGISTRATION.feeArbTokens !== null) {
    return `${REGISTRATION.feeArbTokens} ARB (≈ $${REGISTRATION.feeUsd})`;
  }
  return `$${REGISTRATION.feeUsd} worth of ARB (provisional: ${REGISTRATION.provisionalArbHuman} ARB until confirmed)`;
}

/** localStorage key for one-time eligible→destination remap (client-side only for now). */
export const REMAP_STORAGE_KEY = "ventran:wallet-remap";

export type WalletRemap = {
  eligible: string;
  destination: string;
  savedAt: number;
};

export function loadRemap(eligible: string): WalletRemap | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REMAP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WalletRemap;
    if (parsed.eligible?.toLowerCase() !== eligible.toLowerCase()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveRemap(eligible: string, destination: string): WalletRemap {
  const entry: WalletRemap = {
    eligible: eligible.toLowerCase(),
    destination: destination.toLowerCase(),
    savedAt: Date.now(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(REMAP_STORAGE_KEY, JSON.stringify(entry));
  }
  return entry;
}

export function clearRemap(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(REMAP_STORAGE_KEY);
  }
}
