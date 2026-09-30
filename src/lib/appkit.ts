import { createAppKit } from "@reown/appkit/react";
import { arbitrum } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { AppKitNetwork } from "@reown/appkit/networks";

/**
 * Reown AppKit (OpenSea-style wallet picker) + wagmi adapter.
 * Project ID from Vercel: `VITE_WALLETCONNECT_PROJECT_ID`.
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

export const appkitWagmiConfig = wagmiAdapter.wagmiConfig;

let appkitReady = false;

export function ensureAppKit() {
  if (appkitReady || !WC_PROJECT_ID) return;
  if (typeof window === "undefined") return;
  createAppKit({
    adapters: [wagmiAdapter],
    networks: appkitNetworks,
    projectId: WC_PROJECT_ID,
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
  appkitReady = true;
}
