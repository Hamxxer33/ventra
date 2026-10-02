/**
 * Registration config for claim.ventran.xyz.
 *
 * Fee: ~$1 USD paid as **native ETH** on Arbitrum One (`msg.value` on `register`).
 * NOT the ARB ERC-20. No approve / transferFrom / ARB.transfer.
 *
 * VentRegistration (Arbitrum One): 0x5c607d96284382c6f4f0eb1484e768953e93cdee
 * feeRecipient (display + on-chain): 0x90ef44606791a3522d6c97e2b073ced4fc71ad71
 * UI reads registrationOpen/paused/registrationFee — do not pretend open when flag is false.
 */
import { type Address, type Abi } from "viem";
import ventRegistrationAbi from "@/lib/abi/VentRegistration.json";
import { formatEthExact } from "@/lib/eth-price";

/** Official OpenSea collection for Ventra NFT. */
export const VENTRAN_OPENSEA_URL = "https://opensea.io/collection/ventran";

/** VentRegistration ABI (register is payable — Clanker ETH rebuild). */
export const VENT_REGISTRATION_ABI = ventRegistrationAbi as Abi;

/** Deployed VentRegistration on Arbitrum One. */
export const registrationContract: Address | null =
  "0x5c607d96284382c6f4f0eb1484e768953e93cdee" as Address;
export const registrationContractSet = true;

/** Display fee: ~$1 USD worth of native ETH. Exact msg.value is on-chain registrationFee(). */
export const registrationFeeUsd = 1;

/**
 * Fee-receiving wallet (Hamza, 30 Sep 2026). Shown in UI copy as where the ~$1 ETH goes.
 * On-chain `feeRecipient()` is authoritative once VentRegistration is deployed —
 * this is display/config until then. Never send ETH via bare transfer from the UI;
 * payment is msg.value on `register`.
 */
export const FEE_RECIPIENT = "0x90ef44606791a3522d6c97e2b073ced4fc71ad71" as Address;
export const feeRecipientSet = true;

/** Config object — prefer on-chain reads when available. Never bare-transfer ETH to feeRecipient. */
export const REGISTRATION = {
  contract: registrationContract,
  contractSet: registrationContractSet,
  feeUsd: registrationFeeUsd,
  feeRecipient: FEE_RECIPIENT,
  feeRecipientSet: feeRecipientSet,
  /** EIP-712 domain for setClaimWallet */
  eip712Name: "VentRegistration",
  eip712Version: "1",
  /** Soft-warn threshold when live $1→ETH quote drifts from on-chain fee (never blocks submit) */
  feeTolerance: 0.02,
} as const;

export function registrationFeeLabel(ethWei: bigint | null, ethUsd: number | null): string {
  if (ethWei !== null && ethUsd !== null) {
    return `$${REGISTRATION.feeUsd} in ETH (~${formatEthExact(ethWei)} ETH)`;
  }
  if (ethWei !== null) {
    return `$${REGISTRATION.feeUsd} in ETH (~${formatEthExact(ethWei)} ETH)`;
  }
  return `$${REGISTRATION.feeUsd} in ETH on Arbitrum`;
}

/** localStorage key for one-time eligible→destination remap (UX cache only; chain is truth). */
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

/** EIP-712 typed data for VentRegistration.setClaimWallet */
export function buildSetClaimWalletTypedData(args: {
  verifyingContract: Address;
  chainId: number;
  eligible: Address;
  newClaimWallet: Address;
  nonce: bigint;
  deadline: bigint;
}) {
  return {
    domain: {
      name: REGISTRATION.eip712Name,
      version: REGISTRATION.eip712Version,
      chainId: args.chainId,
      verifyingContract: args.verifyingContract,
    },
    types: {
      SetClaimWallet: [
        { name: "eligible", type: "address" },
        { name: "newClaimWallet", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "SetClaimWallet" as const,
    message: {
      eligible: args.eligible,
      newClaimWallet: args.newClaimWallet,
      nonce: args.nonce,
      deadline: args.deadline,
    },
  };
}
