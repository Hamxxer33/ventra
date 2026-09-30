import { createConfig, http, injected, mock } from "wagmi";
import { walletConnect } from "wagmi/connectors/walletConnect";
import { arbitrum } from "wagmi/chains";
import { DEMO_ADDRESS } from "@/lib/airdrop";

/**
 * Wallet config: EIP-6963 injected wallets, plus Reown WalletConnect when
 * `VITE_WALLETCONNECT_PROJECT_ID` is set (QR / mobile wallets).
 *
 * Optional env: `VITE_ARBITRUM_RPC_URL` (defaults to the public Arbitrum RPC).
 */
const RPC_URL =
  (import.meta.env.VITE_ARBITRUM_RPC_URL as string | undefined) || "https://arb1.arbitrum.io/rpc";

const WC_PROJECT_ID = (
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined
)?.trim();

export function makeWagmiConfig({ demo }: { demo: boolean }) {
  return createConfig({
    chains: [arbitrum],
    connectors: [
      injected({ shimDisconnect: true }),
      ...(demo ? [mock({ accounts: [DEMO_ADDRESS] })] : []),
      ...(WC_PROJECT_ID
        ? [
            walletConnect({
              projectId: WC_PROJECT_ID,
              showQrModal: true,
              metadata: {
                name: "Ventran",
                description: "Ventran ($VENT) airdrop — claim.ventran.xyz",
                url: "https://claim.ventran.xyz",
                icons: ["https://claim.ventran.xyz/vent-favicon.png"],
              },
            }),
          ]
        : []),
    ],
    transports: { [arbitrum.id]: http(RPC_URL) },
    ssr: true,
  });
}

export const TARGET_CHAIN = arbitrum;
