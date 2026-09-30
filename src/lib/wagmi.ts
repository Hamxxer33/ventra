import { createConfig, http, injected, mock } from "wagmi";
import { arbitrum } from "wagmi/chains";
import { DEMO_ADDRESS } from "@/lib/airdrop";
import { appkitWagmiConfig } from "@/lib/appkit";

/**
 * Demo wagmi config (mock + injected). Production uses Reown AppKit's wagmi config.
 *
 * Optional env: `VITE_ARBITRUM_RPC_URL` (defaults to the public Arbitrum RPC).
 */
const RPC_URL =
  (import.meta.env.VITE_ARBITRUM_RPC_URL as string | undefined) || "https://arb1.arbitrum.io/rpc";

export function makeDemoWagmiConfig() {
  return createConfig({
    chains: [arbitrum],
    connectors: [
      injected({ shimDisconnect: true }),
      mock({ accounts: [DEMO_ADDRESS] }),
    ],
    transports: { [arbitrum.id]: http(RPC_URL) },
    ssr: true,
  });
}

/** Prefer AppKit config in production; demo uses mock-enabled config. */
export function makeWagmiConfig({ demo }: { demo: boolean }) {
  return demo ? makeDemoWagmiConfig() : appkitWagmiConfig;
}

export const TARGET_CHAIN = arbitrum;
