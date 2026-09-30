import { useConnection } from "wagmi";
import { ConnectWalletButton } from "@/components/claim/connect-wallet-button";
import { shortAddress } from "@/lib/airdrop";

export function HeaderConnect() {
  const { address, isConnected } = useConnection();
  if (isConnected && address) {
    return (
      <a
        href="#register"
        className="inline-flex h-9 items-center border border-border bg-surface px-4 font-sans text-sm text-fg hover:bg-surface-2"
      >
        {shortAddress(address)}
      </a>
    );
  }
  return (
    <ConnectWalletButton
      label="Connect Wallet"
      className="h-9 border border-border bg-surface px-4 font-sans text-sm shadow-none"
      variant="secondary"
    />
  );
}
