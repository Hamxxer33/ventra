import { Wallet } from "lucide-react";
import { useAppKit } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";
import { WC_PROJECT_ID } from "@/lib/appkit";

type Props = {
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

/** Opens the Reown AppKit wallet picker (MetaMask, Trust, QR, …). */
export function ConnectWalletButton({
  label = "Connect wallet",
  variant = "primary",
  className,
}: Props) {
  const { open } = useAppKit();

  if (!WC_PROJECT_ID) {
    return (
      <p className="font-sans text-sm text-danger">
        Wallet connect is not configured. Set VITE_WALLETCONNECT_PROJECT_ID.
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={() => {
        void open({ view: "Connect" });
      }}
    >
      <Wallet className="size-4" />
      {label}
    </Button>
  );
}
