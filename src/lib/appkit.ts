import { createAppKit } from "@reown/appkit/react";
import { arbitrum } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { AppKitNetwork } from "@reown/appkit/networks";

/**
 * Reown AppKit (OpenSea-style wallet picker) + wagmi adapter.
 * Project ID from Vercel: `VITE_WALLETCONNECT_PROJECT_ID`.
 *
 * createAppKit MUST run at module top-level (before any useAppKit hook).
 * ClaimProviders imports this module via makeWagmiConfig → appkitWagmiConfig,
 * so the side effect completes before ConnectWalletButton / HeaderConnect render.
 */
export const WC_PROJECT_ID = (
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined
)?.trim() ?? "";

export const appkitNetworks = [arbitrum] as [AppKitNetwork, ...AppKitNetwork[]];

export const wagmiAdapter = new WagmiAdapter({
  networks: appkitNetworks,
  projectId: WC_PROJECT_ID || "00000000000000000000000000000000",
  ssr: true,
});

/** Call once at module load so useAppKit never races a useEffect. */
createAppKit({
  adapters: [wagmiAdapter],
  networks: appkitNetworks,
  projectId: WC_PROJECT_ID || "00000000000000000000000000000000",
  metadata: {
    name: "Ventran",
    description: "Ventran ($VENT) airdrop — claim.ventran.xyz",
    url: "https://claim.ventran.xyz",
    icons: ["https://claim.ventran.xyz/vent-favicon.png"],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
    swaps: false,
    onramp: false,
  },
  themeMode: "dark",
  allWallets: "SHOW",
});

export const appkitWagmiConfig = wagmiAdapter.wagmiConfig;
