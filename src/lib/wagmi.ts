import { createConfig, http, injected, mock } from "wagmi";
import { arbitrum } from "wagmi/chains";
import { DEMO_ADDRESS } from "@/lib/airdrop";

/**
 * Wallet config: injected wallets only (MetaMask, Rabby, Coinbase extension, and
 * in-app browsers of mobile wallets, discovered via EIP-6963). No WalletConnect,
 * so no project-id secret is required.
 *
 * Optional env: `VITE_ARBITRUM_RPC_URL` (defaults to the public Arbitrum RPC).
 */
const RPC_URL =
  (import.meta.env.VITE_ARBITRUM_RPC_URL as string | undefined) || "https://arb1.arbitrum.io/rpc";

export function makeWagmiConfig({ demo }: { demo: boolean }) {
  return createConfig({
    chains: [arbitrum],
    connectors: demo
      ? [injected({ shimDisconnect: true }), mock({ accounts: [DEMO_ADDRESS] })]
      : [injected({ shimDisconnect: true })],
    transports: { [arbitrum.id]: http(RPC_URL) },
    ssr: true,
  });
}

export const TARGET_CHAIN = arbitrum;
